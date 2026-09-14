
// --- STATE & STORAGE ---
const OS_STATE = {
  currentTheme: localStorage.getItem("AETHER_THEME") || "sakura",
  ramUsage: 42,
  activeWindow: null,
  matrixInterval: null
};

// --- LIVE CLOCK & RAM WIDGET RUNNER ---
function initSystemStats() {
  const menuClock = document.getElementById("menu-clock");
  const widgetTime = document.getElementById("widget-time");
  const widgetDate = document.getElementById("widget-date");
  const menuRam = document.getElementById("menu-ram-stat");
  const widgetRam = document.getElementById("widget-ram");
  const widgetRamBar = document.getElementById("widget-ram-bar");

  function tick() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const shortTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

    if (menuClock) menuClock.textContent = shortTime;
    if (widgetTime) widgetTime.textContent = timeStr;
    if (widgetDate) widgetDate.textContent = dateStr;

    // Simulate realistic small RAM oscillations
    const jitter = (Math.random() * 2 - 1).toFixed(1);
    OS_STATE.ramUsage = Math.min(180, Math.max(38, (parseFloat(OS_STATE.ramUsage) + parseFloat(jitter)).toFixed(1)));
    
    if (menuRam) menuRam.textContent = `${OS_STATE.ramUsage} MB`;
    if (widgetRam) widgetRam.textContent = `${OS_STATE.ramUsage} MB / 512 MB`;
    if (widgetRamBar) {
      const pct = (OS_STATE.ramUsage / 512) * 100;
      widgetRamBar.style.width = `${pct}%`;
    }
  }

  setInterval(tick, 1000);
  tick();
}

// --- THEME ENGINE ---
function setTheme(themeName) {
  document.body.setAttribute("data-theme", themeName);
  localStorage.setItem("AETHER_THEME", themeName);
  OS_STATE.currentTheme = themeName;

  const matrixCanvas = document.getElementById("live-matrix-canvas");
  if (themeName === "cybermatrix") {
    matrixCanvas.classList.remove("hidden");
    startMatrixAnimation();
  } else {
    matrixCanvas.classList.add("hidden");
    stopMatrixAnimation();
  }
}

