
const compression = require('compression');
const express = require('express');
const app = express();
app.use(compression())
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;
const fs = require('fs');
const os = require('os');
const ip = require('ip');
const { exec } = require('child_process');

var ifaces = os.networkInterfaces();
var ipaddress = null;

Object.keys(ifaces).forEach(function (ifname) {
  var alias = 0;

  ifaces[ifname].forEach(function (iface) {
    if ('IPv4' !== iface.family || iface.internal !== false) {
      // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
      return;
    }

    if (alias >= 1) {
      // this single interface has multiple ipv4 addresses
      console.log(ifname + ':' + alias, iface.address);
    } else {
      // this interface has only one ipv4 adress
      console.log(ifname, iface.address);
    }
    ipaddress = iface.address;
    ++alias;
  });
});

if (!ipaddress) {
  ipaddress = ip.address();
}

const extensions = [ 'png', 'jpg', '.jpeg' ];

var server = {
  ip: ipaddress,
  hostname: os.hostname(),
  path: "",
  viewport: {
    width: 1920,
    height: 1080,
  },
  camera: {
    center: {
      x: 0,
      y: 0
    },
    scale: 1.0,
  },
  regions: [ ],
  vectors: [ ]
} 

const blankState = JSON.parse(JSON.stringify(server));

function getCurrentView() {
  if (server.currentView == -1) {
    return server.global;
  }
  return server.views[server.currentView];
}

loadServerState();

app.use(express.static(__dirname + '/public'));

function loadServerState() {
  loadMetadata("/server");
  if (server.path && server.path.length) {
    loadMetadata(server.path);
    console.log("server.metadata.json loaded");
  }
}

function saveServerState() {
  saveMetadata("/server");
}

function loadMetadata(path) {
  path = "./public" + path + ".metadata.json";
  try {
    if (fs.existsSync(path)) {
      let meta = JSON.parse(fs.readFileSync(path));
      let oldServer = server; 
      server = meta;
      server.hostname = oldServer.hostname,
      server.ip = oldServer.ip;
    }
    console.log("Loaded metadata for", path);
  } catch (err) {
    console.log("Error loading metadata", err);
  }
}

function saveMetadata(path) {
  path = "./public" + path + ".metadata.json";
  fs.writeFile(path, JSON.stringify(server), (err) => {
    if (err) {
      console.log("Error writing file", err);
    } 
  });
}

function broadcast(socket, event, data) {
  let payload = {
    "event": event,
    "data": data
  }
  socket.broadcast.emit("DigitalMapBox", payload);
}

function emit(socket, event, data) {
  let payload = {
    "event": event,
    "data": data
  }
  socket.emit("DigitalMapBox", payload);
}

function fileListHandler(socket, path) {
  let contents = fs.readdirSync('./public' + path, { withFileTypes: true });
  let subdirs = contents
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .sort();
  let images = contents
    .filter(dirent => {
      let tokens = dirent.name.split('.');
      return extensions.some(
        (extension) => extension === tokens[tokens.length - 1].toLowerCase()
      );
    })
    .map(dirent => dirent.name);
  let result = {
    subdirs: subdirs,
    images: images
  }
  console.log("File listing", result);
  emit(socket, 'filelist', result);
}

function imageLoadHandler(socket, path) {
  server = JSON.parse(JSON.stringify(blankState));
  console.log("Image Load", path);
  loadMetadata(path);
  server.path = path
  saveServerState();
  broadcast(socket, 'sync', server);
  syncHandler(socket);
}

function regionHandler(socket, region) {
  let index = server.regions.findIndex(r => r.id === region.id);
  if (index > -1) {
    server.regions[index] = region;
  } else {
    server.regions.push(region);
  }
  console.log("Region ", region);
  broadcast(socket, "region", region);
}

function vectorHandler(socket, vector) {
  server.vectors.push(vector);
  broadcast(socket, "drawing", vector);
}

function pointDistance(p, v) {
  var A = p.x - v.p0.x;
  var B = p.y - v.p0.y;
  var C = v.p1.x - v.p0.x;
  var D = v.p1.y - v.p0.y;

  var dot = A * C + B * D;
  var len_sq = C * C + D * D;
  var param = -1;
  if (len_sq != 0) //in case of 0 length line
      param = dot / len_sq;

  var xx, yy;

  if (param < 0) {
    xx = v.p0.x;
    yy = v.p0.y;
  }
  else if (param > 1) {
    xx = v.p1.x;
    yy = v.p1.y;
  }
  else {
    xx = v.p0.x + param * C;
    yy = v.p0.y + param * D;
  }

  var dx = p.x - xx;
  var dy = p.y - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

function vectorDistance(v1, v2) {
  return Math.min(pointDistance(v1.p0, v2), pointDistance(v1.p1, v2));
}

function eraseHandler(socket, vector) {
  let erased = server.vectors.reduce(
    (results, vector) => {
      if (vectorDistance(v, vector) < 10 / server.viewport.scale) {
        results.push(vector.id);
      }
    }
  )
  broadcast(socket, "erasing", erased);
  server.vectors = server.vectors.filter(
    (vector) => !erased.includes(vector.id)
  )
}

function syncHandler(socket) {
  console.log("Sync", server);
  emit(socket, 'sync', server);
}

function cameraHandler(socket, camera) {
  server.camera = camera;
  saveServerState();
  console.log("Camera change", camera);
  broadcast(socket, "camera", camera);
}

function saveHandler(socket) {
  if (server.path && server.path.length) {
    saveMetadata(server.path);
    saveServerState();
    console.log("Saved metadata for", server.path);
    emit(socket, "savecomplete");
  }
}

function shutdownHandler(socket) {
  exec('sudo shutdown -h now', (err, stdout, stderr) => {
    if (err) {
      // node couldn't execute the command
      console.log("Couldn't execute command");
      return;
    }
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
  }); 
  broadcast(socket, "shutdown");
}

function globalResetHandler(socket) {
  console.log("Reseting global view");
  server.vectors = [ ];
  server.regions = [ ];
  broadcast(socket, "globalreset");
}

function onConnection(socket){
  socket.on('vector', (vector) => vectorHandler(socket, vector));
  socket.on('filelist', (path) => fileListHandler(socket, path));
  socket.on('imageload', (path) => imageLoadHandler(socket, path));
  socket.on('sync', () => syncHandler(socket));
  socket.on('camera', (camera) => cameraHandler(socket, camera));
  socket.on('save', () => saveHandler(socket));
  socket.on('erase', (vector) => eraseHandler(socket, vector));
  socket.on('region', (region) => regionHandler(socket, region));
  socket.on('shutdown', () => shutdownHandler(socket));
  socket.on('globalreset', () => globalResetHandler(socket));
  syncHandler(socket);
}

io.on('connection', onConnection);
http.listen(port, () => console.log('listening on port ' + port));
