const Session = {
  theme: localStorage.getItem("AETHER_THEME") || "industrial",
  trayStyle: localStorage.getItem("AETHER_TRAY") || "matte",
  activeWindowId: null,
  animFrameId: null,
  mediaStream: null
};

function bootTelemetry() {
  const topClock = document.getElementById("top-clock-val");
  const hudClock = document.getElementById("hud-clock");
  const hudCalendar = document.getElementById("hud-calendar");

  function refresh() {
    const d = new Date();
    const timeStr = d.toLocaleTimeString([], { hour12: false });
    const dateStr = d.toLocaleDateString([], { weekday: 'short', month: 'short', day: '2-digit' }).toUpperCase();

    if (topClock) topClock.textContent = timeStr;
    if (hudClock) hudClock.textContent = timeStr;
    if (hudCalendar) hudCalendar.textContent = dateStr;
  }

  setInterval(refresh, 1000);
  refresh();
}

function bootWallpaper() {
  const canvas = document.getElementById("bg-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  function onResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", onResize);
  onResize();

  const step = 28;

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (Session.theme === "phosphor") {
      ctx.strokeStyle = "rgba(34, 197, 94, 0.08)";
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
    } else if (Session.theme === "industrial") {
      ctx.fillStyle = "#0a0d12";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = "rgba(255, 152, 0, 0.04)";
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    } else if (Session.theme === "tactical") {
      ctx.strokeStyle = "rgba(56, 189, 248, 0.06)";
      ctx.lineWidth = 1;
      for (let y = 0; y < canvas.height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    } else if (Session.theme === "monolith") {
      ctx.fillStyle = "#0d0a0b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
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
    frame.style.width = `${Math.min(width, window.innerWidth - 40)}px`;
    frame.style.height = `${Math.min(height, window.innerHeight - 80)}px`;
    frame.style.top = `${50 + (this.pool.size * 20) % 120}px`;
    frame.style.left = `${50 + (this.pool.size * 20) % 120}px`;
    frame.style.zIndex = ++this.depth;

    frame.innerHTML = `
      <div class="win-titlebar">
        <div class="win-controls">
          <button class="ctrl-btn ctrl-close" title="Close">×</button>
          <button class="ctrl-btn ctrl-min" title="Minimize">−</button>
          <button class="ctrl-btn ctrl-max" title="Maximize">□</button>
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
      frame.style.top = isMax ? "60px" : "34px";
      frame.style.left = isMax ? "60px" : "0px";
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
      const maxLeft = window.innerWidth - 60;
      const maxTop = window.innerHeight - 60;
      const nextLeft = Math.max(0, Math.min(e.clientX - ox, maxLeft));
      const nextTop = Math.max(34, Math.min(e.clientY - oy, maxTop));
      frame.style.left = `${nextLeft}px`;
      frame.style.top = `${nextTop}px`;
    });
    document.addEventListener("mouseup", () => moving = false);
  }
}

const Catalog = {
  browser(body) {
    body.innerHTML = `
      <div class="browser-view">
        <div class="browser-bar">
          <input type="text" id="url-in" class="browser-input" value="https://www.wikipedia.org" />
          <button class="ui-action-btn" id="url-exec">GO</button>
        </div>
        <iframe id="web-frame" class="browser-frame" src="https://www.wikipedia.org"></iframe>
      </div>
    `;
    const input = body.querySelector("#url-in");
    const frame = body.querySelector("#web-frame");
    body.querySelector("#url-exec").onclick = () => {
      let target = input.value.trim();
      if (!target.startsWith("http://") && !target.startsWith("https://")) {
        target = "https://" + target;
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
          <span style="font-size:0.7rem; font-family:'JetBrains Mono'; color:var(--text-muted);">WEBCAM API</span>
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
      .catch(() => {
        video.insertAdjacentHTML("afterend", "<p style='color:#e11d48; font-size:0.75rem;'>Hardware stream unavailable or permission denied.</p>");
      });

    body.querySelector("#btn-snap").onclick = () => {
      const sink = body.querySelector("#snap-sink");
      sink.width = video.videoWidth || 640;
      sink.height = video.videoHeight || 480;
      sink.getContext("2d").drawImage(video, 0, 0);
      const a = document.createElement("a");
      a.download = `aether-capture.png`;
      a.href = sink.toDataURL();
      a.click();
    };
  },

  calc(body) {
    body.innerHTML = `
      <div style="display:flex; flex-direction:column; height:100%; gap:6px;">
        <div class="calc-display" id="calc-val">0</div>
        <div class="calc-table">
          <button class="c-btn op" data-v="CLR">C</button>
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
          try {
            state = String(Function(`'use strict'; return (${state})`)());
          } catch {
            state = "ERR";
          }
        } else {
          state += val;
        }
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
        <div class="cal-header-bar">${month} ${year}</div>
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
        <div class="theme-section-tag">PALETTES</div>
        <div class="studio-table">
          <button class="s-btn" data-t="industrial">Industrial Amber</button>
          <button class="s-btn" data-t="phosphor">Phosphor Green</button>
          <button class="s-btn" data-t="tactical">Tactical Blue</button>
          <button class="s-btn" data-t="monolith">Monolith Crimson</button>
        </div>

        <div class="theme-section-tag" style="margin-top:1rem;">TRAY STYLES</div>
        <div class="studio-table">
          <button class="s-btn" data-s="matte">Matte Slate</button>
          <button class="s-btn" data-s="cyber">High-Contrast Border</button>
          <button class="s-btn" data-s="monolith">Solid Monolith</button>
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
          <div>Aether-OS Shell v2.4 (Vanilla JS)</div>
          <div>Type 'help' to view available commands.</div>
        </div>
        <div class="term-in-row">
          <span class="term-prompt">&gt;</span>
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
        line.innerHTML = `<span class="term-prompt">&gt;</span> ${cmd}`;
        out.appendChild(line);

        const res = document.createElement("div");
        if (cmd === "help") res.textContent = "Available: help, clear, date, echo [text], reload";
        else if (cmd === "clear") { out.innerHTML = ""; inp.value = ""; return; }
        else if (cmd === "date") res.textContent = new Date().toString();
        else if (cmd.startsWith("echo ")) res.textContent = cmd.slice(5);
        else if (cmd === "reload") { window.location.reload(); return; }
        else res.textContent = cmd ? `Unknown command: ${cmd}` : "";

        out.appendChild(res);
        inp.value = "";
        out.scrollTop = out.scrollHeight;
      }
    };
  },

  editor(body) {
    const saved = localStorage.getItem("AETHER_STORAGE_NOTES") || "Aether-OS scratchpad notes.";
    body.innerHTML = `
      <div style="display:flex; flex-direction:column; height:100%; gap:6px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:0.7rem; font-family:'JetBrains Mono'; color:var(--text-muted);">localStorage/notes.txt</span>
          <button class="ui-action-btn" id="note-write">SAVE</button>
        </div>
        <textarea id="note-buffer" style="flex:1; background:#000; border:1px solid var(--panel-border); border-radius:var(--radius-box); color:var(--text-bright); font-family:'JetBrains Mono'; font-size:0.78rem; padding:0.6rem; outline:none; resize:none;">${saved}</textarea>
      </div>
    `;
    body.querySelector("#note-write").onclick = () => {
      localStorage.setItem("AETHER_STORAGE_NOTES", body.querySelector("#note-buffer").value);
      alert("Saved to browser storage.");
    };
  },

  files(body, engine) {
    body.innerHTML = `
      <div style="font-family:'JetBrains Mono'; font-size:0.72rem; color:var(--text-muted); margin-bottom:8px;">VIRTUAL FILESYSTEM</div>
      <div style="display:flex; gap:8px;">
        <div id="file-item" style="border:1px solid var(--panel-border); padding:8px 12px; cursor:pointer; font-family:'JetBrains Mono'; font-size:0.75rem; background:var(--win-head);">
          notes.txt
        </div>
      </div>
    `;
    body.querySelector("#file-item").onclick = () => {
      engine.mount({ id: "editor", title: "Scratchpad", construct: Catalog.editor });
    };
  },

  painter(body) {
    body.innerHTML = `
      <div style="display:flex; flex-direction:column; height:100%; gap:6px;">
        <div style="display:flex; gap:6px; align-items:center;">
          <input type="color" id="draw-color" value="#ff9800" style="background:transparent; border:none; cursor:pointer;" />
          <input type="range" id="draw-size" min="1" max="24" value="3" />
          <button class="ui-action-btn" id="draw-wipe">CLEAR</button>
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

document.addEventListener("DOMContentLoaded", () => {
  const Engine = new WindowEngine();
  bootTelemetry();
  bootWallpaper();
  updateTheme(Session.theme);
  updateTrayStyle(Session.trayStyle);

  function executeApp(key) {
    switch (key) {
      case "browser":
        Engine.mount({ id: "browser", title: "Web Navigator", width: 620, height: 400, construct: Catalog.browser });
        break;
      case "camera":
        Engine.mount({ id: "camera", title: "Camera Feed", width: 480, height: 360, construct: Catalog.camera });
        break;
      case "calc":
        Engine.mount({ id: "calc", title: "Calculator", width: 300, height: 340, construct: Catalog.calc });
        break;
      case "calendar":
        Engine.mount({ id: "calendar", title: "Calendar", width: 320, height: 280, construct: Catalog.calendar });
        break;
      case "themes":
        Engine.mount({ id: "themes", title: "Theme Studio", width: 400, height: 300, construct: Catalog.themes });
        break;
      case "terminal":
        Engine.mount({ id: "terminal", title: "Terminal", width: 500, height: 300, construct: Catalog.terminal });
        break;
      case "editor":
        Engine.mount({ id: "editor", title: "Scratchpad", width: 460, height: 320, construct: Catalog.editor });
        break;
      case "files":
        Engine.mount({ id: "files", title: "File Manager", width: 380, height: 240, construct: Catalog.files });
        break;
      case "painter":
        Engine.mount({ id: "painter", title: "Canvas Painter", width: 480, height: 340, construct: Catalog.painter });
        break;
    }
  }

  document.querySelectorAll("[data-launch]").forEach(btn => {
    btn.addEventListener("click", () => executeApp(btn.dataset.launch));
  });

  const dock = document.getElementById("dock-shelf");
  document.getElementById("dock-panel-toggle").onclick = () => {
    dock.classList.toggle("dock-closed");
  };

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

  const ctx = document.getElementById("ctx-menu");
  document.getElementById("workspace").addEventListener("contextmenu", (e) => {
 