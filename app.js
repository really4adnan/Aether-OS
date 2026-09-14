/**
 * AETHER-OS WORKSTATION ENGINE
 * Handcrafted Core - Boxed Geometry, Matrix / Grid Canvas,
 * Persistent LocalStorage Drivers, and Hardware Telemetry.
 */

// Core Session State
const Session = {
  theme: localStorage.getItem("AETHER_THEME") || "industrial",
  trayStyle: localStorage.getItem("AETHER_TRAY") || "matte",
  ramAllocated: 44.8,
  activeWindowId: null,
  animFrameId: null,
  mediaStream: null
};

// --- REAL-TIME TELEMETRY & CLOCK ---
function bootTelemetry() {
  const topClock = document.getElementById("top-clock-val");
  const topRam = document.getElementById("top-ram-val");
  const hudClock = document.getElementById("hud-clock");
  const hudCalendar = document.getElementById("hud-calendar");
  const hudRamText = document.getElementById("hud-ram-text");
  const hudRamBar = document.getElementById("hud-ram-bar");

  function refresh() {
    const d = new Date();
    const timeStr = d.toLocaleTimeString([], { hour12: false });
    const dateStr = d.toLocaleDateString([], { weekday: 'short', month: 'short', day: '2-digit' }).toUpperCase();

    if (topClock) topClock.textContent = timeStr;
    if (hudClock) hudClock.textContent = timeStr;
    if (hudCalendar) hudCalendar.textContent = dateStr;

    // Small realistic memory fluctuations
    const delta = (Math.random() * 0.8 - 0.4).toFixed(1);
    Session.ramAllocated = Math.min(192, Math.max(38, (parseFloat(Session.ramAllocated) + parseFloat(delta)).toFixed(1)));

    if (topRam) topRam.textContent = `${Session.ramAllocated} MB`;
    if (hudRamText) hudRamText.textContent = `${Session.ramAllocated} / 512 MB`;
    if (hudRamBar) hudRamBar.style.width = `${(Session.ramAllocated / 512) * 100}%`;
  }

  setInterval(refresh, 1000);
  refresh();
}

