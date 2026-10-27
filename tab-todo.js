/* QO-Lernseite · Reiter „ToDo“: einfache Liste ohne Datum.
 * Abhaken · Text antippen zum Bearbeiten · am Griff ziehen zum Sortieren */
'use strict';

(() => {
  const GRIP = '<svg viewBox="0 0 10 16" width="10" height="16" aria-hidden="true"><g fill="currentColor"><circle cx="2" cy="3" r="1.4"/><circle cx="8" cy="3" r="1.4"/><circle cx="2" cy="8" r="1.4"/><circle cx="8" cy="8" r="1.4"/><circle cx="2" cy="13" r="1.4"/><circle cx="8" cy="13" r="1.4"/></g></svg>';
  const sorted = () => DB.list('todo').sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || (a.id < b.id ? -1 : 1));

  // Text inline bearbeiten: Enter speichert, Esc bricht ab, leer = löschen
  function edit(li) {
    const id = li.dataset.id, t = DB.get('todo', id), span = li.querySelector('.todo-text');
    const inp = document.createElement('input');
    inp.className = 'todo-edit';
    inp.value = t.text;
    span.replaceWith(inp);
    inp.focus();
    let finished = false;
    const finish = save => {
      if (finished) return;
      finished = true;
      const v = inp.value.trim();
      if (save && !v) DB.del('todo', id);
      else if (save && v !== t.text) DB.put('todo', id, { text: v });
      App.render();
    };
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); finish(true); }
      if (e.key === 'Escape') finish(false);
    });
    inp.addEventListener('blur', () => finish(true));
  }

  // Sortieren per Ziehen am Griff (Maus und Touch)
  function enableDrag(list) {
    let li = null;
    list.addEventListener('pointerdown', e => {
      const grip = e.target.closest('.grip');
      if (!grip) return;
      e.preventDefault();
      li = grip.closest('li');
      li.classList.add('dragging');
      grip.setPointerCapture(e.pointerId);
    });
    list.addEventListener('pointermove', e => {
      if (!li) return;
      const next = [...list.children].find(c => c !== li && e.clientY < c.getBoundingClientRect().top + c.offsetHeight / 2);
      if (next) { if (li.nextElementSibling !== next) list.insertBefore(li, next); }
      else if (list.lastElementChild !== li) list.appendChild(li);
    });
    const drop = () => {
      if (!li) return;
      li.classList.remove('dragging');
      li = null;
      DB.batch(() => [...list.children].forEach((c, i) => {
        const r = DB.get('todo', c.dataset.id);
        if (r && r.order !== i) DB.put('todo', c.dataset.id, { order: i });
      }));
    };
    list.addEventListener('pointerup', drop);
    list.addEventListener('pointercancel', drop);
  }

  App.registerTab({
    id: 'todo',
    title: 'ToDo',
    render(el) {
      const items = sorted();
      const open = items.filter(t => !t.done).length;
      el.innerHTML = `
        <section class="card">
          <form class="row" id="tAdd">
            <input id="tNew" placeholder="Neue Aufgabe …" autocomplete="off" enterkeyhint="done" aria-label="Neue Aufgabe">
            <button class="btn primary">Hinzufügen</button>
          </form>
          <ul class="todos" id="tList">${items.map(t => `
            <li class="todo ${t.done ? 'done' : ''}" data-id="${t.id}">
              <span class="grip" title="Ziehen zum Sortieren">${GRIP}</span>
              <input type="checkbox" ${t.done ? 'checked' : ''} aria-label="Erledigt">
              <span class="todo-text" tabindex="0" title="Antippen zum Bearbeiten">${rich(t.text)}</span>
              <button type="button" class="icon-btn del" aria-label="Löschen" title="Löschen">✕</button>
            </li>`).join('')}</ul>
          ${items.length ? '' : '<p class="empty muted">Noch nichts auf der Liste.</p>'}
          <div class="row foot">
            <span class="muted small">${open} offen · ${items.length - open} erledigt</span>
            <span class="spacer"></span>
            ${items.length > open ? '<button type="button" class="btn ghost" id="tClear">Erledigte löschen</button>' : ''}
          </div>
        </section>`;

      el.querySelector('#tAdd').addEventListener('submit', e => {
        e.preventDefault();
        const v = el.querySelector('#tNew').value.trim();
        if (!v) return;
        const max = Math.max(-1, ...DB.list('todo').map(t => t.order ?? 0));
        DB.put('todo', uid(), { text: v, done: false, order: max + 1 });
        App.render();
        $('#tNew').focus();
      });

      el.addEventListener('change', e => {
        const li = e.target.closest('li.todo');
        if (li && e.target.type === 'checkbox') { DB.put('todo', li.dataset.id, { done: e.target.checked }); App.render(); }
      });

      el.addEventListener('click', e => {
        const li = e.target.closest('li.todo');
        if (li && e.target.closest('.del')) { DB.del('todo', li.dataset.id); App.render(); return; }
        if (li && e.target.closest('.todo-text')) { edit(li); return; }
        if (e.target.id === 'tClear' && confirm('Alle erledigten Aufgaben löschen?')) {
          DB.batch(() => items.filter(t => t.done).forEach(t => DB.del('todo', t.id)));
          App.render();
        }
      });
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' && e.target.classList.contains('todo-text')) edit(e.target.closest('li'));
      });

      enableDrag(el.querySelector('#tList'));
    },
  });
})();