// CyberMatrix Canvas Rain Animation
function startMatrixAnimation() {
  const canvas = document.getElementById("live-matrix-canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const chars = "010101ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%&*";
  const fontSize = 14;
  const cols = Math.floor(canvas.width / fontSize);
  const drops = Array(cols).fill(1);

  if (OS_STATE.matrixInterval) clearInterval(OS_STATE.matrixInterval);

  OS_STATE.matrixInterval = setInterval(() => {
    ctx.fillStyle = "rgba(0, 10, 2, 0.08)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#22c55e";
    ctx.font = `${fontSize}px monospace`;

    for (let i = 0; i < drops.length; i++) {
      const char = chars[Math.floor(Math.random() * chars.length)];
      ctx.fillText(char, i * fontSize, drops[i] * fontSize);
      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
  }, 40);
}

function stopMatrixAnimation() {
  if (OS_STATE.matrixInterval) {
    clearInterval(OS_STATE.matrixInterval);
    OS_STATE.matrixInterval = null;
  }
}

// --- WINDOW MANAGER ENGINE ---
class WindowManager {
  constructor() {
    this.layer = document.getElementById("window-layer");
    this.windows = new Map();
    this.topZ = 100;
  }

  create({ id, title, icon, width = 500, height = 340, render }) {
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
    win.style.left = `${80 + this.windows.size * 25}px`;
    win.style.zIndex = ++this.topZ;

    win.innerHTML = `
      <div class="window-titlebar">
        <div class="window-traffic-lights">
          <button class="win-dot dot-close"></button>
          <button class="win-dot dot-min"></button>
          <button class="win-dot dot-max"></button>
        </div>
        <div class="window-name">${icon} ${title}</div>
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
      win.style.top = win.style.top === "30px" ? "100px" : "30px";
      win.style.left = win.style.left === "0px" ? "100px" : "0px";
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
      target.style.top = `${Math.max(30, e.clientY - oy)}px`;
    });
    document.addEventListener("mouseup", () => dragging = false);
  }
}

// --- APPS DEFINITION ---
const APPS = {
  themes(body) {
    body.innerHTML = `
      <h3 style="margin-bottom:0.75rem; font-size:0.95rem;">Desktop Appearance Studio</h3>
      <div class="theme-grid">
        <div class="theme-card" data-t="sakura">
          <span style="font-size:1.8rem">🌸</span>
          <strong>Strawberry Sakura</strong>
          <small style="color:var(--text-sub)">Soft pink glass aesthetic</small>
        </div>
        <div class="theme-card" data-t="cybermatrix">
          <span style="font-size:1.8rem">🟢</span>
          <strong>CyberMatrix</strong>
          <small style="color:var(--text-sub)">Live digital rain animation</small>
        </div>
        <div class="theme-card" data-t="minecraft">
          <span style="font-size:1.8rem">⛏️</span>
          <strong>Minecraft</strong>
          <small style="color:var(--text-sub)">8-bit dirt & stone styling</small>
        </div>
        <div class="theme-card" data-t="synthwave">
          <span style="font-size:1.8rem">🌆</span>
          <strong>Synthwave 80s</strong>
          <small style="color:var(--text-sub)">Neon purple & sunset tones</small>
        </div>
        <div class="theme-card" data-t="darkvoid">
          <span style="font-size:1.8rem">🌌</span>
          <strong>Dark Void</strong>
          <small style="color:var(--text-sub)">Minimalist deep slate UI</small>
        </div>
      </div>
    `;
    body.querySelectorAll(".theme-card").forEach(c => {
      c.onclick = () => setTheme(c.dataset.t);
    });
  },

  terminal(body) {
    body.innerHTML = `
      <div class="term-box">
        <div class="term-log" id="term-log">
          <div>Aether-OS Kernel [Version 2.5.0-Win7-Native]</div>
          <div>Type 'help' to show all procedures.</div>
        </div>
        <div class="term-prompt-row">
          <span style="color:var(--accent)">aether@user:~$</span>
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
        row.innerHTML = `<span style="color:var(--accent)">aether@user:~$</span> ${cmd}`;
        log.appendChild(row);

        const out = document.createElement("div");
        switch(cmd) {
          case "help":
            out.textContent = "Commands: help, theme [name], clear, date, free, restart";
            break;
          case "theme sakura":
          case "theme cybermatrix":
          case "theme minecraft":
          case "theme synthwave":
          case "theme darkvoid":
            const t = cmd.split(" ")[1];
            setTheme(t);
            out.textContent = `Theme switched to '${t}'`;
            break;
          case "clear":
            log.innerHTML = "";
            input.value = "";
            return;
          case "date":
            out.textContent = new Date().toString();
            break;
          case "free":
            out.textContent = `RAM Allocated: ${OS_STATE.ramUsage} MB / 512 MB`;
            break;
          case "restart":
            window.location.reload();
            return;
          default:
            out.textContent = cmd ? `Unknown shell command: '${cmd}'` : "";
        }
        log.appendChild(out);
        input.value = "";
        body.scrollTop = body.scrollHeight;
      }
    };
  },

  files(body, wm) {
    const raw = localStorage.getItem("AETHER_NOTES_STORAGE") || "Welcome to Aether-OS!\nZero AI bloat.";
    body.innerHTML = `
      <div style="font-size:0.8rem; margin-bottom:0.75rem;">Persistent Local Disk (/user/storage)</div>
      <div style="display:flex; gap:1rem;">
        <div class="desktop-icon" id="file-item-notes" style="width:80px">
          <div class="icon-glyph">📄</div>
          <span>notes.txt</span>
        </div>
      </div>
    `;
    body.querySelector("#file-item-notes").onclick = () => {
      wm.create({ id: "editor", title: "Notes", icon: "📝", render: APPS.editor });
    };
  },

  editor(body) {
    const saved = localStorage.getItem("AETHER_NOTES_STORAGE") || "Type your thoughts, code, or ideas here...";
    body.innerHTML = `
      <div class="notes-container">
        <div style="display:flex; justify-content:space-between;">
          <span style="font-size:0.75rem; color:var(--text-sub)">Autosaved to localStorage</span>
          <button class="btn-ui" id="btn-save-note">Commit</button>
        </div>
        <textarea class="notes-area" id="notes-content">${saved}</textarea>
      </div>
    `;
    const area = body.querySelector("#notes-content");
    body.querySelector("#btn-save-note").onclick = () => {
      localStorage.setItem("AETHER_NOTES_STORAGE", area.value);
      alert("Note successfully saved to persistent browser storage.");
    };
  },

  painter(body) {
    body.innerHTML = `
      <div class="canvas-wrap">
        <div class="canvas-tools">
          <input type="color" id="paint-col" value="#ff7597" />
          <input type="range" id="paint-size" min="1" max="25" value="4" />
          <button class="btn-ui" id="paint-clear">Clear</button>
        </div>
        <canvas id="paint-board" width="460" height="230"></canvas>
      </div>
    `;
    const canvas = body.querySelector("#paint-board");
    const ctx = canvas.getContext("2d");
    let drawing = false;

    canvas.onmousedown = () => drawing = true;
    window.addEventListener("mouseup", () => {
      drawing = false;
      ctx.beginPath();
    });

    canvas.onmousemove = (e) => {
      if (!drawing) return;
      const rect = canvas.getBoundingClientRect();
      ctx.lineWidth = body.querySelector("#paint-size").value;
      ctx.lineCap = "round";
      ctx.strokeStyle = body.querySelector("#paint-col").value;
      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    };

    body.querySelector("#paint-clear").onclick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  },

  monitor(body) {
    body.innerHTML = `
      <h3 style="font-size:0.9rem; margin-bottom:0.6rem;">System Resources & Status</h3>
      <div style="font-size:0.8rem; display:flex; flex-direction:column; gap:0.4rem; color:var(--text-sub)">
        <div>OS Engine: <strong>AetherOS v2.5</strong></div>
        <div>Platform: <strong>Windows 7 Ultimate (x86_64 Browser Subsystem)</strong></div>
        <div>Active Theme: <strong>${OS_STATE.currentTheme}</strong></div>
        <div>Heap Memory: <strong>${OS_STATE.ramUsage} MB</strong></div>
      </div>
    `;
  }
};

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
  const WM = new WindowManager();
  initSystemStats();
  setTheme(OS_STATE.currentTheme);

  function launch(appId) {
    switch(appId) {
      case "themes":
        WM.create({ id: "themes", title: "Theme Studio", icon: "🎨", width: 480, height: 360, render: APPS.themes });
        break;
      case "terminal":
        WM.create({ id: "terminal", title: "Terminal", icon: "⚡", width: 540, height: 320, render: APPS.terminal });
        break;
      case "files":
        WM.create({ id: "files", title: "Storage", icon: "📁", width: 440, height: 280, render: APPS.files });
        break;
      case "editor":
        WM.create({ id: "editor", title: "Notes", icon: "📝", width: 480, height: 320, render: APPS.editor });
        break;
      case "painter":
        WM.create({ id: "painter", title: "Painter", icon: "🖌️", width: 500, height: 350, render: APPS.painter });
        break;
      case "monitor":
        WM.create({ id: "monitor", title: "SysInfo", icon: "📊", width: 420, height: 260, render: APPS.monitor });
        break;
    }
  }

  // Bind Desktop Icons and Dock items
  document.querySelectorAll("[data-app]").forEach(el => {
    el.addEventListener("click", () => launch(el.dataset.app));
  });

  // Start Menu (Apple Button + Physical Windows Key)
  const startBtn = document.getElementById("apple-start-btn");
  const startMenu = document.getElementById("start-menu");

  function toggleStartMenu(e) {
    if (e) e.stopPropagation();
    startMenu.classList.toggle("hidden");
  }

  startBtn.addEventListener("click", toggleStartMenu);

  // Trigger Start Menu via Real Physical Windows / Super Key
  window.addEventListener("keydown", (e) => {
    if (e.key === "Meta" || e.code === "OSLeft" || e.code === "OSRight") {
      e.preventDefault();
      toggleStartMenu();
    }
  });

  document.addEventListener("click", () => startMenu.classList.add("hidden"));
  startMenu.addEventListener("click", (e) => e.stopPropagation());

  document.getElementById("reboot-os-btn").onclick = () => window.location.reload();

  // Desktop Right Click Menu
  const ctxMenu = document.getElementById("context-menu");
  const desktop = document.getElementById("desktop");

  desktop.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    ctxMenu.style.left = `${e.clientX}px`;
    ctxMenu.style.top = `${e.clientY}px`;
    ctxMenu.classList.remove("hidden");
  });

  document.addEventListener("click", () => ctxMenu.classList.add("hidden"));

  document.getElementById("ctx-refresh").onclick = () => window.location.reload();
  document.getElementById("ctx-change-theme").onclick = () => launch("themes");
  document.getElementById("ctx-open-term").onclick = () => launch("terminal");
  document.getElementById("ctx-new-note").onclick = () => launch("editor");

  // Default initial app launch
  launch("themes");
});