'use strict';
// CHAOS: The Battle of Wizards, family remake (WIP).
// Rules engine, board drawing, computer wizards, lobby and chat.

const W = 15, H = 10, C = 16;
const INK = {
  blue: '#0000ff', red: '#ff2020', magenta: '#ff00ff', green: '#00ff00', cyan: '#00ffff', yellow: '#ffff00', white: '#ffffff',
  dblue: '#0000d7', dred: '#d70000', dmagenta: '#d700d7', dgreen: '#00d700', dcyan: '#00d7d7', dyellow: '#d7d700', dwhite: '#d7d7d7',
};
const PCOL = ['#00ffff', '#ffff00', '#ff00ff', '#00ff00', '#ffffff', '#ff2020', '#6f8fff', '#d7d700'];

// ---------------------------------------------------------------- creatures & spells
// id, name, combat, ranged combat, range, defence, movement, manoeuvre, magic resistance,
// casting chance %, alignment (+ law / - chaos), flags (f = flies, u = undead), ink
const CR = {};
[
  ['cobra', 'KING COBRA', 4, 0, 0, 1, 1, 6, 1, 90, 1, '', 'green'],
  ['wolf', 'DIRE WOLF', 3, 0, 0, 2, 3, 7, 2, 90, -1, '', 'cyan'],
  ['goblin', 'GOBLIN', 2, 0, 0, 4, 1, 4, 4, 90, -1, '', 'green'],
  ['orc', 'ORC', 2, 0, 0, 1, 1, 4, 4, 100, -1, '', 'dmagenta'],
  ['rat', 'GIANT RAT', 1, 0, 0, 1, 3, 8, 2, 100, 0, '', 'dwhite'],
  ['elf', 'ELF', 1, 2, 6, 2, 1, 7, 5, 70, 2, '', 'dgreen'],
  ['bear', 'BEAR', 6, 0, 0, 7, 2, 6, 2, 70, 1, '', 'dyellow'],
  ['lion', 'LION', 6, 0, 0, 4, 4, 8, 3, 60, 1, '', 'yellow'],
  ['ogre', 'OGRE', 4, 0, 0, 7, 1, 3, 6, 70, -1, '', 'dgreen'],
  ['hydra', 'HYDRA', 7, 0, 0, 8, 1, 4, 6, 50, -1, '', 'green'],
  ['giant', 'GIANT', 9, 0, 0, 7, 2, 6, 5, 40, 1, '', 'cyan'],
  ['centaur', 'CENTAUR', 1, 2, 4, 3, 4, 5, 5, 70, 1, '', 'dyellow'],
  ['unicorn', 'UNICORN', 5, 0, 0, 4, 4, 9, 7, 60, 2, '', 'white'],
  ['bat', 'VAMPIRE BAT', 1, 0, 0, 1, 5, 9, 4, 90, -1, 'f', 'magenta'],
  ['eagle', 'EAGLE', 3, 0, 0, 3, 6, 8, 2, 70, 1, 'f', 'dwhite'],
  ['harpy', 'HARPY', 4, 0, 0, 2, 5, 8, 5, 60, -1, 'f', 'red'],
  ['gryphon', 'GRYPHON', 3, 0, 0, 5, 5, 5, 6, 60, 1, 'f', 'yellow'],
  ['manticore', 'MANTICORE', 3, 1, 3, 6, 5, 6, 8, 50, -1, 'f', 'dred'],
  ['gdragon', 'GREEN DRAGON', 5, 4, 6, 8, 3, 4, 4, 40, -1, 'f', 'green'],
  ['rdragon', 'RED DRAGON', 7, 3, 5, 9, 3, 4, 5, 30, -2, 'f', 'red'],
  ['ydragon', 'GOLDEN DRAGON', 9, 5, 4, 9, 3, 5, 5, 20, 2, 'f', 'yellow'],
  ['skeleton', 'SKELETON', 3, 0, 0, 2, 1, 3, 4, 70, -1, 'u', 'white'],
  ['zombie', 'ZOMBIE', 1, 0, 0, 1, 1, 2, 3, 90, -1, 'u', 'dgreen'],
  ['ghost', 'GHOST', 1, 0, 0, 3, 2, 9, 6, 60, -1, 'fu', 'white'],
  ['spectre', 'SPECTRE', 4, 0, 0, 2, 1, 6, 4, 60, -1, 'u', 'magenta'],
  ['wraith', 'WRAITH', 5, 0, 0, 5, 2, 4, 5, 50, -1, 'u', 'dcyan'],
  ['vampire', 'VAMPIRE', 6, 0, 0, 8, 4, 6, 5, 30, -2, 'fu', 'red'],
].forEach(([id, name, com, rcom, rng, def, mov, man, res, ch, al, fl, ink]) => {
  CR[id] = { id, name, com, rcom, rng, def, mov, man, res, ch, al, fly: fl.includes('f'), undead: fl.includes('u'), ink: INK[ink] };
});

const SP = {};
for (const id in CR) SP[id] = { name: CR[id].name, kind: 'creature', ch: CR[id].ch, al: CR[id].al, rng: 1 };
Object.assign(SP, {
  disbelieve: { name: 'DISBELIEVE', kind: 'disbelieve', ch: 100, al: 0, rng: 99, txt: 'Unmasks a creature. If it is an illusion it vanishes. You always keep this spell.' },
  bolt: { name: 'MAGIC BOLT', kind: 'bolt', ch: 100, al: 0, rng: 6, str: 3, txt: 'Zaps anything within 6 squares.' },
  lightning: { name: 'LIGHTNING', kind: 'bolt', ch: 100, al: 0, rng: 4, str: 6, txt: 'A big zap, range 4.' },
  subversion: { name: 'SUBVERSION', kind: 'subvert', ch: 100, al: 0, rng: 7, txt: 'Steal an enemy creature (it may resist).' },
  raisedead: { name: 'RAISE DEAD', kind: 'raise', ch: 60, al: -1, rng: 4, txt: 'Turns a corpse into your undead creature.' },
  decree: { name: 'DECREE', kind: 'decree', ch: 80, al: 1, rng: 7, txt: 'Destroys a creature, or all of a wizard\'s creatures.' },
  vengeance: { name: 'VENGEANCE', kind: 'decree', ch: 80, al: -1, rng: 7, txt: 'Destroys a creature, or all of a wizard\'s creatures.' },
  shield: { name: 'MAGIC SHIELD', kind: 'self', ch: 80, al: 1, eff: { def: 2 }, txt: 'Your wizard gets +2 defence.' },
  armour: { name: 'MAGIC ARMOUR', kind: 'self', ch: 50, al: 1, eff: { def: 4 }, txt: 'Your wizard gets +4 defence.' },
  knife: { name: 'MAGIC KNIFE', kind: 'self', ch: 70, al: 1, eff: { com: 2, mw: 1 }, txt: '+2 combat, and can hit undead.' },
  sword: { name: 'MAGIC SWORD', kind: 'self', ch: 40, al: 1, eff: { com: 4, mw: 1 }, txt: '+4 combat, and can hit undead.' },
  wings: { name: 'MAGIC WINGS', kind: 'self', ch: 60, al: 0, eff: { wings: 1 }, txt: 'Your wizard can fly 6 squares.' },
  law1: { name: 'LAW-1', kind: 'world', ch: 100, al: 2, txt: 'Tips the world towards law. Law spells get easier.' },
  law2: { name: 'LAW-2', kind: 'world', ch: 60, al: 4, txt: 'Tips the world a lot towards law.' },
  chaos1: { name: 'CHAOS-1', kind: 'world', ch: 100, al: -2, txt: 'Tips the world towards chaos. Chaos spells get easier.' },
  chaos2: { name: 'CHAOS-2', kind: 'world', ch: 60, al: -4, txt: 'Tips the world a lot towards chaos.' },
});
for (const id in SP) SP[id].id = id;

