
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;
const fs = require('fs');
const os = require('os');
const ip = require('ip');

const extensions = [ 'png', 'jpg', '.jpeg' ];

const hostname = os.hostname();
const ipaddress =  ip.address();

var state = { 
  path: "",
  vectors: [ ],
  viewport: {
    center: {
      x: 0,
      y: 0
    },
    scale: 1.0
  },
};
const stateFields = [ 'path', 'vectors', 'viewport' ];

loadState();

app.use(express.static(__dirname + '/public'));

function loadState() {
  loadMetadata("/state");
  if (state.path && state.path.length) {
    loadMetadata(state.path);
  }
  console.log("state.metadata.json loaded");
}

function saveState() {
  saveMetadata("/state");
}

function loadMetadata(path) {
  path = "./public" + path + ".metadata.json";
  try {
    if (fs.existsSync(path)) {
      state = JSON.parse(fs.readFileSync(path));
    }
    console.log("Loaded metadata for", path);
  } catch (err) {
    console.log("Error loading metadata", err);
  }
}

function saveMetadata(path) {
  path = "./public" + path + ".metadata.json";
  fs.writeFile(path, JSON.stringify(state), (err) => {
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
  state.path = path;
  console.log("Image Load", path);
  loadMetadata(path);
  saveState();
  broadcast(socket, 'sync', state);
  syncHandler(socket);
}

function drawingHandler(socket, data) {
  state.vectors.push(data);
  saveState();
  broadcast(socket, "drawing", data);
}

function syncHandler(socket) {
  let data = {
    ip: ipaddress,
    hostname: hostname
  }
  stateFields.forEach(
    (field) => {
      data[field] = state[field];
    }
  )
  console.log("Sync", data);
  emit(socket, 'sync', data);
}

function viewportHandler(socket, viewport) {
  state.viewport = viewport;
  saveState();
  console.log("Viewport change", viewport);
  broadcast(socket, "viewport", viewport);
}

function saveHandler(socket) {
  if (state.path && state.path.length) {
    saveMetadata(state.path);
    saveState();
    console.log("Saved metadata for", state.path);
    emit(socket, "savecomplete");
  }
}

function onConnection(socket){
  socket.on('drawing', (data) => drawingHandler(socket, data));
  socket.on('filelist', (path) => fileListHandler(socket, path));
  socket.on('imageload', (path) => imageLoadHandler(socket, path));
  socket.on('sync', () => syncHandler(socket));
  socket.on('viewport', (viewport) => viewportHandler(socket, viewport));
  socket.on('save', () => saveHandler(socket));
  syncHandler(socket);
}
io.on('connection', onConnection);

http.listen(port, () => console.log('listening on port ' + port));
