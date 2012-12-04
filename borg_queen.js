var http = require('http');
var fs = require('fs');
var lockFile = require('lockfile');
var io = require('socket.io');

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

var lock_file = 'drone.lock';
var server_port = 8081;

var borg_queen_socket = io.listen(borg_queen);
borg_queen.listen(server_port);

var drone_host = 'http://localhost:8080';
var drone = io.connect(drone_host);


borg_queen_socket.sockets.on('connection', function (socket) {
  socket.send('hello world');
  // opts is optional, and defaults to {}
  lockFile.lock(lock_file, opts, function (er, fd) {
    if (er)
      return;

    console.log("lock acquired");
    socket.send('lock acquired');

    socket.on('fly', function (data) {
      drone.emit('fly', data);
    });

    socket.on('disconnect', function (data) {
      lockFile.unlock(lock_file, function (er) {
        console.log("lock released");
      });

      socket.off('fly');
    });

  });
});