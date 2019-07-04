import io from 'socket.io-client';
import { deparam } from './lib/deparam';

var canvas;
var canvasContext;
var ballX = 50;
var ballY = 50;
var ballSpeedX = 10;
var ballSpeedY = 8;

var paddle1Y = 250;
var paddle2Y = 250;
const PADDLE_HEIGHT = 100;
const PADDLE_WIDTH = 10;

var player1score = 3;
var player2score = 0;
const WINNING_SCORE = 3;

var showingWinScreen = true;
var winningPlayer = 'PLAY';

var player1Join = {
  x: 200,
  y: 400
}

var player2Join = {
  x: 600,
  y: 400
}

var centerX = 400;
var centerY = 300;

var hasChosenPlayer = '';
var joinText1 = ' Player1: click to join';
var joinText2 = ' Player2: click to join';

var socket = io();

let room = ''

let state = {

}

socket.on('connect', function () {
  console.log('Connected to server');
});

const form = document.getElementById('form');

const player1Button = document.getElementById('player1Button');
const player2Button = document.getElementById('player2Button');

const onSubmit = (e) => {
  e.preventDefault();
  console.log('onSubmit')
  joinRoom()
}
form.onsubmit = onSubmit;
function joinRoom () {
  console.log('joinRoom')
  const name = document.getElementById('name').value;
  const roomValue = document.getElementById('room').value; 
  const param = {
    name,
    room: roomValue
  };
  room = roomValue
  console.log('room: ', room);
  console.log('param: ', param);
  socket.emit('join', param, function (err) {
    if (err) {
      alert(err);
      window.location.href = '/';
    } else {
      console.log('No error.');
    }
  })
}

socket.on('playerDisconnected', () => {
  // Should reset everything i guess.Go back to 'click when ready'
  console.log('playerDisconnected');
})

socket.on('disconnect', function () {
  console.log('Disconnected from server')
});

socket.on('newPlayerJoined', function () {
  console.log('New player joined');
});


socket.on('updateState', (state) => {
  const { player1, player2, ball } = state
  ballX = ball.x;
  ballY = ball.y;
  paddle1Y = player1.y;
  showingWinScreen = false;
  player1score = player1.score;
  player2score = player2.score;
  drawEverything();
})

socket.on('showingWinScreen', function(newWinningPlayer) {
  console.log('show win screen')
  player1Button.disabled = false;
  showingWinScreen = true;
  hasChosenPlayer = '';
  joinText1 = ' Player1: click to join';
  joinText2 = ' Player2: click to join';
  winningPlayer = newWinningPlayer;
  drawEverything(true, winningPlayer);
});

socket.on('playerJoined', function(player) {
  console.log('playerjoined', player);
  if (player === 'player1') {
    joinText1 = 'Player1: Ready';
  } else if (player === 'player2'){
    joinText2 = 'Player2: Ready';
  }
  drawEverything();
});

socket.on('renderGame', () => {
  console.log('should renderGame');
  startGame();
});

function calculateMousePos(e) {
  var rect = canvas.getBoundingClientRect();
  var root = document.documentElement;
  var mouseX = e.clientX - rect.left - root.scrollLeft;
  var mouseY = e.clientY - rect.top - root.scrollTop;
  return {
    x: mouseX,
    y: mouseY
  }
}

function startGame () {
  console.log('startGame');
  canvas = document.getElementById('gameCanvas');
  canvasContext = canvas.getContext('2d');
  player1Join.x = canvas.width / 2 - 200;
  player2Join.x = canvas.width / 2 + 200;
  centerY = canvas.height / 2 - 25;
  centerX = canvas.width / 2;
  player1Join.y = centerY;
  player2Join.y = centerY;

  player1Button.onclick = () => {
    socket.emit('playerReady', 'player1', room);
    hasChosenPlayer = 'player1';
    player1Button.disabled = true;
  }
  player2Button.disabled = true;
  player2Button.onclick = () => {
    socket.emit('playerReady', 'player2', room);
  }
  drawEverything(false, '');
  canvas.addEventListener('mousemove',
    function(e) {
      var mousePos = calculateMousePos(e);
      socket.emit('updateMousePosPlayer1', room, mousePos);
    });
}

function drawNet() {
  for (var i = 0; i < canvas.height; i+=40) {
    colorRect(canvas.width / 2 -1, i, 2, 20, 'white');
  }
}

function drawEverything(showingWinScreen, winningPlayer) {

  colorRect(0, 0, canvas.width, canvas.height, 'black');

  if (showingWinScreen) {
    canvasContext.fillStyle = 'white';
    
    canvasContext.fillText( `${winningPlayer} won!`, centerX, centerY);
    console.log('winning player: ', winningPlayer)
    canvasContext.fillText('Click to continue', centerX-5, centerY + 25);
    canvasContext.fillText(joinText1, player1Join.x, player1Join.y);
    canvasContext.fillText(joinText2, player2Join.x, player2Join.y);
    return;
  }

  drawNet()
  colorRect(0, paddle1Y, PADDLE_WIDTH, PADDLE_HEIGHT, 'white');
  colorRect(canvas.width - PADDLE_WIDTH, paddle2Y, PADDLE_WIDTH, PADDLE_HEIGHT, 'white');
  colorCircle(ballX, ballY, 10, 'white');
 
  canvasContext.fillText(player1score, 100, 100);
  canvasContext.fillText(player2score,canvas.width - 100, 100);
}

function colorCircle(centerX, centerY, radius, drawColor) {
  canvasContext.fillStyle = drawColor;
  canvasContext.beginPath();
  canvasContext.arc(centerX, centerY, radius, 0, Math.PI * 2, true);
  canvasContext.fill();
}

function colorRect(leftX, topY, width, height, drawColor) {
  canvasContext.fillStyle = drawColor;
  canvasContext.fillRect(leftX, topY, width, height);
}