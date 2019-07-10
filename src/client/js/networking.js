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

socket.on('playerJoined', function(player) {
  changeView('gameView');
  drawEverything();
});

socket.on('renderGame', () => {
  console.log('should renderGame');
  changeView('gameView');
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
  state.room = roomValue;

  console.log('room:', state.room);
  changeView('gameView');
  socket.emit('join', param, function (newPlayer) {
    //chosenPlayer is either player1, 2 or nothing
    player.player = newPlayer.player;
    player.id = newPlayer.id;
  })
}

export function playerIsReady () {
  socket.emit('playerReady', state.room);
}