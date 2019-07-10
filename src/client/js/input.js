import { playerIsReady, updateDirection } from './networking';
import { readyButton, waitingForPlayer, canvas } from './elements';
import { scaleRatio } from './render';

function onMouseInput(e) {
  //Behövs verkligen den här rect, root osv- uträkningen? tror inte det.
  // var rect = canvas.getBoundingClientRect();
  // var root = document.documentElement;
  // var mouseX = e.clientX - rect.left - root.scrollLeft;
  // var mouseY = e.clientY - rect.top - root.scrollTop;
  handleInput(e.clientX, e.clientY);
}

function onTouchInput(e) {
  const touch = e.touches[0];
  handleInput(touch.clientX, touch.clientY);
}

function handleInput(x, y) {
  updateDirection(y / scaleRatio);
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
