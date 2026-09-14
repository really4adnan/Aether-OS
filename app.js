const OS = {
  theme: localStorage.getItem("AETHER_THEME") || "sakura",
  style: localStorage.getItem("AETHER_STYLE") || "glass",
  ram: 42,
  cameraStream: null,
  animReq: null
};

// --- SYSTEM RUNNER & METRICS HUD ---
function initStats() {
  const menuClock = document.getElementById("menu-clock");
  const widgetTime = document.getElementById("widget-time");
  const widgetDate = document.getElementById("widget-date");
  const menuRam = document.getElementById("menu-ram-stat");
  const widgetRam = document.getElementById("widget-ram");
  const widgetRamBar = document.getElementById("widget-ram-bar");

  function tick() {
    const now = new Date();
    const timeFull = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const timeShort = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

    if (menuClock) menuClock.textContent = timeShort;
    if (widgetTime) widgetTime.textContent = timeFull;
    if (widgetDate) widgetDate.textContent = dateStr;

    const jitter = (Math.random() * 2 - 1).toFixed(1);
    OS.ram = Math.min(190, Math.max(40, (parseFloat(OS.ram) + parseFloat(jitter)).toFixed(1)));

    if (menuRam) menuRam.textContent = `${OS.ram} MB`;
    if (widgetRam) widgetRam.textContent = `${OS.ram} MB / 512 MB`;
    if (widgetRamBar) widgetRamBar.style.width = `${(OS.ram / 512) * 100}%`;
  }
  setInterval(tick, 1000);
  tick();
}

// --- WALLPAPER CANVAS ENGINE ---
function initWallpaper() {
  const canvas = document.getElementById("wallpaper-canvas");
  const ctx = canvas.getContext("2d");

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  // Sakura Petals
  const petals = Array.from({ length: 45 }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    r: Math.random() * 4 + 2,
    dx: Math.random() * 1 + 0.5,
    dy: Math.random() * 1.5 + 0.8
  }));

  // Matrix Drops
  const fontSize = 14;
  let cols = Math.floor(window.innerWidth / fontSize);
  let drops = Array(cols).fill(1);

  // Synthwave Grid Offset
  let synthOffset = 0;

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (OS.theme === "sakura") {
      ctx.fillStyle = "#ffb6c1";
      petals.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        p.x += p.dx;
        p.y += p.dy;
        if (p.y > canvas.height) p.y = -10;
        if (p.x > canvas.width) p.x = -10;
      });
    } else if (OS.theme === "cybermatrix") {
      ctx.fillStyle = "rgba(1, 8, 3, 0.15)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#22c55e";
      ctx.font = `${fontSize}px monospace`;
      drops.forEach((y, i) => {
        const text = String.fromCharCode(0x30A0 + Math.random() * 96);
        ctx.fillText(text, i * fontSize, y * fontSize);
        if (y * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      });
    } else if (OS.theme === "minecraft") {
      ctx.fillStyle = "#1e140d";
      ctx.fillRect(0, canvas.height - 120, canvas.width, 120);
      ctx.fillStyle = "#496828";
      ctx.fillRect(0, canvas.height - 136, canvas.width, 16);
    } else if (OS.theme === "synthwave") {
      ctx.strokeStyle = "rgba(244, 63, 94, 0.4)";
      ctx.lineWidth = 1.5;
      const horizon = canvas.height * 0.55;

      synthOffset = (synthOffset + 0.8) % 30;
      for (let y = horizon; y < canvas.height; y += 22) {
        ctx.beginPath();
        ctx.moveTo(0, y + synthOffset);
        ctx.lineTo(canvas.width, y + synthOffset);
        ctx.stroke();
      }
      for (let x = 0; x < canvas.width; x += 60) {
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, horizon);
        ctx.lineTo(x * 2 - canvas.width / 2, canvas.height);
        ctx.stroke();
      }
    } else if (OS.theme === "darkvoid") {
      ctx.fillStyle = "#38bdf8";
      petals.slice(0, 30).forEach(p => {
        ctx.fillRect(p.x, p.y, 2, 2);
        p.y -= 0.4;
        if (p.y < 0) p.y = canvas.height;
      });
    }

    OS.animReq = requestAnimationFrame(render);
  }

  if (OS.animReq) cancelAnimationFrame(OS.animReq);
  render();
}

