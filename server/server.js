const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');

const { generateMessage, generateLocationMessage } = require('./utils/message');
const { Users } = require('./utils/users');
const { isRealString } = require('./utils/validation');
const publicPath = path.join(__dirname, '../public');
const port = process.env.PORT || 3000;
var app = express();
var server =  http.createServer(app);
var io = socketIO(server);
var users = new Users();

app.use(express.static(publicPath));

io.on('connection', (socket) => {
  console.log('New user connected');
  socket.on('updateMousePosPlayer1', ({x , y}) => {
    socket.emit('updatePlayer1Pos', y)
  })

});

server.listen(port,() => {
    console.log(`Server is up on port ${port}`);
})

