import { updateDirection } from './networking';
import { scaleRatio } from './render';
import { canvas } from './elements';

function onMouseInput(e) {
  handleInput(e.clientX, e.clientY);
}

function onTouchInput(e) {
  const touch = e.touches[0];
  handleInput(touch.clientX, touch.clientY);
}

function handleInput(x, y) {
  const rect = canvas.getBoundingClientRect();
  const root = document.documentElement;
  // const x = x - rect.left - root.scrollLeft;
  const clientY = y - rect.top - root.scrollTop;
  updateDirection(clientY / scaleRatio);
}

export function startCapturingInput(element) {
  element.addEventListener('mousemove', onMouseInput);
  element.addEventListener('click', onMouseInput);
  element.addEventListener('touchstart', onTouchInput);
  element.addEventListener('touchmove', onTouchInput);
}

export function stopCapturingInput(element) {
  element.removeEventListener('mousemove', onMouseInput);
  element.removeEventListener('click', onMouseInput);
  element.removeEventListener('touchstart', onTouchInput);
  element.removeEventListener('touchmove', onTouchInput);
}
