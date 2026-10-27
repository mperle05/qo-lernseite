/* QO-Lernseite · Gerüst
 *
 * Neuer Reiter: Datei tab-xyz.js anlegen mit
 *     App.registerTab({ id: 'xyz', title: 'Xyz', render(el) { el.innerHTML = '…'; } });
 * und in index.html eine <script>-Zeile ergänzen. Mehr braucht es nicht.
 *
 * Daten, die zwischen Geräten gesynct werden:   DB.list / DB.get / DB.put / DB.del ('sammlung', …)
 * Einstellungen nur für dieses Gerät:           Local.get / Local.set
 */
'use strict';

const NS = 'qo-lernseite';

// ---------- kleine Helfer ----------
const $ = (sel, root = document) => root.querySelector(sel);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// Text sicher anzeigen: Zeilenumbrüche + einfache Tags (b, i, u, sub, sup, Listen, br) bleiben erhalten
const rich = s => esc(s)
  .replace(/&lt;(\/?)(b|i|u|em|strong|sub|sup|ul|ol|li|br|div|p)\s*\/?&gt;/gi, '<$1$2>')
  .replace(/\n/g, '<br>');
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

function readJSON(key, fallback) {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; } catch { return fallback; }
}
function writeJSON(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { toast('Konnte nicht speichern: ' + e.message); }
}
function download(name, text, type = 'text/plain') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: type + ';charset=utf-8' }));
  a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => (t.hidden = true), 4000);
}

// ---------- Einstellungen nur für dieses Gerät ----------
const Local = {
  d: readJSON(NS + ':local', {}),
  get(k, fallback) { return k in this.d ? this.d[k] : fallback; },
  set(k, v) { if (v === undefined) delete this.d[k]; else this.d[k] = v; writeJSON(NS + ':local', this.d); },
};

// ---------- Daten (werden gesynct) ----------
// Aufbau: { v: 1, c: { sammlung: { id: { …felder, _t: Zeitstempel, _del?: 1 } } } }
// Gelöschte Einträge bleiben als „Grabstein“ (_del) stehen, damit der Sync das Löschen mitbekommt.
const DB = {
  data: readJSON(NS + ':db', null) || { v: 1, c: {} },
  listeners: [],
  depth: 0,
  col(name) { return (this.data.c[name] ||= {}); },
  get(name, id) { const r = this.col(name)[id]; return r && !r._del ? r : null; },
  list(name) { return Object.entries(this.col(name)).filter(([, r]) => !r._del).map(([id, r]) => ({ ...r, id })); },
  put(name, id, fields) {
    const rec = { ...(this.get(name, id) || {}), ...fields, _t: Date.now() };
    delete rec.id; delete rec._del;
    this.col(name)[id] = rec;
    this.changed(name);
  },
  del(name, id) {
    if (!this.col(name)[id]) return;
    this.col(name)[id] = { _del: 1, _t: Date.now() };
    this.changed(name);
  },
  // mehrere Änderungen am Stück, nur einmal speichern
  batch(fn) { this.depth++; try { fn(); } finally { if (--this.depth === 0) this.changed('*'); } },
  changed(name, source = 'local') {
    if (this.depth) return;
    writeJSON(NS + ':db', this.data);
    this.listeners.forEach(f => f(name, source));
  },
  replace(data) { this.data = data; this.changed('*', 'remote'); },
  onChange(f) { this.listeners.push(f); },
};

// Zwei Stände zusammenführen: pro Eintrag gewinnt die neuere Änderung.
// aOld = a fehlt etwas (a muss aktualisiert werden), bOld = b fehlt etwas.
function mergeDB(a, b) {
  const out = { v: 1, c: {} };
  let aOld = false, bOld = false;
  const names = new Set([...Object.keys(a?.c || {}), ...Object.keys(b?.c || {})]);
  for (const n of names) {
    const ca = a?.c?.[n] || {}, cb = b?.c?.[n] || {}, co = (out.c[n] = {});
    for (const id of new Set([...Object.keys(ca), ...Object.keys(cb)])) {
      const ra = ca[id], rb = cb[id];
      if (ra && (!rb || ra._t >= rb._t)) {
        co[id] = ra;
        if (!rb || ra._t > rb._t) bOld = true;
      } else {
        co[id] = rb;
        aOld = true;
      }
    }
  }
  return { data: out, aOld, bOld };
}

