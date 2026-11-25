// Warung Rasa: Dapur Kilat — the world: chef, stations, orders, plates, timers, score.
// One clear job: every rule of the cooking game, stepped in fixed 1/60 s ticks.

import {
  BEST_KEY, BURN_AFTER, CHEF, COLORS, DISHES, DISH_LIST, HANDS, INGREDIENTS,
  INTERACT_RADIUS, MAX_HEARTS, ORDER, RUSH_AT, SHIFT_SECONDS, STATIONS, STEP,
  WOK_RECIPES, WOK_TIMES,
} from './config.js';

export const EVENT_SERVED = 1;
export const EVENT_EXPIRED = 2;
export const EVENT_OVER = 4;
export const EVENT_WRONG = 8;
export const EVENT_BURNED = 16;

let orderSeq = 0;

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function stationRects() {
  const rects = [];
  for (const bin of STATIONS.bins) rects.push(bin);
  rects.push(STATIONS.board, STATIONS.wok1, STATIONS.wok2, STATIONS.plating, STATIONS.window, STATIONS.trash);
  return rects;
}

function nearestStation(chef) {
  const cx = chef.x;
  const cy = chef.y;
  let best = null;
  let bestDist = Infinity;
  for (const rect of stationRects()) {
    const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
    const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
    const dist = Math.hypot(cx - nx, cy - ny);
    if (dist < bestDist) {
      bestDist = dist;
      best = rect;
    }
  }
  return bestDist <= INTERACT_RADIUS ? best : null;
}

