var arDrone = require('ar-drone');
var client  = arDrone.createClient();

var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')

app.listen(8080);

function handler (req, res) {
  fs.readFile(__dirname + '/fly.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }
    res.writeHead(200);
    res.end(data);
  });
}

function now() {
  return Date.now();
}

function land() {
  client.stop();
  client.land();
}

var state = {};
var last_update = 0;
var runnerId = 0;

io.sockets.on('connection', function (socket) {
  socket.on('fly', function (data) {
    last_update = now();
    state.x = (data.x || 0);
    state.y = (data.y || 0);
    state.z = (data.z || 0);
    state.r = (data.r || 0);

    if (data.takeoff)
      startFlying();
    if (data.land)
      stopFlying();
  });
});

function startFlying() {
  console.log("Starting drone");
  client.takeoff();
  runner = setInterval( function() {
    if (now() - last_update > 250) {
      stopFlying();
    }
    console.log(state);
    client.right(state.x || 0);
    client.front(state.y || 0);
    client.up(state.z || 0);
    client.clockwise(state.r || 0);
  }, 50);
}

function stopFlying() {
  console.log("Stopping drone");
  clearInterval(runner);
  state = {};
  land();
}

process.on('SIGINT', function() {
  console.log("\nGracefully shutting down from SIGINT (Ctrl+C)");
 	client.stop();
 	client.land();
 	setInterval(function() { process.exit(); }, 800);
});
