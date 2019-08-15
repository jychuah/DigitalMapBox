
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

const extensions = [ 'png', 'jpg', '.jpeg' ];

var server = {
  global: {
    name: "global",
    color: "#ffffff",
    state: {
      vectors: [ ],
      viewport: {
        center: {
          x: 0,
          y: 0
        },
        scale: 1.0
      },
      regions: [ ]
    }
  },
  views: [ ],
  currentView: -1,
  ip: ip.address(),
  hostname: os.hostname(),
  path: ""
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

function revealHandler(socket, regions) {
  let view = getCurrentView();
  view.state.regions = regions;
  console.log("Revealing ", regions.length, "regions", regions);
  broadcast(socket, "reveal", regions);
}

function drawingHandler(socket, vector) {
  let view = getCurrentView();
  view.state.vectors.push(vector);
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

function erase(v) {
  let view = getCurrentView();
  view.state.vectors = view.state.vectors.filter(
    (vector) => {
      return vectorDistance(v, vector) > 10 / view.state.viewport.scale;
    }
  )
}

function erasingHandler(socket, vector) {
  console.log("Erasing near vector", vector);
  broadcast(socket, "erasing", vector);
  erase(vector);
}

function syncHandler(socket) {
  console.log("Sync", server);
  emit(socket, 'sync', server);
}

function viewportHandler(socket, viewport) {
  let view = getCurrentView();
  view.state.viewport = viewport;
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
  console.log("Received new view", view);
  broadcast(socket, "newview", view);
}

function updateViewHandler(socket, viewdata) {
  let view = server.views[viewdata.index];
  view.name = viewdata.name;
  view.color = viewdata.color;
  console.log("Updating view metadata", viewdata);
  broadcast(socket, "updateview", viewdata);
}

function setViewHandler(socket, viewIndex) {
  server.currentView = viewIndex;
  console.log("Changing views", viewIndex);
  broadcast(socket, "setview", viewIndex);
}

function deleteViewHandler(socket, viewIndex) {
  server.views.splice(viewIndex, 1);
  console.log("Deleting view", viewIndex);
  broadcast(socket, "deleteview", viewIndex);
}

function fanHandler(socket, pValue) {
  exec('sudo hub-ctrl -h 0 -P 2 -p ' + pValue, (err, stdout, stderr) => {
    if (err) {
      // node couldn't execute the command
      console.log("Couldn't execute command");
      return;
    }
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
  });
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
  socket.on('drawing', (vector) => drawingHandler(socket, vector));
  socket.on('filelist', (path) => fileListHandler(socket, path));
  socket.on('imageload', (path) => imageLoadHandler(socket, path));
  socket.on('sync', () => syncHandler(socket));
  socket.on('viewport', (viewport) => viewportHandler(socket, viewport));
  socket.on('save', () => saveHandler(socket));
  socket.on('newview', (view) => newViewHandler(socket, view));
  socket.on('setview', (viewIndex) => setViewHandler(socket, viewIndex));
  socket.on('updateview', (viewData) => updateViewHandler(socket, viewData))
  socket.on('erasing', (vector) => erasingHandler(socket, vector));
  socket.on('reveal', (regions) => revealHandler(socket, regions));
  socket.on('deleteview', (viewIndex) => deleteViewHandler(socket, viewIndex));
  socket.on('fan', (pValue) => fanHandler(socket, pValue));
  socket.on('shutdown', () => shutdownHandler(socket));
  syncHandler(socket);
}

io.on('connection', onConnection);
http.listen(port, () => console.log('listening on port ' + port));
