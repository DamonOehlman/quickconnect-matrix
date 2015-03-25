var cuid = require('cuid');
var times = require('whisk/times');
var not = require('whisk/not');
var extend = require('cog/extend');

/**
  # quickconnect-matrix

  This is a helper utility for creating a matrix of webrtc connections using
  [`rtc-quickconnect`](https://github.com/rtc-io/rtc-quickconnect).  This is
  mainly used to help facilitate tests for quickconnect and associated
  functionality.

  ## Example Usage

  <<< test/matrix-4.js
**/
module.exports = function(opts, callback) {
  // initialise core settings
  var count = (opts || {}).count || 2;
  var room = (opts || {}).room || cuid();
  var channels = (opts || {}).channels || ['default'];

  var timeout = setTimeout(cancelWait, (opts || {}).timeout || 5000);
  var cancelled = false;

  // require quickconnect if another quickconnect package isn't specified
  var quickconnect = (opts || {}).quickconnect || require('rtc-quickconnect');

  // create the connections
  var connections = times(count).map(function() {
    return quickconnect('', extend({
      room: room,
      signaller: 'https://switchboard.rtc.io/'
    }, opts));
  });

  var pending = [].concat(connections);

  function cancelWait() {
    cancelled = true;
    callback(new Error('connections not established within expected time'));
  }

  function ready(conn) {
    // remove the ready connection from the pending connections
    pending = pending.filter(not(conn));

    // if we have no more pending connections, clear the timeout and callback
    if ((! cancelled) && pending.length === 0) {
      clearTimeout(timeout);
      callback(null, connections);
    }
  }

  connections.forEach(function(conn) {
    var expectedCount = connections.length - 1;
    var expected = [];
    var established = [];

    function handleAnnounce(data) {
      expected.push(data.id);
      if (expected.length === expectedCount) {
        conn.removeListener('peer:announce', handleAnnounce);
      }
    }

    function handleCallStart(id) {
      established.push(id);
      if (established.length === expectedCount) {
        conn.removeListener('call:started', handleCallStart);
        ready(conn);
      }
    }

    conn.on('peer:announce', handleAnnounce);
    conn.on('call:started', handleCallStart);

    // create the data channels
    channels.forEach(function(channelName) {
      conn.createDataChannel(channelName);
    });
  });

  return connections;
};
