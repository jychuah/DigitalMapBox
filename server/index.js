
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;
const fs = require('fs');
const os = require('os');
const ip = require('ip');

const extensions = [ 'png', 'jpg', '.jpeg' ];

var server = {
  global: generateState(),
  views: [ ],
  currentView: "",
  ip: ip.address(),
  hostname: os.hostname(),
  path: ""
} 

const stateFields = [ 'path', 'vectors', 'viewport', 'views', 'currentView' ];

function generateState() {
  return {
    vectors: [ ],
    viewport: {
      center: {
        x: 0,
        y: 0
      },
      scale: 1.0
    }
  }
}

function getCurrentViewState() {
  if (!server.currentView || server.currentView.length == 0) {
    return server.global;
  }
  let targetView = server.views.find(
    (view) => {
      return view.name == server.currentView;
    }
  )
  if (!targetView) {
    console.error("Could not find view", viewname);
  }
  return targetView.state;
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
  server.path = path;
  console.log("Image Load", path);
  loadMetadata(path);
  saveServerState();
  broadcast(socket, 'sync', server);
  syncHandler(socket);
}


function drawingHandler(socket, vector) {
  let state = getCurrentViewState();
  state.vectors.push(vector);
  saveServerState();
  broadcast(socket, "drawing", vector);
}

function syncHandler(socket) {
  console.log("Sync", server);
  emit(socket, 'sync', server);
}

function viewportHandler(socket, viewport) {
  let state = getCurrentViewState();
  state.viewport = viewport;
  saveServerState();
  console.log("Viewport change", viewport);
  broadcast(socket, "viewport", viewport);
}

function saveHandler(socket) {
  if (server.path && server.path.length) {
    saveMetadata(server.path);
    saveServerState();
    console.log("Saved metadata for", server.path);
    emit(socket, "savecomplete");
  }
}

function newViewHandler(socket, view) {
  server.views.push(view);
  broadcast(socket, "newview", view);
}

function changeViewHandler(socket, viewname) {
  server.currentView = viewname;
  broadcast(socket, "changeview", viewname);
}

function onConnection(socket){
  socket.on('drawing', (vector) => drawingHandler(socket, vector));
  socket.on('filelist', (path) => fileListHandler(socket, path));
  socket.on('imageload', (path) => imageLoadHandler(socket, path));
  socket.on('sync', () => syncHandler(socket));
  socket.on('viewport', (viewport) => viewportHandler(socket, viewport));
  socket.on('save', () => saveHandler(socket));
  socket.on('newview', (view) => newViewHandler(socket, view));
  socket.on('changeview', (viewname) => changeViewHandler(socket, viewname));
  syncHandler(socket);
}
io.on('connection', onConnection);

http.listen(port, () => console.log('listening on port ' + port));
