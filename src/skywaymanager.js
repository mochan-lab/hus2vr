import Peer from 'skyway-js';

export function makePeer(apiKey,myKeyField){
    const peer = new Peer({key: apiKey,
                           debug: 3});
    peer.on('open',() => {
        myKeyField.textContent = peer.id;
    });
    return peer;
}

export function makeConnect(peer,theirId){
    const connect = peer.connect(theirId.value);
    return connect;
}