// ---------------------------------------------------------------- app state
let cid = null;
try { cid = localStorage.getItem('chaos_cid'); } catch (e) {}
if (!cid) { cid = 'c' + Math.random().toString(36).slice(2, 10); try { localStorage.setItem('chaos_cid', cid); } catch (e) {} }

const app = { screen: 'title', code: null, room: {}, status: '', hotseat: false, hot: [] };
let S = null;                       // the game state (shared)
let myIds = new Set([cid]);         // players this device controls
const ui = { spell: null, pick: null, ill: false, sel: null, examine: null, chatOpen: false, unread: 0, seenChat: new Set() };
let lastFx = 0;
const anims = [];

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rnd = n => Math.floor(Math.random() * n);
const dist = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
const inB = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
const units = () => Object.values(S.units);
const at = (x, y) => units().find(u => u.x === x && u.y === y) || null;
const wizOf = p => units().find(u => u.t === 'wizard' && u.o === p) || null;
const P = () => S.players[S.cur];
const mine = p => myIds.has(S.players[p].id);
const myTurn = () => S && S.winner < 0 && mine(S.cur) && !P().cpu;
const pname = p => S.players[p].name.toUpperCase();
const pcol = p => PCOL[S.players[p].col % PCOL.length];

function st(u, k) {
  if (u.t === 'wizard') {
    let v = u.s[k] || 0;
    const b = u.b || {};
    if (k === 'com') v += b.com || 0;
    if (k === 'def') v += b.def || 0;
    if (k === 'mov' && b.wings) v = 6;
    return v;
  }
  return CR[u.t][k];
}
const flies = u => u.t === 'wizard' ? !!(u.b && u.b.wings) : CR[u.t].fly;
const undead = u => u.t !== 'wizard' && (CR[u.t].undead || !!u.ud);
const uname = u => u.t === 'wizard' ? pname(u.o) : (u.ud && !CR[u.t].undead ? 'UNDEAD ' : '') + CR[u.t].name;
const canHurt = (a, d) => !undead(d) || undead(a) || (a.t === 'wizard' && !!(a.b && a.b.mw));

function chance(sp) {
  let c = sp.ch;
  const w = S.law;
  if (sp.al && w && Math.sign(sp.al) === Math.sign(w)) c += Math.abs(w) * 5;
  return Math.max(0, Math.min(100, c));
}
const alClass = al => al > 0 ? 'law' : al < 0 ? 'chaos' : 'neut';
const alMark = al => al > 0 ? '^' : al < 0 ? '*' : '-';

function say(t) { S.log.push(t); if (S.log.length > 8) S.log.splice(0, S.log.length - 8); }
function fx(k, x, y, x2, y2) {
  S.fx.push({ n: ++S.fxn, k, x, y, x2: x2 ?? x, y2: y2 ?? y });
  if (S.fx.length > 12) S.fx.splice(0, S.fx.length - 12);
}

// ---------------------------------------------------------------- game rules
const STARTS = { 2: [[1, 4], [13, 5]], 3: [[7, 1], [1, 8], [13, 8]], 4: [[1, 1], [13, 1], [13, 8], [1, 8]] };
const STARTS8 = [[1, 1], [13, 8], [13, 1], [1, 8], [7, 0], [7, 9], [0, 5], [14, 4]];

function newGame(list) {
  const n = list.length, pos = STARTS[n] || STARTS8.slice(0, n);
  const pool = Object.keys(SP).filter(k => k !== 'disbelieve');
  const s = { gid: Math.random().toString(36).slice(2, 8), v: 1, round: 1, cur: 0, phase: 'cast', law: 0, players: [], units: {}, corpses: [], log: [], fx: [], fxn: 0, nid: 0, winner: -1 };
  list.forEach((p, i) => {
    const bag = pool.slice(), spells = ['disbelieve'];
    while (spells.length < 12 && bag.length) spells.push(bag.splice(rnd(bag.length), 1)[0]);
    s.players.push({ id: p.id, name: String(p.name || 'WIZARD').slice(0, 12), cpu: !!p.cpu, alive: true, spells, col: i });
    const id = 'u' + (++s.nid);
    s.units[id] = { id, t: 'wizard', o: i, x: pos[i][0], y: pos[i][1], s: { com: 1 + rnd(3), rcom: 0, rng: 0, def: 1 + rnd(3), mov: 1, man: 3 + rnd(3), res: 5 + rnd(4) }, b: { none: 0 } };
  });
  return s;
}

function norm(s) {
  s.players = s.players || [];
  s.players.forEach(p => { p.spells = p.spells || []; });
  s.units = s.units || {};
  for (const id in s.units) if (!s.units[id].b) s.units[id].b = { none: 0 };
  s.corpses = s.corpses || [];
  s.log = s.log || [];
  s.fx = s.fx || [];
  if (s.winner === undefined) s.winner = -1;
  return s;
}

function startTurn() {
  for (const u of units()) if (u.o === S.cur) { u.mv = st(u, 'mov'); u.at = 0; u.sh = 0; u.chk = 0; }
  S.phase = 'cast';
  say(pname(S.cur) + "'S TURN");
  fx('turn', 0, 0);
}

function endTurn() {
  if (S.winner >= 0) return;
  const n = S.players.length;
  for (let i = 1; i <= n; i++) {
    const p = (S.cur + i) % n;
    if (S.players[p].alive) {
      if (p <= S.cur) { S.round++; say('ROUND ' + S.round); }
      S.cur = p;
      break;
    }
  }
  startTurn();
}

function addUnit(t, o, x, y, extra) {
  const id = 'u' + (++S.nid);
  S.units[id] = Object.assign({ id, t, o, x, y, mv: CR[t].mov, at: 0, sh: 0, chk: 0 }, extra || {});
  return S.units[id];
}

function kill(u, corpse) {
  if (u.t === 'wizard') return killWizard(u.o);
  delete S.units[u.id];
  fx('die', u.x, u.y);
  if (corpse && !u.ill && !undead(u)) S.corpses.push({ t: u.t, x: u.x, y: u.y });
}

function killWizard(p) {
  const w = wizOf(p);
  for (const v of units()) if (v.o === p) delete S.units[v.id];
  S.players[p].alive = false;
  say(pname(p) + ' IS DEAD');
  if (w) fx('die', w.x, w.y);
  const alive = S.players.filter(q => q.alive);
  if (alive.length <= 1) {
    S.winner = alive.length ? S.players.indexOf(alive[0]) : S.cur;
    S.phase = 'over';
    say(pname(S.winner) + ' WINS!');
    fx('win', 0, 0);
  }
}

function spellTargets(sp) {
  const w = wizOf(S.cur), out = [];
  if (!w) return out;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const u = at(x, y), d = dist(w, { x, y });
    switch (sp.kind) {
      case 'creature': if (!u && d <= 1) out.push([x, y]); break;
      case 'bolt': if (u && u !== w && d <= sp.rng) out.push([x, y]); break;
      case 'disbelieve': if (u && u.t !== 'wizard') out.push([x, y]); break;
      case 'subvert': if (u && u.t !== 'wizard' && u.o !== S.cur && d <= sp.rng) out.push([x, y]); break;
      case 'raise': if (!u && d <= sp.rng && S.corpses.some(c => c.x === x && c.y === y)) out.push([x, y]); break;
      case 'decree': if (u && u.o !== S.cur && d <= sp.rng) out.push([x, y]); break;
    }
  }
  return out;
}
const needsTarget = sp => sp.kind !== 'self' && sp.kind !== 'world';

