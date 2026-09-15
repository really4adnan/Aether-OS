# Aether-OS

A minimal, industrial web desktop environment built with vanilla HTML, CSS, and JavaScript.

- **Live Site:** https://aethercube.xyz
- **Repo:** https://github.com/really4adnan/Aether-OS

---

## Why I Built This

I built Aether-OS for Hack Club Stardance because I wanted to see how far I could push plain JavaScript without reaching for React, Electron, or external UI libraries. 

Most modern web desktop concepts look identical—frosted glass blurs, pastel gradients, and generic mobile-style rounded pills. I wanted something sharper and more technical, inspired by older UNIX workstations and brutalist hardware interfaces.

## What Works

- **Window Management:** Custom window engine written from scratch. Handles dragging, focus hierarchy (`z-index`), minimizing to taskbar, maximizing, and viewport boundary checks so windows don't get lost off-screen.
- **Persistent State:** Saves user theme preferences, tray modes, and scratchpad documents straight into `localStorage` so changes persist on refresh.
- **Canvas Backgrounds:** Lightweight custom background rendering (matrix streams, grid lines, and horizon grids) drawn directly on an HTML5 `<canvas>` element without burning CPU cycles.
- **Built-in Tools:**
  - `Terminal`: Basic shell emulator with built-in commands (`help`, `date`, `clear`, `reload`).
  - `Scratchpad`: Persistent text editor that writes directly to browser storage.
  - `Calculator`: Quick math evaluation without external packages.
  - `Canvas Draw`: Simple pixel scratchboard with size and color pickers.
  - `Camera`: Live optical test using the browser MediaDevices stream.
  - `Web Navigator`: Lightweight iframe-based web browser.
  - `Calendar`: Month grid generation based on native JS date objects.

## Tech Stack

- **HTML5 & CSS3:** Semantic markup, flexbox/grid layouts, custom box-shadows, and zero border-radius styling.
- **Vanilla JavaScript (ES5/ES6):** DOM manipulation, canvas rendering loop, mouse drag tracking, and event bubbling.
- **Typography:** MiSans & JetBrains Mono.
- **Hosting:** Deployed via GitHub Pages on custom domain `aethercube.xyz`.

## Running Locally

No npm install, no build step, no dependencies. Just clone and open:

```bash
git clone [https://github.com/really4adnan/Aether-OS.git](https://github.com/really4adnan/Aether-OS.git)
cd Aether-OS
# Open index.html in any modern browser
