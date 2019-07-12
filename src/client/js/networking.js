// Put all socket handling here
import io from 'socket.io-client';
import { drawEverything, scaleRatio } from './render';
import { canvas, readyButton } from './elements';
import { player, state } from './state';
import { startGame } from './game';
import { changeView } from './elements';
import { stopCapturingInput } from './input';


const socket = io();

socket.on('connect', function () {
  console.log('Connected to server');
});

socket.on('disconnect', () => {
  stopCapturingInput(canvas)
})

socket.on('updateState', (serverState) => {
  const { player1, player2, ball } = serverState
  state.ballX = ball.x * scaleRatio;
  state.ballY = ball.y * scaleRatio;
  state.paddle1Y = player1.y * scaleRatio;
  state.paddle2Y = player2.y * scaleRatio;
  state.showingWinScreen = false;
  state.player1score = player1.score;
  state.player2score = player2.score;

  drawEverything();
})

socket.on('showingWinScreen', function(newWinningPlayer) {
  console.log('show win screen')
  readyButton.disabled = false;
  state.winningPlayer = newWinningPlayer;
  changeView('winView'); // Byt ut canvas mot andra element
});

socket.on('newPlayerJoined', (player) => {
  console.log(('new player joined ', player));
  state.player2Name = player;
  changeView('gameView');
})

socket.on('otherPlayerIsReady', function(playerName) {
  console.log('other player is ready', playerName);
  state.player2Name = playerName;
  // changeView('gameView');
  drawEverything();
});

socket.on('renderGame', (room) => {
  console.log('')
  // changeView('gameView');
  startGame();
});

socket.on('startGame', () => {
  console.log('Should start game');
  changeView('gameStartView');
});

export const updateDirection = (y) => {
  socket.emit('updatePosition', state.room, y);
}

export function joinRoom (name, roomValue) {
  const param = {
    name,
    room: roomValue
  };
  player.name = name;
  
  socket.emit('join', param, function (newPlayer, otherPlayer, room) {
    //chosenPlayer is either player1, 2 or nothing
    console.log('JoinedRoom.', room, ' Player is: ', newPlayer);
    state.room = room;
    console.log('state: ',state);
    player.player = newPlayer.player;
    if (otherPlayer) {
      state.player2Name = otherPlayer;
    }
    changeView('gameView');
  })
}

export function playerIsReady () {
  socket.emit('playerReady', state.room);
}