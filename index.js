const IPFS = require('ipfs')
const Room = require('ipfs-pubsub-room')
const Rx = require('rxjs')
function websig(roomname, iceserver) {
    this.room;
    this.datachannel;
    this.ispeerjoined = new Rx.BehaviorSubject(false);
    this.pc = new RTCPeerConnection(iceserver);
    this.ipfsid;
    this.peer;
    this.datachannelData = new Rx.BehaviorSubject(undefined)
    this.ipfs = new IPFS({
        repo: 'ipfs/pubsub-demo/' + Math.random(),
        EXPERIMENTAL: {
            pubsub: true
        },
        config: {
            Addresses: {
                Swarm: ['/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star']
            }
        }
    });
    this.roomname = roomname;
    this.pc.onicecandidate = (event => {
        if (event.candidate) {
            this.sendMessage(JSON.stringify({
                message: {
                    'ice': event.candidate,
                },
                sender: this.ipfsid
            }));
        } else {
        }
    });
    const self = this;
    this.datachannel = this.pc.createDataChannel('dataChannel', {
        negotiated: true,
        id: 0
    });
    this.datachannel.onclose = function (event) {
    };
    this.datachannel.onerror = function (err) {
    };
    this.datachannel.onmessage = function (event) {        
        self.datachannelData.next(event.data);
    }
    this.ipfs.once('ready', () => this.ipfs.id((err, info) => {
        if (err) {
            throw err
        }
        this.ipfsid = info.id
        this.room = Room(this.ipfs, this.roomname)
        this.room.on('peer joined', (peer) => {
            this.peer = peer;

            this.ispeerjoined.next(true);
        })
        this.room.on('peer left', (peer) => {
            this.ispeerjoined.next(false);
        })
        this.room.on('message', (message) => {
            var bigmsg = JSON.parse(message.data.toString());
            console.log(bigmsg);
            const msg = bigmsg.message;
            const sender = bigmsg.sender;
            if (sender !== this.ipfsid) {
                if (msg.ice) {
                    if (this.pc) {
                        this.pc.addIceCandidate(new RTCIceCandidate(msg.ice));
                    }
                } else if (msg.sdp.type === 'offer') {
                    this.pc.setRemoteDescription(new RTCSessionDescription(msg.sdp))
                        .then(() => this.pc.createAnswer())
                        .then(answer => {
                            return this.pc.setLocalDescription(answer);
                        })
                        .then(() => this.sendMessage(JSON.stringify({
                            message: {
                                sdp: this.pc.localDescription,
                            },
                            sender: this.ipfsid
                        })));
                } else if (msg.sdp.type === 'answer') {
                    this.pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
                }
            }
        })
    }))
}
websig.prototype.getipfsid = function () {
    return this.ipfsid;
}
websig.prototype.setipfsid = function (getipfsid) {
    this.ipfsid = getipfsid;
}
websig.prototype.getRoomname = function () {
    return this.roomname;
}

websig.prototype.sendMessage = function (message) {
    this.room.sendTo(this.peer, message)
}

websig.prototype.getIceserver = function () {
    return this.iceserver;
}
websig.prototype.connectWEBRTC = function () {
    if(this.ispeerjoined.value){
        this.pc.createOffer()
        .then(offer => this.pc.setLocalDescription(offer))
        .then(() => {
            this.sendMessage(JSON.stringify({
                message: {
                    sdp: this.pc.localDescription
                },
                sender: this.ipfsid,
            }))
        });
    }
}
websig.prototype.send = function (msg) {
    if (this.datachannel.readyState === 'open') {
        this.datachannel.send(msg);
    }
}

module.exports = websig;