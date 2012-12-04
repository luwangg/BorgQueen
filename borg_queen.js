var http = require('http');
var fs = require('fs');
var lockFile = require('lockfile');
var io = require('socket.io');
var io_client = require('socket.io-client');
var path = require('path');

var borg_queen = http.createServer(function (req, res) {
  var filePath = req.url;
  console.log('filePath', filePath);
  if (filePath.match(/^\/vendor/)) {
    filePath = '.' + filePath;
    var extname = path.extname(filePath);
    var contentType = 'text/html';
    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
    }

    fs.exists(filePath, function(exists) {
      if (exists) {
        fs.readFile(filePath, function(error, content) {
          if (error) {
            res.writeHead(500);
            res.end();
          } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
          }
        });
      } else {
        res.writeHead(404);
        res.end();
      }
    });

  } else {
    fs.readFile(__dirname + '/drone/fly.html',
    function (err, data) {
      if (err) {
        res.writeHead(500);
        return res.end('Error loading fly.html');
      }

      res.writeHead(200);
      res.end(data);
    });
  }
});

var bqSocket = io.listen(borg_queen);
borg_queen.listen(8081);

var drone = io_client.connect('http://localhost:8080');

var lock_file = 'drone.lock';
lockFile.unlock(lock_file, function() {});

bqSocket.sockets.on('connection', function (socket) {
  var has_lock = false;

  socket.send('hello world');
  lockFile.lock(lock_file, function (er, fd) {
    console.log("err", er);
    if (er)
      return;
    has_lock = true;

    console.log("lock acquired");
    socket.send('lock acquired');
  });

  socket.on('fly', function (data) {
    console.log("data", data, has_lock);
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