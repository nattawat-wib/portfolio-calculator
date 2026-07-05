---
name: portal-theme
description: Use when working with CSS custom properties, dark/light theme, or color system across the mini-apps portal. Helps ensure consistent theming.
---

# Portal Theme

This skill documents the theming conventions across all mini-apps in this project.

## CSS custom properties pattern

Every app defines colors via CSS custom properties on `:root` (light mode) and overrides them under `body.dark-mode` (or `html[data-theme="dark"]`).

### Common variable names used across apps

| Variable | Light value | Dark value |
|----------|-------------|------------|
| `--bg` / `--bg-primary` | `#f0f2f5` | `#12121e` |
| `--bg-card` / `--bg-secondary` | `#fff` / `#fffcf0` | `#1e1e2e` |
| `--text` / `--text-primary` | `#1a1a2e` | `#e0e0e8` |
| `--text-secondary` | `#666` | `#999` |
| `--text-muted` | `#999` | `#777` |
| `--border` / `--border-primary` | `#eee` | `#2a2a3e` / `#333` |
| `--primary` | `#d97706` | `#f59e0b` |
| `--primary-light` | `#fef8e7` | `#2a2a3e` |
| `--shadow` | `rgba(0,0,0,0.08)` | `rgba(0,0,0,0.3)` |

> Some apps use `--bg`, others use `--bg-primary`. When adding to an existing app, use the same naming convention that app already uses. When creating a new app, prefer the `--bg-primary` / `--bg-secondary` naming.

## Dark mode anti-flash

The dark mode class/attribute must be applied synchronously in `<head>` before the page renders:

```html
<script>
(function() {
  var saved = localStorage.getItem('theme');
  var theme = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  // or: document.body.classList.add('dark-mode') depending on the app's convention
})();
</script>
```

## Toggle mechanism

- Light: `localStorage.setItem('theme', 'light')`, remove dark class
- Dark: `localStorage.setItem('theme', 'dark')`, add dark class
- On load: check localStorage, fall back to `prefers-color-scheme` media query

## Color palette

- **Amber primary**: `#d97706` (light) / `#f59e0b` (dark)
- **Background**: cool dark `#12121e` / warm light `#f0f2f5`
- **Cards**: slightly lighter than background
- **Text**: high contrast on both modes
- **Transitions**: `transition: background 0.3s, color 0.3s` on body

## App-specific icon colors

| App | Color |
|-----|-------|
| Oxford 3000 | `#6c63ff` (purple) |
| Portfolio Calculator | `#10b981` (green) |
| Investing News | `#d97706` (amber) |

## Responsive breakpoint

- Mobile: `480px` — reduce padding, font sizes, and card spacing

## Rule of thumb

When editing an existing app's theme, use the same variable names that app already defines. When creating a new app, pick one naming convention and stick with it. Never mix `--bg` and `--bg-primary` in the same file.
