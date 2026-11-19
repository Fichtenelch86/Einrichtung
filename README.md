# 🛋️ Einrichtungs-Assistent

👉 **Live-Demo (per Link starten):** [fichtenelch86.github.io/Einrichtung](https://fichtenelch86.github.io/Einrichtung/)

Eine statische Web-App (reines HTML/CSS/JS, **kein Build-Schritt, keine Abhängigkeiten**), mit der du einen Gebäudegrundriss lädst und virtuell einrichtest: Möbel und Dekoration platzieren, Wandfarben und Bodenbeläge ausprobieren.

## Starten

- Lokal: `index.html` direkt im Browser öffnen (Doppelklick genügt), oder
- `python3 -m http.server` im Repo-Ordner und <http://localhost:8000> aufrufen, oder
- über **GitHub Pages** (Settings → Pages → Branch `main`, Ordner `/`).

## Workflow

1. **Grundriss laden** (rechts oben: 📷 Bild laden – PNG/JPG/SVG/WebP) oder **✨ Beispiel-Grundriss** klicken.
2. **Maßstab setzen** (Werkzeug 📏): zwei Punkte auf einer bekannten Strecke klicken (z. B. eine 5-m-Wand) und die Länge in Metern eingeben. Danach werden Möbel in realer Größe gezeichnet, Räume zeigen m² an und die Statusleiste zeigt die Cursorposition in Metern.
3. **Räume einzeichnen** (Werkzeug ✏️): Polygon per Klick zeichnen, Doppelklick/Enter schließt. Pro Raum rechts: Name, **Wandfarbe** (Farbfeld oder Presets) und **Bodenbelag** (Parkett, Laminat, Fliesen, Teppich, Vinyl, Beton).
4. **Möbel & Deko platzieren**: links aus dem Katalog per Drag & Drop auf den Plan ziehen (oder anklicken = mittig platzieren). Auswählen, verschieben, über den blauen Dreh-Griff oder ±15°-Buttons drehen, nach vorne/hinten schieben, mit `Entf` löschen.
5. **Ansichten**: Mausrad zoomt, Ziehen auf leerer Fläche (oder ✋ Hand) verschiebt.
6. **Sichern/Exportieren** (oben): Projekt als JSON speichern/laden, Autosave läuft automatisch im Browser (localStorage), Export als **PNG** oder **SVG**.

## Tastenkürzel

| Taste | Funktion |
|---|---|
| `1` / `2` / `3` / `4` | Werkzeuge: Auswählen / Raum zeichnen / Maßstab / Hand |
| `Strg+Z` / `Strg+Y` | Rückgängig / Wiederholen |
| `Entf` | Auswahl löschen |
| `Esc` | Zeichnen abbrechen / Auswahl aufheben |
| `Enter` | Raum-Polygon schließen |

## Dateien

```
index.html      Oberfläche (Deutsch)
styles.css      Theme & Layout
js/helpers.js   Utilities, Konstanten
js/catalog.js   Möbel-Katalog (SVG-Symbole, reale Maße in m)
js/floors.js    Bodenbeläge als SVG-Pattern
js/render.js    Zustand, Undo/Redo, Rendering
js/main.js      Pointer-Interaktion, Import/Export, Init
```

## Datenformat (Projekt-JSON)

```json
{
  "app": "einrichtungs-assistent",
  "version": 1,
  "state": {
    "planImage": { "dataUrl": "…", "w": 720, "h": 480 },
    "pxPerMeter": 60,
    "rooms": [{ "id": 1, "name": "Wohnzimmer", "points": [{"x":0,"y":0}], "wallColor": "#e8dcc8", "floor": "parkett" }],
    "items": [{ "id": 2, "type": "sofa", "x": 120, "y": 200, "rotation": 90 }]
  }
}
```

Alle Koordinaten sind Pixel im Grundriss-Koordinatensystem; Möbel-Typen und Maße siehe `js/catalog.js`.
