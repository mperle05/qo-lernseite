/* QO-Lernseite · Reiter „Themen“: Checkliste Lecture Notes ↔ Skript (Inhalte in data-themen.js) */
'use strict';

(() => {
  const NIMM = {
    skript: ['Skript', 'b-skript'],
    beides: ['Skript + LN', 'b-beides'],
    ln: ['LN', 'b-ln'],
    luecke: ['Lücke', 'b-luecke'],
  };
  const isDone = id => !!DB.get('themen', id)?.done;
  const unitsOf = it => [it.id, ...(it.aufgaben || []).map(a => a.id)];
  const pct = (d, n) => (n ? Math.round((100 * d) / n) : 0);
  // Filter „Lücken & Achtung“: alles, wofür man über das Skript hinaus etwas tun muss
  const needsWork = it => it.nimm !== 'skript' || !!it.achtung || !!it.aufgaben;

  const taskHTML = a => `
    <li class="task ${isDone(a.id) ? 'done' : ''}">
      <label class="chk"><input type="checkbox" data-id="${a.id}" ${isDone(a.id) ? 'checked' : ''}><span>${esc(a.text)}</span></label>
      ${a.check ? `<details class="check"><summary>Check</summary><div>${esc(a.check)}</div></details>` : ''}
    </li>`;

  const itemHTML = it => {
    const [label, cls] = NIMM[it.nimm] || NIMM.skript;
    return `
    <li class="item ${isDone(it.id) ? 'done' : ''}" data-units="${unitsOf(it).join(' ')}">
      <div class="item-main">
        <label class="chk"><input type="checkbox" data-id="${it.id}" ${isDone(it.id) ? 'checked' : ''}><span class="item-title">${esc(it.thema)}</span></label>
        <span class="badge ${cls}">${label}</span>
      </div>
      <div class="item-meta">${it.ln ? `<span class="ref">${esc(it.ln)}</span>` : ''}<span>Skript: ${esc(it.skript)}</span></div>
      ${it.notiz ? `<p class="note">${esc(it.notiz)}</p>` : ''}
      ${(it.achtung || []).map(a => `<p class="warn"><strong>Achtung</strong> ${esc(a)}</p>`).join('')}
      ${it.aufgaben ? `<ul class="tasks">${it.aufgaben.map(taskHTML).join('')}</ul>` : ''}
    </li>`;
  };

  // Zähler, Balken und „Erledigte ausblenden“ aktualisieren, ohne neu zu zeichnen
  // (so bleiben aufgeklappte „Check“-Felder offen)
  function paint(el, T) {
    const hide = Local.get('themenHideDone', false);
    let all = 0, done = 0;
    for (const g of T.gruppen) {
      const ids = g.items.flatMap(unitsOf), d = ids.filter(isDone).length;
      all += ids.length; done += d;
      const sec = el.querySelector(`[data-group="${g.id}"]`);
      if (!sec) continue;
      sec.querySelector('.count').textContent = `${d}/${ids.length}`;
      sec.querySelector('.bar i').style.width = pct(d, ids.length) + '%';
      let visible = 0;
      sec.querySelectorAll('li.item').forEach(li => {
        const off = hide && li.dataset.units.split(' ').every(isDone);
        li.classList.toggle('hide', off);
        if (!off) visible++;
      });
      sec.querySelector('.all-done').hidden = visible > 0;
    }
    el.querySelector('.sum-num').textContent = `${done} / ${all}`;
    el.querySelector('.sum .bar i').style.width = pct(done, all) + '%';
  }

  App.registerTab({
    id: 'themen',
    title: 'Themen',
    render(el) {
      const T = window.QO_THEMEN;
      const hide = Local.get('themenHideDone', false);
      const filter = Local.get('themenFilter', 'alle');
      const shown = it => filter !== 'arbeit' || needsWork(it);

      el.innerHTML = `
        <section class="card sum">
          <div class="sum-top">
            <div><div class="sum-num big"></div><div class="muted small">Themen und Aufgaben abgehakt</div></div>
            <div class="ctrls">
              <div class="seg" role="group" aria-label="Filter">
                <button type="button" data-filter="alle" aria-pressed="${filter !== 'arbeit'}">Alle</button>
                <button type="button" data-filter="arbeit" aria-pressed="${filter === 'arbeit'}">Lücken &amp; Achtung</button>
              </div>
              <label class="chk small"><input type="checkbox" data-ctl="hide" ${hide ? 'checked' : ''}><span>Erledigte ausblenden</span></label>
            </div>
          </div>
          <div class="bar"><i></i></div>
          <details class="hints"><summary>Hinweise</summary><ul>${T.hinweise.map(h => `<li>${esc(h)}</li>`).join('')}</ul></details>
        </section>
        ${T.gruppen.filter(g => g.items.some(shown)).map(g => `
          <section class="card group" data-group="${g.id}">
            <div class="group-head"><h2>${esc(g.titel)}</h2><span class="count muted"></span></div>
            <div class="bar"><i></i></div>
            <ul class="items">${g.items.filter(shown).map(itemHTML).join('')}</ul>
            <p class="all-done muted small" hidden>Hier ist alles erledigt.</p>
          </section>`).join('')}`;

      paint(el, T);

      el.addEventListener('change', e => {
        const t = e.target;
        if (t.dataset.id) {
          DB.put('themen', t.dataset.id, { done: t.checked });
          t.closest('li').classList.toggle('done', t.checked);
          paint(el, T);
        } else if (t.dataset.ctl === 'hide') {
          Local.set('themenHideDone', t.checked);
          paint(el, T);
        }
      });
      el.addEventListener('click', e => {
        const b = e.target.closest('[data-filter]');
        if (b) { Local.set('themenFilter', b.dataset.filter); App.render(); }
      });
    },
  });
})();
