/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 */
'use strict';

require('./shim')
require('./crypto')
require('stream')
var debug = require('debug')
debug.log = console.log.bind(console)
var crypto = require('crypto')
var EventEmitter = require('events').EventEmitter
var leveldown = require('asyncstorage-down')
var DHT = require('bittorrent-dht')
var Zlorp = require('zlorp')
Zlorp.ANNOUNCE_INTERVAL = 5000
Zlorp.LOOKUP_INTERVAL = 5000
var DSA = Zlorp.DSA
var kiki = require('kiki')
var React = require('react-native');
var {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  TouchableHighlight,
  TextInput
} = React;

var port = Number(process.argv[2]) || 55555
var tradleIp = '54.236.214.150'
var privKeys = require('./priv')
var fingerprints = {}
for (var name in privKeys) {
  var key = privKeys[name] = DSA.parsePrivate(privKeys[name])
  fingerprints[name] = key.fingerprint()
}

function getNodeId (fingerprint) {
  return crypto.createHash('sha256')
    .update(fingerprint)
    .digest()
    .slice(0, 20)
}

var zlorpy = React.createClass({
  chooseIdentity: function (me) {
    var self = this
    var them = me === 'bill' ? 'ted' : 'bill'
    var dht = new DHT({
      bootstrap: [tradleIp + ':25778'],
      nodeId: getNodeId(fingerprints[me])
    })

    dht.listen(port)

    var z = new Zlorp({
      leveldown: leveldown,
      dht: dht,
      key: privKeys[me],
      port: port,
      relay: {
        address: tradleIp,
        port: 25778
      }
    })

    z.on('data', function (data) {
      if (self.state.them) {
        self.addMessage(self.state.them, data.toString())
      }
    })

    z.contact({
      fingerprint: fingerprints[them]
    })

    z.on('connect', function (info) {
      if (info.fingerprint === fingerprints[them]) {
        self.state.msgs[0] = 'Tell ' + name + ' how you feel'
        self.setState(self.state)
      }
    })

    var state = this.state
    this.setState({
      msgs: this.state.msgs,
      me: me,
      them: them,
      node: z
    })
  },
  // componentWillMount: function () {
  //   var self = this
  //   var logged = false
  //   ;['log', 'debug', 'error'].forEach(function (method) {
  //     var orig = console[method]
  //     console[method] = function () {
  //       debugger
  //       var msg = 'LOG: ' + [].join.apply(arguments, ' ')
  //       self.state.msgs.push(msg)
  //       if (!logged) {
  //         logged = true
  //         process.nextTick(function () {
  //           logged = false
  //           self.setState(self.state)
  //         })
  //       }

  //       return orig.apply(console, arguments)
  //     }
  //   })
  // },
  addMessage: function (from, msg) {
    this.state.msgs.push(from + ': ' + msg)
    this.setState(this.state)
  },
  getInitialState: function () {
    return {
      msgs: ['Nothing here yet']
    }
  },
  onSubmit: function (msg) {
    msg = msg.nativeEvent.text
    this.state.text = ''
    this.addMessage(this.state.me, msg)
    this.state.node.send(new Buffer(msg), fingerprints[this.state.them])
  },
  onType: function (msg) {
    this.state.text = msg
    this.setState(this.state)
  },
  render: function() {
    var identityChooser = !this.state.me && (
      <View>
        <TouchableHighlight
          // style={styles.button}
          onPress={this.chooseIdentity.bind(this, 'bill')}>
            <Text style={styles.buttonText}>Bill</Text>
        </TouchableHighlight>
        <TouchableHighlight
          // style={styles.button}
          onPress={this.chooseIdentity.bind(this, 'ted')}>
            <Text style={styles.buttonText}>Ted</Text>
        </TouchableHighlight>
      </View>
    )

    var input = !identityChooser && (
      <TextInput
        style={{height: 40, borderColor: 'gray', borderWidth: 1}}
        onChangeText={this.onType}
        onSubmitEditing={this.onSubmit}
        value={this.state.text}
      />
    )

    return (
      <View style={styles.container}>
        {input}
        <Text style={styles.welcome}>
          {this.state.msgs.join('\n')}
        </Text>
        {identityChooser}
      </View>
    );
  }
});

var styles = StyleSheet.create({
  container: {
    flex: 1,
    // justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    padding: 10,
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});

AppRegistry.registerComponent('zlorpy', () => zlorpy);