function cast(id, ill, x, y) {
  const sp = SP[id], p = P(), w = wizOf(S.cur);
  if (id !== 'disbelieve') { const i = p.spells.indexOf(id); if (i >= 0) p.spells.splice(i, 1); }
  say(pname(S.cur) + ' CASTS ' + sp.name);
  S.phase = 'move';
  const tx = x ?? w.x, ty = y ?? w.y;
  const ok = ill || rnd(100) < chance(sp);
  if (!ok) { say('SPELL FAILS'); fx('fail', tx, ty); return; }
  if (!ill && sp.al) S.law = Math.max(-12, Math.min(12, S.law + sp.al));
  const u = needsTarget(sp) ? at(x, y) : null;
  switch (sp.kind) {
    case 'creature':
      fx('cast', x, y);
      addUnit(id, S.cur, x, y, ill ? { ill: 1 } : null);
      say('SPELL SUCCEEDS');
      break;
    case 'bolt':
      fx('bolt', w.x, w.y, x, y);
      if (sp.str + rnd(10) > st(u, 'def') + rnd(10)) { say(uname(u) + ' IS DESTROYED'); kill(u, true); }
      else say(uname(u) + ' SURVIVES');
      break;
    case 'disbelieve':
      fx('cast', x, y);
      if (u.ill) { say('IT WAS AN ILLUSION!'); kill(u, false); }
      else say('IT IS REAL');
      break;
    case 'subvert':
      fx('cast', x, y);
      if (rnd(10) >= st(u, 'res')) { u.o = S.cur; u.mv = 0; u.at = 1; u.sh = 1; say(uname(u) + ' JOINS ' + pname(S.cur)); }
      else say(uname(u) + ' RESISTS');
      break;
    case 'raise': {
      fx('cast', x, y);
      const i = S.corpses.findIndex(c => c.x === x && c.y === y);
      const c = S.corpses.splice(i, 1)[0];
      addUnit(c.t, S.cur, x, y, { ud: 1 });
      say('THE DEAD RISE!');
      break;
    }
    case 'decree':
      fx('cast', x, y);
      if (u.t === 'wizard') {
        if (rnd(10) >= st(u, 'res')) {
          for (const v of units()) if (v.o === u.o && v.t !== 'wizard') { fx('die', v.x, v.y); delete S.units[v.id]; }
          say(pname(u.o) + "'S CREATURES ARE DESTROYED");
        } else say(pname(u.o) + ' RESISTS');
      } else if (rnd(10) >= st(u, 'res')) { say(uname(u) + ' IS DESTROYED'); kill(u, false); }
      else say(uname(u) + ' RESISTS');
      break;
    case 'self': {
      fx('cast', w.x, w.y);
      const b = w.b = w.b || {};
      for (const k in sp.eff) b[k] = (k === 'com' || k === 'def') ? (b[k] || 0) + sp.eff[k] : 1;
      if (sp.eff.wings) w.mv = 6;
      say('SPELL SUCCEEDS');
      break;
    }
    case 'world':
      fx('cast', w.x, w.y);
      say(S.law > 0 ? 'THE WORLD TIPS TO LAW' : S.law < 0 ? 'THE WORLD TIPS TO CHAOS' : 'THE WORLD IS BALANCED');
      break;
  }
}

function adjEnemy(u, x = u.x, y = u.y) { return units().some(v => v.o !== u.o && Math.max(Math.abs(v.x - x), Math.abs(v.y - y)) === 1); }

// one roll per turn: a creature next to an enemy may be stuck fighting it
function checkEngaged(u) {
  if (u.chk) return false;
  u.chk = 1;
  if (u.mv > 0 && adjEnemy(u) && rnd(10) >= st(u, 'man')) { u.mv = 0; say(uname(u) + ' IS ENGAGED'); }
  return true;
}

function reach(u) {
  const out = new Map();
  if (!u.mv || u.at) return out;
  if (flies(u)) {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++)
      if (!at(x, y) && dist(u, { x, y }) <= u.mv) out.set(x + ',' + y, 1);
    return out;
  }
  const q = [[u.x, u.y, 0]], seen = new Set([u.x + ',' + u.y]);
  while (q.length) {
    const [x, y, d] = q.shift();
    if (d >= u.mv || (d > 0 && adjEnemy(u, x, y))) continue;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
      if (!inB(nx, ny) || seen.has(k) || at(nx, ny)) continue;
      seen.add(k); out.set(k, d + 1); q.push([nx, ny, d + 1]);
    }
  }
  return out;
}

function landNear(u, v) {
  let best = null, bd = 99;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const x = v.x + dx, y = v.y + dy;
    if (!inB(x, y) || (dx === 0 && dy === 0)) continue;
    if (x === u.x && y === u.y) return [x, y];
    if (at(x, y)) continue;
    const d = dist(u, { x, y });
    if (d <= u.mv && d < bd) { bd = d; best = [x, y]; }
  }
  return best;
}

function meleeTargets(u) {
  if (u.at) return [];
  return units().filter(v => v.o !== u.o && canHurt(u, v) &&
    (dist(u, v) === 1 || (flies(u) && u.mv > 0 && dist(u, v) <= u.mv + 1 && landNear(u, v))));
}
function rangedTargets(u) {
  if (u.sh || !st(u, 'rcom')) return [];
  return units().filter(v => v.o !== u.o && canHurt(u, v) && dist(u, v) <= st(u, 'rng') && dist(u, v) > 0);
}

function doMove(u, x, y) {
  const r = reach(u), k = x + ',' + y;
  if (!r.has(k)) return;
  if (flies(u)) u.mv = 0; else u.mv -= r.get(k);
  fx('move', u.x, u.y, x, y);
  u.x = x; u.y = y;
  if (adjEnemy(u)) u.mv = 0;
}

function doAttack(u, v) {
  if (dist(u, v) > 1) { const l = landNear(u, v); if (!l) return; fx('move', u.x, u.y, l[0], l[1]); u.x = l[0]; u.y = l[1]; }
  u.at = 1; u.sh = 1; u.mv = 0;
  if (st(u, 'com') + rnd(10) > st(v, 'def') + rnd(10)) {
    fx('hit', v.x, v.y);
    say(uname(u) + ' KILLS ' + uname(v));
    const vx = v.x, vy = v.y;
    kill(v, true);
    if (S.units[u.id] && !at(vx, vy)) { u.x = vx; u.y = vy; }
  } else { fx('miss', v.x, v.y); say(uname(v) + ' FIGHTS OFF ' + uname(u)); }
}

function doShoot(u, v) {
  u.sh = 1; u.at = 1; u.mv = 0;
  fx('shoot', u.x, u.y, v.x, v.y);
  if (st(u, 'rcom') + rnd(10) > st(v, 'def') + rnd(10)) { say(uname(u) + ' SHOOTS ' + uname(v) + ' DEAD'); kill(v, true); }
  else say(uname(u) + ' MISSES');
}

// ---------------------------------------------------------------- computer wizards
let cpuBusy = false, cpuKey = '', cpuDone = new Set();
const runsCpu = () => app.hotseat || app.room.host === cid;

function maybeCpu() {
  if (!S || S.winner >= 0 || cpuBusy || !P().cpu || !runsCpu() || app.screen !== 'game') return;
  cpuBusy = true;
  setTimeout(cpuStep, 700);
}

