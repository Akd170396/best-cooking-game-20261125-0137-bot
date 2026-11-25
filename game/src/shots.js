// Warung Rasa: Dapur Kilat — staged screenshot scenes for ?shot=.
// One clear job: build a real, reachable game state for each screenshot name
// using the world's own rules, so the frame is what the game truly looks like.

import { DISHES } from './config.js';
import { SCREEN_PLAY, SCREEN_TITLE } from './render.js';

/** Place the chef at a station and set up a scene by name. */
function putChefAt(world, stationId) {
  const rects = {
    board: { x: 150, y: 560 },
    wok1: { x: 415, y: 560 },
    wok2: { x: 595, y: 560 },
    plating: { x: 870, y: 560 },
    window: { x: 1120, y: 570 },
    bins: { x: 480, y: 350 },
  };
  const at = rects[stationId] || { x: 640, y: 560 };
  world.state.chef.x = at.x;
  world.state.chef.y = at.y;
}

function seedOrders(world, specs) {
  world.state.orders = specs.map((spec, i) => ({
    id: 100 + i,
    dish: spec.dish,
    left: spec.left,
    total: spec.total,
  }));
}

export function stageShot(name, world) {
  world.reset();
  const s = world.state;
  s.shiftLeft = 96; // mid-shift, timer visible and ticking
  s.score = 1240;
  s.coins = 132;
  s.combo = 3;
  s.bestCombo = 5;

  if (name === 'chopping') {
    // Chef at the board, chicken mid-chop, ingredients on the counters.
    seedOrders(world, [
      { dish: 'mie_ayam', left: 38, total: 45 },
      { dish: 'ayam_geprek', left: 22, total: 45 },
      { dish: 'nasi_goreng', left: 41, total: 45 },
    ]);
    s.board.item = 'ayam';
    s.board.progress = 1.1;
    s.chef.chopTarget = 'ayam';
    s.hands = ['sayur'];
    putChefAt(world, 'board');
    return { screen: SCREEN_PLAY, best: 1240 };
  }

  if (name === 'wok') {
    // Wok 1 sizzling with rice nearly done, wok 2 with chicken; chef holds a plate.
    seedOrders(world, [
      { dish: 'nasi_goreng', left: 31, total: 45 },
      { dish: 'mie_ayam', left: 18, total: 45 },
      { dish: 'ayam_geprek', left: 40, total: 45 },
      { dish: 'sayur_lodeh', left: 12, total: 45 },
    ]);
    s.woks[0].item = 'nasi';
    s.woks[0].progress = 2.4;
    s.woks[1].item = 'ayam_potong';
    s.woks[1].progress = 3.1;
    s.plate = ['telur_dadar', 'kecap'];
    s.hands = ['nasi_matang'];
    putChefAt(world, 'wok1');
    return { screen: SCREEN_PLAY, best: 1240 };
  }

  if (name === 'serving') {
    // Finished Nasi Goreng on the plate in hand, at the serving window, rush timer low.
    seedOrders(world, [
      { dish: 'nasi_goreng', left: 9, total: 45 },
      { dish: 'mie_ayam', left: 26, total: 45 },
      { dish: 'ayam_geprek', left: 33, total: 45 },
    ]);
    s.hands = ['plate:nasi_goreng'];
    s.shiftLeft = 38; // rush hour
    s.rush = true;
    s.combo = 5;
    putChefAt(world, 'window');
    return { screen: SCREEN_PLAY, best: 1240 };
  }

  // Default: 'kitchen' — the cover. Everything at once: full order board,
  // ingredients on the counters, a dish mid-assembly, timer running, plate ready.
  seedOrders(world, [
    { dish: 'nasi_goreng', left: 36, total: 45 },
    { dish: 'mie_ayam', left: 24, total: 45 },
    { dish: 'ayam_geprek', left: 41, total: 45 },
    { dish: 'sayur_lodeh', left: 15, total: 45 },
  ]);
  s.woks[0].item = 'telur';
  s.woks[0].progress = 1.8;
  s.board.item = 'sayur';
  s.board.progress = 0.9;
  s.chef.chopTarget = 'sayur';
  s.plate = ['nasi_matang', 'telur_dadar'];
  s.plateDish = null;
  s.hands = ['kecap'];
  putChefAt(world, 'plating');
  return { screen: SCREEN_PLAY, best: 1240 };
}

export { SCREEN_TITLE };
export const SHOT_NAMES = ['kitchen', 'chopping', 'wok', 'serving'];