function applyTheme(name) {
  OS.theme = name;
  document.body.setAttribute("data-theme", name);
  localStorage.setItem("AETHER_THEME", name);
}

function applyStyle(styleName) {
  OS.style = styleName;
  document.body.setAttribute("data-style", styleName);
  localStorage.setItem("AETHER_STYLE", styleName);
}

// --- WINDOW MANAGER ---
class WindowManager {
  constructor() {
    this.layer = document.getElementById("window-layer");
    this.windows = new Map();
    this.topZ = 100;
  }

  create({ id, title, width = 540, height = 360, render }) {
    if (this.windows.has(id)) {
      this.focus(id);
      return;
    }

    const win = document.createElement("div");
    win.className = "aether-window active";
    win.id = `win-${id}`;
    win.style.width = `${width}px`;
    win.style.height = `${height}px`;
    win.style.top = `${60 + this.windows.size * 25}px`;
    win.style.left = `${70 + this.windows.size * 25}px`;
    win.style.zIndex = ++this.topZ;

    win.innerHTML = `
      <div class="window-titlebar">
        <div class="window-traffic-lights">
          <button class="win-dot dot-close"></button>
          <button class="win-dot dot-min"></button>
          <button class="win-dot dot-max"></button>
        </div>
        <div class="window-name">${title}</div>
        <div style="width: 40px;"></div>
      </div>
      <div class="window-body"></div>
    `;

    render(win.querySelector(".window-body"), this);

    win.addEventListener("mousedown", () => this.focus(id));
    this.bindDrag(win.querySelector(".window-titlebar"), win);

    win.querySelector(".dot-close").onclick = (e) => { e.stopPropagation(); this.close(id); };
    win.querySelector(".dot-min").onclick = (e) => { e.stopPropagation(); win.classList.add("hidden"); };
    win.querySelector(".dot-max").onclick = (e) => {
      e.stopPropagation();
      win.style.top = win.style.top === "32px" ? "90px" : "32px";
      win.style.left = win.style.left === "0px" ? "80px" : "0px";
      win.style.width = win.style.width === "100vw" ? `${width}px` : "100vw";
      win.style.height = win.style.height === "calc(100vh - 98px)" ? `${height}px` : "calc(100vh - 98px)";
    };

    this.layer.appendChild(win);
    this.windows.set(id, win);
    this.focus(id);
  }

  focus(id) {
    this.windows.forEach(w => w.classList.remove("active"));
    const target = this.windows.get(id);
    if (target) {
      target.classList.remove("hidden");
      target.classList.add("active");
      target.style.zIndex = ++this.topZ;
      const titleEl = document.getElementById("menubar-app-title");
      if (titleEl) titleEl.textContent = target.querySelector(".window-name").textContent;
    }
  }

  close(id) {
    const win = this.windows.get(id);
    if (win) {
      if (id === "camera" && OS.cameraStream) {
        OS.cameraStream.getTracks().forEach(track => track.stop());
        OS.cameraStream = null;
      }
      win.remove();
      this.windows.delete(id);
    }
  }

  bindDrag(handle, target) {
    let ox = 0, oy = 0, dragging = false;
    handle.onmousedown = (e) => {
      dragging = true;
      ox = e.clientX - target.offsetLeft;
      oy = e.clientY - target.offsetTop;
    };
    document.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      target.style.left = `${e.clientX - ox}px`;
      target.style.top = `${Math.max(32, e.clientY - oy)}px`;
    });
    document.addEventListener("mouseup", () => dragging = false);
  }
}