function cpuStep() {
  cpuBusy = false;
  if (!S || S.winner >= 0 || !P().cpu || app.screen !== 'game') return;
  const key = S.gid + ':' + S.round + ':' + S.cur;
  if (key !== cpuKey) { cpuKey = key; cpuDone = new Set(); }
  if (S.phase === 'cast') { cpuCast(); return commit(); }
  const left = units().filter(u => u.o === S.cur && !cpuDone.has(u.id)).sort((a, b) => (a.t === 'wizard') - (b.t === 'wizard'));
  if (!left.length) { endTurn(); return commit(); }
  cpuDone.add(left[0].id);
  cpuUnit(left[0]);
  commit();
}

function cpuCast() {
  const p = P(), w = wizOf(S.cur);
  const foeW = units().filter(v => v.t === 'wizard' && v.o !== S.cur).sort((a, b) => dist(a, w) - dist(b, w));
  const near = foeW[0] || w;
  const pickT = (sp, filter) => spellTargets(sp).map(([x, y]) => at(x, y) || { x, y }).filter(filter);
  for (const id of p.spells) {
    const sp = SP[id];
    if (sp.kind === 'bolt' || sp.kind === 'decree') {
      const t = pickT(sp, v => v.o !== undefined && v.o !== S.cur).sort((a, b) => (b.t === 'wizard') - (a.t === 'wizard'))[0];
      if (t && (t.t === 'wizard' || rnd(2))) return cast(id, false, t.x, t.y);
    }
  }
  const crs = p.spells.filter(id => SP[id].kind === 'creature');
  if (crs.length) {
    const pow = id => { const c = CR[id]; return c.com + c.def + c.rcom + c.mov; };
    const id = crs.sort((a, b) => pow(b) - pow(a))[0], sp = SP[id];
    const cells = spellTargets(sp).sort((a, b) => dist({ x: a[0], y: a[1] }, near) - dist({ x: b[0], y: b[1] }, near));
    if (cells.length) return cast(id, chance(sp) < 50 && rnd(3) > 0, cells[0][0], cells[0][1]);
  }
  for (const id of p.spells) {
    const sp = SP[id];
    if (sp.kind === 'self' || sp.kind === 'world') return cast(id, false);
    if (sp.kind === 'subvert' || sp.kind === 'raise') {
      const t = spellTargets(sp);
      if (t.length) { const c = t[rnd(t.length)]; return cast(id, false, c[0], c[1]); }
    }
  }
  const t = pickT(SP.disbelieve, v => v.o !== S.cur);
  if (t.length && rnd(2)) { const v = t[rnd(t.length)]; return cast('disbelieve', false, v.x, v.y); }
  S.phase = 'move';
}

function cpuUnit(u) {
  checkEngaged(u);
  const pick = l => l.sort((a, b) => (b.t === 'wizard') - (a.t === 'wizard'))[0];
  let t = pick(meleeTargets(u));
  if (t && (u.t !== 'wizard' || t.t === 'wizard' || st(u, 'com') >= st(t, 'def'))) return doAttack(u, t);
  t = pick(rangedTargets(u));
  if (t) return doShoot(u, t);
  if (u.t === 'wizard' && !(u.b && u.b.mw)) return;
  const foes = units().filter(v => v.o !== u.o && canHurt(u, v));
  if (!foes.length) return;
  const goal = foes.filter(v => v.t === 'wizard').sort((a, b) => dist(a, u) - dist(b, u))[0] || foes.sort((a, b) => dist(a, u) - dist(b, u))[0];
  t = meleeTargets(u).find(v => v === goal);
  if (t) return doAttack(u, t);
  let best = null, bd = dist(u, goal);
  for (const k of reach(u).keys()) {
    const [x, y] = k.split(',').map(Number), d = Math.max(Math.abs(x - goal.x), Math.abs(y - goal.y));
    if (d < bd) { bd = d; best = [x, y]; }
  }
  if (!best) return;
  doMove(u, best[0], best[1]);
  t = pick(meleeTargets(u));
  if (t) return doAttack(u, t);
  t = pick(rangedTargets(u));
  if (t) doShoot(u, t);
}

// ---------------------------------------------------------------- sync
function commit() {
  S.v++;
  if (app.hotseat) { onState(S); return; }
  Net.set('state', S).catch(() => {});
}

function onState(s) {
  if (!s) return;
  if (S && s !== S && s.gid === S.gid && s.v <= S.v) return; // our own echo, or older
  const fresh = !S || s.gid !== S.gid;
  S = norm(s);
  if (fresh) { ui.spell = ui.pick = ui.sel = ui.examine = null; lastFx = S.v <= 2 ? 0 : S.fxn; }
  for (const f of S.fx) if (f.n > lastFx) playFx(f);
  lastFx = S.fxn;
  if (ui.sel && (!S.units[ui.sel] || S.units[ui.sel].o !== S.cur || S.phase !== 'move')) ui.sel = null;
  if (ui.examine && !S.units[ui.examine]) ui.examine = null;
  if (!myTurn()) { ui.spell = ui.pick = ui.sel = null; }
  if (app.screen !== 'game') show('game');
  renderPanel();
  maybeCpu();
}

function playFx(f) {
  const now = performance.now();
  const dur = { cast: 800, fail: 600, die: 600, hit: 350, miss: 300, bolt: 450, shoot: 350, move: 150 }[f.k];
  if (dur) anims.push({ ...f, t0: now, d: dur });
  if (f.k === 'turn') { if (myTurn()) { SFX.play('turn'); navigator.vibrate && navigator.vibrate(60); } return; }
  SFX.play({ cast: 'cast', fail: 'fail', die: 'die', hit: 'hit', miss: 'miss', bolt: 'bolt', shoot: 'shoot', move: 'move', win: 'win' }[f.k]);
  if (f.k === 'cast') setTimeout(() => SFX.play('success'), 600);
}

// ---------------------------------------------------------------- drawing
const cv = $('board'), ctx = cv.getContext('2d');
cv.width = W * C; cv.height = H * C;
ctx.imageSmoothingEnabled = false;
const sprCache = {}, pngs = {};

for (const k in SPRITES) {
  const im = new Image();
  im.onload = () => { pngs[k] = im; for (const key in sprCache) if (key.startsWith(k + '|')) delete sprCache[key]; };
  im.onerror = () => {};
  im.src = 'sprites/' + k + '.png';
}
const twoFrame = t => pngs[t] && pngs[t].width >= pngs[t].height * 2;

function spr(t, ink, frame = 0) {
  const key = t + '|' + ink + '|' + frame;
  if (sprCache[key]) return sprCache[key];
  const c = document.createElement('canvas'); c.width = c.height = C;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  const im = pngs[t];
  if (im) {
    const two = twoFrame(t), sw = two ? im.width / 2 : im.width;
    g.drawImage(im, two && frame ? sw : 0, 0, sw, im.height, 0, 0, C, C);
    if (t === 'wizard') { g.globalCompositeOperation = 'source-in'; g.fillStyle = ink; g.fillRect(0, 0, C, C); }
  } else {
    const rows = (SPRITES[t] || '').trim().split('\n');
    g.fillStyle = ink;
    rows.forEach((r, y) => { for (let x = 0; x < C; x++) if (r[x] === '#') g.fillRect(x, y, 1, 1); });
  }
  return (sprCache[key] = c);
}

function frameRect(x, y, col, inset = 0) {
  ctx.strokeStyle = col; ctx.lineWidth = 1;
  ctx.strokeRect(x * C + 0.5 + inset, y * C + 0.5 + inset, C - 1 - inset * 2, C - 1 - inset * 2);
}
const ZX = ['#0000ff', '#ff0000', '#ff00ff', '#00ff00', '#00ffff', '#ffff00', '#ffffff'];

