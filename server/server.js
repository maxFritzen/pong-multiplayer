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
const WINNING_SCORE = 1;

io.on('connection', (socket) => {
  console.log('New user connected');
  socket.on('updateMousePosPlayer1', ({x , y}) => {
    paddle1Y = y - PADDLE_HEIGHT / 2;
    socket.emit('updatePlayer1Pos', paddle1Y)
  });

  socket.on('startGame', () => {
    console.log('startGame')
    showingWinScreen = false;
    var fps = 30;
    setInterval(() => {
      if (showingWinScreen) {
        socket.emit('showingWinScreen', winningPlayer)
      } else {
        moveEverything()
        socket.emit('updateBallPos', { x: ballX, y: ballY });
        socket.emit('updatePlayer2Pos', paddle2Y);
      }
      
    }, 1000 / fps);
    
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

  computerMovement()

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