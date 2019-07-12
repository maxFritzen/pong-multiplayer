
const express = require('express');
const socketIO = require('socket.io');
const port = process.env.PORT || 3000;
const app = express();

const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackConfig = require('../../webpack.dev.js');
const shortid = require('shortid');
const { MAP_SIZE } = require('../shared/variables');
app.use(express.static('public'));
if (process.env.NODE_ENV === 'development') {
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
const WINNING_SCORE = 10;
const originalBall = {
  x: 250,
  y: 250, 
  speedX: 6,
  speedY: 2
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
  emptyRooms: [] 
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

const whichPlayer = (room, socketId) => {
  let player = '';
  if (state[room].player1.id === socketId) {
    player = 'player1';
  } else if (state[room].player2.id === socketId) {
    player = 'player2'
  }
  return player;
}

io.on('connection', (socket) => {
  console.log('New user connected');

  socket.on('join', (params, callback) => {
    let { name, room } = params;
    console.log('player joined room', room);
    if (!room) {
      console.log('Empty string for room');
      if (!state.emptyRooms.length) {
        console.log('Should create random room');
        room = shortid.generate();
        state.emptyRooms.push(room);
      } else {
        console.log('Should join already created and empty random room');
        room = state.emptyRooms.shift();
        console.log('emptyRooms:', state.emptyRooms); 
      }
    }
    socket.join(room, () => console.log('joined room', room));
    io.to(room).emit('renderGame');
    socket.broadcast.to(room).emit('newPlayerJoined', name);
    const currentPlayers = state[room] ? state[room].players : []
    const currentStateRoom = state[room] ? state[room] : originalRoom;
    const socketsInRoom = getConnectedPlayers(room);

    state[room] = {
      ...currentStateRoom,
      players: [ ...currentPlayers, socket.id ],
      connectedSockets: socketsInRoom
    }
    
    const newPlayer = {
      player: '', // 1 or 2
      id: '' // socket.id
    };
    // Is the new player player1, 2 or nothing?
    const player1Id = state[room].player1.id;
    const player2Id = state[room].player2.id;
    let otherPlayer = ''
    if (!socketsInRoom.includes(player1Id)) {
      // player1 has left
      delete state[room].player1;
    } else if (!socketsInRoom.includes(player2Id)) {
      // This means player2 has left
      delete state[room].player2;
    }
    if (!state[room].player1) {
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
      state[room] = {
        ...state[room],
        player2: {
          ...PLAYER,
          name: name,
          id: socket.id
        }
      };
      newPlayer.player = 'player2';
      otherPlayer = state[room].player1.name;
    } else {
    }
    
    callback(newPlayer, otherPlayer, room) // You are player 1 or 2 or spectator, or whatever
  });

  socket.on('updatePosition', (room, y) => {
    const player = whichPlayer(room, socket.id);
    state[room][player].pointToWherePaddleShouldGo = y;
  });

  function startGame (room) {
    io.to(room).emit('startGame');
    state[room].showingWinScreen = false;

    ballReset(room);
    const fps = 60;
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

  socket.on('playerReady', (room) => {
    console.log('playerReay room:', room)
    const player = whichPlayer(room, socket.id); // Is it player1 or 2
    console.log('playerReady',player, room);
    if (!player) {
      console.log('something went wrong with player', player);
      return;
    }
    const playerName = state[room][player].name;
    state[room][player].ready = true;
    // state[room].player2.ready = true; // OBS TA BORT FÖR ATT KÖRA 2
    socket.broadcast.to(room).emit('otherPlayerIsReady', playerName);
    console.log(state);

    if (state[room].player1.ready && state[room].player2.ready) {
      startGame(room);
    }
  });

});

function someoneDisonnected (room) {

  console.log('someoneDiscconected');
  state[room].players = getConnectedPlayers(room);
  console.log(state[room].players)
  console.log(getConnectedPlayers(room))
  io.to(room).emit('playerDisconnected');
  io.to(room).emit('showingWinScreen', state[room].winningPlayer);
}

function moveBall(room) {
  state[room].ball.x += state[room].ball.speedX;
  state[room].ball.y += state[room].ball.speedY;
  const { player1, player2, ball } = state[room];

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

  if (ball.x > MAP_SIZE.width - PADDLE_WIDTH - 10) {
    if (ball.y > player2.y 
      && ball.y < player2.y + PADDLE_HEIGHT) {
      state[room].ball.speedX = -ball.speedX;

      var deltaY = ball.y - (player2.y + PADDLE_HEIGHT / 2);
      state[room].ball.speedY = deltaY * 0.35
    } else if (ball.x > MAP_SIZE.width) {
      state[room].player1.score++;
      ballReset(room);
    }  
  }

  if (ball.y < 0) {
    state[room].ball.speedY = -ball.speedY;
  }

  if (ball.y > MAP_SIZE.height) {
    state[room].ball.speedY = -ball.speedY;
  }
}

function movePaddle1(room) {

  const currentY = state[room].player1.y;
  let newY = currentY;
  const pointToWherePaddleShouldGo = state[room].player1.pointToWherePaddleShouldGo;
  if (pointToWherePaddleShouldGo + 15 < (currentY + PADDLE_HEIGHT / 2)) {
    newY -= 15;
  } else if (pointToWherePaddleShouldGo - 15 > (currentY + PADDLE_HEIGHT / 2)) {
    newY += 15;
  }
  if (newY <= 0) {
    newY = 0;
  } else if (newY + PADDLE_HEIGHT >= MAP_SIZE.height) {
    newY = MAP_SIZE.height - PADDLE_HEIGHT;
  }

  state[room].player1.y = newY;
  // state[room].player2.y = newY; // OBS TA BORT FÖR ATT KÖRA 2
}
function movePaddle2(room) {
  const currentY = state[room].player2.y;
  let newY = currentY;
  const pointToWherePaddleShouldGo = state[room].player2.pointToWherePaddleShouldGo;
  if (pointToWherePaddleShouldGo + 15 < (currentY + PADDLE_HEIGHT / 2)) {
    newY -= 15;
  } else if (pointToWherePaddleShouldGo - 15 > (currentY + PADDLE_HEIGHT / 2)) {
    newY += 15;
  }
  if (newY <= 0) {
    newY = 0;
  } else if (newY + PADDLE_HEIGHT >= MAP_SIZE.height) {
    newY = MAP_SIZE.height - PADDLE_HEIGHT;
  }

  state[room].player2.y = newY;
}
let shouldUpdate = true;
function moveEverything(room) {
  moveBall(room);
  movePaddle1(room);
  movePaddle2(room);
  if (shouldUpdate) {
    io.to(room).emit('updateState', state[room]);
    shouldUpdate = false
  } else {
    shouldUpdate = true;
  }
  
}

function ballReset(room) {
  const player1score = state[room].player1.score;
  const player2score = state[room].player2.score;
  let whoWon = 'player2';
  if (player1score >= WINNING_SCORE || player2score >= WINNING_SCORE) {
    state[room].showingWinScreen = true;
    if (player1score > player2score) {
      whoWon = 'player1';
    } 
    state[room].winningPlayer = state[room][whoWon].name;
  }

  state[room].ball.speedX = -state[room].ball.speedX; // Direction is the opposite of what is was
  state[room].ball.x = MAP_SIZE.width / 2;
  state[room].ball.y = MAP_SIZE.height / 2;
}
function computerMovement() {
  // Implement this later
}