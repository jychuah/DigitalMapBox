
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
var dirty = false;

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
  try {
    console.log("Loading global metadata");
    loadMetadata("/server");
    if (server.path && server.path.length) {
      console.log("Searching for image", "./public" + server.path);
      if (!fs.existsSync("./public" + server.path)) {
        throw "Image " + server.path + " not found";
      }
      console.log("Loading metadata for", server.path);
      loadMetadata(server.path);
      console.log("server.metadata.json loaded");
    }
  } catch (err) {
    console.log("Error while loading server state", err);
    server = { ...blankState };
    saveServerState();
  }
}

function saveServerState() {
  saveMetadata("/server");
}

function loadMetadata(path) {
  path = "./public" + path + ".metadata.json";
  try {
    console.log("Searching for file", path);
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
  console.log("Requesting path", path);
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
  dirty = true;
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
  dirty = true;
}

function drawHandler(socket, vector) {
  server.vectors.push(vector);
  broadcast(socket, "drawing", vector);
  dirty = true;
}

function eraseRegionHandler(socket, id) {
  let index = server.regions.findIndex(
    (region) => region.id === id
  );
  server.regions.splice(index, 1);
  broadcast(socket, "eraseregion", id);
  dirty = true;
}

function eraseHandler(socket, erased) {
  broadcast(socket, "erasing", erased);
  server.vectors = server.vectors.filter(
    (vector) => !erased.includes(vector.id)
  )
  dirty = true;
}

function resetVectorsHandler(socket) {
  broadcast(socket, "resetvectors");
  server.vectors = [ ];
  dirty = true;
}

function resetRegionsHandler(socket) {
  broadcast(socket, "resetregions");
  server.regions = [ ];
  dirty = true;
}

function syncHandler(socket) {
  console.log("Sync", server);
  emit(socket, 'sync', server);
}

function cameraHandler(socket, camera) {
  server.camera = camera;
  saveServerState();
  broadcast(socket, "camera", camera);
  dirty = true;
}

function saveHandler() {
  if (dirty && server.path && server.path.length) {
    saveMetadata(server.path);
    saveServerState();
    console.log("Saved metadata for", server.path);
    dirty = false;
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

function onConnection(socket){
  socket.on('drawing', (vector) => drawHandler(socket, vector));
  socket.on('filelist', (path) => fileListHandler(socket, path));
  socket.on('imageload', (path) => imageLoadHandler(socket, path));
  socket.on('sync', () => syncHandler(socket));
  socket.on('camera', (camera) => cameraHandler(socket, camera));
  socket.on('save', () => saveHandler(socket));
  socket.on('erasing', (vectors) => eraseHandler(socket, vectors));
  socket.on('eraseregion', (id) => eraseRegionHandler(socket, id));
  socket.on('region', (region) => regionHandler(socket, region));
  socket.on('shutdown', () => shutdownHandler(socket));
  socket.on('globalreset', () => globalResetHandler(socket));
  socket.on('resetvectors', () => resetVectorsHandler(socket));
  socket.on('resetregions', () => resetRegionsHandler(socket));
  syncHandler(socket);
}

setInterval(saveHandler, 5000);
io.on('connection', onConnection);
http.listen(port, () => console.log('listening on port ' + port));
