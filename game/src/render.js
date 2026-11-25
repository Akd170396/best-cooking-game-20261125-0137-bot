// Warung Rasa: Dapur Kilat — everything the player sees, drawn on one canvas.
// One clear job: paint the kitchen, the chef, the orders and the HUD from state.

import {
  COLORS, COMPONENTS, DISHES, INGREDIENTS, INTERACT_RADIUS, STATIONS, VIEW,
} from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, weight = '700', align = 'center') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

/** Small vector pictogram for an ingredient / component, drawn at (x, y). */
export function drawIngredientIcon(ctx, id, x, y, size) {
  const r = size / 2;
  ctx.save();
  ctx.translate(x, y);
  if (id === 'nasi' || id === 'nasi_matang') {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(0, 2, r * 0.85, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d9c48a';
    for (let i = 0; i < 6; i += 1) {
      ctx.beginPath();
      ctx.arc((i % 3 - 1) * r * 0.4, (Math.floor(i / 3) - 0.5) * r * 0.5, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = '#8b5a2b'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 4, r, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  } else if (id === 'mie' || id === 'mie_matang') {
    ctx.strokeStyle = '#f2c94c'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-r * 0.8, i * r * 0.45);
      ctx.bezierCurveTo(-r * 0.3, i * r * 0.45 - r * 0.4, r * 0.3, i * r * 0.45 + r * 0.4, r * 0.8, i * r * 0.45);
      ctx.stroke();
    }
  } else if (id === 'telur' || id === 'telur_dadar') {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f6c445';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'ayam' || id === 'ayam_potong' || id === 'ayam_goreng') {
    ctx.fillStyle = id === 'ayam_goreng' ? '#b4551f' : '#e07840';
    ctx.beginPath(); ctx.arc(-r * 0.15, 0, r * 0.62, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#f5efe0'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(r * 0.35, -r * 0.2); ctx.lineTo(r * 0.85, -r * 0.55); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(r * 0.35, r * 0.2); ctx.lineTo(r * 0.85, r * 0.55); ctx.stroke();
  } else if (id === 'sayur' || id === 'sayur_potong') {
    ctx.fillStyle = '#58b368';
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.ellipse(-r * 0.5 + i * r * 0.5, 0, r * 0.32, r * 0.55, (i - 1) * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = '#2f6f4f'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, r * 0.6); ctx.lineTo(0, r * 0.9); ctx.stroke();
  } else if (id === 'sambal') {
    ctx.fillStyle = '#d7263d';
    ctx.beginPath(); ctx.arc(0, 2, r * 0.8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff5d3b';
    ctx.beginPath(); ctx.moveTo(0, -r); ctx.quadraticCurveTo(r * 0.5, -r * 0.2, 0, r * 0.3);
    ctx.quadraticCurveTo(-r * 0.5, -r * 0.2, 0, -r); ctx.fill();
  } else if (id === 'kecap') {
    ctx.fillStyle = '#4a2c1a';
    roundRect(ctx, -r * 0.45, -r * 0.8, r * 0.9, r * 1.6, 4); ctx.fill();
    ctx.fillStyle = '#d7263d';
    ctx.fillRect(-r * 0.45, -r * 0.15, r * 0.9, r * 0.5);
  } else {
    ctx.fillStyle = '#999';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.7, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawPlate(ctx, x, y, radius, components) {
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#d9d9d9'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x, y, radius * 0.72, 0, Math.PI * 2); ctx.stroke();
  components.forEach((comp, i) => {
    const angle = -Math.PI / 2 + (i * Math.PI * 2) / Math.max(components.length, 1);
    drawIngredientIcon(ctx, comp, x + Math.cos(angle) * radius * 0.36, y + Math.sin(angle) * radius * 0.36, radius * 0.55);
  });
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function drawFloor() {
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(0, 0, VIEW.width, 200);
    ctx.fillStyle = COLORS.floor;
    ctx.fillRect(0, 200, VIEW.width, VIEW.height - 200);
    ctx.strokeStyle = COLORS.floorLine;
    ctx.lineWidth = 2;
    for (let x = 0; x <= VIEW.width; x += 80) {
      ctx.beginPath(); ctx.moveTo(x, 200); ctx.lineTo(x, VIEW.height); ctx.stroke();
    }
    for (let y = 280; y <= VIEW.height; y += 80) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(VIEW.width, y); ctx.stroke();
    }
    // wall trim + warung sign
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(0, 192, VIEW.width, 8);
    text(ctx, 'WARUNG RASA', 640, 34, 30, '#402a17', '800');
    text(ctx, 'dapur kilat  •  masak cepat, saji hangat', 640, 64, 15, '#8b5a2b', '600');
  }

  function drawBins(state) {
    for (const bin of STATIONS.bins) {
      const ing = INGREDIENTS[bin.item];
      ctx.fillStyle = COLORS.counterTop;
      roundRect(ctx, bin.x, bin.y, bin.w, bin.h, 10); ctx.fill();
      ctx.fillStyle = COLORS.counterWood;
      ctx.fillRect(bin.x, bin.y + bin.h - 12, bin.w, 12);
      drawIngredientIcon(ctx, bin.item, bin.x + bin.w / 2, bin.y + 30, 44);
      text(ctx, ing.name, bin.x + bin.w / 2, bin.y + bin.h - 26, 14, '#fff8e7');
    }
    text(ctx, 'BAHAN  —  ambil dengan E', 480, 204, 12, '#402a17', '700', 'left');
  }

  function drawBoard(state) {
    const b = STATIONS.board;
    ctx.fillStyle = COLORS.board;
    roundRect(ctx, b.x, b.y, b.w, b.h, 10); ctx.fill();
    ctx.fillStyle = '#3d8a63';
    ctx.fillRect(b.x + 14, b.y + 14, b.w - 28, b.h - 28);
    text(ctx, 'TALENAN', b.x + b.w / 2, b.y + 30, 14, '#fff8e7');
    if (state.board.item) {
      const ing = INGREDIENTS[state.board.item];
      drawIngredientIcon(ctx, state.board.item, b.x + b.w / 2, b.y + 62, 52);
      const p = Math.min(1, state.board.progress / ing.chopTime);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(b.x + 20, b.y + b.h - 24, b.w - 40, 10);
      ctx.fillStyle = '#f2c94c';
      ctx.fillRect(b.x + 20, b.y + b.h - 24, (b.w - 40) * p, 10);
      if (state.chef.chopTarget) text(ctx, 'DIPOTONG...', b.x + b.w / 2, b.y + b.h - 38, 12, '#fff8e7');
      else text(ctx, 'E: lanjut potong', b.x + b.w / 2, b.y + b.h - 38, 12, '#fff8e7');
    } else {
      text(ctx, 'Ayam / Sayur', b.x + b.w / 2, b.y + 62, 13, '#cfe8d8');
      text(ctx, 'tahan E untuk potong', b.x + b.w / 2, b.y + 88, 12, '#cfe8d8');
    }
  }

  function drawWok(state, wok, rect) {
    ctx.fillStyle = COLORS.counterTop;
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 10); ctx.fill();
    ctx.fillStyle = '#22242c';
    ctx.beginPath(); ctx.arc(rect.x + rect.w / 2, rect.y + 58, 46, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = COLORS.wok;
    ctx.beginPath(); ctx.arc(rect.x + rect.w / 2, rect.y + 58, 40, 0, Math.PI * 2); ctx.fill();
    if (wok.item) {
      const label = WOK_LABEL[wok.item] || wok.item;
      if (!wok.done) {
        const p = Math.min(1, wok.progress / 4);
        ctx.strokeStyle = '#f2c94c'; ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(rect.x + rect.w / 2, rect.y + 58, 30, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p);
        ctx.stroke();
        text(ctx, 'MASAK...', rect.x + rect.w / 2, rect.y + 58, 11, '#fff8e7');
      } else {
        drawIngredientIcon(ctx, wok.item, rect.x + rect.w / 2, rect.y + 58, 40);
        ctx.fillStyle = wok.burnIn < 2 ? '#d7263d' : '#58b368';
        ctx.beginPath(); ctx.arc(rect.x + rect.w - 18, rect.y + 18, 10, 0, Math.PI * 2); ctx.fill();
        text(ctx, 'SIAP!', rect.x + rect.w / 2, rect.y + rect.h - 14, 12, '#fff8e7');
      }
    } else {
      text(ctx, 'WAJAN', rect.x + rect.w / 2, rect.y + 30, 13, '#fff8e7');
      text(ctx, 'E: masukkan bahan', rect.x + rect.w / 2, rect.y + 92, 11, '#e8d9b0');
    }
  }

  const WOK_LABEL = { nasi: 'Nasi', mie: 'Mie', telur: 'Telur', ayam_potong: 'Ayam' };

  function drawPlating(state) {
    const p = STATIONS.plating;
    ctx.fillStyle = COLORS.steel;
    roundRect(ctx, p.x, p.y, p.w, p.h, 10); ctx.fill();
    text(ctx, 'MEJA SAJI — rakit hidangan', p.x + p.w / 2, p.y + 18, 13, '#3a3f4a');
    if (state.plate.length === 0) {
      ctx.strokeStyle = '#8a94a6'; ctx.lineWidth = 2; ctx.setLineDash([6, 5]);
      ctx.beginPath(); ctx.arc(p.x + 60, p.y + 68, 34, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      text(ctx, 'piring kosong — E: taruh bahan', p.x + 130, p.y + 68, 12, '#5a6474', '600', 'left');
    } else {
      drawPlate(ctx, p.x + 60, p.y + 68, 36, state.plate);
      if (state.plateDish) {
        const dish = DISHES[state.plateDish];
        text(ctx, `✓ ${dish.name} — SIAP!`, p.x + 130, p.y + 56, 15, '#2f6f4f', '800', 'left');
        text(ctx, 'E: ambil piringnya', p.x + 130, p.y + 80, 12, '#2f6f4f', '600', 'left');
      } else {
        text(ctx, 'belum lengkap...', p.x + 130, p.y + 56, 13, '#5a6474', '600', 'left');
        text(ctx, 'cek papan order di atas', p.x + 130, p.y + 80, 12, '#5a6474', '600', 'left');
      }
    }
  }

  function drawWindow(state) {
    const w = STATIONS.window;
    ctx.fillStyle = '#7a4a21';
    roundRect(ctx, w.x, w.y, w.w, w.h, 10); ctx.fill();
    ctx.fillStyle = '#fff8e7';
    ctx.fillRect(w.x + 12, w.y + 12, w.w - 24, w.h - 24);
    text(ctx, 'JENDELA SAJI', w.x + w.w / 2, w.y + 30, 14, '#402a17');
    ctx.fillStyle = '#d7263d';
    ctx.beginPath(); ctx.arc(w.x + w.w - 30, w.y + 30, 12, 0, Math.PI * 2); ctx.fill();
    text(ctx, '🔔', w.x + w.w - 30, w.y + 31, 13, '#fff', '700');
    text(ctx, 'E: antar piring', w.x + w.w / 2, w.y + 58, 13, '#402a17');
    text(ctx, 'yang cocok dengan order', w.x + w.w / 2, w.y + 78, 12, '#8b5a2b');
    text(ctx, 'hidangan salah = ditolak', w.x + w.w / 2, w.y + 98, 11, '#b0552f');
  }

  function drawTrash(state) {
    const t = STATIONS.trash;
    ctx.fillStyle = '#5a6474';
    roundRect(ctx, t.x, t.y, t.w, t.h, 10); ctx.fill();
    ctx.fillStyle = '#3a3f4a';
    roundRect(ctx, t.x + 16, t.y + 18, t.w - 32, t.h - 30, 6); ctx.fill();
    text(ctx, 'SAMPAH', t.x + t.w / 2, t.y + 22, 12, '#fff8e7');
    text(ctx, 'E: buang', t.x + t.w / 2, t.y + t.h - 12, 11, '#cfd6e4');
  }

  function drawChef(state) {
    const chef = state.chef;
    const bob = chef.moving ? Math.sin(state.time * 14) * 2 : 0;
    ctx.save();
    ctx.translate(chef.x, chef.y + bob);
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.ellipse(0, 22, 26, 8, 0, 0, Math.PI * 2); ctx.fill();
    // body + apron
    ctx.fillStyle = '#f5efe0';
    ctx.beginPath(); ctx.arc(0, 0, 24, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e07840';
    ctx.beginPath(); ctx.arc(0, 6, 20, 0.15 * Math.PI, 0.85 * Math.PI); ctx.fill();
    // face
    ctx.fillStyle = '#3a2a1a';
    ctx.beginPath(); ctx.arc(-8, -4, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(8, -4, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 4, 7, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
    // chef hat
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(0, -20, 13, Math.PI, 0); ctx.fill();
    ctx.fillRect(-13, -22, 26, 6);
    // carried items above the head
    state.hands.forEach((item, i) => {
      const ox = (i - (state.hands.length - 1) / 2) * 30;
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath(); ctx.arc(ox, -44, 14, 0, Math.PI * 2); ctx.fill();
      if (item.startsWith('plate:')) {
        drawPlate(ctx, ox, -44, 12, DISHES[item.slice(6)].needs);
      } else {
        drawIngredientIcon(ctx, item, ox, -44, 20);
      }
    });
    ctx.restore();
  }

  function drawOrders(state) {
    const y = 104;
    const w = 296;
    const gap = 10;
    for (let i = 0; i < 4; i += 1) {
      const x = 40 + i * (w + gap);
      const order = state.orders[i];
      if (!order) {
        ctx.fillStyle = 'rgba(64,42,23,0.10)';
        roundRect(ctx, x, y, w, 80, 10); ctx.fill();
        ctx.strokeStyle = 'rgba(64,42,23,0.25)'; ctx.setLineDash([5, 5]);
        roundRect(ctx, x, y, w, 80, 10); ctx.stroke();
        ctx.setLineDash([]);
        text(ctx, '— menunggu pesanan —', x + w / 2, y + 40, 13, '#8b7a5a');
        continue;
      }
      const dish = DISHES[order.dish];
      const frac = Math.max(0, order.left / order.total);
      const urgent = frac < 0.3;
      ctx.fillStyle = COLORS.ticket;
      roundRect(ctx, x, y, w, 80, 10); ctx.fill();
      ctx.strokeStyle = urgent ? COLORS.danger : COLORS.ticketEdge;
      ctx.lineWidth = urgent ? 3 : 2;
      roundRect(ctx, x, y, w, 80, 10); ctx.stroke();
      ctx.fillStyle = dish.color;
      ctx.fillRect(x, y, 8, 80);
      text(ctx, dish.name, x + 22, y + 18, 16, '#402a17', '800', 'left');
      dish.needs.forEach((need, j) => {
        drawIngredientIcon(ctx, need, x + 34 + j * 34, y + 48, 26);
      });
      text(ctx, `${Math.ceil(order.left)} dtk`, x + w - 14, y + 18, 14, urgent ? COLORS.danger : '#402a17', '800', 'right');
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(x + 14, y + 66, w - 28, 7);
      ctx.fillStyle = frac > 0.5 ? '#58b368' : frac > 0.3 ? '#f2c94c' : '#d7263d';
      ctx.fillRect(x + 14, y + 66, (w - 28) * frac, 7);
    }
  }

  function drawHud(state, best) {
    // score / coins / combo / hearts / shift timer
    text(ctx, `SKOR ${state.score}`, 1010, 30, 20, '#402a17', '800', 'left');
    text(ctx, `🪙 ${state.coins}`, 1010, 56, 16, '#8b5a2b', '700', 'left');
    if (state.combo > 1) text(ctx, `KOMBO x${state.combo}`, 1150, 30, 16, '#d7263d', '800', 'left');
    for (let i = 0; i < 3; i += 1) {
      ctx.fillStyle = i < state.hearts ? '#d7263d' : 'rgba(0,0,0,0.15)';
      ctx.beginPath();
      ctx.arc(1010 + i * 26, 82, 9, 0, Math.PI * 2);
      ctx.fill();
    }
    const mins = Math.floor(state.shiftLeft / 60);
    const secs = Math.ceil(state.shiftLeft % 60);
    const shiftText = state.rush ? `⚠ RUSH! ${mins}:${String(secs).padStart(2, '0')}` : `Shift ${mins}:${String(secs).padStart(2, '0')}`;
    text(ctx, shiftText, 640, 92, 16, state.rush ? '#d7263d' : '#402a17', '800');
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(480, 100, 320, 6);
    ctx.fillStyle = state.rush ? '#d7263d' : '#58b368';
    ctx.fillRect(480, 100, 320 * (state.shiftLeft / 150), 6);
    text(ctx, `Terbaik: ${Math.max(best, state.score)}`, 240, 30, 14, '#8b5a2b', '600', 'left');
  }

  function drawMessage(state) {
    if (!state.message) return;
    ctx.fillStyle = 'rgba(64,42,23,0.88)';
    const w = ctx.measureText(state.message).width + 36;
    roundRect(ctx, 640 - w / 2, 736, w, 34, 17); ctx.fill();
    text(ctx, state.message, 640, 754, 15, '#fff8e7');
  }

  function drawParticles(state) {
    for (const p of state.particles) {
      ctx.globalAlpha = Math.max(0, p.ttl);
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.ttl, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (const pop of state.popups) {
      ctx.globalAlpha = Math.min(1, pop.ttl);
      text(ctx, pop.text, pop.x, pop.y, 20, pop.color, '800');
    }
    ctx.globalAlpha = 1;
  }

  function drawInteractHint(state) {
    // The renderer only sees world state, so it finds the nearest station itself.
    const chef = state.chef;
    let station = null;
    let bestDist = Infinity;
    const all = [...STATIONS.bins, STATIONS.board, STATIONS.wok1, STATIONS.wok2, STATIONS.plating, STATIONS.window, STATIONS.trash];
    for (const rect of all) {
      const nx = Math.max(rect.x, Math.min(chef.x, rect.x + rect.w));
      const ny = Math.max(rect.y, Math.min(chef.y, rect.y + rect.h));
      const dist = Math.hypot(chef.x - nx, chef.y - ny);
      if (dist < bestDist) {
        bestDist = dist;
        station = rect;
      }
    }
    if (!station || bestDist > INTERACT_RADIUS) return;
    const label = {
      board: 'TALENAN — E: potong',
      wok1: 'WAJAN 1 — E: masak / angkat',
      wok2: 'WAJAN 2 — E: masak / angkat',
      plating: 'MEJA SAJI — E: rakit / ambil',
      window: 'JENDELA SAJI — E: antar',
      trash: 'SAMPAH — E: buang',
    }[station.id] || (station.id.startsWith('bin_') ? 'BAHAN — E: ambil' : null);
    if (!label) return;
    const x = state.chef.x;
    const y = state.chef.y - 78;
    ctx.fillStyle = 'rgba(64,42,23,0.9)';
    const w = ctx.measureText(label).width + 28;
    roundRect(ctx, x - w / 2, y - 16, w, 30, 15); ctx.fill();
    text(ctx, label, x, y, 13, '#fff8e7');
    // range ring on the station
    ctx.strokeStyle = 'rgba(242,201,76,0.9)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(station.x + station.w / 2, station.y + station.h / 2, Math.max(station.w, station.h) / 2 + 8, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawTitle(state, best) {
    ctx.fillStyle = 'rgba(64,42,23,0.55)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.fillStyle = '#fff8e7';
    roundRect(ctx, 290, 180, 700, 420, 20); ctx.fill();
    text(ctx, '🍳 WARUNG RASA', 640, 240, 44, '#402a17', '800');
    text(ctx, 'DAPUR KILAT', 640, 292, 30, '#e07840', '800');
    text(ctx, 'Masak pesanan warung secepat kilat: ambil bahan,', 640, 350, 17, '#5a4632');
    text(ctx, 'potong, goreng di wajan, rakit di piring, antar ke jendela.', 640, 376, 17, '#5a4632');
    text(ctx, 'Gerak: WASD / panah  •  Aksi: E atau klik  •  Jeda: P  •  Suara: M', 640, 414, 15, '#8b5a2b', '600');
    text(ctx, 'Hati-hati: pesanan hangus kalau timer habis, masakan gosong kalau telat diangkat!', 640, 442, 14, '#b0552f', '600');
    ctx.fillStyle = '#e07840';
    roundRect(ctx, 520, 480, 240, 56, 12); ctx.fill();
    text(ctx, '▶  MULAI MASAK', 640, 509, 20, '#fff8e7', '800');
    if (best > 0) text(ctx, `Skor terbaik: ${best}`, 640, 566, 15, '#8b5a2b', '700');
  }

  function drawPaused() {
    ctx.fillStyle = 'rgba(64,42,23,0.55)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    text(ctx, 'JEDA', 640, 380, 48, '#fff8e7', '800');
    text(ctx, 'Tekan P atau klik untuk lanjut', 640, 430, 18, '#ffe9c4');
  }

  function drawOver(state, best) {
    ctx.fillStyle = 'rgba(64,42,23,0.6)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.fillStyle = '#fff8e7';
    roundRect(ctx, 340, 200, 600, 380, 20); ctx.fill();
    text(ctx, state.hearts <= 0 ? 'WARUNG TUTUP!' : 'SHIFT SELESAI!', 640, 260, 40, '#402a17', '800');
    text(ctx, `Skor akhir: ${state.score}`, 640, 320, 26, '#e07840', '800');
    text(ctx, `Hidangan tersaji: ${state.served}   •   Hangus: ${state.expired}`, 640, 364, 17, '#5a4632');
    text(ctx, `Kombo terbaik: x${state.bestCombo}   •   Koin: ${state.coins}`, 640, 394, 17, '#5a4632');
    text(ctx, `Skor terbaik: ${Math.max(best, state.score)}`, 640, 424, 17, '#8b5a2b', '700');
    ctx.fillStyle = '#e07840';
    roundRect(ctx, 520, 470, 240, 56, 12); ctx.fill();
    text(ctx, '↻  MASAK LAGI', 640, 499, 20, '#fff8e7', '800');
  }

  function draw(state, screen, best) {
    ctx.clearRect(0, 0, VIEW.width, VIEW.height);
    ctx.save();
    if (state.shake > 0) {
      ctx.translate((Math.random() - 0.5) * 8 * state.shake, (Math.random() - 0.5) * 8 * state.shake);
    }
    drawFloor();
    drawOrders(state);
    drawBins(state);
    drawBoard(state);
    drawWok(state, state.woks[0], STATIONS.wok1);
    drawWok(state, state.woks[1], STATIONS.wok2);
    drawPlating(state);
    drawWindow(state);
    drawTrash(state);
    drawChef(state);
    drawParticles(state);
    drawHud(state, best);
    if (state.rush && screen === SCREEN_PLAY) {
      // Dinner rush: a pulsing red edge so the pressure reads at a glance.
      const pulse = 0.25 + 0.12 * Math.sin(state.time * 5);
      ctx.strokeStyle = `rgba(215,38,61,${pulse})`;
      ctx.lineWidth = 14;
      ctx.strokeRect(7, 7, VIEW.width - 14, VIEW.height - 14);
    }
    if (screen === SCREEN_PLAY) drawInteractHint(state);
    drawMessage(state);
    ctx.restore();
    if (screen === SCREEN_TITLE) drawTitle(state, best);
    else if (screen === SCREEN_PAUSED) drawPaused();
    else if (screen === SCREEN_OVER) drawOver(state, best);
  }

  return { draw };
}