function draw(now) {
  requestAnimationFrame(draw);
  if (app.screen !== 'game' || !S) return;
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cv.width, cv.height);
  const blink = Math.floor(now / 260) % 2;

  for (const c of S.corpses) ctx.drawImage(spr(c.t, '#6a6a6a'), 0, 0, C, C, c.x * C, c.y * C + 8, C, 8);

  // what can be tapped right now
  const marks = [];
  if (myTurn()) {
    if (S.phase === 'cast' && ui.spell) for (const [x, y] of spellTargets(SP[ui.spell])) marks.push([x, y, '#fff']);
    if (S.phase === 'move' && ui.sel && S.units[ui.sel]) {
      const u = S.units[ui.sel];
      for (const k of reach(u).keys()) { const [x, y] = k.split(',').map(Number); ctx.fillStyle = '#0aa'; ctx.fillRect(x * C + 7, y * C + 7, 2, 2); }
      for (const v of meleeTargets(u)) marks.push([v.x, v.y, '#f22']);
      for (const v of rangedTargets(u)) marks.push([v.x, v.y, '#f0f']);
    }
  }

  const hidden = new Set(anims.filter(a => a.k === 'cast' && now - a.t0 < a.d * 0.7).map(a => a.x + ',' + a.y));
  for (const u of units()) {
    if (hidden.has(u.x + ',' + u.y)) continue;
    const ink = u.t === 'wizard' ? pcol(u.o) : (u.ud && !CR[u.t].undead ? '#d7d7d7' : CR[u.t].ink);
    const f = (Math.floor(now / 420) + u.x + u.y) % 2;
    const two = twoFrame(u.t);
    ctx.drawImage(spr(u.t, ink, two ? f : 0), u.x * C, u.y * C - (!two && f ? 1 : 0));
    if (u.t !== 'wizard') { ctx.fillStyle = pcol(u.o); ctx.fillRect(u.x * C, u.y * C + 13, 3, 3); }
  }

  if (blink) for (const [x, y, col] of marks) frameRect(x, y, col);
  if (myTurn() && ui.sel && S.units[ui.sel]) { const u = S.units[ui.sel]; frameRect(u.x, u.y, blink ? '#ff0' : '#fff'); }
  if (ui.examine && S.units[ui.examine]) { const u = S.units[ui.examine]; if (blink) frameRect(u.x, u.y, '#0f0', 1); }

  for (let i = anims.length - 1; i >= 0; i--) {
    const a = anims[i], p = (now - a.t0) / a.d;
    if (p >= 1) { anims.splice(i, 1); continue; }
    const X = a.x * C, Y = a.y * C, col = ZX[Math.floor(now / 50) % ZX.length];
    switch (a.k) {
      case 'cast': {
        ctx.fillStyle = col;
        const r = Math.floor((1 - p) * 8);
        for (let k = 0; k < 14; k++) ctx.fillRect(X + 8 + rnd(r * 2 + 1) - r, Y + 8 + rnd(r * 2 + 1) - r, 1, 1);
        ctx.strokeStyle = col; ctx.strokeRect(X + 8 - r + 0.5, Y + 8 - r + 0.5, r * 2, r * 2);
        break;
      }
      case 'fail': ctx.fillStyle = blink ? '#f00' : '#000'; ctx.fillRect(X + 2, Y + 2, 12, 12); break;
      case 'die': ctx.fillStyle = col; for (let k = 0; k < 30; k++) ctx.fillRect(X + rnd(16), Y + rnd(16), 1, 1); break;
      case 'hit': ctx.strokeStyle = '#fff'; ctx.strokeRect(X + 0.5, Y + 0.5, 15, 15); ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(X, Y, 16, 16); break;
      case 'miss': ctx.strokeStyle = '#888'; ctx.strokeRect(X + 2.5, Y + 2.5, 11, 11); break;
      case 'bolt': case 'shoot': {
        const x1 = a.x * C + 8, y1 = a.y * C + 8, x2 = a.x2 * C + 8, y2 = a.y2 * C + 8;
        ctx.fillStyle = a.k === 'bolt' ? col : '#fff';
        if (a.k === 'bolt') { for (let k = 0; k <= 30; k++) { const t = k / 30; ctx.fillRect(Math.round(x1 + (x2 - x1) * t + rnd(3) - 1), Math.round(y1 + (y2 - y1) * t + rnd(3) - 1), 1, 1); } }
        else ctx.fillRect(Math.round(x1 + (x2 - x1) * p) - 1, Math.round(y1 + (y2 - y1) * p) - 1, 2, 2);
        break;
      }
    }
  }
}
requestAnimationFrame(draw);

function fit() {
  const wrap = $('boardWrap'), land = innerWidth >= innerHeight;
  const b = 16;
  let w = land ? Math.min(innerWidth * 0.63, (innerHeight - b) * 1.5) : Math.min(innerWidth - b, (innerHeight * 0.55) * 1.5);
  w = Math.floor(w - (land ? 0 : 0));
  cv.style.width = w + 'px'; cv.style.height = Math.floor(w / 1.5) + 'px';
  wrap.style.borderColor = S && S.winner < 0 ? pcol(S.cur) : '#00d';
}
addEventListener('resize', fit);

// ---------------------------------------------------------------- panel
function unitInfo(u) {
  const own = u.t === 'wizard' ? '' : `<div style="color:${pcol(u.o)}">${esc(pname(u.o))}'S</div>`;
  const ink = u.t === 'wizard' ? pcol(u.o) : CR[u.t].ink;
  const flags = [];
  if (flies(u)) flags.push('FLYING');
  if (undead(u)) flags.push('UNDEAD');
  if (u.ill && mine(u.o)) flags.push('ILLUSION');
  if (u.t === 'wizard' && u.b) { if (u.b.mw) flags.push('MAGIC WEAPON'); if (u.b.def) flags.push('MAGIC DEFENCE'); }
  const rows = [['COMBAT', st(u, 'com')], ['RANGED', st(u, 'rcom') ? st(u, 'rcom') + ' (RANGE ' + st(u, 'rng') + ')' : '-'], ['DEFENCE', st(u, 'def')], ['MOVE', st(u, 'mov')], ['MANOEUVRE', st(u, 'man')], ['RESIST', st(u, 'res')]];
  return `${own}<div style="color:${ink}">${esc(uname(u))}</div>` +
    (flags.length ? `<div style="color:#f0f;font-size:8px">${flags.join(' ')}</div>` : '') +
    `<div class="stats">${rows.map(r => `<span>${r[0]}</span><span>${r[1]}</span>`).join('')}</div>`;
}

function crInfo(id) {
  const c = CR[id];
  const rows = [['COMBAT', c.com], ['RANGED', c.rcom ? c.rcom + ' (RANGE ' + c.rng + ')' : '-'], ['DEFENCE', c.def], ['MOVE', c.mov + (c.fly ? ' FLYING' : '')], ['MANOEUVRE', c.man], ['RESIST', c.res]];
  return `<div class="stats">${rows.map(r => `<span>${r[0]}</span><span>${r[1]}</span>`).join('')}</div>` + (c.undead ? '<div style="color:#f0f;font-size:8px">UNDEAD: ONLY UNDEAD OR MAGIC WEAPONS HURT IT</div>' : '');
}