// --- APPLICATION DIRECTORY ---
const APPS = {
  browser(body) {
    body.innerHTML = `
      <div class="browser-wrap">
        <div class="browser-bar">
          <input type="text" id="browser-url" class="browser-input" value="https://www.bing.com" />
          <button class="btn-ui" id="browser-go">Go</button>
        </div>
        <iframe id="browser-frame" class="browser-frame" src="https://www.bing.com"></iframe>
      </div>
    `;
    const inUrl = body.querySelector("#browser-url");
    const frame = body.querySelector("#browser-frame");
    body.querySelector("#browser-go").onclick = () => {
      let val = inUrl.value.trim();
      if (!val.startsWith("http://") && !val.startsWith("https://")) {
        val = "https://www.google.com/search?q=" + encodeURIComponent(val);
      }
      frame.src = val;
    };
  },

  camera(body) {
    body.innerHTML = `
      <div class="camera-wrap">
        <video id="cam-video" class="camera-video" autoplay playsinline></video>
        <button class="btn-ui" id="snap-btn">Capture Snapshot</button>
        <canvas id="snap-canvas" class="hidden"></canvas>
      </div>
    `;
    const video = body.querySelector("#cam-video");
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then(stream => {
        OS.cameraStream = stream;
        video.srcObject = stream;
      })
      .catch(() => alert("Camera permission unavailable or denied."));

    body.querySelector("#snap-btn").onclick = () => {
      const canvas = body.querySelector("#snap-canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      canvas.getContext("2d").drawImage(video, 0, 0);
      const link = document.createElement("a");
      link.download = "aether-snapshot.png";
      link.href = canvas.toDataURL();
      link.click();
    };
  },

  calc(body) {
    body.innerHTML = `
      <div style="display:flex; flex-direction:column; height:100%; gap:0.6rem;">
        <div class="calc-screen" id="calc-disp">0</div>
        <div class="calc-grid">
          <button class="calc-btn op" data-c="C">C</button>
          <button class="calc-btn op" data-c="(">(</button>
          <button class="calc-btn op" data-c=")">)</button>
          <button class="calc-btn op" data-c="/">÷</button>
          <button class="calc-btn" data-c="7">7</button>
          <button class="calc-btn" data-c="8">8</button>
          <button class="calc-btn" data-c="9">9</button>
          <button class="calc-btn op" data-c="*">×</button>
          <button class="calc-btn" data-c="4">4</button>
          <button class="calc-btn" data-c="5">5</button>
          <button class="calc-btn" data-c="6">6</button>
          <button class="calc-btn op" data-c="-">-</button>
          <button class="calc-btn" data-c="1">1</button>
          <button class="calc-btn" data-c="2">2</button>
          <button class="calc-btn" data-c="3">3</button>
          <button class="calc-btn op" data-c="+">+</button>
          <button class="calc-btn" data-c="0">0</button>
          <button class="calc-btn" data-c=".">.</button>
          <button class="calc-btn op" data-c="DEL">⌫</button>
          <button class="calc-btn op" data-c="=" style="background:var(--accent); color:#000;">=</button>
        </div>
      </div>
    `;
    const disp = body.querySelector("#calc-disp");
    let expr = "";
    body.querySelectorAll(".calc-btn").forEach(btn => {
      btn.onclick = () => {
        const c = btn.dataset.c;
        if (c === "C") expr = "";
        else if (c === "DEL") expr = expr.slice(0, -1);
        else if (c === "=") {
          try { expr = String(Function(`'use strict'; return (${expr})`)()); }
          catch { expr = "Error"; }
        } else expr += c;
        disp.textContent = expr || "0";
      };
    });
  },

  calendar(body) {
    const d = new Date();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const curMonth = monthNames[d.getMonth()];
    const curYear = d.getFullYear();
    const today = d.getDate();

    const daysInMonth = new Date(curYear, d.getMonth() + 1, 0).getDate();
    let daysHtml = "";
    for (let i = 1; i <= daysInMonth; i++) {
      daysHtml += `<div class="cal-day-cell ${i === today ? 'active-today' : ''}">${i}</div>`;
    }

    body.innerHTML = `
      <div class="cal-wrap">
        <div class="cal-header">${curMonth} ${curYear}</div>
        <div class="cal-grid-days">
          <div class="cal-day-head">Su</div><div class="cal-day-head">Mo</div>
          <div class="cal-day-head">Tu</div><div class="cal-day-head">We</div>
          <div class="cal-day-head">Th</div><div class="cal-day-head">Fr</div>
          <div class="cal-day-head">Sa</div>
          ${daysHtml}
        </div>
      </div>
    `;
  },

  themes(body) {
    body.innerHTML = `
      <div>
        <div class="theme-section-title">Wallpapers & Aesthetics</div>
        <div class="studio-grid">
          <div class="studio-card" data-t="sakura">🌸 Strawberry Sakura</div>
          <div class="studio-card" data-t="cybermatrix">🟢 CyberMatrix</div>
          <div class="studio-card" data-t="minecraft">⛏️ Minecraft</div>
          <div class="studio-card" data-t="synthwave">🌆 Synthwave 80s</div>
          <div class="studio-card" data-t="darkvoid">🌌 Dark Void</div>
        </div>

        <div class="theme-section-title" style="margin-top:1.2rem;">Tray & Window Architecture</div>
        <div class="studio-grid">
          <div class="studio-card" data-s="glass">💎 Glassmorphism</div>
          <div class="studio-card" data-s="clay">🧱 Claymorphism (3D)</div>
          <div class="studio-card" data-s="neon">⚡ Neon Cyber Glow</div>
        </div>
      </div>
    `;
    body.querySelectorAll("[data-t]").forEach(el => el.onclick = () => applyTheme(el.dataset.t));
    body.querySelectorAll("[data-s]").forEach(el => el.onclick = () => applyStyle(el.dataset.s));
  },

  terminal(body) {
    body.innerHTML = `
      <div class="term-box">
        <div class="term-log" id="term-log">
          <div>Aether-OS Kernel [Shell v3.0 Native Client]</div>
          <div>Type 'help' to inspect command directory.</div>
        </div>
        <div class="term-prompt-row">
          <span style="color:var(--accent)">user@aether:~$</span>
          <input type="text" class="term-in" id="term-in" autofocus />
        </div>
      </div>
    `;
    const input = body.querySelector("#term-in");
    const log = body.querySelector("#term-log");

    input.onkeydown = (e) => {
      if (e.key === "Enter") {
        const cmd = input.value.trim().toLowerCase();
        const row = document.createElement("div");
        row.innerHTML = `<span style="color:var(--accent)">user@aether:~$</span> ${cmd}`;
        log.appendChild(row);

        const out = document.createElement("div");
        if (cmd === "help") out.textContent = "Commands: help, clear, date, free, reload";
        else if (cmd === "clear") { log.innerHTML = ""; input.value = ""; return; }
        else if (cmd === "date") out.textContent = new Date().toString();
        else if (cmd === "free") out.textContent = `Active Virtual RAM: ${OS.ram} MB / 512 MB`;
        else if (cmd === "reload") { window.location.reload(); return; }
        else out.textContent = cmd ? `Command not found: '${cmd}'` : "";

        log.appendChild(out);
        input.value = "";
        body.scrollTop = body.scrollHeight;
      }
    };
  },

  editor(body) {
    const raw = localStorage.getItem("AETHER_NOTES") || "Welcome to your personal scratchpad.";
    body.innerHTML = `
      <div style="display:flex; flex-direction:column; height:100%; gap:0.5rem;">
        <button class="btn-ui" id="save-note" style="align-self:flex-end;">Save</button>
        <textarea id="note-txt" style="flex:1; background:rgba(0,0,0,0.3); border:1px solid var(--panel-border); border-radius:6px; color:#fff; font-family:inherit; padding:0.75rem; outline:none; resize:none;">${raw}</textarea>
      </div>
    `;
    body.querySelector("#save-note").onclick = () => {
      localStorage.setItem("AETHER_NOTES", body.querySelector("#note-txt").value);
      alert("Committed note to browser storage.");
    };
  },

  files(body, wm) {
    body.innerHTML = `
      <div style="font-size:0.8rem; margin-bottom:0.75rem;">Virtual Disk Hierarchy</div>
      <div style="display:flex; gap:1rem;">
        <div class="dock-icon" id="file-item-notes" style="width:70px; height:70px; flex-direction:column; gap:4px; font-size:0.7rem;">
          <span>📄</span>
          <span>notes.txt</span>
        </div>
      </div>
    `;
    body.querySelector("#file-item-notes").onclick = () => {
      wm.create({ id: "editor", title: "Notes Editor", render: APPS.editor });
    };
  },

  painter(body) {
    body.innerHTML = `
      <div style="display:flex; flex-direction:column; height:100%; gap:0.5rem;">
        <div style="display:flex; gap:0.5rem; align-items:center;">
          <input type="color" id="p-col" value="#ff7597" />
          <input type="range" id="p-size" min="1" max="30" value="4" />
          <button class="btn-ui" id="p-clear">Clear</button>
        </div>
        <canvas id="p-board" width="460" height="240" style="background:#fff; border-radius:6px; cursor:crosshair; flex:1;"></canvas>
      </div>
    `;
    const canvas = body.querySelector("#p-board");
    const ctx = canvas.getContext("2d");
    let draw = false;

    canvas.onmousedown = () => draw = true;
    window.addEventListener("mouseup", () => { draw = false; ctx.beginPath(); });
    canvas.onmousemove = (e) => {
      if (!draw) return;
      const rect = canvas.getBoundingClientRect();
      ctx.lineWidth = body.querySelector("#p-size").value;
      ctx.lineCap = "round";
      ctx.strokeStyle = body.querySelector("#p-col").value;
      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    };
    body.querySelector("#p-clear").onclick = () => ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
};

// --- BOOTSTRAP INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
  const WM = new WindowManager();
  initStats();
  initWallpaper();
  applyTheme(OS.theme);
  applyStyle(OS.style);

  function openApp(id) {
    switch(id) {
      case "browser": WM.create({ id: "browser", title: "AetherWeb", width: 620, height: 420, render: APPS.browser }); break;
      case "camera": WM.create({ id: "camera", title: "System Camera", width: 500, height: 380, render: APPS.camera }); break;
      case "calc": WM.create({ id: "calc", title: "Calculator", width: 320, height: 380, render: APPS.calc }); break;
      case "calendar": WM.create({ id: "calendar", title: "Calendar", width: 340, height: 310, render: APPS.calendar }); break;
      case "themes": WM.create({ id: "themes", title: "Theme & Tray Studio", width: 440, height: 340, render: APPS.themes }); break;
      case "terminal": WM.create({ id: "terminal", title: "Terminal Shell", width: 520, height: 320, render: APPS.terminal }); break;
      case "editor": WM.create({ id: "editor", title: "Notes Editor", width: 460, height: 320, render: APPS.editor }); break;
      case "files": WM.create({ id: "files", title: "File Manager", width: 400, height: 260, render: APPS.files }); break;
      case "painter": WM.create({ id: "painter", title: "Canvas Painter", width: 500, height: 360, render: APPS.painter }); break;
    }
  }

  // Bind Dock & Start Menu Listeners
  document.querySelectorAll("[data-app]").forEach(el => {
    el.addEventListener("click", () => openApp(el.dataset.app));
  });

  // Floating Side Dock Toggle Button
  const dock = document.getElementById("dock-container");
  document.getElementById("dock-toggle-side-btn").onclick = () => {
    dock.classList.toggle("dock-hidden");
  };

  // Start Menu (Pickaxe Button + Windows Key)
  const startBtn = document.getElementById("pickaxe-start-btn");
  const startMenu = document.getElementById("start-menu");

  function toggleStart(e) {
    if (e) e.stopPropagation();
    startMenu.classList.toggle("hidden");
  }

  startBtn.addEventListener("click", toggleStart);
  window.addEventListener("keydown", (e) => {
    if (e.key === "Meta" || e.code === "OSLeft" || e.code === "OSRight") {
      e.preventDefault();
      toggleStart();
    }
  });

  document.addEventListener("click", () => startMenu.classList.add("hidden"));
  startMenu.addEventListener("click", (e) => e.stopPropagation());
  document.getElementById("reboot-os-btn").onclick = () => window.location.reload();

  // Desktop Right-Click Context Menu
  const ctxMenu = document.getElementById("context-menu");
  document.getElementById("desktop").addEventListener("contextmenu", (e) => {
    e.preventDefault();
    ctxMenu.style.left = `${e.clientX}px`;
    ctxMenu.style.top = `${e.clientY}px`;
    ctxMenu.classList.remove("hidden");
  });

  document.addEventListener("click", () => ctxMenu.classList.add("hidden"));
  document.getElementById("ctx-open-browser").onclick = () => openApp("browser");
  document.getElementById("ctx-new-note").onclick = () => openApp("editor");
  document.getElementById("ctx-open-term").onclick = () => openApp("terminal");
  document.getElementById("ctx-change-theme").onclick = () => openApp("themes");
  document.getElementById("ctx-toggle-dock").onclick = () => dock.classList.toggle("dock-hidden");
  document.getElementById("ctx-refresh").onclick = () => window.location.reload();

  // Default Open App
  openApp("themes");
});