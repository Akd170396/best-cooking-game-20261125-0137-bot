// Warung Rasa: Dapur Kilat — boot and the one game loop.
// One clear job: read input, advance the world in fixed steps, paint each frame.
//
// ?seed=N fixes the order pattern. ?shot=kitchen|chopping|wok|serving (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.

import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createAudio } from './audio.js';
import { createWorld, EVENT_BURNED, EVENT_EXPIRED, EVENT_OVER, EVENT_SERVED, EVENT_WRONG } from './world.js';
import { ACTION_CONFIRM, ACTION_MUTE, ACTION_PAUSE, createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();

function announce(message) {
  status.textContent = message;
}

function playSound(key) {
  if (!key) return;
  if (key === 'chop') audio.chop();
  else if (key === 'sizzle') audio.sizzle();
  else if (key === 'pickup') audio.pickup();
  else if (key === 'place') audio.place();
  else if (key === 'ding') audio.ding();
  else if (key === 'coin') audio.coin();
  else if (key === 'error') audio.error();
  else if (key === 'burn') audio.burn();
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = world.best();
  let accumulator = 0;
  let last = performance.now();
  let sizzleT = 0;

  function startGame() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    audio.unlock();
    announce('Bermain. Ambil bahan, potong, masak, sajikan!');
  }

  function endGame() {
    screen = SCREEN_OVER;
    if (world.state.score > best) {
      best = world.state.score;
      world.saveBest(best);
    }
    announce(`Shift selesai. Skor ${world.state.score}. Terbaik ${best}.`);
  }

  function handleEvents(events) {
    if (events & EVENT_OVER) endGame();
    if (events & EVENT_EXPIRED) {
      audio.error();
      announce('Satu pesanan hangus! Satu hati hilang.');
    }
    if (events & EVENT_BURNED) audio.burn();
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) {
      const muted = audio.toggleMute();
      announce(muted ? 'Suara mati.' : 'Suara hidup.');
    }
    if (actions & ACTION_CONFIRM) {
      audio.unlock();
      if (screen === SCREEN_TITLE || screen === SCREEN_OVER) startGame();
      else if (screen === SCREEN_PAUSED) screen = SCREEN_PLAY;
      else if (screen === SCREEN_PLAY) {
        const key = world.interact();
        playSound(key);
        if (key === 'coin') {
          audio.ding();
          announce('Hidangan tersaji! Pelanggan senang.');
        }
      }
    }
    if (actions & ACTION_PAUSE) {
      if (screen === SCREEN_PLAY) {
        screen = SCREEN_PAUSED;
        announce('Jeda.');
      } else if (screen === SCREEN_PAUSED) screen = SCREEN_PLAY;
    }
    const click = input.takeClick();
    if (click && screen === SCREEN_PLAY) {
      // Clicking a nearby station acts on it; clicking the chef's tile does nothing.
      const station = world.nearestStation(world.state.chef);
      if (station) {
        const key = world.interact();
        playSound(key);
        if (key === 'coin') audio.ding();
      }
    }
  }

  function step() {
    if (screen === SCREEN_TITLE) {
      world.step(STEP, { x: 0, y: 0 }, true);
      return;
    }
    if (screen !== SCREEN_PLAY) return;
    const dir = input.direction();
    const events = world.step(STEP, dir, false);
    handleEvents(events);
    // Stop chopping when the chef walks away from the board.
    const chef = world.state.chef;
    if (chef.chopTarget) {
      const station = world.nearestStation(chef);
      if (!station || station.id !== 'board') world.stopChopping();
      else if (dir.x !== 0 || dir.y !== 0) {
        // Holding still chops; moving cancels it.
        world.stopChopping();
      }
    }
    // Sizzle ambience while a wok is cooking.
    sizzleT -= STEP;
    if (sizzleT <= 0) {
      const cooking = world.state.woks.some((w) => w.item && !w.done);
      if (cooking) {
        audio.sizzle();
        sizzleT = 0.45;
      } else {
        sizzleT = 0.2;
      }
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Jeda.');
    }
  });

  announce('Warung Rasa: Dapur Kilat. Tekan Spasi atau klik untuk mulai.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
