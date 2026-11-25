// Warung Rasa: Dapur Kilat — configuration: recipes, stations, timings, colours.
// One clear job: every tunable number and name lives here, nowhere else.

export const VIEW = { width: 1280, height: 800 };
export const STEP = 1 / 60;
export const SHIFT_SECONDS = 150;
export const RUSH_AT = 45; // seconds left when the dinner rush starts
export const MAX_HEARTS = 3;
export const HANDS = 2; // items the chef can carry at once
export const BEST_KEY = 'warung-rasa-best';

// --- ingredients ------------------------------------------------------------
export const INGREDIENTS = {
  nasi:   { id: 'nasi',   name: 'Nasi',   color: '#f5efe0', prep: 'wok',  cookTime: 3, result: 'nasi_matang' },
  mie:    { id: 'mie',    name: 'Mie',    color: '#f2c94c', prep: 'wok',  cookTime: 3, result: 'mie_matang' },
  telur:  { id: 'telur',  name: 'Telur',  color: '#f6e27a', prep: 'wok',  cookTime: 3, result: 'telur_dadar' },
  ayam:   { id: 'ayam',   name: 'Ayam',   color: '#e07840', prep: 'chop', chopTime: 2, result: 'ayam_potong' },
  sayur:  { id: 'sayur',  name: 'Sayur',  color: '#58b368', prep: 'chop', chopTime: 2, result: 'sayur_potong' },
  sambal: { id: 'sambal', name: 'Sambal', color: '#d7263d', prep: 'none', result: 'sambal' },
  kecap:  { id: 'kecap',  name: 'Kecap',  color: '#4a2c1a', prep: 'none', result: 'kecap' },
};

// Intermediate / finished components (what the chef actually carries).
export const COMPONENTS = {
  nasi_matang:  { id: 'nasi_matang',  name: 'Nasi Matang',  color: '#f5efe0' },
  mie_matang:   { id: 'mie_matang',   name: 'Mie Matang',   color: '#f2c94c' },
  telur_dadar:  { id: 'telur_dadar',  name: 'Telur Dadar',  color: '#f6e27a' },
  ayam_potong:  { id: 'ayam_potong',  name: 'Ayam Potong',  color: '#e07840' },
  ayam_goreng:  { id: 'ayam_goreng',  name: 'Ayam Goreng',  color: '#b4551f' },
  sayur_potong: { id: 'sayur_potong', name: 'Sayur Potong', color: '#58b368' },
  sambal:       { id: 'sambal',       name: 'Sambal',       color: '#d7263d' },
  kecap:        { id: 'kecap',        name: 'Kecap',        color: '#4a2c1a' },
};

// ayam_potong is the only intermediate that needs a second step (wok).
export const WOK_RECIPES = {
  nasi: 'nasi_matang',
  mie: 'mie_matang',
  telur: 'telur_dadar',
  ayam_potong: 'ayam_goreng',
};
export const WOK_TIMES = { nasi: 3, mie: 3, telur: 3, ayam_potong: 4 };
export const BURN_AFTER = 6; // seconds a finished wok dish waits before it burns

// --- dishes -----------------------------------------------------------------
export const DISHES = {
  nasi_goreng: {
    id: 'nasi_goreng', name: 'Nasi Goreng', color: '#e8a33d',
    needs: ['nasi_matang', 'telur_dadar', 'kecap'],
  },
  mie_ayam: {
    id: 'mie_ayam', name: 'Mie Ayam', color: '#f2c94c',
    needs: ['mie_matang', 'ayam_goreng', 'sayur_potong'],
  },
  ayam_geprek: {
    id: 'ayam_geprek', name: 'Ayam Geprek', color: '#d7263d',
    needs: ['ayam_goreng', 'sambal', 'nasi_matang'],
  },
  sayur_lodeh: {
    id: 'sayur_lodeh', name: 'Sayur Lodeh', color: '#58b368',
    needs: ['sayur_potong', 'telur_dadar', 'sambal'],
  },
};
export const DISH_LIST = ['nasi_goreng', 'mie_ayam', 'ayam_geprek', 'sayur_lodeh'];

// --- orders -----------------------------------------------------------------
export const ORDER = {
  patience: 45,        // seconds before a ticket expires (calm)
  patienceRush: 34,    // seconds during the rush
  spawnEvery: 14,      // seconds between new tickets (calm)
  spawnRush: 8,        // seconds between new tickets (rush)
  maxOpen: 4,
};

// --- stations (kitchen layout, pixels) --------------------------------------
export const STATIONS = {
  bins: [
    { id: 'bin_nasi',   item: 'nasi',   x: 40,  y: 212, w: 118, h: 86 },
    { id: 'bin_mie',    item: 'mie',    x: 168, y: 212, w: 118, h: 86 },
    { id: 'bin_telur',  item: 'telur',  x: 296, y: 212, w: 118, h: 86 },
    { id: 'bin_ayam',   item: 'ayam',   x: 424, y: 212, w: 118, h: 86 },
    { id: 'bin_sayur',  item: 'sayur',  x: 552, y: 212, w: 118, h: 86 },
    { id: 'bin_sambal', item: 'sambal', x: 680, y: 212, w: 118, h: 86 },
    { id: 'bin_kecap',  item: 'kecap',  x: 808, y: 212, w: 118, h: 86 },
  ],
  board:   { id: 'board',   x: 40,  y: 400, w: 220, h: 118 },
  wok1:    { id: 'wok1',    x: 340, y: 400, w: 150, h: 118 },
  wok2:    { id: 'wok2',    x: 520, y: 400, w: 150, h: 118 },
  plating: { id: 'plating', x: 740, y: 400, w: 260, h: 118 },
  window:  { id: 'window',  x: 1000, y: 600, w: 240, h: 118 },
  trash:   { id: 'trash',   x: 40,  y: 640, w: 140, h: 100 },
};

export const CHEF = { radius: 24, speed: 270 };
export const INTERACT_RADIUS = 86;

// --- palette ----------------------------------------------------------------
export const COLORS = {
  wall: '#f7e8c9',
  floor: '#d9a066',
  floorLine: '#c98d54',
  counterWood: '#8b5a2b',
  counterTop: '#a9743f',
  steel: '#b8c0cc',
  wok: '#3a3f4a',
  board: '#2f6f4f',
  ticket: '#fff8e7',
  ticketEdge: '#d9c48a',
  hud: '#402a17',
  accent: '#e07840',
  gold: '#f2c94c',
  danger: '#d7263d',
  ok: '#58b368',
};