export function createWorld(random) {
  const state = {
    time: 0,
    shiftLeft: SHIFT_SECONDS,
    score: 0,
    coins: 0,
    combo: 0,
    bestCombo: 0,
    served: 0,
    expired: 0,
    hearts: MAX_HEARTS,
    over: false,
    rush: false,
    spawnIn: 6, // first ticket arrives quickly so the board is never empty
    chef: { x: 640, y: 560, dir: 0, moving: false, chopTarget: null, chopProgress: 0 },
    hands: [], // component ids, at most HANDS
    plate: [], // component ids on the plating counter, at most 3
    plateDish: null, // dish id the plate currently completes, or null
    orders: [], // {id, dish, left, total}
    woks: [
      { id: 'wok1', item: null, progress: 0, done: false, burnIn: 0 },
      { id: 'wok2', item: null, progress: 0, done: false, burnIn: 0 },
    ],
    board: { item: null, progress: 0 }, // chopping board
    popups: [], // {x, y, text, color, ttl}
    particles: [], // {x, y, vx, vy, ttl, color, size}
    message: '', // hint / error line shown under the board
    messageTtl: 0,
    shake: 0,
  };

  function popup(x, y, text, color) {
    state.popups.push({ x, y, text, color, ttl: 1.4 });
  }

  function steam(x, y) {
    for (let i = 0; i < 2; i += 1) {
      state.particles.push({
        x: x + (random.next() - 0.5) * 40, y,
        vx: (random.next() - 0.5) * 12, vy: -28 - random.next() * 22,
        ttl: 0.9 + random.next() * 0.5, color: '#ffffff', size: 5 + random.next() * 5,
      });
    }
  }

  function plateMatchesDish(plate) {
    for (const dishId of DISH_LIST) {
      const needs = [...DISHES[dishId].needs].sort();
      const got = [...plate].sort();
      if (needs.length === got.length && needs.every((v, i) => v === got[i])) return dishId;
    }
    return null;
  }

  function spawnOrder() {
    if (state.orders.length >= ORDER.maxOpen) return;
    const dish = random.pick(DISH_LIST);
    const total = state.rush ? ORDER.patienceRush : ORDER.patience;
    orderSeq += 1;
    state.orders.push({ id: orderSeq, dish, left: total, total });
  }

  function serveOrder(order) {
    const dish = DISHES[order.dish];
    const timeBonus = Math.round(order.left * 2);
    state.combo += 1;
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    const mult = 1 + 0.25 * (state.combo - 1);
    const points = Math.round((100 + timeBonus) * mult);
    state.score += points;
    const earned = Math.max(5, Math.round(points / 10));
    state.coins += earned;
    state.served += 1;
    popup(1120, 600, `+${points}  ${dish.name}`, '#f2c94c');
    popup(1120, 632, `+${earned} koin  x${state.combo}`, '#58b368');
    return points;
  }

  function reset() {
    state.time = 0;
    state.shiftLeft = SHIFT_SECONDS;
    state.score = 0;
    state.coins = 0;
    state.combo = 0;
    state.bestCombo = 0;
    state.served = 0;
    state.expired = 0;
    state.hearts = MAX_HEARTS;
    state.over = false;
    state.rush = false;
    state.spawnIn = 6;
    state.chef = { x: 640, y: 560, dir: 0, moving: false, chopTarget: null, chopProgress: 0 };
    state.hands = [];
    state.plate = [];
    state.plateDish = null;
    state.orders = [];
    state.woks = [
      { id: 'wok1', item: null, progress: 0, done: false, burnIn: 0 },
      { id: 'wok2', item: null, progress: 0, done: false, burnIn: 0 },
    ];
    state.board = { item: null, progress: 0 };
    state.popups = [];
    state.particles = [];
    state.message = '';
    state.messageTtl = 0;
    state.shake = 0;
    spawnOrder();
    spawnOrder();
  }

  /** Move the chef, advance timers, spawn orders, burn food. Returns event flags. */
  function step(dt, dir, attract) {
    if (state.over) return 0;
    let events = 0;
    state.time += dt;
    if (!attract) {
      state.shiftLeft -= dt;
      if (state.shiftLeft <= 0) {
        state.shiftLeft = 0;
        state.over = true;
        return EVENT_OVER;
      }
      state.rush = state.shiftLeft <= RUSH_AT;
    }

    // --- chef movement (slide along station rectangles) ---
    const chef = state.chef;
    chef.moving = dir.x !== 0 || dir.y !== 0;
    if (chef.moving) chef.dir = Math.atan2(dir.y, dir.x);
    const speed = CHEF.speed * dt;
    const next = { x: chef.x + dir.x * speed, y: chef.y + dir.y * speed };
    const body = { x: next.x - CHEF.radius, y: next.y - CHEF.radius, w: CHEF.radius * 2, h: CHEF.radius * 2 };
    let blocked = false;
    for (const rect of stationRects()) {
      if (rectsOverlap(body, rect)) { blocked = true; break; }
    }
    if (!blocked && next.x > 24 && next.x < 1256 && next.y > 204 && next.y < 776) {
      chef.x = next.x;
      chef.y = next.y;
    } else {
      // try sliding on one axis only
      const slideX = { x: chef.x + dir.x * speed, y: chef.y };
      const bodyX = { x: slideX.x - CHEF.radius, y: slideX.y - CHEF.radius, w: CHEF.radius * 2, h: CHEF.radius * 2 };
      const hitX = stationRects().some((r) => rectsOverlap(bodyX, r));
      if (!hitX && slideX.x > 24 && slideX.x < 1256) chef.x = slideX.x;
      const slideY = { x: chef.x, y: chef.y + dir.y * speed };
      const bodyY = { x: slideY.x - CHEF.radius, y: slideY.y - CHEF.radius, w: CHEF.radius * 2, h: CHEF.radius * 2 };
      const hitY = stationRects().some((r) => rectsOverlap(bodyY, r));
      if (!hitY && slideY.y > 204 && slideY.y < 776) chef.y = slideY.y;
    }

    // --- chopping (progress lives on the board, so walking away only pauses it) ---
    if (chef.chopTarget) {
      const ing = INGREDIENTS[chef.chopTarget];
      state.board.progress += dt;
      if (state.board.progress >= ing.chopTime) {
        state.board.item = null;
        state.board.progress = 0;
        chef.chopTarget = null;
        chef.chopProgress = 0;
        state.hands.push(ing.result);
      }
    }

    // --- woks cook, then burn (steam rises from the wok's own spot) ---
    const wokRects = { wok1: STATIONS.wok1, wok2: STATIONS.wok2 };
    for (const wok of state.woks) {
      if (wok.item && !wok.done) {
        wok.progress += dt;
        if (random.next() < 0.12) {
          const rect = wokRects[wok.id];
          steam(rect.x + rect.w / 2, rect.y + 30);
        }
        if (wok.progress >= WOK_TIMES[wok.item]) {
          wok.done = true;
          wok.burnIn = BURN_AFTER;
        }
      } else if (wok.item && wok.done) {
        wok.burnIn -= dt;
        if (wok.burnIn <= 0) {
          wok.item = null;
          wok.progress = 0;
          wok.done = false;
          events |= EVENT_BURNED;
          state.message = 'Hangus! Angkat masakan sebelum gosong.';
          state.messageTtl = 2.5;
        }
      }
    }

    // --- orders: patience drains, spawn new tickets ---
    for (let i = state.orders.length - 1; i >= 0; i -= 1) {
      const order = state.orders[i];
      order.left -= dt;
      if (order.left <= 0) {
        state.orders.splice(i, 1);
        state.expired += 1;
        state.hearts -= 1;
        state.combo = 0;
        events |= EVENT_EXPIRED;
        popup(640, 130, 'Pesanan hangus!', '#d7263d');
        if (state.hearts <= 0) {
          state.over = true;
          return events | EVENT_OVER;
        }
      }
    }
    if (!attract) {
      state.spawnIn -= dt;
      if (state.spawnIn <= 0) {
        spawnOrder();
        state.spawnIn = state.rush ? ORDER.spawnRush : ORDER.spawnEvery;
      }
    }

    // --- popups, particles, message, shake ---
    for (let i = state.popups.length - 1; i >= 0; i -= 1) {
      state.popups[i].ttl -= dt;
      state.popups[i].y -= 26 * dt;
      if (state.popups[i].ttl <= 0) state.popups.splice(i, 1);
    }
    for (let i = state.particles.length - 1; i >= 0; i -= 1) {
      const p = state.particles[i];
      p.ttl -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.ttl <= 0) state.particles.splice(i, 1);
    }
    if (state.messageTtl > 0) {
      state.messageTtl -= dt;
      if (state.messageTtl <= 0) state.message = '';
    }
    if (state.shake > 0) state.shake -= dt;

    return events;
  }

  /** Context action at the nearest station. Returns a sound key for main.js. */
  function interact() {
    const station = nearestStation(state.chef);
    if (!station) return null;
    const chef = state.chef;

    // --- ingredient bins: take the raw ingredient (or its ready form) ---
    if (station.id.startsWith('bin_')) {
      if (state.hands.length >= HANDS) {
        state.message = 'Tangan penuh! Antar dulu bahanmu.';
        state.messageTtl = 2;
        return 'error';
      }
      const ing = INGREDIENTS[station.item];
      if (ing.prep === 'none') {
        state.hands.push(ing.result);
      } else {
        state.hands.push(ing.id);
      }
      return 'pickup';
    }

    // --- chopping board: place a choppable item, resume, or take the result ---
    if (station.id === 'board') {
      if (state.board.item && !chef.chopTarget) {
        // The item is still on the board: step back up and chopping resumes.
        chef.chopTarget = state.board.item;
        return 'place';
      }
      if (state.board.item) return null; // already chopping: E does nothing here
      const idx = state.hands.findIndex((h) => INGREDIENTS[h] && INGREDIENTS[h].prep === 'chop');
      if (idx === -1) {
        state.message = 'Taruh Ayam atau Sayur di talenan untuk dipotong.';
        state.messageTtl = 2;
        return 'error';
      }
      state.board.item = state.hands.splice(idx, 1)[0];
      state.board.progress = 0;
      chef.chopTarget = state.board.item;
      chef.chopProgress = 0;
      return 'place';
    }

    // --- woks: put something in to cook, or take the finished dish out ---
    if (station.id === 'wok1' || station.id === 'wok2') {
      const wok = state.woks.find((w) => w.id === station.id);
      if (wok.item && wok.done) {
        if (state.hands.length >= HANDS) {
          state.message = 'Tangan penuh! Kosongkan dulu.';
          state.messageTtl = 2;
          return 'error';
        }
        state.hands.push(WOK_RECIPES[wok.item]);
        wok.item = null;
        wok.progress = 0;
        wok.done = false;
        return 'pickup';
      }
      if (wok.item && !wok.done) {
        state.message = 'Masih dimasak, tunggu sampai matang.';
        state.messageTtl = 1.5;
        return 'error';
      }
      const idx = state.hands.findIndex((h) => WOK_RECIPES[h]);
      if (idx === -1) {
        state.message = 'Bawa bahan mentah (Nasi, Mie, Telur, Ayam Potong) ke wajan.';
        state.messageTtl = 2;
        return 'error';
      }
      wok.item = state.hands.splice(idx, 1)[0];
      wok.progress = 0;
      wok.done = false;
      return 'place';
    }

    // --- plating counter: add a component, take the finished plate, or clear it ---
    if (station.id === 'plating') {
      if (state.plateDish && state.hands.length < HANDS) {
        state.hands.push(`plate:${state.plateDish}`);
        state.plate = [];
        state.plateDish = null;
        return 'pickup';
      }
      if (state.plate.length >= 3) {
        state.message = 'Piring sudah penuh — antar atau buang isinya.';
        state.messageTtl = 2;
        return 'error';
      }
      if (state.hands.length === 0) {
        if (state.plate.length > 0) {
          state.plate = [];
          state.plateDish = null;
          state.message = 'Piring dikosongkan.';
          state.messageTtl = 1.5;
          return 'place';
        }
        state.message = 'Bawa bahan matang ke sini untuk merakit hidangan.';
        state.messageTtl = 2;
        return 'error';
      }
      const item = state.hands[0];
      if (item.startsWith('plate:')) return 'error';
      state.hands.splice(0, 1);
      state.plate.push(item);
      state.plateDish = plateMatchesDish(state.plate);
      return 'place';
    }

    // --- serving window: hand over a finished plate that matches an open order ---
    if (station.id === 'window') {
      const plateIdx = state.hands.findIndex((h) => h.startsWith('plate:'));
      if (plateIdx === -1) {
        state.message = 'Bawa piring hidangan yang sudah lengkap ke jendela saji.';
        state.messageTtl = 2;
        return 'error';
      }
      const dishId = state.hands[plateIdx].slice(6);
      const orderIdx = state.orders.findIndex((o) => o.dish === dishId);
      if (orderIdx === -1) {
        state.message = 'Tidak ada yang memesan hidangan ini sekarang.';
        state.messageTtl = 2;
        state.shake = 0.35;
        return 'error';
      }
      const order = state.orders[orderIdx];
      state.orders.splice(orderIdx, 1);
      state.hands.splice(plateIdx, 1);
      serveOrder(order);
      return 'coin';
    }

    // --- trash: dump everything in hand ---
    if (station.id === 'trash') {
      if (state.hands.length === 0 && state.plate.length === 0) {
        state.message = 'Tidak ada yang dibuang.';
        state.messageTtl = 1.5;
        return 'error';
      }
      state.hands = [];
      state.plate = [];
      state.plateDish = null;
      state.message = 'Dibuang. Masak lagi yang baru!';
      state.messageTtl = 1.5;
      return 'place';
    }

    return null;
  }

  /** Pause chopping when the player walks away; the item stays on the board. */
  function stopChopping() {
    const chef = state.chef;
    if (chef.chopTarget) {
      chef.chopTarget = null;
      chef.chopProgress = 0;
    }
  }

  function best() {
    try {
      return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
    } catch {
      return 0;
    }
  }

  function saveBest(value) {
    try {
      window.localStorage.setItem(BEST_KEY, String(value));
    } catch {
      // Storage can be off: the best score then lasts this visit only.
    }
  }

  reset();

  return {
    state, reset, step, interact, stopChopping, nearestStation,
    plateMatchesDish, spawnOrder, best, saveBest,
  };
}
