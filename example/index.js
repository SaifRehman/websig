const webrtc = require('../index')
window.addEventListener('load', function () {
    var video =  document.getElementById('videotag');
    console.log(video);
    if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true }).then(function(stream) {
            video.srcObject = stream;
            video.play();
        });
    }
    var peers = [document.getElementById("peer1"), document.getElementById("peer2")]
    document.getElementById("myBtn").disabled = false;
    const server = {
        'iceServers': [{
            'urls': 'stun:global.stun.twilio.com:3478?transport=udp'
        }]
    };
    const newwebrtc = new webrtc('saiftest', server)
    console.log(newwebrtc);
    document.getElementById("myBtn").addEventListener("click", function () {
        console.log('button clicked');
        newwebrtc.connectWEBRTC();
    });
    document.getElementById("myBtn1").addEventListener("click", function () {
        var x = document.getElementById("myText").value;
        var tag = document.createElement("p");
        var text = document.createTextNode(x);
        tag.appendChild(text);
        var element = document.getElementById("new");
        element.appendChild(tag);
        newwebrtc.send(newwebrtc.ipfsid + ": "+ x);
    });
    
    newwebrtc.emitter.on('pc joined', () => {
        console.log('emittt')
        const index = newwebrtc.pc.length - 1;
        var tag = document.createElement("p");
        var text = document.createTextNode(newwebrtc.pc[index].currentpeer);
        tag.appendChild(text);
        var element = document.getElementById("new1");
        element.appendChild(tag);

        newwebrtc.pc[index].pc.ontrack = (event => {
            if (event.streams && event.streams[0]) {
            peers[index].srcObject = event.streams[0];
            }
        });
        video.srcObject.getTracks().forEach(track => newwebrtc.pc[index].pc.addTrack(track,  video.srcObject));
        console.log(newwebrtc.pc[index])
    
    })
    
            newwebrtc.datachannelData.subscribe(msg => {
                if (msg) {
                    console.log('msg is ', msg)
                    var tag = document.createElement("p");
                    var text = document.createTextNode(msg);
                    tag.appendChild(text);
                    var element = document.getElementById("new");
                    element.appendChild(tag);
                }
            }, error => {
                console.log(error)
            })
  })
