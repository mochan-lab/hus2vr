import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-converter';
import '@tensorflow/tfjs-backend-webgl'
import * as posenet from '@tensorflow-models/posenet';
import {drawBoundingBox, drawKeyPoints, drawSkeleton} from './util';
import { bindVertexProgramAttributeStreams } from '@tensorflow/tfjs-backend-webgl/dist/gpgpu_util';
import { makePeer, makeConnect} from './skywaymanager';

//SETTINGS 
const videoWidth = 960;
const videoHeight = 540;
//details in https://github.com/tensorflow/tfjs-models/tree/master/posenet
const architectureValue = 'ResNet50';
const outputStrideValue = 32;
const inputResolutionValue = { width:480,height:270};
const multiplierValue = 4;
const quantBytesValue = 2;
const maxDetectionsValue = 5;
const scoreThresholdValue = 0.6;
const nmsRadiusValue = 20;
const minPoseConfidence = 0.1;
const minPartConfidence = 0.1;

const apiKey = ''; //Input your Skyway WebRTC apiKey

const myId = document.getElementById('my-id');
const theirId = document.getElementById('their-id');
const connectButton = document.getElementById('make-connect');
const poseTxt = document.getElementById('txt');

//FUNCTIONS
async function setupCamera(){
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
            'Browser API navigator.mediaDevices.getUserMedia not available');
    }
    const video = document.getElementById('video');
    video.width = videoWidth;
    video.height = videoHeight;
    
    const stream = await navigator.mediaDevices.getUserMedia({video:true, audio:false});
    video.srcObject = stream;
    return new Promise((resolve)=>{
        video.onloadedmetadata = ()=>{
            resolve(video);
        };
    });
}
async function loadVideo(){
    const video = await setupCamera();
    video.play();
    return video;
}
function detectPoseInRealTime(video, net,peerU){
    const canvas = document.getElementById('output');
    const context = canvas.getContext('2d');

    const flipPoseHorizontal = false;

    canvas.width = videoWidth;
    canvas.height = videoHeight;

    let fps = 0;
    let avefps = 0;
    let starttime,lasttime,nowtime;
    let framecount = 1;

    const connectU = makeConnect(peerU,theirId);
    connectU.on("open", async () => {
        connectU.send('send start');
        starttime = new Date().getTime();
    });

    async function poseDetectionFrame(){
        let poses = [];
        
        let all_poses = await net.estimatePoses(video,{
            flipHorizontal: flipPoseHorizontal,
            decodeingMethod: 'multi-person',
            maxDetections: maxDetectionsValue,
            scoreThreshold: scoreThresholdValue,
            nmsRadius: nmsRadiusValue,
        });

        poses = poses.concat(all_poses);

        context.clearRect(0,0,videoWidth,videoHeight);

        // context.save();
        // context.scale(-1,1);
        // context.translate(-videoWidth,0);
        // context.drawImage(video,0,0,videoWidth,videoHeight);
        // context.restore();
        context.save();
        context.scale(1,1);
        context.translate(0,0);
        context.drawImage(video,0,0,videoWidth,videoHeight);
        context.restore();

        poses.forEach(({score,keypoints}) => {
            if (score >= minPoseConfidence){
                drawKeyPoints(keypoints,minPartConfidence,context);
                drawSkeleton(keypoints,minPartConfidence,context);
                drawBoundingBox(keypoints,context);
            }
        });

        // var scoretxt = "Scores\n"
        // poses.forEach(({score,keypoints})=>{
        //     keypoints.forEach(({position,part,score})=>{
        //         scoretxt = scoretxt + part + " : x" + position["x"] + " y" + position["y"] + " Score" + score + "\n";
        //     })
        //     scoretxt = scoretxt + "\n"
        // })
        // poseTxt.innerText = scoretxt;

        const posesJson = JSON.stringify(poses,null,"\t");
        poseTxt.innerText = posesJson;
        connectU.send(posesJson);

        lasttime = nowtime;
        nowtime = new Date().getTime();
        fps = 1000 / (nowtime - lasttime);
        avefps = (framecount * 1000) / (nowtime - starttime);
        myId.textContent = fps + " fps (average: " + avefps + " fps)";
        framecount = framecount + 1;

        requestAnimationFrame(poseDetectionFrame);
    }

    connectU.on("open", async () => {
        poseDetectionFrame();
    });
}

//KICKING function
export async function bindPage(){
    const net = await posenet.load({
        architecture: architectureValue,
        outputStride: outputStrideValue,
        inputResolution: inputResolutionValue,
        //multiplier: multiplierValue,
        quantBytes: quantBytesValue
    });

    let video;

    try{
        video = await loadVideo();
    } catch(e){
        throw e;
    }

    const peerU = makePeer(apiKey,myId);
    connectButton.onclick = () => {
        detectPoseInRealTime(video,net,peerU);
    };
}

//KICKING!!
bindPage();