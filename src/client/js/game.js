import io from 'socket.io-client';
import { debounce } from 'throttle-debounce';

var ballX = 50;
var ballY = 50;

var paddle1Y = 250;
var paddle2Y = 250;
const PADDLE_HEIGHT = 100;
const PADDLE_WIDTH = 10;

var player1score = 3;
var player2score = 0;
const WINNING_SCORE = 3;

var showingWinScreen = true;
var winningPlayer = 'PLAY';


var socket = io();

let room = '';

const player = {
  player: '', // 1 or 2
  id: '' // socket.id
}

let scaleRatio;

socket.on('connect', function () {
  console.log('Connected to server');
});

const form = document.getElementById('form');
const player1Button = document.getElementById('player1Button');
const joinRoomView = document.getElementById('joinRoomView');
const winView = document.getElementById('winView');
const gameView = document.getElementById('gameView');
const canvas = document.getElementById('gameCanvas');
const canvasContext = canvas.getContext('2d');
const waitingForPlayer = document.getElementById('waitingForPlayer');
const header = document.getElementById('header');

const changeView = (view) => {
  // Should make variables of viewNames
  console.log('should change view to', view)
  switch (view) {
    case 'gameView':
      header.classList.add('hidden');
      gameView.classList.remove('hidden');
      winView.classList.add('hidden');
      joinRoomView.classList.add('hidden');
      break;
    case 'joinView':
      header.classList.remove('hidden');
      joinRoomView.classList.remove('hidden');
      gameView.classList.add('hidden');
      break;
    case 'winView':
      header.classList.remove('hidden');
      winView.classList.remove('hidden');
      canvas.classList.add('hidden');
      waitingForPlayer.classList.add('hidden');
      player1Button.classList.remove('hidden');
      const winner = document.getElementById('winnerName');
      winner.textContent = winningPlayer;
      console.log('winner: ', winner);
      break;
    case 'gameStartView':
      canvas.classList.remove('hidden');
      waitingForPlayer.classList.add('hidden');
      header.classList.add('hidden');
      break;
  
    default:
      break;
  }
}

function setCanvasDimensions() {
  // map size is 800
  scaleRatio = (window.innerWidth / 800) * 0.8;

  canvas.width = (scaleRatio * 800);
  canvas.height = (scaleRatio * 600);
  console.log('setCanvasDimenstions()', {
    canvasWidth: canvas.width, 
    windowInnerWidth: window.innerWidth, 
    canvasHeight: canvas.height, 
    windowInnerHeight: window.innerHeight,
    scaleRatio: scaleRatio});
}


const onSubmit = (e) => {
  e.preventDefault();
  joinRoom()
}
form.onsubmit = onSubmit;
function joinRoom () {
  const name = document.getElementById('name').value;
  const roomValue = document.getElementById('room').value; 
  const param = {
    name,
    room: roomValue
  };
  room = roomValue
  changeView('gameView');
  socket.emit('join', param, function (newPlayer) {
    //chosenPlayer is either player1, 2 or nothing
    player.player = newPlayer.player;
    player.id = newPlayer.id;
  })
}

socket.on('playerDisconnected', () => {
  // Should reset everything i guess.Go back to 'click when ready'
  console.log('playerDisconnected');
})

socket.on('disconnect', function () {
  console.log('Disconnected from server')
  changeView('joinView');
});

socket.on('newPlayerJoined', function () {
  console.log('New player joined');
});


socket.on('updateState', (state) => {
  const { player1, player2, ball } = state
  ballX = ball.x * scaleRatio;
  ballY = ball.y * scaleRatio;
  paddle1Y = player1.y * scaleRatio;
  paddle2Y = player2.y * scaleRatio;
  showingWinScreen = false;
  player1score = player1.score;
  player2score = player2.score;
  drawEverything();
})

socket.on('showingWinScreen', function(newWinningPlayer) {
  console.log('show win screen')
  player1Button.disabled = false;
  showingWinScreen = true;
  winningPlayer = newWinningPlayer;
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

function calculateMousePos(e) {
  var rect = canvas.getBoundingClientRect();
  var root = document.documentElement;
  var mouseX = e.clientX - rect.left - root.scrollLeft;
  var mouseY = e.clientY - rect.top - root.scrollTop;
  return {
    x: mouseX / scaleRatio,
    y: mouseY / scaleRatio
  }
}

window.addEventListener('resize', debounce(400, setCanvasDimensions));

function startGame () {
  console.log('startGame');
  setCanvasDimensions()

  player1Button.onclick = () => {
    console.log('onClick', waitingForPlayer, player1Button);
    socket.emit('playerReady', room);
    player1Button.disabled = true;
    waitingForPlayer.classList.remove('hidden');
    player1Button.classList.add('hidden');
  }
  canvas.addEventListener('mousemove',
    function(e) {
      var mousePos = calculateMousePos(e);
      if (room) {
        socket.emit('updatePosition', room, mousePos);
      }
      
    });

  canvas.addEventListener('touchstart',
    function(e) {
      var mousePos = calculateMousePos(e);
      if (room) {
        socket.emit('updatePosition', room, mousePos);
      }
      
    });
  canvas.addEventListener('touchmove',
    function(e) {
      var mousePos = calculateMousePos(e);
      if (room) {
        socket.emit('updatePosition', room, mousePos);
      }
      
    });
}

function drawNet() {
  for (var i = 0; i < canvas.height; i+=40) {
    colorRect((canvas.width / 2 -1), i, 2, 20, 'white');
  }
}

function drawEverything(showingWinScreen, winningPlayer) {

  colorRect(0, 0, canvas.width, canvas.height, 'black');

  if (showingWinScreen) {
    console.log('winning player: ', winningPlayer)
    return;
  }
  drawNet()
  colorRect(0, paddle1Y, PADDLE_WIDTH * scaleRatio, PADDLE_HEIGHT * scaleRatio, 'white');
  colorRect((canvas.width) - (PADDLE_WIDTH * scaleRatio), paddle2Y, PADDLE_WIDTH * scaleRatio, PADDLE_HEIGHT * scaleRatio, 'white');
  colorCircle(ballX, ballY, 10 * scaleRatio, 'white');
 
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