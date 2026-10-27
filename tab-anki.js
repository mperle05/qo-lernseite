/* QO-Lernseite · Reiter „Anki“: Karten sammeln, ansehen, als Anki-Datei exportieren
 * oder per AnkiConnect direkt an Anki schicken.
 *
 * Einfügeformate:
 *   Vorderseite <TAB> Rückseite [<TAB> Tags]      (eine Karte pro Zeile, wie Anki-Textexport)
 *   Q: Vorderseite / A: Rückseite                  (Blöcke, Antworten dürfen mehrzeilig sein)
 * Ein [Tag] am Anfang der Vorderseite wird automatisch auch als Tag übernommen.
 */
'use strict';

(() => {
  const DECK = 'Quantum Optics HS26';
  const PAGE = 60;

  // ---------- Einlesen ----------
  const unquote = s => {
    s = s.trim();
    return /^"[\s\S]*"$/.test(s) ? s.slice(1, -1).replace(/""/g, '"') : s;
  };
  const clean = (c, batchTags) => {
    const norm = s => String(s || '').replace(/<br\s*\/?>/gi, '\n').trim();
    const front = norm(c.front), back = norm(c.back);
    const tags = new Set(`${c.tags || ''} ${batchTags || ''}`.split(/[\s,]+/).filter(Boolean));
    const m = front.match(/^\[([^\]]+)\]/);
    if (m) tags.add(m[1].trim().replace(/\s+/g, '_'));
    return { front, back, tags: [...tags] };
  };
  function parse(text, batchTags) {
    text = text.replace(/\r/g, '');
    const cards = [], bad = [];
    if (/^\s*(Q|F|Frage)\s*:/im.test(text) && !text.includes('\t')) {
      let cur = null, field = null;
      for (const line of text.split('\n')) {
        const m = line.match(/^\s*(Q|F|Frage|A|Antwort)\s*:\s?(.*)$/i);
        if (m && /^(q|f|frage)$/i.test(m[1])) { if (cur) cards.push(cur); cur = { front: m[2], back: '' }; field = 'front'; }
        else if (m && cur) { cur.back = m[2]; field = 'back'; }
        else if (cur) cur[field] += '\n' + line;
        else if (line.trim()) bad.push(line);
      }
      if (cur) cards.push(cur);
    } else {
      for (const line of text.split('\n')) {
        if (!line.trim() || line.startsWith('#')) continue;
        const p = line.split('\t').map(unquote);
        if (p.length < 2 || !p[0]) { bad.push(line); continue; }
        cards.push({ front: p[0], back: p[1], tags: p[2] || '' });
      }
    }
    return { cards: cards.map(c => clean(c, batchTags)).filter(c => c.front), bad };
  }
  const key = s => s.replace(/\s+/g, ' ').trim().toLowerCase();

  // ---------- Ausgabe für Anki (gleiche Umwandlung wie auf der Seite: Zeilen → <br>, < > maskiert) ----------
  function ankiTxt(cards) {
    const f = s => rich(s).replace(/\t/g, ' ');
    return ['#separator:tab', '#html:true', '#tags column:3',
      ...cards.map(c => [f(c.front), f(c.back), (c.tags || []).join(' ')].join('\t'))].join('\n') + '\n';
  }

  async function ac(action, params = {}) {
    let r;
    try {
      r = await fetch('http://127.0.0.1:8765', { method: 'POST', body: JSON.stringify({ action, version: 6, params }) });
    } catch {
      throw new Error('Anki nicht erreichbar. Läuft Anki mit AnkiConnect, und steht diese Seite in webCorsOriginList?');
    }
    const j = await r.json();
    if (j.error) throw new Error(j.error);
    return j.result;
  }

  App.registerTab({
    id: 'anki',
    title: 'Anki',
    render(el) {
      const st = { q: '', tag: '', status: 'alle', limit: PAGE };
      const origin = location.origin === 'null' || location.protocol === 'file:' ? 'null' : location.origin;

      el.innerHTML = `
        <section class="card">
          <h2>Karten einfügen</h2>
          <p class="muted small">Eine Karte pro Zeile: <code>Vorderseite ⇥ Rückseite ⇥ Tags</code> (Tab-getrennt, Tags optional) oder Blöcke mit <code>Q:</code> und <code>A:</code>. Mathe wie in Anki mit <code>\\( … \\)</code>. Ein <code>[Tag]</code> am Anfang der Vorderseite wird automatisch zum Tag.</p>
          <textarea id="aPaste" rows="6" spellcheck="false" placeholder="Q: Wie skaliert die Revival-Zeit mit n̄?&#10;A: \\(t_r\\approx 2\\pi\\sqrt{\\bar n}/g\\)"></textarea>
          <div class="row">
            <input id="aTag" placeholder="Tags für diesen Stapel, z. B. LN3" value="${esc(Local.get('ankiBatchTag', ''))}" aria-label="Tags für diesen Stapel">
            <button type="button" class="btn primary" data-act="add">Übernehmen</button>
            <label class="btn ghost">Datei laden<input type="file" id="aFile" accept=".txt,.tsv,.csv,text/plain" hidden></label>
          </div>
        </section>

        <section class="card">
          <div class="row">
            <input type="search" id="aQ" placeholder="Karten durchsuchen …" aria-label="Karten durchsuchen">
            <select id="aTagF" aria-label="Nach Tag filtern"></select>
            <select id="aStat" aria-label="Nach Status filtern">
              <option value="alle">Alle Karten</option><option value="neu">Nur neue</option><option value="anki">Nur in Anki</option>
            </select>
          </div>
          <div class="row">
            <span id="aCount" class="muted small"></span>
            <span class="spacer"></span>
            <button type="button" class="btn" data-act="export-new">Neue als Anki-Datei</button>
            <button type="button" class="btn" data-act="send">Neue an Anki senden</button>
            <button type="button" class="btn ghost" data-act="export-all">Alle exportieren</button>
          </div>
          <ul id="aList" class="flashcards"></ul>
          <button type="button" class="btn ghost more" data-act="more" hidden>Mehr anzeigen</button>
        </section>

        <details class="card" id="aSetup">
          <summary>AnkiConnect einrichten (Karten direkt an Anki senden)</summary>
          <ol class="small steps">
            <li>In Anki: Extras → Erweiterungen → Erweiterungen herunterladen → Code <code>2055492159</code>.</li>
            <li>AnkiConnect → Konfiguration: bei <code>webCorsOriginList</code> diese Adresse ergänzen: <code>${esc(origin)}</code></li>
            <li>Anki offen lassen und hier „Verbinden“. Fragt der Browser nach Zugriff aufs lokale Netzwerk: erlauben.</li>
          </ol>
          <div class="row">
            <input id="aDeck" list="aDecks" value="${esc(Local.get('ankiDeck', DECK))}" aria-label="Deck">
            <datalist id="aDecks"></datalist>
            <select id="aModel" aria-label="Notiztyp"><option>${esc(Local.get('ankiModel', 'Notiztyp'))}</option></select>
            <button type="button" class="btn" data-act="connect">Verbinden</button>
          </div>
          <p id="aConn" class="muted small"></p>
          <p class="muted small">Ohne AnkiConnect geht immer: „Neue als Anki-Datei“ und in Anki über Datei → Importieren einlesen.</p>
          <button type="button" class="btn ghost" data-act="reset-status">Alle Karten wieder als „neu“ markieren</button>
        </details>`;

      const list = el.querySelector('#aList');

      const cardHTML = c => `
        <li class="flash ${c.status === 'anki' ? 'sent' : ''}" data-id="${c.id}">
          <div class="front" data-act="flip">${rich(c.front)}</div>
          <div class="back" hidden>${rich(c.back)}</div>
          <div class="flash-meta">
            ${(c.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('')}
            <span class="badge ${c.status === 'anki' ? 'b-skript' : 'b-neu'}">${c.status === 'anki' ? 'in Anki' : 'neu'}</span>
            <span class="spacer"></span>
            <button type="button" class="link" data-act="flip">Antwort</button>
            <button type="button" class="link" data-act="edit">Bearbeiten</button>
            <button type="button" class="link danger" data-act="del">Löschen</button>
          </div>
        </li>`;

      const editHTML = c => `
        <div class="edit">
          <label class="small muted">Vorderseite<textarea rows="3" data-f="front">${esc(c.front)}</textarea></label>
          <label class="small muted">Rückseite<textarea rows="4" data-f="back">${esc(c.back)}</textarea></label>
          <label class="small muted">Tags (mit Leerzeichen getrennt)<input data-f="tags" value="${esc((c.tags || []).join(' '))}"></label>
          <div class="row"><button type="button" class="btn primary" data-act="save">Speichern</button><button type="button" class="btn ghost" data-act="cancel">Abbrechen</button></div>
        </div>`;

      function draw() {
        const all = DB.list('anki').sort((a, b) => (b.created || 0) - (a.created || 0) || (a.n || 0) - (b.n || 0));
        const tags = [...new Set(all.flatMap(c => c.tags || []))].sort((a, b) => a.localeCompare(b, 'de'));
        if (st.tag && !tags.includes(st.tag)) st.tag = '';
        el.querySelector('#aTagF').innerHTML = `<option value="">Alle Tags</option>` +
          tags.map(t => `<option ${t === st.tag ? 'selected' : ''}>${esc(t)}</option>`).join('');

        const q = st.q.toLowerCase();
        const hits = all.filter(c =>
          (!st.tag || (c.tags || []).includes(st.tag)) &&
          (st.status === 'alle' || (st.status === 'anki') === (c.status === 'anki')) &&
          (!q || `${c.front} ${c.back}`.toLowerCase().includes(q)));
        const fresh = all.filter(c => c.status !== 'anki').length;

        el.querySelector('#aCount').textContent =
          `${all.length} Karten · ${fresh} neu` + (hits.length !== all.length ? ` · ${hits.length} gefiltert` : '');
        App.untypeset(list);
        list.innerHTML = hits.slice(0, st.limit).map(cardHTML).join('') ||
          `<li class="empty muted">${all.length ? 'Keine Karte passt zum Filter.' : 'Noch keine Karten. Oben einfügen und „Übernehmen“.'}</li>`;
        el.querySelector('.more').hidden = hits.length <= st.limit;
        App.typeset(list);
      }

      function add(text) {
        const batch = el.querySelector('#aTag').value.trim();
        Local.set('ankiBatchTag', batch);
        const { cards, bad } = parse(text, batch);
        const seen = new Set(DB.list('anki').map(c => key(c.front)));
        const base = Date.now();
        let added = 0, dup = 0;
        DB.batch(() => cards.forEach(c => {
          if (seen.has(key(c.front))) { dup++; return; }
          seen.add(key(c.front));
          DB.put('anki', uid(), { ...c, status: 'neu', created: base, n: added++ });
        }));
        toast(`${added} Karte${added === 1 ? '' : 'n'} übernommen` +
          (dup ? ` · ${dup} doppelt übersprungen` : '') + (bad.length ? ` · ${bad.length} Zeile(n) nicht erkannt` : ''));
        if (added) el.querySelector('#aPaste').value = '';
        draw();
      }

      const fieldsOK = () => Local.get('ankiModel') && (Local.get('ankiFields') || []).length >= 2;

      async function connect() {
        const out = el.querySelector('#aConn');
        try {
          const v = await ac('version');
          const [decks, models] = await Promise.all([ac('deckNames'), ac('modelNames')]);
          el.querySelector('#aDecks').innerHTML = decks.map(d => `<option value="${esc(d)}">`).join('');
          const pref = [Local.get('ankiModel'), 'Basic', 'Einfach'].find(m => models.includes(m)) || models[0];
          el.querySelector('#aModel').innerHTML = models.map(m => `<option ${m === pref ? 'selected' : ''}>${esc(m)}</option>`).join('');
          await pickModel(pref);
          out.textContent = `Verbunden (AnkiConnect v${v}) · Felder: ${Local.get('ankiFields').slice(0, 2).join(' / ')}`;
        } catch (e) {
          out.textContent = e.message;
        }
      }
      async function pickModel(name) {
        const fields = await ac('modelFieldNames', { modelName: name });
        Local.set('ankiModel', name);
        Local.set('ankiFields', fields);
      }

      async function send() {
        const cards = DB.list('anki').filter(c => c.status !== 'anki');
        if (!cards.length) return toast('Keine neuen Karten');
        if (!fieldsOK()) { el.querySelector('#aSetup').open = true; return toast('Erst unten bei AnkiConnect „Verbinden“'); }
        const deck = el.querySelector('#aDeck').value.trim() || DECK;
        Local.set('ankiDeck', deck);
        const model = Local.get('ankiModel'), [f0, f1] = Local.get('ankiFields');
        try {
          await ac('createDeck', { deck });
          const notes = cards.map(c => ({
            deckName: deck, modelName: model,
            fields: { [f0]: rich(c.front), [f1]: rich(c.back) },
            tags: c.tags || [], options: { allowDuplicate: false },
          }));
          let ids;
          try { ids = await ac('addNotes', { notes }); }
          catch { ids = []; for (const n of notes) ids.push(await ac('addNote', { note: n }).catch(() => null)); }
          DB.batch(() => cards.forEach((c, i) => { if (ids[i]) DB.put('anki', c.id, { status: 'anki', noteId: ids[i] }); }));
          const ok = ids.filter(Boolean).length;
          toast(`${ok} Karte${ok === 1 ? '' : 'n'} an Anki gesendet` + (ok < cards.length ? ` · ${cards.length - ok} übersprungen (z. B. Duplikate)` : ''));
          draw();
        } catch (e) {
          toast(e.message);
        }
      }

      function exportCards(onlyNew) {
        const cards = DB.list('anki').filter(c => !onlyNew || c.status !== 'anki')
          .sort((a, b) => (a.created || 0) - (b.created || 0) || (a.n || 0) - (b.n || 0));
        if (!cards.length) return toast(onlyNew ? 'Keine neuen Karten' : 'Noch keine Karten');
        download(`qo-anki-${onlyNew ? 'neu' : 'alle'}-${cards.length}.txt`, ankiTxt(cards));
        if (onlyNew) {
          DB.batch(() => cards.forEach(c => DB.put('anki', c.id, { status: 'anki' })));
          toast(`${cards.length} Karten exportiert und als „in Anki“ markiert. In Anki: Datei → Importieren.`);
          draw();
        }
      }

      el.addEventListener('click', e => {
        const b = e.target.closest('[data-act]');
        if (!b) return;
        const li = b.closest('li.flash'), id = li?.dataset.id;
        switch (b.dataset.act) {
          case 'add': add(el.querySelector('#aPaste').value); break;
          case 'flip': { const back = li.querySelector('.back'); back.hidden = !back.hidden; break; }
          case 'edit': {
            const c = DB.get('anki', id);
            App.untypeset(li);
            li.innerHTML = editHTML(c);
            li.querySelector('textarea').focus();
            break;
          }
          case 'save': {
            const v = f => li.querySelector(`[data-f="${f}"]`).value;
            if (!v('front').trim()) return toast('Die Vorderseite darf nicht leer sein');
            DB.put('anki', id, { front: v('front').trim(), back: v('back').trim(), tags: v('tags').split(/[\s,]+/).filter(Boolean) });
            draw();
            break;
          }
          case 'cancel': draw(); break;
          case 'del': if (confirm('Karte löschen?')) { DB.del('anki', id); draw(); } break;
          case 'more': st.limit += PAGE; draw(); break;
          case 'export-new': exportCards(true); break;
          case 'export-all': exportCards(false); break;
          case 'send': send(); break;
          case 'connect': connect(); break;
          case 'reset-status':
            if (confirm('Alle Karten wieder als „neu“ markieren?')) {
              DB.batch(() => DB.list('anki').forEach(c => { if (c.status === 'anki') DB.put('anki', c.id, { status: 'neu' }); }));
              draw();
            }
            break;
        }
      });

      el.querySelector('#aQ').addEventListener('input', e => { st.q = e.target.value; st.limit = PAGE; draw(); });
      el.querySelector('#aTagF').addEventListener('change', e => { st.tag = e.target.value; st.limit = PAGE; draw(); });
      el.querySelector('#aStat').addEventListener('change', e => { st.status = e.target.value; st.limit = PAGE; draw(); });
      el.querySelector('#aModel').addEventListener('change', async e => {
        try { await pickModel(e.target.value); el.querySelector('#aConn').textContent = 'Felder: ' + Local.get('ankiFields').slice(0, 2).join(' / '); }
        catch (err) { el.querySelector('#aConn').textContent = err.message; }
      });
      el.querySelector('#aFile').addEventListener('change', async e => {
        const f = e.target.files[0];
        e.target.value = '';
        if (f) add(await f.text());
      });

      draw();
    },
  });
})();
