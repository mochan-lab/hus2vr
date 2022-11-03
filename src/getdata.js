import { makePeer } from './skywaymanager';

const apiKey = ''; //Input your Skyway WebRTC apiKey

const myId = document.getElementById('my-id');
const theirId = document.getElementById('their-id');
const poseTxt = document.getElementById('txt');

//export function startget(){
//    let connect;
    const peer = makePeer(apiKey,myId);
    peer.on('connection', dataConnection => {
        //connect = dataConnection;
        dataConnection.once('open',async() => {
            theirId.textContent = 'make connection!!';
        });
        dataConnection.on('data',data => {
            poseTxt.textContent = data;
        });
    });
//}


//startget();