// ---------- App: Reiter, Navigation, Mathe ----------
const App = {
  tabs: [], current: null, view: null, pending: false, mj: Promise.resolve(),

  registerTab(def) { this.tabs.push(def); },

  start() {
    this.view = $('#view');
    $('#tabs').innerHTML = this.tabs
      .map(t => `<a href="#${t.id}" data-tab="${t.id}" role="tab">${esc(t.title)}</a>`).join('');
    addEventListener('hashchange', () => this.show(location.hash.slice(1)));
    // Änderungen von einem anderen Gerät: neu zeichnen, aber nicht mitten im Tippen
    DB.onChange((name, source) => { if (source === 'remote') this.refresh(); });
    document.addEventListener('focusout', () => setTimeout(() => {
      if (this.pending && !this.editing()) this.render();
    }));
    Settings.init();
    this.show(location.hash.slice(1) || Local.get('tab'));
    if (typeof Sync !== 'undefined') Sync.init();
  },

  show(id) {
    this.current = this.tabs.find(t => t.id === id) || this.tabs[0];
    Local.set('tab', this.current.id);
    document.querySelectorAll('#tabs a').forEach(a =>
      a.setAttribute('aria-selected', String(a.dataset.tab === this.current.id)));
    this.render();
    scrollTo(0, 0);
  },

  render() {
    this.pending = false;
    this.untypeset(this.view);
    const fresh = this.view.cloneNode(false);  // frisches Element: alte Event-Listener der Reiter fallen weg
    this.view.replaceWith(fresh);
    this.view = fresh;
    this.current.render(fresh);
    this.typeset(fresh);
  },

  editing() {
    const a = document.activeElement;
    return !!a && this.view.contains(a) && (a.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName));
  },

  refresh() { if (this.editing()) this.pending = true; else this.render(); },

  // Formeln setzen (MathJax lädt asynchron; vorher passiert einfach nichts)
  typeset(el) {
    if (!el || !window.MathJax?.typesetPromise) return;
    this.mj = this.mj.then(() => MathJax.typesetPromise([el])).catch(() => {});
  },
  untypeset(el) { if (el && window.MathJax?.typesetClear) MathJax.typesetClear([el]); },
};

// ---------- Einstellungen: Backup + Farbschema (Sync-Teil steht in app-sync.js) ----------
const Settings = {
  init() {
    const dlg = $('#settings');
    const open = () => { this.fill(); dlg.showModal(); };
    $('#settingsBtn').onclick = open;
    $('#syncPill').onclick = open;

    this.applyTheme(Local.get('theme', 'auto'));
    dlg.querySelectorAll('input[name=theme]').forEach(r => {
      r.onchange = () => { Local.set('theme', r.value); this.applyTheme(r.value); };
    });

    $('#backupDl').onclick = () => download(
      `qo-lernseite-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(DB.data), 'application/json');

    $('#backupUp').onchange = async e => {
      const file = e.target.files[0];
      e.target.value = '';
      if (!file) return;
      try {
        const m = mergeDB(DB.data, JSON.parse(await file.text()));
        if (m.aOld) { DB.replace(m.data); DB.changed('*'); }  // zweiter Aufruf stößt den Sync an
        toast(m.aOld ? 'Backup eingespielt' : 'Im Backup war nichts Neues');
      } catch {
        toast('Die Datei ist kein gültiges Backup');
      }
    };
  },
  fill() {
    const t = Local.get('theme', 'auto');
    document.querySelectorAll('input[name=theme]').forEach(r => (r.checked = r.value === t));
    if (typeof Sync !== 'undefined') Sync.paint();
  },
  applyTheme(t) {
    if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
    else delete document.documentElement.dataset.theme;
  },
};
