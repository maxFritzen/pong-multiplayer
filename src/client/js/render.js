import { state, PADDLE_HEIGHT, PADDLE_WIDTH }from './state';
import { canvas, canvasContext, playerNames } from './elements';
import { MAP_SIZE } from '../../shared/variables';
// Scale
export let scaleRatio = 1;
export function setCanvasDimensions() {
  const mapWidth = MAP_SIZE.width;
  scaleRatio = (window.innerWidth / mapWidth) * 0.8;
  if (scaleRatio > 1) {
    scaleRatio = 1;
  }
  
  canvas.width = (scaleRatio * 800);
  canvas.height = (scaleRatio * 600);
  playerNames.style.width = canvas.width + 'px';
  console.log(playerNames.style.width)
  console.log('setCanvasDimenstions()', {
    canvasWidth: canvas.width, 
    windowInnerWidth: window.innerWidth, 
    canvasHeight: canvas.height, 
    windowInnerHeight: window.innerHeight,
    scaleRatio: scaleRatio});
}

function drawNet() {
  for (var i = 0; i < canvas.height; i+=40) {
    colorRect((canvas.width / 2 -1), i, 2, 20, 'white');
  }
}

export function drawEverything(showingWinScreen, winningPlayer) {
  const { ballX, ballY, paddle1Y, paddle2Y , player1score, player2score} = state;

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