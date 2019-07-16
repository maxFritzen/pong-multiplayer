
import { debounce } from 'throttle-debounce';
import { setCanvasDimensions } from './render';
import { startCapturingInput } from './input';
import { canvas, getElements } from './elements';

getElements()

window.addEventListener('resize', debounce(400, setCanvasDimensions));

export function startGame () {
  console.log('startGame');
  setCanvasDimensions();
  const el = document.getElementById('gameView');
  startCapturingInput(el);
}