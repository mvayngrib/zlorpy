/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 */
'use strict';

require('./shim')
require('./crypto')
require('stream')
var crypto = require('crypto')
var EventEmitter = require('events').EventEmitter
var leveldown = require('asyncstorage-down')
var DHT = require('bittorrent-dht')
var Zlorp = require('zlorp')
Zlorp.ANNOUNCE_INTERVAL = 5000
Zlorp.LOOKUP_INTERVAL = 5000
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

var bill = require('./bill-priv')
bill.name = 'bill'
var ted = require('./ted-priv')
ted.name = 'ted'
var msgEmitter = new EventEmitter()
var dht = new DHT({
  bootstrap: ['tradle.io:25778'],
  nodeId: getNodeId(me)
})

var port = Number(process.argv[2]) || 55555
dht.listen(port)

// setInterval(function () {
//   msgEmitter.emit('data', 'hey')
// }, 2000)

function getNodeId (key) {
  return crypto.createHash('sha256')
    .update(key.fingerprint)
    .digest()
    .slice(0, 20)
}

var zlorpy = React.createClass({
  chooseIdentity: function (me) {
    var them = me === bill ? ted : bill
    var z = new Zlorp({
      leveldown: leveldown,
      dht: dht,
      key: kiki.toKey(me)
    })

    z.on('data', function () {
      msgEmitter.emit('data', data)
    })

    z.contact({
      fingerprint: them.fingerprint
    })

    var state = this.state
    this.setState({
      msgs: this.state.msgs,
      me: me,
      them: them,
      node: z
    })
  },
  addMessage: function (from, msg) {
    this.state.msgs.push(from + ': ' + msg)
    this.setState(this.state)
  },
  getInitialState: function () {
    return {
      msgs: ['Nothing here yet']
    }
  },
  componentWillMount: function () {
    var self = this
    msgEmitter.on('data', function (data) {
      if (self.state.them) {
        self.addMessage(self.state.them.name, data)
      }
    })
  },
  onSubmit: function (msg) {
    msg = msg.nativeEvent.text
    this.state.text = ''
    this.addMessage(this.state.me.name, msg)
    this.state.node.send(msg, this.state.them.fingerprint)
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
          onPress={this.chooseIdentity.bind(this, bill)}>
            <Text style={styles.buttonText}>Bill</Text>
        </TouchableHighlight>
        <TouchableHighlight
          // style={styles.button}
          onPress={this.chooseIdentity.bind(this, ted)}>
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
