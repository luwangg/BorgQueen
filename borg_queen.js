var http = require('http');
var fs = require('fs');
var lockFile = require('lockfile');
var io = require('socket.io');
var io_client = require('socket.io-client');

var borg_queen = http.createServer(function (req, res) {
  fs.readFile(__dirname + '/drone/fly.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading fly.html');
    }

    res.writeHead(200);
    res.end(data);
  });
});

var bqSocket = io.listen(borg_queen);
borg_queen.listen(8081);

var drone = io_client.connect('http://localhost:8080');

var lock_file = 'drone.lock';

bqSocket.sockets.on('connection', function (socket) {
  var has_lock = false;

  socket.send('hello world');
  lockFile.lock(lock_file, function (er, fd) {
    if (er)
      return;
    has_lock = true;

    console.log("lock acquired");
    socket.send('lock acquired');
  });

  socket.on('fly', function (data) {
    if (!has_lock)
      return;

    console.log("data", data);
    drone.emit('fly', data);
  });

  socket.on('disconnect', function (data) {
    if (!has_lock)
      return;
    
    lockFile.unlock(lock_file, function (er) {
      console.log("lock released");
    });
  });

});