function worldTxt() {
  if (!S.law) return '<span class="neut">NEUTRAL</span>';
  return S.law > 0 ? `<span class="law">LAW ${'^'.repeat(Math.min(6, Math.ceil(S.law / 2)))}</span>` : `<span class="chaos">CHAOS ${'*'.repeat(Math.min(6, Math.ceil(-S.law / 2)))}</span>`;
}

function renderPanel() {
  if (!S) return;
  fit();
  const chatBtn = app.hotseat ? '' : `<button data-act="chat">CHAT${ui.unread ? ` <span class="badge">${ui.unread}</span>` : ''}</button>`;
  $('top').innerHTML = `<span class="sw" style="background:${S.winner >= 0 ? pcol(S.winner) : pcol(S.cur)}"></span>
    <span class="who">${S.winner >= 0 ? 'GAME OVER' : esc(pname(S.cur)) + (S.phase === 'cast' ? ' · CAST' : ' · MOVE')}</span>
    <span>R${S.round} ${worldTxt()}</span>${chatBtn}<button data-act="mute">${SFX.muted ? 'SND OFF' : 'SND'}</button><button data-act="menu">≡</button>`;

  let h = '';
  if (S.winner >= 0) {
    h = `<div class="h" style="color:${pcol(S.winner)};font-size:14px;margin:10px 0">${esc(pname(S.winner))} WINS!</div>`;
    if (app.hotseat || app.room.host === cid) h += `<div class="acts"><button class="big y" data-act="again">PLAY AGAIN</button></div>`;
    else h += `<div class="hint">WAITING FOR THE HOST TO START AGAIN</div>`;
  } else if (myTurn()) {
    const p = P();
    if (S.phase === 'cast') {
      if (ui.spell) {
        const sp = SP[ui.spell];
        h = `<div class="h">${sp.name}</div><div class="hint">TAP A FLASHING SQUARE ON THE BOARD</div>` +
          (spellTargets(sp).length ? '' : '<div style="color:#f22">NOTHING TO TARGET</div>') +
          `<div class="acts"><button data-act="unspell">BACK</button></div>`;
      } else if (ui.pick) {
        const sp = SP[ui.pick];
        h = `<div class="h ${alClass(sp.al)}">${alMark(sp.al)} ${sp.name}</div>` +
          `<div>CHANCE <span style="color:#ff0">${chance(sp)}%</span></div>` +
          (sp.kind === 'creature' ? crInfo(ui.pick) : `<div style="color:#ccc;font-size:9px;margin-top:4px;line-height:1.7">${esc(sp.txt || '')}</div>`) +
          `<div class="acts"><button class="y" data-act="castgo">CAST</button>` +
          (sp.kind === 'creature' ? `<button class="m" data-act="castill">ILLUSION (100%)</button>` : '') +
          `<button data-act="unpick">BACK</button></div>` +
          (sp.kind === 'creature' ? `<div style="color:#888;font-size:8px;margin-top:6px;line-height:1.7">AN ILLUSION ALWAYS WORKS, BUT DISBELIEVE MAKES IT VANISH.</div>` : '');
      } else {
        h = `<div class="h">${esc(pname(S.cur))}, CHOOSE A SPELL</div><div class="spells">` +
          p.spells.map(id => { const sp = SP[id]; return `<button class="${alClass(sp.al)}" data-act="pick" data-id="${id}"><span>${alMark(sp.al)}${sp.name}</span><b>${chance(sp)}</b></button>`; }).join('') +
          `</div><div class="acts"><button data-act="skipcast">DON'T CAST</button></div>`;
      }
    } else {
      const u = ui.sel && S.units[ui.sel];
      h = `<div class="h">MOVE YOUR WIZARD AND CREATURES</div>` +
        (u ? unitInfo(u) + `<div class="hint" style="margin-top:4px;font-size:8px">${hintFor(u)}</div>` : `<div class="hint">TAP ONE OF YOURS ON THE BOARD</div>`) +
        `<div class="acts"><button class="y" data-act="endturn">END TURN</button></div>`;
    }
  } else {
    h = `<div class="hint">${P().cpu ? 'THE COMPUTER IS THINKING' : 'WAITING FOR ' + esc(pname(S.cur))}…</div>`;
  }
  if (ui.examine && S.units[ui.examine] && !(myTurn() && S.phase === 'move' && ui.sel === ui.examine)) h += `<div style="margin-top:10px;border-top:1px solid #333;padding-top:6px">${unitInfo(S.units[ui.examine])}</div>`;
  $('main').innerHTML = h;
  $('log').innerHTML = S.log.slice(-4).map(l => `<div>${esc(l)}</div>`).join('');
}

function hintFor(u) {
  const bits = [];
  if (reach(u).size) bits.push(`<span style="color:#0aa">DOTS</span> = MOVE (${u.mv} LEFT)`);
  if (meleeTargets(u).length) bits.push('<span style="color:#f22">RED</span> = ATTACK');
  if (rangedTargets(u).length) bits.push('<span style="color:#f0f">PINK</span> = SHOOT');
  return bits.length ? bits.join(' · ') : 'DONE FOR THIS TURN';
}

// ---------------------------------------------------------------- input
cv.addEventListener('pointerdown', e => {
  if (!S) return;
  const r = cv.getBoundingClientRect();
  const x = Math.floor((e.clientX - r.left) / r.width * W), y = Math.floor((e.clientY - r.top) / r.height * H);
  if (!inB(x, y)) return;
  tapCell(x, y);
});

function tapCell(x, y) {
  const u = at(x, y);
  if (myTurn()) {
    if (S.phase === 'cast' && ui.spell) {
      if (spellTargets(SP[ui.spell]).some(([a, b]) => a === x && b === y)) {
        const id = ui.spell, ill = ui.ill;
        ui.spell = ui.pick = null;
        cast(id, ill, x, y);
        return commit();
      }
    }
    if (S.phase === 'move') {
      const s = ui.sel && S.units[ui.sel];
      if (s) {
        if (reach(s).has(x + ',' + y)) { doMove(s, x, y); return commit(); }
        if (u && meleeTargets(s).includes(u)) { doAttack(s, u); if (!S.units[s.id]) ui.sel = null; return commit(); }
        if (u && rangedTargets(s).includes(u)) { doShoot(s, u); return commit(); }
      }
      if (u && u.o === S.cur) {
        ui.sel = u.id; ui.examine = null;
        SFX.play('click');
        if (checkEngaged(u)) return commit();
        return renderPanel();
      }
    }
  }
  ui.examine = u ? u.id : null;
  if (u) SFX.play('click');
  renderPanel();
}

document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const act = b.dataset.act;
  SFX.play('click');
  const f = ACTS[act];
  if (f) f(b);
});

const ACTS = {
  create: () => createRoom(),
  join: () => joinRoom($('joincode').value),
  hotseat: () => { goLandscape(); app.hotseat = true; app.hot = [{ id: cid + '#1', name: myName() }]; show('lobby'); renderLobby(); },
  pick: b => { ui.pick = b.dataset.id; renderPanel(); },
  unpick: () => { ui.pick = null; renderPanel(); },
  unspell: () => { ui.spell = null; renderPanel(); },
  castgo: () => startCast(false),
  castill: () => startCast(true),
  skipcast: () => { if (!myTurn()) return; say(pname(S.cur) + ' CASTS NOTHING'); S.phase = 'move'; ui.pick = null; commit(); },
  endturn: () => { if (!myTurn()) return; ui.sel = null; endTurn(); commit(); },
  mute: () => { SFX.toggle(); renderPanel(); },
  menu: () => { if (confirmLeave()) leave(); },
  again: () => {
    if (app.hotseat) { S = null; show('lobby'); renderLobby(); return; }
    Net.del('state');
  },
  chat: () => { ui.chatOpen = true; ui.unread = 0; $('chat').classList.add('on'); renderChat(); renderPanel(); setTimeout(() => $('say').focus(), 50); },
  chatclose: () => { ui.chatOpen = false; $('chat').classList.remove('on'); },
  send: () => sendChat(),
  addcpu: () => addCpu(),
  addhuman: () => { const n = prompt('NAME?'); if (n) { app.hot.push({ id: cid + '#' + (app.hot.length + 1) + Math.random().toString(36).slice(2, 5), name: n.slice(0, 12) }); renderLobby(); } },
  kick: b => {
    if (app.hotseat) { app.hot.splice(+b.dataset.i, 1); renderLobby(); }
    else Net.del('players/' + b.dataset.id);
  },
  start: () => startGame(),
  dice: () => rollName(),
  invite: () => invite(),
  leave: () => leave(),
};

