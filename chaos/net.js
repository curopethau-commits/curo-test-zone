// CHAOS: room sync through the Firebase Realtime Database (same database as the
// party apps). Each room lives at chaos_rooms/<CODE>: host, players, state, chat.
// Add ?local to the address to test with tabs in one browser (nothing leaves the device).

const CHAOS_DB = 'https://wills-terranium-default-rtdb.europe-west1.firebasedatabase.app';
const CHAOS_NODE = 'chaos_rooms';

const Net = (() => {
  const db = CHAOS_DB.trim().replace(/\/+$/, '');
  const local = !db || new URLSearchParams(location.search).has('local');
  let code = null, tree = {}, es = null, bc = null, onRoom = null, onStatus = () => {};

  const split = p => String(p).split('/').filter(Boolean);
  const base = c => `${db}/${CHAOS_NODE}/${c || code}`;
  const lsKey = c => 'chaos_room_' + c;
  const lsLoad = c => { try { return JSON.parse(localStorage.getItem(lsKey(c || code))) || {}; } catch (e) { return {}; } };
  const lsSave = t => { try { localStorage.setItem(lsKey(code), JSON.stringify(t)); } catch (e) {} };

  // write val at parts inside obj, Firebase style (null deletes, empty objects vanish)
  function setAt(obj, parts, val) {
    if (!parts.length) return val === undefined ? null : val;
    obj = obj && typeof obj === 'object' && !Array.isArray(obj) ? obj : (Array.isArray(obj) ? Object.assign({}, obj) : {});
    const [k, ...rest] = parts;
    const v = setAt(obj[k], rest, val);
    if (v === null) delete obj[k]; else obj[k] = v;
    return Object.keys(obj).length ? obj : null;
  }
  const emit = () => onRoom && onRoom(tree);

  function open(c, roomCb, statusCb) {
    close();
    code = c; onRoom = roomCb; onStatus = statusCb || (() => {}); tree = {};
    if (local) {
      bc = 'BroadcastChannel' in window ? new BroadcastChannel('chaos_' + c) : null;
      if (bc) bc.onmessage = e => { tree = e.data || lsLoad(); emit(); };
      tree = lsLoad(); onStatus('local'); emit();
      return;
    }
    es = new EventSource(base() + '.json');
    const h = ev => {
      let m; try { m = JSON.parse(ev.data); } catch (e) { return; }
      if (!m) return;
      const parts = split(m.path);
      if (ev.type === 'put') tree = setAt(tree, parts, m.data) || {};
      else for (const k in m.data || {}) tree = setAt(tree, parts.concat(split(k)), m.data[k]) || {};
      emit();
    };
    es.addEventListener('put', h);
    es.addEventListener('patch', h);
    es.addEventListener('cancel', () => onStatus('setup'));
    es.onopen = () => onStatus('live');
    es.onerror = () => {
      fetch(base() + '.json?shallow=true')
        .then(r => onStatus(r.status === 401 ? 'setup' : 'reconnecting'))
        .catch(() => onStatus('reconnecting'));
    };
  }

  function close() {
    if (es) es.close();
    if (bc) bc.close();
    es = bc = null; code = null; tree = {};
  }

  // set a value inside the room; shown here straight away, then sent
  async function set(path, val) {
    const parts = split(path);
    if (local) {
      tree = setAt(lsLoad(), parts, val) || {};
      lsSave(tree); bc && bc.postMessage(JSON.parse(JSON.stringify(tree))); emit();
      return;
    }
    tree = setAt(tree, parts, val) || {}; emit();
    const r = await fetch(`${base()}/${parts.join('/')}.json`, {
      method: val === null ? 'DELETE' : 'PUT',
      body: val === null ? undefined : JSON.stringify(val),
    });
    if (!r.ok) { if (r.status === 401) onStatus('setup'); throw new Error('HTTP ' + r.status); }
  }
  const del = path => set(path, null);
  const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const push = (path, val) => set(path + '/' + newId(), val);

  // 'yes' | 'no' | 'setup' | 'offline'
  async function exists(c) {
    if (local) return lsLoad(c).host ? 'yes' : 'no';
    try {
      const r = await fetch(base(c) + '/host.json');
      if (r.status === 401) return 'setup';
      if (!r.ok) return 'offline';
      return (await r.json()) ? 'yes' : 'no';
    } catch (e) { return 'offline'; }
  }

  return { open, close, set, del, push, exists, local, get tree() { return tree; } };
})();
