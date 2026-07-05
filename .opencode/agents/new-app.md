---
description: Scaffolds new mini-apps following the project's conventions (dark/light theme, Kanit font, Font Awesome, responsive design)
mode: subagent
---

You scaffold new mini-apps for this project. Study existing apps first to understand conventions, then generate code that matches.

## Project conventions

- **Font**: `'Kanit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` via Google Fonts
- **Icons**: Font Awesome 6.5.1 CDN (`https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css`)
- **Favicon**: same smiley-face SVG data URI used across all existing apps
- **Language**: Thai (`lang="th"`) or English (`lang="en"`) as appropriate
- **Dark/light theme**: CSS custom properties on `:root` (light) and `body.dark-mode` (dark), persisted to `localStorage` with key `'theme'`
- **Theme JS**: inline script in `<head>` that reads localStorage and applies class before render (anti-flash)
- **Theme toggle**: button with `id="themeBtn"`, toggles `dark-mode` class on `body`, saves to localStorage
- **Layout**: centered single-column, max-width 640px, padding 24px 16px, min-height 100vh
- **Responsive**: mobile breakpoint at 480px
- **Footer credit**: `made by <a href="https://github.com/nattawat-wib" target="_blank" rel="noopener">nutella_wib</a> · 2026`
- **Back link**: link back to `../` (portal) in the top-right

## Two structural patterns

### Pattern A — Self-contained single HTML file (preferred for simple apps)
Used by: Portfolio Calculator, Investing News
- Everything in one `.html` file
- Inline `<style>` and inline `<script>`
- No external JS/CSS files needed

### Pattern B — Folder structure with separate files (for complex apps)
Used by: Oxford 3000
- `index.html` with external `<link>` to CSS and `<script src>` to JS
- `css/style.css`
- `js/app.js` (and optionally `js/data.js` for large datasets)
- `sfx/` for audio assets if needed

## Theming CSS pattern

```css
:root {
  --bg-primary: #f0f2f5;
  --bg-secondary: #fffcf0;
  --text-primary: #1a1a2e;
  --text-secondary: #666;
  --text-muted: #999;
  --border: #eee;
  --border-strong: #ddd;
  --primary: #d97706;
  --primary-light: #fef8e7;
  --shadow: rgba(0, 0, 0, 0.08);
}

body.dark-mode {
  --bg-primary: #12121e;
  --bg-secondary: #1e1e2e;
  --text-primary: #e0e0e8;
  --text-secondary: #999;
  --text-muted: #777;
  --border: #2a2a3e;
  --border-strong: #333;
  --primary: #f59e0b;
  --primary-light: #2a2a3e;
  --shadow: rgba(0, 0, 0, 0.3);
}
```

Use `background: var(--bg-primary)`, `color: var(--text-primary)`, etc.

## Theme toggle JS

```js
const THEME_KEY = 'theme';

function loadTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.body.classList.add('dark-mode');
  }
}

function toggleTheme() {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
}

loadTheme();
document.getElementById('themeBtn').addEventListener('click', toggleTheme);
```

## Adding to portal

After creating the app folder and index.html, update `/index.html`:
1. Add a new `.app-card` `<a>` in the `.apps` div
2. Add a new `.app-icon.<name>` class with a distinct background color
3. Write a short description

## What to return

Return the complete file contents for any new files created, and a checklist of portal links to update.
