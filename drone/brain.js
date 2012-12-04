var arDrone = require('ar-drone');
var client  = arDrone.createClient();

var app = require('http').createServer(handler),
    io = require('socket.io').listen(app);

app.listen(8080);

function handler (req, res) {
  res.writeHead(200);
  res.end("Nothing to show");
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
var runner = 0;

io.sockets.on('connection', function (socket) {
  socket.on('fly', function (data) {
    console.log('data', data);
    last_update = now();
    state.x = (data.x || 0);
    state.y = (data.y || 0);
    state.z = (data.z || 0);
    state.r = (data.r || 0);

    if (data.takeoff)
      startFlying();
    if (data.land)
      stopFlying();
    if (data.recover) {
      console.log("Recovering!")
      stopFlying();
      client.disableEmergency();
    }
  });
});

function startFlying() {
  console.log("Starting drone");
  client.takeoff();
  runner = setInterval( function() {
    if (now() - last_update > 250) {
      stopFlying();
    }
    client.right(state.x || 0);
    client.front(state.y || 0);
    client.up(state.z || 0);
    client.clockwise(state.r || 0);
  }, 30);
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
