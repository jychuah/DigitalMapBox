
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;
const fs = require('fs');
const os = require('os');
const ip = require('ip');

const extensions = [ 'png', 'jpg', '.jpeg' ];

const state = { 
  path: "",
  vectors: [ ],
  viewport: {
    center: {
      x: 0,
      y: 0
    },
    scale: 1.0
  },
  hostname: os.hostname(),
  ip: ip.address(),
};

app.use(express.static(__dirname + '/public'));

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
  broadcast(socket, 'sync', state);
  syncHandler(socket);
}

function drawingHandler(socket, data) {
  state.vectors.push(data);
  broadcast(socket, "drawing", data);
}

function syncHandler(socket) {
  console.log("Sync", state);
  emit(socket, 'sync', state);
}

function onConnection(socket){
  socket.on('drawing', (data) => drawingHandler(socket, data));
  socket.on('filelist', (path) => fileListHandler(socket, path));
  socket.on('imageload', (path) => imageLoadHandler(socket, path));
  socket.on('sync', () => syncHandler(socket));
  syncHandler(socket);
}
io.on('connection', onConnection);

http.listen(port, () => console.log('listening on port ' + port));