// --- WALLPAPER & GRID ENGINE ---
function bootWallpaper() {
  const canvas = document.getElementById("bg-canvas");
  const ctx = canvas.getContext("2d");

  function onResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", onResize);
  onResize();

  // Matrix Stream Setup
  const charSet = "01010123456789ABCDEF!@#$%&*";
  const step = 14;
  let cols = Math.floor(window.innerWidth / step);
  let drops = Array(cols).fill(1);

  // Tactical Grid Setup
  let gridOffset = 0;

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (Session.theme === "phosphor") {
      ctx.fillStyle = "rgba(4, 8, 4, 0.2)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#22c55e";
      ctx.font = `${step}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const txt = charSet[Math.floor(Math.random() * charSet.length)];
        ctx.fillText(txt, i * step, drops[i] * step);
        if (drops[i] * step > canvas.height && Math.random() > 0.98) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    } else if (Session.theme === "industrial") {
      // Tech Blueprint Grid
      ctx.strokeStyle = "rgba(35, 40, 52, 0.45)";
      ctx.lineWidth = 1;
      const size = 36;

      for (let x = 0; x < canvas.width; x += size) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += size) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    } else if (Session.theme === "tactical") {
      // Horizon Perspective Grid
      ctx.strokeStyle = "rgba(56, 189, 248, 0.25)";
      ctx.lineWidth = 1;
      const horizon = canvas.height * 0.6;

      gridOffset = (gridOffset + 0.6) % 24;
      for (let y = horizon; y < canvas.height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y + gridOffset);
        ctx.lineTo(canvas.width, y + gridOffset);
        ctx.stroke();
      }
      for (let x = -canvas.width; x < canvas.width * 2; x += 80) {
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, horizon);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
    } else if (Session.theme === "monolith") {
      // Pure deep star drift
      ctx.fillStyle = "#f43f5e";
      for (let i = 0; i < 20; i++) {
        const px = (Math.sin(i * 99 + Date.now() * 0.0002) * 0.5 + 0.5) * canvas.width;
        const py = (Math.cos(i * 33 + Date.now() * 0.0001) * 0.5 + 0.5) * canvas.height;
        ctx.fillRect(px, py, 2, 2);
      }
    }

    Session.animFrameId = requestAnimationFrame(loop);
  }

  if (Session.animFrameId) cancelAnimationFrame(Session.animFrameId);
  loop();
}

function updateTheme(name) {
  Session.theme = name;
  document.body.setAttribute("data-theme", name);
  localStorage.setItem("AETHER_THEME", name);
}

function updateTrayStyle(styleName) {
  Session.trayStyle = styleName;
  document.body.setAttribute("data-tray", styleName);
  localStorage.setItem("AETHER_TRAY", styleName);
}

// --- WINDOW MANAGER SUBSYSTEM ---
class WindowEngine {
  constructor() {
    this.container = document.getElementById("window-container");
    this.pool = new Map();
    this.depth = 100;
  }

  mount({ id, title, width = 520, height = 340, construct }) {
    if (this.pool.has(id)) {
      this.bringToFront(id);
      return;
    }

    const frame = document.createElement("div");
    frame.className = "aether-win active";
    frame.id = `win-node-${id}`;
    frame.style.width = `${width}px`;
    frame.style.height = `${height}px`;
    frame.style.top = `${50 + this.pool.size * 22}px`;
    frame.style.left = `${60 + this.pool.size * 22}px`;
    frame.style.zIndex = ++this.depth;

    frame.innerHTML = `
      <div class="win-titlebar">
        <div class="win-controls">
          <button class="ctrl-btn ctrl-close" title="Terminate">×</button>
          <button class="ctrl-btn ctrl-min" title="Hide">−</button>
          <button class="ctrl-btn ctrl-max" title="Expand">□</button>
        </div>
        <div class="win-caption">${title.toUpperCase()}</div>
        <div style="width: 45px;"></div>
      </div>
      <div class="win-content"></div>
    `;

    construct(frame.querySelector(".win-content"), this);

    frame.addEventListener("mousedown", () => this.bringToFront(id));
    this.attachDrag(frame.querySelector(".win-titlebar"), frame);

    frame.querySelector(".ctrl-close").onclick = (e) => {
      e.stopPropagation();
      this.destroy(id);
    };

    frame.querySelector(".ctrl-min").onclick = (e) => {
      e.stopPropagation();
      frame.classList.add("hidden");
    };

    frame.querySelector(".ctrl-max").onclick = (e) => {
      e.stopPropagation();
      const isMax = frame.style.width === "100vw";
      frame.style.top = isMax ? "70px" : "34px";
      frame.style.left = isMax ? "70px" : "0px";
      frame.style.width = isMax ? `${width}px` : "100vw";
      frame.style.height = isMax ? `${height}px` : "calc(100vh - 34px)";
    };

    this.container.appendChild(frame);
    this.pool.set(id, frame);
    this.bringToFront(id);
  }

  bringToFront(id) {
    this.pool.forEach(node => node.classList.remove("active"));
    const target = this.pool.get(id);
    if (target) {
      target.classList.remove("hidden");
      target.classList.add("active");
      target.style.zIndex = ++this.depth;
      const label = document.getElementById("active-task-label");
      if (label) label.textContent = target.querySelector(".win-caption").textContent;
    }
  }

  destroy(id) {
    const node = this.pool.get(id);
    if (node) {
      if (id === "camera" && Session.mediaStream) {
        Session.mediaStream.getTracks().forEach(track => track.stop());
        Session.mediaStream = null;
      }
      node.remove();
      this.pool.delete(id);
    }
  }

  attachDrag(bar, frame) {
    let ox = 0, oy = 0, moving = false;
    bar.onmousedown = (e) => {
      moving = true;
      ox = e.clientX - frame.offsetLeft;
      oy = e.clientY - frame.offsetTop;
    };
    document.addEventListener("mousemove", (e) => {
      if (!moving) return;
      frame.style.left = `${e.clientX - ox}px`;
      frame.style.top = `${Math.max(34, e.clientY - oy)}px`;
    });
    document.addEventListener("mouseup", () => moving = false);
  }
}

// --- APPLICATIONS DIRECTORY ---
const Catalog = {
  browser(body) {
    body.innerHTML = `
      <div class="browser-view">
        <div class="browser-bar">
          <input type="text" id="url-in" class="browser-input" value="https://www.bing.com" />
          <button class="ui-action-btn" id="url-exec">FETCH</button>
        </div>
        <iframe id="web-frame" class="browser-frame" src="https://www.bing.com"></iframe>
      </div>
    `;
    const input = body.querySelector("#url-in");
    const frame = body.querySelector("#web-frame");
    body.querySelector("#url-exec").onclick = () => {
      let target = input.value.trim();
      if (!target.startsWith("http://") && !target.startsWith("https://")) {
        target = "https://www.google.com/search?q=" + encodeURIComponent(target);
      }
      frame.src = target;
    };
  },

  camera(body) {
    body.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:8px; height:100%;">
        <video id="webcam" style="width:100%; height:230px; background:#000; border:1px solid var(--panel-border); object-fit:cover;" autoplay playsinline></video>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <button class="ui-action-btn" id="btn-snap">SNAPSHOT</button>
          <span style="font-size:0.7rem; font-family:'JetBrains Mono'; color:var(--text-muted);">STREAM // ACTIVE</span>
        </div>
        <canvas id="snap-sink" class="hidden"></canvas>
      </div>
    `;
    const video = body.querySelector("#webcam");
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then(stream => {
        Session.mediaStream = stream;
        video.srcObject = stream;
      })
      .catch(() => alert("Hardware stream unavailable."));

    body.querySelector("#btn-snap").onclick = () => {
      const sink = body.querySelector("#snap-sink");
      sink.width = video.videoWidth || 640;
      sink.height = video.videoHeight || 480;
      sink.getContext("2d").drawImage(video, 0, 0);
      const a = document.createElement("a");
      a.download = `aether-capture-${Date.now()}.png`;
      a.href = sink.toDataURL();
      a.click();
    };
  },

  calc(body) {
    body.innerHTML = `
      <div style="display:flex; flex-direction:column; height:100%; gap:6px;">
        <div class="calc-display" id="calc-val">0</div>
        <div class="calc-table">
          <button class="c-btn op" data-v="CLR">CLR</button>
          <button class="c-btn op" data-v="(">(</button>
          <button class="c-btn op" data-v=")">)</button>
          <button class="c-btn op" data-v="/">/</button>
          <button class="c-btn" data-v="7">7</button>
          <button class="c-btn" data-v="8">8</button>
          <button class="c-btn" data-v="9">9</button>
          <button class="c-btn op" data-v="*">*</button>
          <button class="c-btn" data-v="4">4</button>
          <button class="c-btn" data-v="5">5</button>
          <button class="c-btn" data-v="6">6</button>
          <button class="c-btn op" data-v="-">-</button>
          <button class="c-btn" data-v="1">1</button>
          <button class="c-btn" data-v="2">2</button>
          <button class="c-btn" data-v="3">3</button>
          <button class="c-btn op" data-v="+">+</button>
          <button class="c-btn" data-v="0">0</button>
          <button class="c-btn" data-v=".">.</button>
          <button class="c-btn op" data-v="BS">DEL</button>
          <button class="c-btn op" data-v="=" style="background:var(--accent); color:#000;">=</button>
        </div>
      </div>
    `;
    const screen = body.querySelector("#calc-val");
    let state = "";
    body.querySelectorAll(".c-btn").forEach(b => {
      b.onclick = () => {
        const val = b.dataset.v;
        if (val === "CLR") state = "";
        else if (val === "BS") state = state.slice(0, -1);
        else if (val === "=") {
          try { state = String(Function(`'use strict'; return (${state})`)()); }
          catch { state = "ERR"; }
        } else state += val;
        screen.textContent = state || "0";
      };
    });
  },

  calendar(body) {
    const now = new Date();
    const mList = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const month = mList[now.getMonth()];
    const year = now.getFullYear();
    const day = now.getDate();
    const totalDays = new Date(year, now.getMonth() + 1, 0).getDate();

    let gridCells = "";
    for (let i = 1; i <= totalDays; i++) {
      gridCells += `<div class="cal-cell ${i === day ? 'today' : ''}">${i}</div>`;
    }

    body.innerHTML = `
      <div class="cal-container">
        <div class="cal-header-bar">${month} // ${year}</div>
        <div class="cal-matrix">
          <div class="head">SU</div><div class="head">MO</div>
          <div class="head">TU</div><div class="head">WE</div>
          <div class="head">TH</div><div class="head">FR</div>
          <div class="head">SA</div>
          ${gridCells}
        </div>
      </div>
    `;
  },

  themes(body) {
    body.innerHTML = `
      <div>
        <div class="theme-section-tag">// SYSTEM PALETTE</div>
        <div class="studio-table">
          <button class="s-btn" data-t="industrial">01 // Industrial Amber</button>
          <button class="s-btn" data-t="phosphor">02 // Phosphor Matrix</button>
          <button class="s-btn" data-t="tactical">03 // Tactical Navy</button>
          <button class="s-btn" data-t="monolith">04 // Monolith Crimson</button>
        </div>

        <div class="theme-section-tag" style="margin-top:1rem;">// TRAY INTERFACE GEOMETRY</div>
        <div class="studio-table">
          <button class="s-btn" data-s="matte">MODE // Matte Boxed</button>
          <button class="s-btn" data-s="cyber">MODE // Cyber Grid</button>
          <button class="s-btn" data-s="monolith">MODE // Monolith Solid</button>
        </div>
      </div>
    `;
    body.querySelectorAll("[data-t]").forEach(b => b.onclick = () => updateTheme(b.dataset.t));
    body.querySelectorAll("[data-s]").forEach(b => b.onclick = () => updateTrayStyle(b.dataset.s));
  },

  terminal(body) {
    body.innerHTML = `
      <div class="term-wrap">
        <div class="term-scroll" id="term-out">
          <div>Aether-OS Kernel [x86_64 Node Engine]</div>
          <div>Type 'help' for executable instructions.</div>
        </div>
        <div class="term-in-row">
          <span class="term-prompt">root@node:~$</span>
          <input type="text" class="term-input" id="term-input" autofocus />
        </div>
      </div>
    `;
    const inp = body.querySelector("#term-input");
    const out = body.querySelector("#term-out");

    inp.onkeydown = (e) => {
      if (e.key === "Enter") {
        const cmd = inp.value.trim().toLowerCase();
        const line = document.createElement("div");
        line.innerHTML = `<span class="term-prompt">root@node:~$</span> ${cmd}`;
        out.appendChild(line);

        const res = document.createElement("div");
        if (cmd === "help") res.textContent = "Commands: help, clear, date, mem, reload";
        else if (cmd === "clear") { out.innerHTML = ""; inp.value = ""; return; }
        else if (cmd === "date") res.textContent = new Date().toISOString();
        else if (cmd === "mem") res.textContent = `Heap: ${Session.ramAllocated} MB / 512 MB`;
        else if (cmd === "reload") { window.location.reload(); return; }
        else res.textContent = cmd ? `Unknown instruction: '${cmd}'` : "";

        out.appendChild(res);
        inp.value = "";
        out.scrollTop = out.scrollHeight;
      }
    };
  },

  editor(body) {
    const disk = localStorage.getItem("AETHER_STORAGE_NOTES") || "Aether-OS persistent document storage.";
    body.innerHTML = `
      <div style="display:flex; flex-direction:column; height:100%; gap:6px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:0.7rem; font-family:'JetBrains Mono'; color:var(--text-muted);">/user/storage/notes.txt</span>
          <button class="ui-action-btn" id="note-write">SYNC DISK</button>
        </div>
        <textarea id="note-buffer" style="flex:1; background:#000; border:1px solid var(--panel-border); border-radius:var(--radius-box); color:var(--text-bright); font-family:'JetBrains Mono'; font-size:0.78rem; padding:0.6rem; outline:none; resize:none;">${disk}</textarea>
      </div>
    `;
    body.querySelector("#note-write").onclick = () => {
      localStorage.setItem("AETHER_STORAGE_NOTES", body.querySelector("#note-buffer").value);
      alert("Committed to browser local storage.");
    };
  },

  files(body, engine) {
    body.innerHTML = `
      <div style="font-family:'JetBrains Mono'; font-size:0.72rem; color:var(--text-muted); margin-bottom:8px;">INDEX OF /user/storage</div>
      <div style="display:flex; gap:8px;">
        <div id="file-item" style="border:1px solid var(--panel-border); padding:8px 12px; cursor:pointer; font-family:'JetBrains Mono'; font-size:0.75rem; background:var(--win-head);">
          📄 notes.txt
        </div>
      </div>
    `;
    body.querySelector("#file-item").onclick = () => {
      engine.mount({ id: "editor", title: "Document Editor", construct: Catalog.editor });
    };
  },

  painter(body) {
    body.innerHTML = `
      <div style="display:flex; flex-direction:column; height:100%; gap:6px;">
        <div style="display:flex; gap:6px; align-items:center;">
          <input type="color" id="draw-color" value="#ff9800" style="background:transparent; border:none; cursor:pointer;" />
          <input type="range" id="draw-size" min="1" max="24" value="3" />
          <button class="ui-action-btn" id="draw-wipe">WIPE</button>
        </div>
        <canvas id="draw-board" width="460" height="230" style="background:#ffffff; border:1px solid var(--panel-border); cursor:crosshair; flex:1;"></canvas>
      </div>
    `;
    const cvs = body.querySelector("#draw-board");
    const ctx = cvs.getContext("2d");
    let active = false;

    cvs.onmousedown = () => active = true;
    window.addEventListener("mouseup", () => { active = false; ctx.beginPath(); });
    cvs.onmousemove = (e) => {
      if (!active) return;
      const rect = cvs.getBoundingClientRect();
      ctx.lineWidth = body.querySelector("#draw-size").value;
      ctx.lineCap = "square";
      ctx.strokeStyle = body.querySelector("#draw-color").value;
      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    };
    body.querySelector("#draw-wipe").onclick = () => ctx.clearRect(0, 0, cvs.width, cvs.height);
  }
};

