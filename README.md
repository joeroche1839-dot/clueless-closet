# As If! — Virtual Closet 💛

A Clueless-inspired virtual closet with an Apple-clean aesthetic. Upload your outfits,
tag them, and let your imaginary computer pick the perfect look — just like Cher.

![Made with love](https://img.shields.io/badge/made%20with-%F0%9F%92%9B-ff9ec7)

## Features

- 📷 **Take a photo** — snap an outfit straight from your device camera (live preview + front/back flip), or
- 🖼️ **Upload looks** — tap, choose from your library, or drag-and-drop a photo, then name it and pick a category
- 🗂️ **Categories** — Tops, Bottoms, Dresses, Shoes, Accessories, Full Looks
- ✨ **Pick My Outfit** — the Cher-style "computer picks your look" spotlight, with re-roll
- 💾 **Auto-saves** in your browser (`localStorage`) — your closet is there when you come back
- 🪄 Photos auto-resize & compress so storage doesn't fill up
- 📱 Fully responsive — looks great on a phone

## Run it locally

It's a plain static site — no build step, no dependencies.

```bash
# any static server works; here's one with Python
python3 -m http.server 4599
# then open http://localhost:4599
```

Or just double-click `run.sh` (macOS/Linux), or open `index.html` directly in a browser.

## Files

| File | What it does |
|------|--------------|
| `index.html` | Page structure |
| `styles.css` | All the Clueless × Apple styling |
| `app.js` | Upload, save, filter, and outfit-picker logic |

## Notes

Outfits are stored **per-browser/device** in `localStorage` — they live on whatever
device you upload them from. For cross-device sync you'd need a hosted backend.

---

*Rolling with the homies since '95.* 🛍️
