# QO-Lernseite (Quantum Optics HS26)

Kleine Lernseite ohne Build-Schritt: einfach `index.html` öffnen oder über GitHub Pages nutzen.

**Reiter**

- **Themen**: Checkliste Lecture Notes ↔ Home-Skript, mit Lücken zum Selbst-Herleiten (Check-Werte zum Aufklappen) und den Fehlern in den LN.
- **ToDo**: einfache Liste ohne Datum. Abhaken, Text antippen zum Bearbeiten, am Griff ziehen zum Sortieren.
- **Anki**: Karten einfügen (Tab-getrennt oder `Q:`/`A:`), ansehen, als Anki-Datei exportieren oder per AnkiConnect direkt senden.

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Gerüst, lädt alles andere |
| `style.css` | Aussehen (hell/dunkel) |
| `app-core.js` | Reiter-Verwaltung, Speicher, Backup |
| `app-sync.js` | Sync über einen privaten GitHub-Gist |
| `data-themen.js` | Inhalte der Themen-Checkliste |
| `tab-*.js` | ein Reiter pro Datei |

## Neuen Reiter hinzufügen

1. `tab-xyz.js` anlegen (z. B. `tab-todo.js` als Vorlage):
   ```js
   (() => {
     App.registerTab({
       id: 'xyz', title: 'Xyz',
       render(el) { el.innerHTML = '<section class="card">…</section>'; },
     });
   })();
   ```
2. In `index.html` bei den Reitern eine Zeile `<script src="tab-xyz.js"></script>` ergänzen.

Daten, die zwischen Geräten gesynct werden sollen: `DB.put('xyz', id, {...})`, `DB.list('xyz')`, `DB.del('xyz', id)`.
Nur fürs Gerät: `Local.set(key, value)` / `Local.get(key)`.

## Sync Laptop ↔ Handy

Einstellungen (Zahnrad) → Token erstellen (klassischer Token, nur Scope `gist`) → einfügen → Verbinden.
Auf jedem Gerät einmal. Der Stand liegt dann in einem privaten Gist `qo-lernseite-sync.json`;
pro Eintrag gewinnt die neuere Änderung. Der Token bleibt nur im Browser des jeweiligen Geräts.

## Deploy

GitHub Pages: Settings → Pages → „Deploy from a branch“ → `main` / `(root)`.
Updates: geänderte Dateien hochladen, nach ca. einer Minute ist die Seite aktuell.
