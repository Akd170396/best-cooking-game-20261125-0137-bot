// Warung Rasa: Dapur Kilat — keyboard and mouse input.
// One clear job: turn keys and clicks into a direction vector and action flags.

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_MUTE = 4;

export function createInput(canvas) {
  const keys = new Set();
  let actions = 0;
  let click = null; // {x, y} in canvas pixels, consumed by the game loop

  function keyDown(event) {
    const key = event.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault();
    if (key === ' ' || key === 'enter' || key === 'e') actions |= ACTION_CONFIRM;
    if (key === 'p' || key === 'escape') actions |= ACTION_PAUSE;
    if (key === 'm') actions |= ACTION_MUTE;
    keys.add(key);
  }
  function keyUp(event) {
    keys.delete(event.key.toLowerCase());
  }
  function pointerDown(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    click = {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
    actions |= ACTION_CONFIRM;
  }

  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', keyUp);
  canvas.addEventListener('pointerdown', pointerDown);

  return {
    direction() {
      let x = 0;
      let y = 0;
      if (keys.has('a') || keys.has('arrowleft')) x -= 1;
      if (keys.has('d') || keys.has('arrowright')) x += 1;
      if (keys.has('w') || keys.has('arrowup')) y -= 1;
      if (keys.has('s') || keys.has('arrowdown')) y += 1;
      if (x !== 0 && y !== 0) {
        const len = Math.hypot(x, y);
        x /= len;
        y /= len;
      }
      return { x, y };
    },
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    takeClick() {
      const taken = click;
      click = null;
      return taken;
    },
  };
}
