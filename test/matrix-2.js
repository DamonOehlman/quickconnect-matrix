var test = require('tape');
var matrix = require('..');
var connections;

test('create a connection matrix of 2 connections', function(t) {
  var dcs = [];

  function testSend() {
    if (dcs[0] && dcs[1]) {
      dcs[1].onmessage = function(evt) {
        t.equal(evt.data, 'hello', 'got message ok');
      };

      dcs[0].send('hello');
    }
  }

  t.plan(4);
  connections = matrix({ count: 2, channels: ['test'] }, function(err) {
    t.ifError(err);
  });

  connections.forEach(function(conn, idx) {
    conn.once('channel:opened:test', function(id, dc) {
      t.ok(dcs[idx] = dc, 'got a datachannel for for connection:' + idx);
      testSend();
    });
  });
});

test('close opened connections and wait for notification', function(t) {
  t.plan(connections.length);
  connections.forEach(function(conn, idx) {
    conn.once('call:ended', t.pass.bind(t, 'closed connection:' + idx));
  });

  connections.splice(0).forEach(function(conn) {
    conn.close();
  });
});
