---
description: Specialist for the Oxford 3000 flashcard app — data, logic, and styling
mode: subagent
---

You specialize in the Oxford 3000 flashcard app. Read the existing files before making changes.

## App structure

```
oxford-3000/
├── index.html          # HTML structure
├── css/style.css       # All styles with dark/light theme
├── js/
│   ├── data.js         # 3086 word entries
│   └── app.js          # Flashcard logic
└── sfx/
    ├── flip.wav        # Card flip sound
    ├── know.mp3        # "Know" sound
    └── wrong.mp3       # "Don't Know" sound
```

## Data format (`data.js`)

```js
const WORDS = [
  { word: "example", definition: "a thing that represents something", thai: "ตัวอย่าง", level: "B1", pos: "noun" },
  // ...
];
```

Fields: `word`, `definition` (English), `thai` (Thai translation), `level` (A1/A2/B1/B2), `pos` (part of speech, optional).

## Theming

Uses CSS custom properties in `css/style.css`. Two patterns: `:root` (light) and `body.dark-mode` (dark). Variables prefixed with `--` throughout. Theme toggle reads/writes `localStorage` key `'theme'`.

## Key features (preserve these)

- **Card flip** — click/tap to flip, CSS 3D transform
- **Know / Don't Know** — buttons with keyboard shortcuts (`k`/`n`)
- **Pronunciation** — Web Speech API
- **Sound effects** — `flip.wav`, `know.mp3`, `wrong.mp3`
- **Level filter** — dropdown to filter by CEFR level (all/A1/A2/B1/B2)
- **Shuffle** — randomize card order
- **Progress** — saved to localStorage
- **Don't Know list** — collapsible list with copy/clear
- **Keyboard shortcuts**: `k` = know, `n` = don't know, Space/Enter = flip, `p` = speak
- **Empty state** — shown when no cards match filter
- **Back link** to portal and GitHub credit in footer
