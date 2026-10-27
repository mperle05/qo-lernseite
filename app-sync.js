/* QO-Lernseite · Sync Laptop ↔ Handy über einen privaten GitHub-Gist
 *
 * - Token und Gist-ID bleiben nur auf dem jeweiligen Gerät (Local), gesynct wird nur DB.data.
 * - Ablauf: Gist holen → mit lokalem Stand zusammenführen (neuere Änderung gewinnt pro Eintrag)
 *   → lokal übernehmen, falls dort etwas fehlt → hochladen, falls im Gist etwas fehlt.
 * - Ausgelöst nach jeder Änderung (kurz verzögert), beim Zurückkehren in den Tab und jede Minute.
 */
'use strict';

const Sync = {
  FILE: 'qo-lernseite-sync.json',
  busy: false, again: false, timer: null, state: 'off', msg: '',

  get token() { return Local.get('ghToken', ''); },
  get gistId() { return Local.get('gistId', ''); },

  async api(path, opts = {}) {
    const res = await fetch('https://api.github.com' + path, {
      ...opts,
      cache: 'no-store',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: 'Bearer ' + this.token,
        ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
      },
    });
    if (!res.ok) {
      const text = { 401: 'Token ungültig oder abgelaufen', 403: 'Kein Zugriff – der Token braucht den Haken „gist“', 404: 'Gist nicht gefunden' };
      const err = new Error(text[res.status] || 'GitHub-Fehler ' + res.status);
      err.status = res.status;
      throw err;
    }
    return res.json();
  },

  // Vorhandenen Sync-Gist finden (zweites Gerät) oder neu anlegen (erstes Gerät)
  async findOrCreate() {
    for (let page = 1; page <= 10; page++) {
      const list = await this.api(`/gists?per_page=100&page=${page}`);
      const hit = list.find(g => g.files && g.files[this.FILE]);
      if (hit) return hit.id;
      if (list.length < 100) break;
    }
    const g = await this.api('/gists', {
      method: 'POST',
      body: JSON.stringify({
        description: 'QO-Lernseite Sync (bitte nicht löschen)',
        public: false,
        files: { [this.FILE]: { content: JSON.stringify(DB.data) } },
      }),
    });
    return g.id;
  },

  async pull() {
    const g = await this.api('/gists/' + this.gistId);
    const f = g.files?.[this.FILE];
    if (!f) return { v: 1, c: {} };
    const text = f.truncated ? await (await fetch(f.raw_url, { cache: 'no-store' })).text() : f.content;
    return JSON.parse(text || '{}');
  },

  push(data) {
    return this.api('/gists/' + this.gistId, {
      method: 'PATCH',
      body: JSON.stringify({ files: { [this.FILE]: { content: JSON.stringify(data) } } }),
    });
  },

  async now() {
    if (!this.token) return this.set('off');
    if (this.busy) { this.again = true; return; }
    this.busy = true;
    this.set('busy');
    try {
      if (!this.gistId) Local.set('gistId', await this.findOrCreate());
      const m = mergeDB(DB.data, await this.pull());
      if (m.aOld) DB.replace(m.data);
      if (m.bOld) await this.push(m.data);
      Local.set('lastSync', Date.now());
      this.set('ok');
    } catch (e) {
      if (e.status === 404) Local.set('gistId', undefined);  // Gist weg → beim nächsten Mal neu suchen/anlegen
      this.set('err', e.status ? e.message : 'Keine Verbindung');
    } finally {
      this.busy = false;
      if (this.again) { this.again = false; this.schedule(300); }
    }
  },

  schedule(ms = 1500) { clearTimeout(this.timer); this.timer = setTimeout(() => this.now(), ms); },

  init() {
    DB.onChange((name, source) => { if (source === 'local' && this.token) this.schedule(); });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) this.now(); });
    setInterval(() => { if (!document.hidden && !this.busy) this.now(); }, 60000);

    $('#syncConnect').onclick = () => {
      const t = $('#ghToken').value.trim();
      if (!t) return toast('Erst den Token einfügen');
      Local.set('ghToken', t);
      Local.set('gistId', undefined);
      $('#ghToken').value = '';
      this.now();
    };
    $('#syncNow').onclick = () => this.now();
    $('#syncOff').onclick = () => {
      Local.set('ghToken', undefined);
      Local.set('gistId', undefined);
      this.set('off');
      toast('Sync auf diesem Gerät getrennt – deine Daten bleiben hier gespeichert');
    };

    this.now();
  },

  set(state, msg = '') { this.state = state; this.msg = msg; this.paint(); },

  paint() {
    const labels = { off: 'Sync aus', busy: 'Synct …', ok: 'Gesynct', err: 'Sync-Fehler' };
    const pill = $('#syncPill');
    const last = Local.get('lastSync');
    const when = last ? new Date(last).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' }) : '';
    pill.dataset.state = this.state;
    pill.querySelector('.label').textContent = labels[this.state];
    pill.title = this.state === 'err' ? this.msg : when ? 'Zuletzt gesynct: ' + when : 'Sync';

    const info = $('#syncInfo');
    if (!this.token) {
      info.textContent = 'Auf diesem Gerät nicht verbunden.';
      $('#ghToken').placeholder = 'ghp_…';
    } else {
      $('#ghToken').placeholder = 'Token gespeichert – zum Ändern neuen einfügen';
      const gist = this.gistId ? ` · <a href="https://gist.github.com/${esc(this.gistId)}" target="_blank" rel="noopener">Gist ansehen</a>` : '';
      info.innerHTML = this.state === 'err'
        ? `<span class="bad">${esc(this.msg)}</span>${gist}`
        : `Verbunden${when ? ' · zuletzt ' + when : ''}${gist}`;
    }
  },
};
