<h1 align="center">
  <br>
  <a href="https://github.com/SaifRehman/websig"><img src="https://raw.githubusercontent.com/SaifRehman/websig/master/websig.png" alt="Lotion" ></a>
</h1>

<h4 align="center">P2P Signalling server built with IPFSPubSub and WEBRTC</h4>

<p align="center">
  <a>
    <img src="https://img.shields.io/travis/keppel/lotion/master.svg"
         alt="Travis Build">
  </a>
</p>
<br>

# Introduction
Websig is P2P Signalling server for WEBRTC built on top of IPFSPubSub and WEBRTC Protocol. It is able to create peer to peer webrtc data channels and audio/video conferencing in your frontend applications

Please 🌟 the Repo if you liked it. Thanks !

# Usuage
1. Install the library
```
$ npm i websig --save
```

```JavaScript
const websig = require('websig')
// Place in your STUN/TURN server to tackle Nating issues
const server = {
    'iceServers': [{
        'urls': 'stun:global.stun.twilio.com:3478?transport=udp'
    }]
};
const roomname = 'test';
const webrtc =  new websig(roomname, server);
// establish a webrtc datachannel connection
webrtc.ispeerjoined.subscribe(data => {
    if (data) {
        webrtc.connectWEBRTC();
        webrtc.datachannelData.subscribe(msg => {
            console.log("data is =>", msg);
        }, error => {
            console.log(error)
        })
    }
}, error => {
    console.log(error)
})
// sending message
webrtc.send('Hello World!!');
```
# Supports
1. Browserify
3. React 
4. VUE

# Todo
* Support Audio/Video channels
* Create an example app using websig
* Add support for Angular and TS
* Support Multi Party webrtc channels

# Example app

1. Navigate to example folder
```sh
$ cd example
$ npm i 
```

2. Run browserify 
```
$ browserify app.js -o public/js/app.js -d
```

3. Run the app
```
$ http-server
```


## Author
[SaifRehman](SaifRehman.github.io)

