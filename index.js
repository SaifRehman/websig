const IPFS = require('ipfs')
const Room = require('ipfs-pubsub-room')
const Rx = require('rxjs')
var emitter = require('events');
var util = require('util');

function websig(roomname, iceserver) {
    this.emitter = new emitter.EventEmitter();
    this.room;
    this.datachannel = [];
    this.ispeerjoined = new Rx.Subject(false);
    this.iceserver = iceserver;
    this.pc = [];
    this.ipfsid;
    this.peer;
    this.datachannelData = new Rx.Subject(undefined)
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

    const self = this;

    this.ipfs.once('ready', () => this.ipfs.id((err, info) => {
        if (err) {
            throw err
        }
        this.ipfsid = info.id
        this.room = Room(this.ipfs, this.roomname)
        this.room.on('peer joined', (peer) => {
            console.log("peer joined", peer);
            this.peer = peer;
            this.ispeerjoined.next(true);
            var hasMatch = false;
            for (var index = 0; index < this.pc.length; ++index) {

                var temp = this.pc[index];

                if (temp.currentpeer == peer) {
                    hasMatch = true;
                    break;
                }
            }
            if (!hasMatch) {
                this.pc.push({
                    currentpeer: info.id,
                    pc: new RTCPeerConnection(this.iceserver),
                    peer: peer
                })
                this.pc[this.pc.length - 1].pc.onicecandidate = (event => {
                    if (event.candidate) {
                        this.sendMessage(peer, JSON.stringify({
                            message: {
                                'ice': event.candidate,
                            },
                            sender: this.ipfsid
                        }));
                    }
                });
                this.datachannel.push({
                    currentpeer: this.ipfsid,
                    datachannel: this.pc[this.pc.length - 1].pc.createDataChannel('dataChannel', {
                        negotiated: true,
                        id: 0
                    }),
                    peer: peer
                });
                this.datachannel.forEach(data => {
                    if (!data.datachannel.onclose) {
                        data.datachannel.onclose = function (event) {};
                    }
                    if (!data.datachannel.onerror) {
                        data.datachannel.onerror = function (event) {};
                    }
                    if (!data.datachannel.onmessage) {
                        data.datachannel.onmessage = function (event) {
                            console.log('my data is ', event.data);
                            self.datachannelData.next(event.data);
                        };
                    }

                })
                console.log(this.pc, this.datachannel);
            }
            this.emitter.emit('pc joined');
        })
        this.room.on('peer left', (peer) => {
            console.log("peer left")
            this.ispeerjoined.next(false);
            this.pc = this.pc.filter(function (jsonObject) {
                return jsonObject.peer != peer;
            });
            this.datachannel = this.datachannel.filter(function (jsonObject) {
                return jsonObject.peer != peer;
            });
            console.log(this.pc, this.datachannel)
        })
        this.room.on('message', (message) => {
            var bigmsg = JSON.parse(message.data.toString());
            console.log(bigmsg, this.ipfsid);
            const msg = bigmsg.message;
            const indexval = this.pc.findIndex(x => (x.peer === bigmsg.sender && x.currentpeer === this.ipfsid));

            console.log('current pc ', indexval);
            if (bigmsg.sender !== this.ipfsid) {
                if (msg.ice) {
                    if (this.pc[indexval].pc) {
                        this.pc[indexval].pc.addIceCandidate(new RTCIceCandidate(msg.ice));
                    }
                } else if (msg.sdp.type === 'offer') {
                    console.log("in offer");
                    this.pc[indexval].pc.setRemoteDescription(new RTCSessionDescription(msg.sdp))
                        .then(() => {
                            console.log('setRemoteDescription')
                            return this.pc[indexval].pc.createAnswer()
                        })
                        .then(answer => {
                            console.log('creating answer')
                            return this.pc[indexval].pc.setLocalDescription(answer);
                        })
                        .then(() => {
                            console.log('sending offer!!!!')
                            this.sendMessage(this.pc[indexval].peer, JSON.stringify({
                                message: {
                                    sdp: this.pc[indexval].pc.localDescription,
                                },
                                sender: this.ipfsid
                            }))
                        });
                } else if (msg.sdp.type === 'answer') {
                    this.pc[indexval].pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
                }
            }
        })
    }))
}
util.inherits(websig, emitter)

websig.prototype.getipfsid = function () {
    return this.ipfsid;
}
websig.prototype.setipfsid = function (getipfsid) {
    this.ipfsid = getipfsid;
}
websig.prototype.getRoomname = function () {
    return this.roomname;
}

websig.prototype.sendMessage = function (peer, message) {
    this.room.sendTo(peer, message)
}

websig.prototype.getIceserver = function () {
    return this.iceserver;
}
websig.prototype.connectWEBRTC = function () {
    const self = this;
    this.pc.forEach(element => {
        // if (element.peer !== this.ipfsid) {
        console.log("elements is ", element);
        console.log(element.pc.connectionState);
        if (element.pc.connectionState !== 'connected') {
            element.pc.createOffer()
                .then(offer => element.pc.setLocalDescription(offer))
                .then(() => {
                    console.log('sending message to peer ', element.peer)
                    self.sendMessage(element.peer, JSON.stringify({
                        message: {
                            sdp: element.pc.localDescription
                        },
                        sender: self.ipfsid,
                    }))
                });
        }
    });
}
websig.prototype.send = function (msg) {
    this.datachannel.forEach(data => {
        if (data.datachannel.readyState === 'open') {
            data.datachannel.send(msg);
        }
    })
}

module.exports = websig;