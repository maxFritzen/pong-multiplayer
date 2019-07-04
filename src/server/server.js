const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');
const publicPath = path.join(__dirname, '../public');
const port = process.env.PORT || 3000;
var app = express();
// var server =  http.createServer(app);


const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackConfig = require('../../webpack.dev.js');
// app.use(express.static(publicPath));
app.use(express.static('public'));
if (process.env.NODE_ENV === 'development') {
  console.log('env development');
  const compiler = webpack(webpackConfig);
  app.use(webpackDevMiddleware(compiler));
} else {
  app.use(express.static('dist'));
}

const server = app.listen(port);
console.log(`Server listening on port ${port}`);
var io = socketIO(server);

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
var pointToWherePaddleShouldGo = 0; // Använd den här för att uppdatera paddle1


// Hold all variables here in state[room].
const state = {

}


io.on('connection', (socket) => {
  console.log('New user connected');
  // player1Ready = false;
  // player2Ready = false;
  // showingWinScreen = true;

  socket.on('join', (params, callback) => {
    const room = params.room;
    console.log('player joined room', room);
    socket.join(room, () => console.log('joined room', room));
    io.to(room).emit('renderGame');
    socket.broadcast.to(room).emit('newPlayerJoined');
    state[room] = {
      ball: {
        x: 250,
        y: 250, 
        speedX: 10,
        speedY: 8
      },
      player1: {
        pointToWherePaddleShouldGo: 0,
        score: 0,
        ready: false,
        x: 0,
        y: 250
      }, 
      player2: {
        pointToWherePaddleShouldGo: 0,
        score: 0,
        ready: false,
        x: 0,
        y: 250
      },
      showingWinScreen: true,
      winningPlayer: ''
    }
    console.log(state);
  });

  socket.on('updateMousePosPlayer1', (room, { y }) => {
    state[room].player1.pointToWherePaddleShouldGo = y;
  });

  socket.on('updateMousePosPlayer2', (room, { y }) => {
    state[room].player2.pointToWherePaddleShouldGo = y;
  });

  function startGame (room) {
    console.log('startGame server side', room)
    state[room].showingWinScreen = false;
    var fps = 30;
    var interval = setInterval(() => {
      if (state[room].showingWinScreen) { 
        console.log('winning player: ', state[room].winningPlayer);
        io.to(room).emit('showingWinScreen', state[room].winningPlayer);
        state[room].player1.ready = false;
        state[room].player2.ready = false;
        state[room].player1.score = 0;
        state[room].player2.score = 0;
        // player1Ready = false;
        // player2Ready = false;
        // player1score = 0;
        // player2score = 0;
        clearInterval(interval);
      } else {
        moveEverything(room)
      }
      
    }, 1000 / fps);
  };

  socket.on('playerReady', (player, room) => {
    console.log(player, room);
    if (player === 'player1') {
      console.log('player 1 ready in ', room);
      state[room].player1.ready = true;
      io.to(room).emit('playerJoined', player);
    } else if( player === 'player2') {
      console.log('player 2 ready');
      state[room].player2.ready = true;
      io.to(room).emit('playerJoined', player);
    }

    if (state[room].player1.ready && state[room].player2.ready) {
      startGame(room);
    }
  });

});

var canvas = { // Skicka med det här i parameter nånstans istället.
  height: 600,
  width: 800
};

function moveBall(room) {
  state[room].ball.x += state[room].ball.speedX;
  state[room].ball.y += state[room].ball.speedY;
  console.log(state[room].ball.x);
  if (state[room].ball.x < 0 + PADDLE_WIDTH + 10) {
    if (state[room].ball.y > state[room].player1.y 
      && state[room].ball.y < state[room].player1.y + PADDLE_HEIGHT) {
      state[room].ball.speedX = -state[room].ball.speedX;
      
      var deltaY = state[room].ball.y - (state[room].player1.y + PADDLE_HEIGHT / 2);
      state[room].ball.speedY = deltaY * 0.35
    } else if (state[room].ball.x < 0) {
      // player2score++;
      ballReset(room);
    }  
  }

  if (state[room].ball.x > canvas.width - PADDLE_WIDTH - 10) {
    if (state[room].ball.y > state[room].player2.y 
      && state[room].ball.y < state[room].player2.y + PADDLE_HEIGHT) {
      state[room].ball.speedX = -state[room].ball.speedX;

      var deltaY = state[room].ball.y - (state[room].player2.y + PADDLE_HEIGHT / 2);
      state[room].ball.speedY = deltaY * 0.35
    } else if (state[room].ball.x > canvas.width) {
      // player1score++;
      ballReset(room);
    }  
  }

  if (state[room].ball.y < 0) {
    state[room].ball.speedY = -state[room].ball.speedY;
  }

  if (state[room].ball.y > canvas.height) {
    state[room].ball.speedY = -state[room].ball.speedY;
  }
}
// function moveBall() {
//   ballX += ballSpeedX;
//   ballY += ballSpeedY;

