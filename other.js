
var crypto = require('crypto')
var EventEmitter = require('events').EventEmitter
var leveldown = require('memdown')
var DHT = require('bittorrent-dht')
var Zlorp = require('zlorp')
Zlorp.ANNOUNCE_INTERVAL = 5000
Zlorp.LOOKUP_INTERVAL = 5000
var kiki = require('kiki')
var bill = require('./bill-priv')
var ted = require('./ted-priv')
var msgEmitter = new EventEmitter()
var me = bill
var them = ted
var dht = new DHT({
  bootstrap: ['tradle.io:25778'],
  nodeId: getNodeId(me)
})

var port = Number(process.argv[2]) || 50162
dht.listen(port)

// setInterval(function () {
//   msgEmitter.emit('data', 'hey')
// }, 2000)

var z = new Zlorp({
  leveldown: leveldown,
  dht: dht,
  key: kiki.toKey(me)
})

z.on('data', function (msg) {
  console.log(them.fingerprint + ': ' + msg)
})

z.contact({
  fingerprint: them.fingerprint
})

// var send = z.send
// z.send = function (msg) {
//   console.log(me.fingerprint + ': ' + msg)
//   return send.apply(this, arguments)
// }

process.stdin.resume()
process.stdin.on('data', function (data) {
  z.send(data, them.fingerprint)
})

function getNodeId (key) {
  return crypto.createHash('sha256')
    .update(key.fingerprint)
    .digest()
    .slice(0, 20)
}
