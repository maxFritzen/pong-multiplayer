
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
var winningPlayer = 'No one';

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


socket.on('updateBallPos', function ({x, y}) {
  // Update ball pos
  ballX = x;
  ballY = y;
  drawEverything();
});

socket.on('updatePlayer1Pos', function (y) {
  paddle1Y = y ;
});

socket.on('updatePlayer2Pos', function (y) {
  paddle2Y = y ;
});

socket.on('showingWinScreen', function(winningPlayer) {
  console.log('someone won', winningPlayer)
  showingWinScreen = true;
  winningPlayer = winningPlayer;
  drawEverything();
})


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
  if (showingWinScreen) {
    player1score = 0;
    player2score = 0;
    showingWinScreen = false;
  }
}

window.onload = function() {
  console.log('onload');
  canvas = document.getElementById('gameCanvas');
  canvasContext = canvas.getContext('2d');

  socket.emit('startGame');

  drawEverything();

  canvas.addEventListener('mousedown', handleMouseClick);
  canvas.addEventListener('mousemove',
    function(e) {
      var mousePos = calculateMousePos(e);
      // Skicka mousePos till backend
      socket.emit('updateMousePosPlayer1', mousePos);

    });
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

function drawNet() {
  for (var i = 0; i < canvas.height; i+=40) {
    colorRect(canvas.width / 2 -1, i, 2, 20, 'white');
  }
}

function drawEverything() {

  colorRect(0, 0, canvas.width, canvas.height, 'black');

  if (showingWinScreen) {
    canvasContext.fillStyle = 'white';
    const centerX = canvas.width / 2 - 30;
    const centerY = canvas.height / 2;
    canvasContext.fillText(`${winningPlayer} won!`, centerX, centerY);

    
    canvasContext.fillText('Click to continue', centerX-5, centerY + 25);
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