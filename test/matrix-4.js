var test = require('tape');
var matrix = require('..');
var connections;

test('create a connection matrix of 4 connections', function(t) {
  t.plan(1);
  connections = matrix({ count: 4, timeout: 20e3 }, function(err) {
    t.ifError(err);
  });
});

test('close connections', function(t) {
  t.plan(1);
  connections.splice(0).forEach(function(conn) {
    conn.close();
  });

  t.pass('connections closed');
});