function startCast(ill) {
  if (!myTurn() || !ui.pick) return;
  const sp = SP[ui.pick];
  ui.ill = ill;
  if (needsTarget(sp)) { ui.spell = ui.pick; ui.pick = null; renderPanel(); }
  else { const id = ui.pick; ui.pick = null; cast(id, false); commit(); }
}

$('say').addEventListener('keydown', e => { if (e.key === 'Enter') sendChat(); });
$('joincode').addEventListener('keydown', e => { if (e.key === 'Enter') joinRoom($('joincode').value); });

const confirmLeave = () => confirm('LEAVE THIS GAME?');

// ---------------------------------------------------------------- screens, rooms, lobby
function show(s) {
  app.screen = s;
  for (const id of ['title', 'lobby', 'game']) $(id).classList.toggle('on', id === s);
  const chat = $('chat');
  if (s === 'lobby' && !app.hotseat) { $('chatHome').appendChild(chat); chat.style.display = ''; renderChat(); }
  else if (s === 'game') { $('panel').appendChild(chat); chat.style.display = ''; chat.classList.toggle('on', ui.chatOpen); }
  else chat.style.display = 'none';
  if (s === 'game') fit();
}

const nameKey = 'chaos_name';
try { $('name').value = localStorage.getItem(nameKey) || ''; } catch (e) {}
function myName() {
  const n = ($('name').value || '').trim().toUpperCase().slice(0, 12) || 'WIZARD';
  try { localStorage.setItem(nameKey, n); } catch (e) {}
  return n;
}

function goLandscape() {
  if (!matchMedia('(pointer: coarse)').matches) return;
  const el = document.documentElement;
  const p = el.requestFullscreen ? el.requestFullscreen({ navigationUI: 'hide' }) : null;
  if (p && p.then) p.then(() => screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => {})).catch(() => {});
}

const setupMsg = 'ONLINE ROOMS NEED A ONE-OFF DATABASE RULE (SEE README). "PLAY ON THIS DEVICE" WORKS NOW.';

async function createRoom() {
  goLandscape();
  const name = myName();
  $('terr').textContent = 'MAKING A ROOM…';
  const L = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let tries = 0; tries < 5; tries++) {
    code = Array.from({ length: 5 }, () => L[rnd(L.length)]).join('');
    const ex = await Net.exists(code);
    if (ex === 'setup') { $('terr').textContent = setupMsg; return; }
    if (ex === 'offline') { $('terr').textContent = 'CAN\'T REACH THE ROOM SERVER. CHECK YOUR CONNECTION.'; return; }
    if (ex === 'no') break;
  }
  enterRoom(code);
  try {
    await Net.set('host', cid);
    await Net.set('players/' + cid, { name, t: Date.now() });
    $('terr').textContent = '';
  } catch (e) { $('terr').textContent = setupMsg; show('title'); }
}

async function joinRoom(code) {
  code = (code || '').trim().toUpperCase();
  if (code.length !== 5) { $('terr').textContent = 'TYPE THE 5-LETTER ROOM CODE'; return; }
  goLandscape();
  const name = myName();
  $('terr').textContent = 'LOOKING FOR ' + code + '…';
  const ex = await Net.exists(code);
  if (ex === 'setup') { $('terr').textContent = setupMsg; return; }
  if (ex === 'offline') { $('terr').textContent = 'CAN\'T REACH THE ROOM SERVER. CHECK YOUR CONNECTION.'; return; }
  if (ex === 'no') { $('terr').textContent = 'NO ROOM CALLED ' + code; return; }
  $('terr').textContent = '';
  enterRoom(code);
  const me = (Net.tree.players || {})[cid];
  Net.set('players/' + cid, { name, t: me ? me.t : Date.now() }).catch(() => {});
}

function enterRoom(code) {
  app.hotseat = false; app.code = code; app.room = {}; S = null; myIds = new Set([cid]);
  ui.seenChat = new Set(); ui.unread = 0; ui.chatOpen = false;
  try { history.replaceState(null, '', '?room=' + code + (Net.local ? '&local' : '')); } catch (e) {}
  show('lobby');
  let firstChat = true;
  Net.open(code, tree => {
    app.room = tree || {};
    const chat = app.room.chat || {};
    for (const id in chat) if (!ui.seenChat.has(id)) {
      ui.seenChat.add(id);
      if (!firstChat && chat[id].u !== cid) { SFX.play('chat'); if (!ui.chatOpen && app.screen === 'game') ui.unread++; }
    }
    firstChat = false;
    renderChat();
    if (app.room.state) onState(app.room.state);
    else {
      if (app.screen === 'game') { S = null; show('lobby'); }
      renderLobby();
    }
  }, st => { app.status = st; if (app.screen === 'lobby') renderLobby(); });
}

function lobbyPlayers() {
  if (app.hotseat) return app.hot;
  const ps = app.room.players || {};
  return Object.keys(ps).map(id => ({ id, ...ps[id] })).sort((a, b) => a.t - b.t).slice(0, 8);
}

function renderLobby() {
  if (app.screen !== 'lobby') return;
  const ps = lobbyPlayers(), host = app.hotseat || app.room.host === cid;
  const list = ps.map((p, i) => `<div><span class="sw" style="background:${PCOL[i]}"></span><span style="color:${PCOL[i]}">${esc(String(p.name).toUpperCase())}${p.cpu ? ' (COMPUTER)' : ''}${!app.hotseat && p.id === app.room.host ? ' ★' : ''}</span>` +
    (host && (app.hotseat ? i > 0 : p.id !== cid) ? `<button class="x" data-act="kick" data-id="${esc(p.id)}" data-i="${i}">X</button>` : '') + '</div>').join('');
  const status = app.hotseat ? '' : app.status === 'setup' ? `<div class="err">${setupMsg}</div>` : app.status === 'reconnecting' ? '<div class="err">RECONNECTING…</div>' : '';
  $('lobbyLeft').innerHTML =
    (app.hotseat ? `<div class="h" style="color:#0f0">PLAY ON THIS DEVICE <span class="wip">WIP</span></div><div style="color:#888;font-size:8px">PASS THE DEVICE ROUND. ADD PEOPLE OR COMPUTER WIZARDS.</div>`
      : `<div class="label">ROOM CODE <span class="wip">WIP</span></div><div class="code">${esc(app.code)}</div><div class="row" style="flex:none"><button class="c" data-act="invite">SHARE INVITE LINK</button></div>`) +
    status +
    `<div class="label">WIZARDS (${ps.length}/8)</div><div class="plist">${list}</div>` +
    `<div class="acts">` +
    (host && ps.length < 8 ? (app.hotseat ? `<button class="g" data-act="addhuman">+ PERSON</button>` : '') + `<button class="m" data-act="addcpu">+ COMPUTER</button>` : '') +
    (host ? `<button class="big y" data-act="start" ${ps.length < 2 ? 'disabled' : ''}>START</button>` : `<div class="hint">WAITING FOR THE HOST TO START</div>`) +
    `<button data-act="leave">LEAVE</button></div>`;
}

