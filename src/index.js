import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-converter';
import '@tensorflow/tfjs-backend-webgl'
import * as posenet from '@tensorflow-models/posenet';
// import { fromUint8ToStringArray } from '@tensorflow/tfjs-core/dist/backends/backend_util.js';
import pkg from '@tensorflow/tfjs-core/dist/backends/backend_util';
const { fromUint8ToStringArray } = pkg;

const imageElement = document.getElementById('cats');
var elm = document.getElementById('score');

async function estimateMultiplePoseOnImage(imageElement){
    const net = await posenet.load();
    const poses = await net.estimateMultiplePoses(imageElement,{
        flipHorizontal: false,
        maxDetections: 3,
        scoreThreshold: 0.6,
        nmsRadius:20});
    return poses;
}

const poses = estimateMultiplePoseOnImage(imageElement);

poses.then(function(poses){
    var scoretxt = "Scores\n";
    console.log(poses);
    poses.forEach(element => scoretxt = scoretxt + element["score"] + '\n');
    elm.innerText = scoretxt;
})