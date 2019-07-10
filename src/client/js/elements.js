
import { joinRoom } from './networking';
import { playerIsReady } from './networking';
import { state, player } from './state';


export let form = null;
export let readyButton = null;
export let joinRoomView = null;
export let winView = null;
export let gameView = null;
export let canvas = null;
export let canvasContext = null;
export let waitingForPlayer = null;
export let header = null;
export let playerNames = null;


export function getElements () {
  console.log('Get elements');
  form = document.getElementById('form');
  form.onsubmit = onSubmit;
  readyButton = document.getElementById('readyButton');
  joinRoomView = document.getElementById('joinRoomView');
  winView = document.getElementById('winView');
  gameView = document.getElementById('gameView');
  canvas = document.getElementById('gameCanvas');
  canvasContext = canvas.getContext('2d');
  waitingForPlayer = document.getElementById('waitingForPlayer');
  header = document.getElementById('header');
  playerNames = document.getElementById('playerNames');

  readyButton.onclick = () => {
    readyButton.disabled = true;
    waitingForPlayer.classList.remove('hidden');
    readyButton.classList.add('hidden');
    playerIsReady()
  }
  if (form && readyButton && joinRoomView && winView && gameView && canvas && canvasContext && waitingForPlayer && header) {
    console.log('all elements needed found');
  }
}


export const changeView = (view) => {
  // Should make variables of viewNames
  console.log('should change view to', view)
  switch (view) {
    case 'gameView':
      header.classList.add('hidden');
      gameView.classList.remove('hidden');
      winView.classList.add('hidden');
      joinRoomView.classList.add('hidden');
      const names = playerNames.getElementsByClassName('playerName');
      // playerNames.style.width = canvas.width + 'px';
      
      for (let item of names) {
        console.log(item.id);
        if (item.id === player.player) { //player.player === 'player1' or 'player2'
          item.textContent = player.name;
        } else {
          item.textContent = state.player2Name;
        }
      }
  
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
      readyButton.classList.remove('hidden');
      const winner = document.getElementById('winnerName');
      winner.textContent = state.winningPlayer;
      break;
    case 'gameStartView':
      canvas.classList.remove('hidden');
      waitingForPlayer.classList.add('hidden');
      header.classList.add('hidden');
      winView.classList.add('hidden');
      break;
  
    default:
      break;
  }
}

function onSubmit (e) {
  e.preventDefault();
  const name = document.getElementById('name').value;
  const room = document.getElementById('room').value; 
  joinRoom(name, room)
}