// --- SUBSYSTEM INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
  const Engine = new WindowEngine();
  bootTelemetry();
  bootWallpaper();
  updateTheme(Session.theme);
  updateTrayStyle(Session.trayStyle);

  function executeApp(key) {
    switch (key) {
      case "browser": Engine.mount({ id: "browser", title: "Navigator", width: 620, height: 400, construct: Catalog.browser }); break;
      case "camera": Engine.mount({ id: "camera", title: "Optics Stream", width: 480, height: 360, construct: Catalog.camera }); break;
      case "calc": Engine.mount({ id: "calc", title: "Arithmetic Unit", width: 310, height: 360, construct: Catalog.calc }); break;
      case "calendar": Engine.mount({ id: "calendar", title: "Chrono Calendar", width: 330, height: 290, construct: Catalog.calendar }); break;
      case "themes": Engine.mount({ id: "themes", title: "Display Studio", width: 420, height: 320, construct: Catalog.themes }); break;
      case "terminal": Engine.mount({ id: "terminal", title: "Virtual Shell", width: 500, height: 300, construct: Catalog.terminal }); break;
      case "editor": Engine.mount({ id: "editor", title: "Document Editor", width: 460, height: 320, construct: Catalog.editor }); break;
      case "files": Engine.mount({ id: "files", title: "File Manager", width: 380, height: 240, construct: Catalog.files }); break;
      case "painter": Engine.mount({ id: "painter", title: "Bit Painter", width: 480, height: 340, construct: Catalog.painter }); break;
    }
  }

  // Bind Launch Controls
  document.querySelectorAll("[data-launch]").forEach(btn => {
    btn.addEventListener("click", () => executeApp(btn.dataset.launch));
  });

  // Dock Shelf Toggle
  const dock = document.getElementById("dock-shelf");
  document.getElementById("dock-panel-toggle").onclick = () => {
    dock.classList.toggle("dock-closed");
  };

  // Root Menu Toggle
  const rootBtn = document.getElementById("pickaxe-menu-trigger");
  const rootMenu = document.getElementById("root-menu");

  function toggleRoot(e) {
    if (e) e.stopPropagation();
    rootMenu.classList.toggle("hidden");
  }

  rootBtn.addEventListener("click", toggleRoot);
  window.addEventListener("keydown", (e) => {
    if (e.key === "Meta" || e.code === "OSLeft" || e.code === "OSRight") {
      e.preventDefault();
      toggleRoot();
    }
  });

  document.addEventListener("click", () => rootMenu.classList.add("hidden"));
  rootMenu.addEventListener("click", (e) => e.stopPropagation());
  document.getElementById("reboot-trigger").onclick = () => window.location.reload();

  // Desktop Context Menu
  const ctx = document.getElementById("ctx-menu");
  document.getElementById("workspace").addEventListener("contextmenu", (e) => {
    e.preventDefault();
    ctx.style.left = `${e.clientX}px`;
    ctx.style.top = `${e.clientY}px`;
    ctx.classList.remove("hidden");
  });

  document.addEventListener("click", () => ctx.classList.add("hidden"));

  ctx.querySelectorAll("[data-action]").forEach(el => {
    el.addEventListener("click", () => {
      const act = el.dataset.action;
      if (act === "browser") executeApp("browser");
      else if (act === "notes") executeApp("editor");
      else if (act === "term") executeApp("terminal");
      else if (act === "themes") executeApp("themes");
      else if (act === "toggle-dock") dock.classList.toggle("dock-closed");
      else if (act === "reload") window.location.reload();
    });
  });

  // Open Themes app on boot
  executeApp("themes");
});