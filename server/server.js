const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');

const publicPath = path.join(__dirname, '../public');
const port = process.env.PORT || 3000;
var app = express();
var server =  http.createServer(app);
var io = socketIO(server);

app.use(express.static(publicPath));

var ballX = 250;
var ballY = 250;
var ballSpeedX = 10;
var ballSpeedY = 8;

var paddle1Y = 250;
var paddle2Y = 250;
const PADDLE_HEIGHT = 100;
const PADDLE_WIDTH = 10;

var showingWinScreen = false;
var winningPlayer;
var player1score = 0;
var player2score = 0;
const WINNING_SCORE = 3;

var player1Ready = false;
var player2Ready = false;

io.on('connection', (socket) => {
  console.log('New user connected');
  player1Ready = false;
  player2Ready = false;
  showingWinScreen = true;

  socket.on('join', (params, callback) => {

    socket.join(params.room);
    socket.broadcast.to(params.room).emit('newPlayerJoined');
  });

  socket.on('updateMousePosPlayer1', ({x , y}) => {
    paddle1Y = y - PADDLE_HEIGHT / 2;
    socket.emit('updatePlayer1Pos', paddle1Y)
  });

  socket.on('updateMousePosPlayer2', ({x , y}) => {
    paddle2Y = y - PADDLE_HEIGHT / 2;
    socket.emit('updatePlayer2Pos', paddle2Y)
  });

  function startGame () {
    console.log('startGame')
    showingWinScreen = false;
    var fps = 30;
    var interval = setInterval(() => {
      if (showingWinScreen) {
        console.log('winning player: ', winningPlayer);
        io.emit('showingWinScreen', winningPlayer);
        player1Ready = false;
        player2Ready = false;
        player1score = 0;
        player2score = 0;
        clearInterval(interval);
      } else {
        moveEverything()
        io.emit('updateBallPos', { x: ballX, y: ballY, p1score: player1score, p2score: player2score });
        io.emit('updatePlayer1Pos', paddle1Y);
        io.emit('updatePlayer2Pos', paddle2Y);
      }
      
    }, 1000 / fps);
  };

  socket.on('playerReady', (player) => {
    if (player === 'player1') {
      console.log('player 1 ready');
      player1Ready = true;
      io.emit('playerJoined', player);
    } else if( player === 'player2') {
      console.log('player 2 ready');
      player2Ready = true;
      io.emit('playerJoined', player);
    }

    if (player1Ready && player2Ready) {
      startGame();
    }
  });

});

server.listen(port,() => {
    console.log(`Server is up on port ${port}`);
})

var canvas = {
  height: 600,
  width: 800
};

function moveEverything() {

  // computerMovement()

  ballX += ballSpeedX;
  ballY += ballSpeedY;

  if (ballX < 0 + PADDLE_WIDTH + 10) {
    if (ballY > paddle1Y && ballY < paddle1Y + PADDLE_HEIGHT) {
      ballSpeedX = -ballSpeedX;
      
      var deltaY = ballY - (paddle1Y + PADDLE_HEIGHT / 2);
      ballSpeedY = deltaY * 0.35
    } else if (ballX < 0) {
      player2score++;
      ballReset();
    }  
  }

  if (ballX > canvas.width - PADDLE_WIDTH - 10) {
    if (ballY > paddle2Y && ballY < paddle2Y + PADDLE_HEIGHT) {
      ballSpeedX = -ballSpeedX;

      var deltaY = ballY - (paddle2Y + PADDLE_HEIGHT / 2);
      ballSpeedY = deltaY * 0.35
    } else if (ballX > canvas.width) {
      player1score++;
      ballReset();
    }  
  }

  if (ballY < 0) {
    ballSpeedY = -ballSpeedY;
  }

  if (ballY > canvas.height) {
    ballSpeedY = -ballSpeedY;
  }
}

function ballReset() {

  if (player1score >= WINNING_SCORE || player2score >= WINNING_SCORE){
    showingWinScreen = true;
    if (player1score > player2score) {
      winningPlayer = 'PLAYER 1';
    } else {
      winningPlayer = 'PLAYER 2';
    }
  }

  ballSpeedX = -ballSpeedX
  ballX = canvas.width / 2;
  ballY = canvas.height / 2;
}
function computerMovement() {
  var paddle2YCenter = paddle2Y + (PADDLE_HEIGHT / 2);
  // paddle2Y = ballY - 50;
  if (paddle2YCenter < ballY - 35) {
    paddle2Y += 10;
  } else if (paddle2YCenter > ballY + 35){
    paddle2Y -= 10;
  }
}