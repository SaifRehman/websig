const webrtc = require('websig')
document.getElementById("myBtn").disabled = true;
const server = {
    'iceServers': [{
        'urls': 'stun:global.stun.twilio.com:3478?transport=udp'
    }]
};
const newwebrtc = new webrtc('879', server)
console.log(newwebrtc);
document.getElementById("myBtn").addEventListener("click", function () {
    console.log('button clicked');
    newwebrtc.connectWEBRTC();
});
document.getElementById("myBtn1").addEventListener("click", function () {
    console.log(newwebrtc.datachannel.readyState);
    if(newwebrtc.datachannel.readyState !== 'open'){
        alert('webrtc not ready yet')
        console.log(newwebrtc.datachannelData.readyState);
        newwebrtc.connectWEBRTC();
    } else {
        var x = document.getElementById("myText").value;
        newwebrtc.send(x);
    }

});

newwebrtc.ispeerjoined.subscribe(data => {
    console.log('grtting val', data);
    if (data) {
        document.getElementById("myBtn").disabled = false;
        newwebrtc.datachannelData.subscribe(msg => {
            if(msg){
                var tag = document.createElement("p");
                var text = document.createTextNode(msg);
                tag.appendChild(text);
                var element = document.getElementById("new");
                element.appendChild(tag);
            }
        }, error => {
            console.log(error)
        })
    }
}, error => {
    console.log(error)
})