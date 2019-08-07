
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;
const fs = require('fs');

const extensions = [ 'png', 'jpg', '.jpeg' ];

app.use(express.static(__dirname + '/public'));



function fileListHandler(socket, path) {
  let contents = fs.readdirSync('./public/img' + path, { withFileTypes: true });
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
  socket.emit('filelist', result);
}

function onConnection(socket){
  socket.on('drawing', (data) => socket.broadcast.emit('drawing', data));
  socket.on('filelist', (path) => fileListHandler(socket, path));
}

io.on('connection', onConnection);

http.listen(port, () => console.log('listening on port ' + port));