//   if (ballX < 0 + PADDLE_WIDTH + 10) {
//     if (ballY > paddle1Y && ballY < paddle1Y + PADDLE_HEIGHT) {
//       ballSpeedX = -ballSpeedX;
      
//       var deltaY = ballY - (paddle1Y + PADDLE_HEIGHT / 2);
//       ballSpeedY = deltaY * 0.35
//     } else if (ballX < 0) {
//       // player2score++;
//       ballReset();
//     }  
//   }

//   if (ballX > canvas.width - PADDLE_WIDTH - 10) {
//     if (ballY > paddle2Y && ballY < paddle2Y + PADDLE_HEIGHT) {
//       ballSpeedX = -ballSpeedX;

//       var deltaY = ballY - (paddle2Y + PADDLE_HEIGHT / 2);
//       ballSpeedY = deltaY * 0.35
//     } else if (ballX > canvas.width) {
//       // player1score++;
//       ballReset();
//     }  
//   }

//   if (ballY < 0) {
//     ballSpeedY = -ballSpeedY;
//   }

//   if (ballY > canvas.height) {
//     ballSpeedY = -ballSpeedY;
//   }
// }

function movePaddle1(room) {
  // if (!state[room].player1.pointToWherePaddleShouldGo) return;
  const currentY = state[room].player1.y;
  let newY = currentY;
  const pointToWherePaddleShouldGo = state[room].player1.pointToWherePaddleShouldGo;
  if (pointToWherePaddleShouldGo + 20 < (currentY + PADDLE_HEIGHT / 2)) {
    newY -= 15;
  } else if (pointToWherePaddleShouldGo -20 > (currentY + PADDLE_HEIGHT / 2)) {
    newY += 15;
  }
  state[room].player1.y = newY;
  // if (!pointToWherePaddleShouldGo) return;
  // if (pointToWherePaddleShouldGo + 20 < (paddle1Y + PADDLE_HEIGHT / 2)) {
  //   paddle1Y -= 15;
  // } else if (pointToWherePaddleShouldGo -20 > (paddle1Y + PADDLE_HEIGHT / 2)) {
  //   paddle1Y += 15;
  // }
}

function moveEverything(room) {

  // computerMovement();
  moveBall(room);
  movePaddle1(room);
  // Emit all state
  io.to(room).emit('updateState', state[room]);
  // io.to(room).emit('updateBallPos', { x: ballX, y: ballY, p1score: player1score, p2score: player2score });
  // io.to(room).emit('updatePlayer1Pos', paddle1Y);
  // io.to(room).emit('updatePlayer2Pos', paddle2Y);
  // io.to(room).emit('updateBallPos', { x: ballX, y: ballY, p1score: player1score, p2score: player2score });
  // io.to(room).emit('updatePlayer1Pos', paddle1Y);
  // io.to(room).emit('updatePlayer2Pos', paddle2Y);
  
}

function ballReset(room) {
  const player1score = state[room].player1.score;
  const player2score = state[room].player2.score;
  if (player1score >= WINNING_SCORE || player2score >= WINNING_SCORE){
    state[room].showingWinScreen = true;
    if (player1score > player2score) {
      state[room].winningPlayer = 'PLAYER 1';
    } else {
      state[room].winningPlayer = 'PLAYER 2';
    }
  }
  console.log('ballreset: ', room, state);
  state[room].ball.speedX =- state[room].ball.speedX;
  state[room].ball.x = canvas.width / 2;
  state[room].ball.y = canvas.height / 2;
  console.log('ballreset after reset: ', room, state);
  // if (player1score >= WINNING_SCORE || player2score >= WINNING_SCORE){
  //   showingWinScreen = true;
  //   if (player1score > player2score) {
  //     winningPlayer = 'PLAYER 1';
  //   } else {
  //     winningPlayer = 'PLAYER 2';
  //   }
  // }

  // ballSpeedX = -ballSpeedX
  // ballX = canvas.width / 2;
  // ballY = canvas.height / 2;
}
function computerMovement() {
  // 
  // var paddle2YCenter = paddle2Y + (PADDLE_HEIGHT / 2);
  // // paddle2Y = ballY - 50;
  // if (paddle2YCenter < ballY - 35) {
  //   paddle2Y += 10;
  // } else if (paddle2YCenter > ballY + 35){
  //   paddle2Y -= 10;
  // }
}