const CPU_NAMES = ['GANDALFINI', 'MERLOT', 'ZORBO', 'HEXABEL', 'GRIMWALD', 'ASBAAL', 'DYERARTI', 'LO PAN'];
function addCpu() {
  const ps = lobbyPlayers();
  const used = new Set(ps.map(p => String(p.name).toUpperCase()));
  const name = CPU_NAMES.find(n => !used.has(n)) || 'CPU ' + (ps.length + 1);
  if (app.hotseat) { app.hot.push({ id: 'cpu' + Math.random().toString(36).slice(2, 7), name, cpu: true }); renderLobby(); }
  else Net.set('players/cpu' + Math.random().toString(36).slice(2, 7), { name, cpu: true, t: Date.now() });
}

function startGame() {
  const ps = lobbyPlayers();
  if (ps.length < 2) return;
  S = null;
  const s = newGame(ps.map(p => ({ id: p.id, name: String(p.name).toUpperCase(), cpu: !!p.cpu })));
  if (app.hotseat) myIds = new Set(app.hot.filter(p => !p.cpu).map(p => p.id));
  S = s;
  say('ROUND 1');
  startTurn();
  lastFx = 0;
  if (app.hotseat) { show('game'); }
  commit();
}

function invite() {
  const url = location.origin + location.pathname + '?room=' + app.code + (Net.local ? '&local' : '');
  const text = 'Come and play CHAOS with me! Room ' + app.code;
  if (navigator.share) navigator.share({ title: 'CHAOS', text, url }).catch(() => {});
  else navigator.clipboard && navigator.clipboard.writeText(url).then(() => alert('LINK COPIED')).catch(() => prompt('COPY THIS LINK', url));
}

function leave() {
  if (!app.hotseat && app.code) {
    if (!app.room.state) Net.del('players/' + cid).catch(() => {});
    Net.close();
  }
  S = null; app.code = null; app.room = {}; app.hotseat = false; ui.chatOpen = false;
  try { history.replaceState(null, '', location.pathname); } catch (e) {}
  show('title');
}

// ---------------------------------------------------------------- chat
const CHAT_LIFE = 5 * 60 * 1000;
function chatColour(uid) {
  if (S) { const i = S.players.findIndex(p => p.id === uid); if (i >= 0) return pcol(i); }
  const i = lobbyPlayers().findIndex(p => p.id === uid);
  return i >= 0 ? PCOL[i] : '#fff';
}
function renderChat() {
  const chat = app.room.chat || {};
  const now = Date.now();
  const ids = Object.keys(chat).sort();
  const box = $('msgs');
  const atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 30;
  box.innerHTML = ids.filter(id => now - chat[id].t < CHAT_LIFE).slice(-60)
    .map(id => { const m = chat[id]; return `<div><span class="n" style="color:${chatColour(m.u)}">${esc(String(m.n || '').toUpperCase())}</span>${esc(m.m)}</div>`; }).join('') ||
    '<div style="color:#555">NO MESSAGES YET. ONLY PEOPLE IN THIS ROOM SEE THEM.</div>';
  if (atBottom) box.scrollTop = box.scrollHeight;
  // tidy up old messages
  for (const id of ids) if (now - chat[id].t > CHAT_LIFE) Net.del('chat/' + id).catch(() => {});
}
setInterval(() => { if (app.code) renderChat(); }, 30000);

function sendChat() {
  const t = $('say').value.trim();
  if (!t || !app.code) return;
  $('say').value = '';
  Net.push('chat', { u: cid, n: myName(), m: t.slice(0, 140), t: Date.now() }).catch(() => {});
}

const away = () => document.body.classList.toggle('away', document.hidden || !document.hasFocus());
document.addEventListener('visibilitychange', away);
addEventListener('blur', away); addEventListener('focus', away);

// ---------------------------------------------------------------- name dice
const NA = ['ZOR', 'MOR', 'GRIM', 'AL', 'BAL', 'VAX', 'THAL', 'MER', 'RAZ', 'KAL', 'XAN', 'OR', 'SYL', 'DRAK', 'FEN', 'HEX', 'QUIL', 'UR', 'BRAM', 'NYX', 'EL', 'GOR', 'ZAN', 'MAL', 'WOB', 'PIP', 'TOR', 'IG'];
const NB = ['BAX', 'GRIM', 'DOR', 'WYN', 'AZAR', 'THOR', 'LOCK', 'ZAR', 'IX', 'UMBRA', 'ORN', 'ETH', 'IN', 'OTH', 'ARD', 'ISTO', 'EUS', 'OCK', 'ANDO', 'RAX', 'IEL', 'OS', 'WIN', 'BLE', 'MOTH', 'AGON'];
function wizName() {
  for (;;) {
    const a = NA[rnd(NA.length)], b = NB[rnd(NB.length)];
    const n = a + b;
    if (a !== b && n.length >= 4 && n.length <= 10) return n;
  }
}
// pixel die face 1-6 as an 11x11 SVG
const PIPS = { 1: [[5, 5]], 2: [[2, 2], [8, 8]], 3: [[2, 2], [5, 5], [8, 8]], 4: [[2, 2], [8, 2], [2, 8], [8, 8]], 5: [[2, 2], [8, 2], [5, 5], [2, 8], [8, 8]], 6: [[2, 2], [8, 2], [2, 5], [8, 5], [2, 8], [8, 8]] };
function dieSvg(n, col = '#fff') {
  let r = '';
  for (let y = 0; y < 11; y++) for (let x = 0; x < 11; x++) {
    const corner = (x === 0 || x === 10) && (y === 0 || y === 10);
    if (!corner) r += `<rect x="${x}" y="${y}" width="1" height="1" fill="${col}"/>`;
  }
  for (const [x, y] of PIPS[n]) r += `<rect x="${x}" y="${y}" width="1" height="1" fill="#000"/>`;
  return `<svg viewBox="0 0 11 11" xmlns="http://www.w3.org/2000/svg">${r}</svg>`;
}
const DIE_COLS = ['#fff', '#ff0', '#0ff', '#f0f', '#0f0', '#f22'];
$('dice').innerHTML = dieSvg(5);
let rolling = false;
function rollName() {
  if (rolling) return;
  rolling = true;
  const d = $('dice'), inp = $('name');
  d.classList.add('roll');
  let i = 0;
  const tick = () => {
    const face = 1 + rnd(6);
    d.innerHTML = dieSvg(face, DIE_COLS[rnd(DIE_COLS.length)]);
    inp.value = wizName();
    SFX.play('click');
    if (++i < 9) setTimeout(tick, 45 + i * 12);
    else {
      d.classList.remove('roll');
      d.innerHTML = dieSvg(face);
      SFX.play('success');
      myName();
      rolling = false;
    }
  };
  tick();
}

// ---------------------------------------------------------------- boot
$('logo').innerHTML = 'CHAOS'.split('').map((c, i) => `<span style="animation-delay:${-i * 0.27}s">${c}</span>`).join('');
{
  const q = new URLSearchParams(location.search);
  const room = (q.get('room') || '').toUpperCase();
  if (room) { $('joincode').value = room; if ($('name').value) joinRoom(room); }
}
