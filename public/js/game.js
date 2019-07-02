
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

socket.on('connect', function () {
  console.log('Connected to server');
  var params = deparam(window.location.search);
  socket.emit('join', params, function (err) {
    if (err) {
      alert(err);
      window.location.href = '/';
    } else {
      console.log('No error.');
    }
  })
});

socket.on('disconnect', function () {
  console.log('Disconnected from server')
});

socket.on('newPlayerJoined', function () {
  console.log('New player joined');
});


socket.on('updateBallPos', function ({x, y, p1score, p2score}) {
  // Update ball pos
  ballX = x;
  ballY = y;
  player1score = p1score;
  player2score = p2score;
  showingWinScreen = false;
  drawEverything();
});

socket.on('updatePlayer1Pos', function (y) {
  paddle1Y = y ;
});

socket.on('updatePlayer2Pos', function (y) {
  paddle2Y = y ;
});

socket.on('showingWinScreen', function(newWinningPlayer) {
  console.log('show win screen')
  showingWinScreen = true;
  hasChosenPlayer = '';
  joinText1 = ' Player1: click to join';
  joinText2 = ' Player2: click to join';
  winningPlayer = newWinningPlayer;
  drawEverything();
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

function handleMouseClick (e) {
  console.log('handleMouseClick');
  console.log(showingWinScreen, hasChosenPlayer);
  
  if (showingWinScreen && !hasChosenPlayer.length) {
    // socket.emit('startGame');
    console.log('player1Join.x', player1Join.x)
    const targetPlayer1 = 
      (e.x > player1Join.x - 10 && e.x < player1Join.x + 100)
      && e.y > player1Join.y - 40 && e.y < player1Join.y + 40;

    const targetPlayer2 = 
      (e.x > player2Join.x - 10 && e.x < player2Join.x + 100)
      && e.y > player2Join.y - 40 && e.y < player2Join.y + 40;
    console.log(targetPlayer1, targetPlayer2);
    console.log(e.x, e.y)
    if (targetPlayer1) {
      console.log('player1')
      // emit some 'player ready' - call
      hasChosenPlayer = 'player1';
      socket.emit('playerReady', 'player1');

    } else if (targetPlayer2) {
      console.log('player2')
      // emit some 'player ready' - call
      hasChosenPlayer = 'player2';
      socket.emit('playerReady', 'player2');
    }
  }
}

window.onload = function() {
  console.log('onload');
  canvas = document.getElementById('gameCanvas');
  canvasContext = canvas.getContext('2d');
  player1Join.x = canvas.width / 2 - 200;
  player2Join.x = canvas.width / 2 + 200;
  centerY = canvas.height / 2 - 25;
  centerX = canvas.width / 2;
  player1Join.y = centerY;
  player2Join.y = centerY;
  var player1Button = document.getElementById('player1Button');
  var player2Button = document.getElementById('player2Button');
  player1Button.onclick = () => {
    socket.emit('playerReady', 'player1');
    socket.emit('playerReady', 'player2'); // Just to skip click on player2btn while testing
    hasChosenPlayer = 'player1';
    player1Button.disabled = true;
  }
  player2Button.disabled = true;
  player2Button.onclick = () => {
    socket.emit('playerReady', 'player2');
  }
  drawEverything();
  canvas.addEventListener('mousedown', handleMouseClick);
  canvas.addEventListener('mousemove',
    function(e) {
      var mousePos = calculateMousePos(e);
      socket.emit('updateMousePosPlayer1', mousePos);
    });
}

function computerMovement() {
  var paddle2YCenter = paddle2Y + (PADDLE_HEIGHT / 2);
  if (paddle2YCenter < ballY - 35) {
    paddle2Y += 10;
  } else if (paddle2YCenter > ballY + 35){
    paddle2Y -= 10;
  }
}

function drawNet() {
  for (var i = 0; i < canvas.height; i+=40) {
    colorRect(canvas.width / 2 -1, i, 2, 20, 'white');
  }
}

function drawEverything() {

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