var http = require('http');
var fs = require('fs');
var index = fs.readFileSync('index.html');
var lockFile = require('lockfile');

var borg_queen = http.createServer(function (req, res) {
  fs.readFile(__dirname + '/fly.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading fly.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}).listen(server_port);

var io = require('socket.io').listen(borg_queen);

var lock_file = 'drone.lock';
var server_port = 8081;
var drone_host = 'http://localhost:8080';
var drone = io.connect(drone_host);


io.sockets.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' });
  // opts is optional, and defaults to {}
  lockFile.lock(lock_file, opts, function (er, fd) {
    if (er)
      return;

    console.log("lock acquired");
    socket.emit('news', { lock: 'aquired' });

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