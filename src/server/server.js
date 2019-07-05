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

const PADDLE_HEIGHT = 100;
const PADDLE_WIDTH = 10;
const WINNING_SCORE = 3;
const originalBall = {
  x: 250,
  y: 250, 
  speedX: 20,
  speedY: 15
}

const PLAYER = {
  name: '',
  id: '',
  pointToWherePaddleShouldGo: 0,
  score: 0,
  ready: false,
  x: 0,
  y: 250
}

// Hold all variables here in state[room].
const state = {

}

const originalRoom = {
  ball: {
    ...originalBall
  },
  player1: {
    ...PLAYER 
  }, 
  player2: {
    ...PLAYER
  },
  showingWinScreen: true,
  winningPlayer: '',
  players: [],
  connectedSockets: []
}

const getConnectedPlayers = (room) => {
  return Object.keys(io.sockets.adapter.rooms[room].sockets);
}

io.on('connection', (socket) => {
  console.log('New user connected');

  socket.on('join', (params, callback) => {
    const { name, room } = params;
    console.log('player joined room', room);
    socket.join(room, () => console.log('joined room', room));
    io.to(room).emit('renderGame');
    socket.broadcast.to(room).emit('newPlayerJoined');
    const currentPlayers = state[room] ? state[room].players : []
    const currentStateRoom = state[room] ? state[room] : originalRoom;
    const socketsInRoom = getConnectedPlayers(room);

    state[room] = {
      ...currentStateRoom,
      players: [ ...currentPlayers, socket.id ],
      connectedSockets: socketsInRoom
    }
    
    console.log('socketsInRoom: ', socketsInRoom)
    
    const newPlayer = {
      player: '', // 1 or 2
      id: '' // socket.id
    };
    // Is the new player player1, 2 or nothing?
    const player1Id = state[room].player1.id;
    const player2Id = state[room].player2.id;
    if (!socketsInRoom.includes(player1Id)) {
      // player1 has left
      delete state[room].player1;
      console.log('delete player 1');
    } else if (!socketsInRoom.includes(player2Id)) {
      // This means player2 has left
      delete state[room].player2;
    }
    if (!state[room].player1) {
      console.log('No player 1, add player 1');
      state[room] = {
        ...state[room],
        player1: {
          ...PLAYER,
          name: name,
          id: socket.id
        }
      };
      newPlayer.player = 'player1';
    } else if (!state[room].player2) {
      console.log('there is a player 1 but No player 2, add player 2')
      state[room] = {
        ...state[room],
        player2: {
          ...PLAYER,
          name: name,
          id: socket.id
        }
      };
      newPlayer.player = 'player2';
    } else {
      console.log('There is a player 1 and player2');
    }
    console.log('state:' , state[room]);
  
    callback(newPlayer) // You are player 1 or 2 or spectator, typ.
  });

  socket.on('updateMousePosPlayer1', (room, { y }) => {
    state[room].player1.pointToWherePaddleShouldGo = y;
  });

  socket.on('updateMousePosPlayer2', (room, { y }) => {
    state[room].player2.pointToWherePaddleShouldGo = y;
  });

  function startGame (room) {
    console.log('startGame server side', room);
    console.log('startGame state:', state[room]);
    state[room].showingWinScreen = false;
    // state[room].ball = originalBall;
    ballReset(room);
    const fps = 30;
    const interval = setInterval(function() {
      if (!io.sockets.adapter.rooms[room]) {
        console.log('means no one is in this room. Delete room');
        delete state[room];
        clearInterval(interval);
        return;
      }

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
        const { players } = state[room];
        const connectedSockets = getConnectedPlayers(room);
        if (players.length !== connectedSockets.length) {
          console.log('Not same length of players and connectedSockets', players, connectedSockets);
          someoneDisonnected(room);
          clearInterval(interval);
          return;
        } else {
          moveEverything(room)
        }
        
      }
      
    }, 1000 / fps);
  };

  socket.on('playerReady', (player, room) => {
    console.log(player, room);
    if (player === 'player1') {
      console.log('player 1 ready in ', room);
      state[room].player1.ready = true;
      state[room].player2.ready = true;
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

function someoneDisonnected (room) {
  // Vad ska hända då? Får gå tillbaka till 'waiting for players' som för övrigt inte finns. Men ah, starta om från att behöva klicka 'ready'
  console.log('someoneDiscconected');
  state[room].players = getConnectedPlayers(room);
  console.log(state[room].players)
  console.log(getConnectedPlayers(room))
  io.to(room).emit('playerDisconnected');
  io.to(room).emit('showingWinScreen', state[room].winningPlayer);
}
var canvas = { // Skicka med det här i parameter nånstans istället.
  height: 600,
  width: 800
};

function moveBall(room) {
  state[room].ball.x += state[room].ball.speedX;
  state[room].ball.y += state[room].ball.speedY;
  const { player1, player2, ball } = state[room];
  // console.log(state[room].ball.x);
  if (ball.x < 0 + PADDLE_WIDTH + 10) {
    if (ball.y > player1.y 
      && ball.y < player1.y + PADDLE_HEIGHT) {
      state[room].ball.speedX = -ball.speedX; // change direction
      
      var deltaY = ball.y - (player1.y + PADDLE_HEIGHT / 2);
      state[room].ball.speedY = deltaY * 0.35
    } else if (ball.x < 0) {
      state[room].player2.score++;
      ballReset(room);
    }  
  }

  if (ball.x > canvas.width - PADDLE_WIDTH - 10) {
    if (ball.y > player2.y 
      && ball.y < player2.y + PADDLE_HEIGHT) {
      state[room].ball.speedX = -ball.speedX;

      var deltaY = ball.y - (player2.y + PADDLE_HEIGHT / 2);
      state[room].ball.speedY = deltaY * 0.35
    } else if (ball.x > canvas.width) {
      state[room].player1.score++;
      ballReset(room);
    }  
  }

  if (ball.y < 0) {
    state[room].ball.speedY = -ball.speedY;
  }

  if (ball.y > canvas.height) {
    state[room].ball.speedY = -ball.speedY;
  }
}

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

}

function moveEverything(room) {

  // computerMovement();
  moveBall(room);
  movePaddle1(room);
  // Emit all state
  io.to(room).emit('updateState', state[room]);
  
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
  // console.log('ballreset: ', room, state);
  state[room].ball.speedX = -state[room].ball.speedX;
  state[room].ball.x = canvas.width / 2;
  state[room].ball.y = canvas.height / 2;
  // console.log('ballreset after reset: ', room, state);
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