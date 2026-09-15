var Session = {
  theme: localStorage.getItem("AETHER_THEME") || "industrial",
  trayStyle: localStorage.getItem("AETHER_TRAY") || "matte",
  activeWindowId: null,
  animFrameId: null,
  mediaStream: null
};

function bootTelemetry() {
  var topClock = document.getElementById("top-clock-val");
  var hudClock = document.getElementById("hud-clock");
  var hudCalendar = document.getElementById("hud-calendar");

  function refresh() {
    var d = new Date();
    var timeStr = d.toLocaleTimeString();
    var dateStr = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: '2-digit' }).toUpperCase();

    if (topClock) topClock.innerText = timeStr;
    if (hudClock) hudClock.innerText = timeStr;
    if (hudCalendar) hudCalendar.innerText = dateStr;
  }

  setInterval(refresh, 1000);
  refresh();
}

function bootWallpaper() {
  var canvas = document.getElementById("bg-canvas");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");

  function onResize() {
    canvas.width = window.innerWidth || document.documentElement.clientWidth || 800;
    canvas.height = window.innerHeight || document.documentElement.clientHeight || 600;
  }
  window.addEventListener("resize", onResize);
  onResize();

  var step = 32;

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (Session.theme === "phosphor") {
      ctx.strokeStyle = "rgba(34, 197, 94, 0.12)";
      ctx.lineWidth = 1;
      for (var x = 0; x < canvas.width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
    } else if (Session.theme === "industrial") {
      ctx.fillStyle = "#0a0d12";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = "rgba(255, 152, 0, 0.05)";
      ctx.lineWidth = 1;
      for (var ix = 0; ix < canvas.width; ix += step) {
        ctx.beginPath();
        ctx.moveTo(ix, 0);
        ctx.lineTo(ix, canvas.height);
        ctx.stroke();
      }
      for (var iy = 0; iy < canvas.height; iy += step) {
        ctx.beginPath();
        ctx.moveTo(0, iy);
        ctx.lineTo(canvas.width, iy);
        ctx.stroke();
      }
    } else if (Session.theme === "tactical") {
      ctx.strokeStyle = "rgba(56, 189, 248, 0.08)";
      ctx.lineWidth = 1;
      for (var ty = 0; ty < canvas.height; ty += step) {
        ctx.beginPath();
        ctx.moveTo(0, ty);
        ctx.lineTo(canvas.width, ty);
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

function WindowEngine() {
  this.container = document.getElementById("window-container");
  this.pool = {};
  this.depth = 100;
}

WindowEngine.prototype.mount = function(options) {
  var id = options.id;
  var title = options.title;
  var width = options.width || 520;
  var height = options.height || 340;
  var construct = options.construct;

  if (this.pool[id]) {
    this.bringToFront(id);
    return;
  }

  var self = this;
  var frame = document.createElement("div");
  frame.className = "aether-win active";
  frame.id = "win-node-" + id;
  frame.style.width = Math.min(width, (window.innerWidth || 800) - 40) + "px";
  frame.style.height = Math.min(height, (window.innerHeight || 600) - 80) + "px";
  frame.style.top = (60 + (Object.keys(this.pool).length * 24) % 140) + "px";
  frame.style.left = (60 + (Object.keys(this.pool).length * 24) % 140) + "px";
  frame.style.zIndex = ++this.depth;

  frame.innerHTML = 
    '<div class="win-titlebar">' +
      '<div class="win-controls">' +
        '<button class="ctrl-btn ctrl-close" title="Close">×</button>' +
        '<button class="ctrl-btn ctrl-min" title="Minimize">−</button>' +
        '<button class="ctrl-btn ctrl-max" title="Maximize">□</button>' +
      '</div>' +
      '<div class="win-caption">' + title.toUpperCase() + '</div>' +
      '<div style="width: 45px;"></div>' +
    '</div>' +
    '<div class="win-content"></div>';

  var contentArea = frame.querySelector(".win-content");
  construct(contentArea, this);

  frame.addEventListener("mousedown", function() {
    self.bringToFront(id);
  });

  this.attachDrag(frame.querySelector(".win-titlebar"), frame);

  frame.querySelector(".ctrl-close").onclick = function(e) {
    e.stopPropagation();
    self.destroy(id);
  };

  frame.querySelector(".ctrl-min").onclick = function(e) {
    e.stopPropagation();
    frame.classList.add("hidden");
  };

  frame.querySelector(".ctrl-max").onclick = function(e) {
    e.stopPropagation();
    var isMax = frame.style.width === "100vw";
    frame.style.top = isMax ? "60px" : "34px";
    frame.style.left = isMax ? "60px" : "0px";
    frame.style.width = isMax ? width + "px" : "100vw";
    frame.style.height = isMax ? height + "px" : "calc(100vh - 34px)";
  };

  if (!this.container) {
    this.container = document.getElementById("window-container");
  }
  this.container.appendChild(frame);
  this.pool[id] = frame;
  this.bringToFront(id);
};

WindowEngine.prototype.bringToFront = function(id) {
  for (var key in this.pool) {
    if (this.pool[key]) {
      this.pool[key].classList.remove("active");
    }
  }
  var target = this.pool[id];
  if (target) {
    target.classList.remove("hidden");
    target.classList.add("active");
    target.style.zIndex = ++this.depth;
    var label = document.getElementById("active-task-label");
    if (label) {
      var caption = target.querySelector(".win-caption");
      label.innerText = caption ? caption.innerText : "Desktop";
    }
  }
};

WindowEngine.prototype.destroy = function(id) {
  var node = this.pool[id];
  if (node) {
    if (id === "camera" && Session.mediaStream) {
      var tracks = Session.mediaStream.getTracks();
      for (var i = 0; i < tracks.length; i++) {
        tracks[i].stop();
      }
      Session.mediaStream = null;
    }
    node.parentNode.removeChild(node);
    delete this.pool[id];
  }
};

WindowEngine.prototype.attachDrag = function(bar, frame) {
  var ox = 0, oy = 0, moving = false;
  bar.onmousedown = function(e) {
    moving = true;
    ox = e.clientX - frame.offsetLeft;
    oy = e.clientY - frame.offsetTop;
  };
  document.addEventListener("mousemove", function(e) {
    if (!moving) return;
    var maxLeft = (window.innerWidth || 800) - 60;
    var maxTop = (window.innerHeight || 600) - 60;
    var nextLeft = Math.max(0, Math.min(e.clientX - ox, maxLeft));
    var nextTop = Math.max(34, Math.min(e.clientY - oy, maxTop));
    frame.style.left = nextLeft + "px";
    frame.style.top = nextTop + "px";
  });
  document.addEventListener("mouseup", function() {
    moving = false;
  });
};

var Catalog = {
  browser: function(body) {
    body.innerHTML = 
      '<div class="browser-view">' +
        '<div class="browser-bar">' +
          '<input type="text" id="url-in" class="browser-input" value="https://www.wikipedia.org" />' +
          '<button class="ui-action-btn" id="url-exec">GO</button>' +
        '</div>' +
        '<iframe id="web-frame" class="browser-frame" src="https://www.wikipedia.org"></iframe>' +
      '</div>';
    var input = body.querySelector("#url-in");
    var frame = body.querySelector("#web-frame");
    body.querySelector("#url-exec").onclick = function() {
      var target = input.value.trim();
      if (target.indexOf("http://") !== 0 && target.indexOf("https://") !== 0) {
        target = "https://" + target;
      }
      frame.src = target;
    };
  },

  camera: function(body) {
    body.innerHTML = 
      '<div style="display:flex; flex-direction:column; gap:8px; height:100%;">' +
        '<video id="webcam" style="width:100%; height:230px; background:#000; border:1px solid var(--panel-border); object-fit:cover;" autoplay playsinline></video>' +
        '<div style="display:flex; justify-content:space-between; align-items:center;">' +
          '<button class="ui-action-btn" id="btn-snap">SNAPSHOT</button>' +
          '<span style="font-size:0.7rem; font-family:\'JetBrains Mono\'; color:var(--text-muted);">WEBCAM API</span>' +
        '</div>' +
        '<canvas id="snap-sink" class="hidden"></canvas>' +
      '</div>';
    var video = body.querySelector("#webcam");
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(function(stream) {
          Session.mediaStream = stream;
          video.srcObject = stream;
        })
        .catch(function() {
          video.insertAdjacentHTML("afterend", "<p style='color:#e11d48; font-size:0.75rem;'>Hardware stream unavailable or permission denied.</p>");
        });
    } else {
      video.insertAdjacentHTML("afterend", "<p style='color:#e11d48; font-size:0.75rem;'>MediaDevices API not supported on this browser.</p>");
    }

    body.querySelector("#btn-snap").onclick = function() {
      var sink = body.querySelector("#snap-sink");
      sink.width = video.videoWidth || 640;
      sink.height = video.videoHeight || 480;
      sink.getContext("2d").drawImage(video, 0, 0);
      var a = document.createElement("a");
      a.download = "aether-capture.png";
      a.href = sink.toDataURL();
      a.click();
    };
  },

  calc: function(body) {
    body.innerHTML = 
      '<div style="display:flex; flex-direction:column; height:100%; gap:6px;">' +
        '<div class="calc-display" id="calc-val">0</div>' +
        '<div class="calc-table">' +
          '<button class="c-btn op" data-v="CLR">C</button>' +
          '<button class="c-btn op" data-v="(">(</button>' +
          '<button class="c-btn op" data-v=")">)</button>' +
          '<button class="c-btn op" data-v="/">/</button>' +
          '<button class="c-btn" data-v="7">7</button>' +
          '<button class="c-btn" data-v="8">8</button>' +
          '<button class="c-btn" data-v="9">9</button>' +
          '<button class="c-btn op" data-v="*">*</button>' +
          '<button class="c-btn" data-v="4">4</button>' +
          '<button class="c-btn" data-v="5">5</button>' +
          '<button class="c-btn" data-v="6">6</button>' +
          '<button class="c-btn op" data-v="-">-</button>' +
          '<button class="c-btn" data-v="1">1</button>' +
          '<button class="c-btn" data-v="2">2</button>' +
          '<button class="c-btn" data-v="3">3</button>' +
          '<button class="c-btn op" data-v="+">+</button>' +
          '<button class="c-btn" data-v="0">0</button>' +
          '<button class="c-btn" data-v=".">.</button>' +
          '<button class="c-btn op" data-v="BS">DEL</button>' +
          '<button class="c-btn op" data-v="=" style="background:var(--accent); color:#000;">=</button>' +
        '</div>' +
      '</div>';
    var screen = body.querySelector("#calc-val");
    var state = "";
    var buttons = body.querySelectorAll(".c-btn");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].onclick = function() {
        var val = this.getAttribute("data-v");
        if (val === "CLR") state = "";
        else if (val === "BS") state = state.slice(0, -1);
        else if (val === "=") {
          try {
            if (/^[0-9+\-*/().\s]+$/.test(state)) {
              state = String(eval(state));
            } else {
              state = "ERR";
            }
          } catch(err) {
            state = "ERR";
          }
        } else {
          state += val;
        }
        screen.innerText = state || "0";
      };
    }
  },

  calendar: function(body) {
    var now = new Date();
    var mList = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    var month = mList[now.getMonth()];
    var year = now.getFullYear();
    var day = now.getDate();
    var totalDays = new Date(year, now.getMonth() + 1, 0).getDate();

    var gridCells = "";
    for (var i = 1; i <= totalDays; i++) {
      gridCells += '<div class="cal-cell ' + (i === day ? 'today' : '') + '">' + i + '</div>';
    }

    body.innerHTML = 
      '<div class="cal-container">' +
        '<div class="cal-header-bar">' + month + ' ' + year + '</div>' +
        '<div class="cal-matrix">' +
          '<div class="head">SU</div><div class="head">MO</div>' +
          '<div class="head">TU</div><div class="head">WE</div>' +
          '<div class="head">TH</div><div class="head">FR</div>' +
          '<div class="head">SA</div>' +
          gridCells +
        '</div>' +
      '</div>';
  },

  themes: function(body) {
    body.innerHTML = 
      '<div>' +
        '<div class="theme-section-tag">PALETTES</div>' +
        '<div class="studio-table">' +
          '<button class="s-btn" data-t="industrial">Industrial Amber</button>' +
          '<button class="s-btn" data-t="phosphor">Phosphor Green</button>' +
          '<button class="s-btn" data-t="tactical">Tactical Blue</button>' +
          '<button class="s-btn" data-t="monolith">Monolith Crimson</button>' +
        '</div>' +
        '<div class="theme-section-tag" style="margin-top:1rem;">TRAY STYLES</div>' +
        '<div class="studio-table">' +
          '<button class="s-btn" data-s="matte">Matte Slate</button>' +
          '<button class="s-btn" data-s="cyber">High-Contrast Border</button>' +
          '<button class="s-btn" data-s="monolith">Solid Monolith</button>' +
        '</div>' +
      '</div>';

    var themeBtns = body.querySelectorAll("[data-t]");
    for (var i = 0; i < themeBtns.length; i++) {
      themeBtns[i].onclick = function() {
        updateTheme(this.getAttribute("data-t"));
      };
    }
    var trayBtns = body.querySelectorAll("[data-s]");
    for (var j = 0; j < trayBtns.length; j++) {
      trayBtns[j].onclick = function() {
        updateTrayStyle(this.getAttribute("data-s"));
      };
    }
  },

  terminal: function(body) {
    body.innerHTML = 
      '<div class="term-wrap">' +
        '<div class="term-scroll" id="term-out">' +
          '<div>Aether-OS Shell v2.4</div>' +
          '<div>Type \'help\' to view available commands.</div>' +
        '</div>' +
        '<div class="term-in-row">' +
          '<span class="term-prompt">&gt;</span>' +
          '<input type="text" class="term-input" id="term-input" autofocus />' +
        '</div>' +
      '</div>';

    var inp = body.querySelector("#term-input");
    var out = body.querySelector("#term-out");

    inp.onkeydown = function(e) {
      if (e.key === "Enter" || e.keyCode === 13) {
        var cmd = inp.value.trim().toLowerCase();
        var line = document.createElement("div");
        line.innerHTML = '<span class="term-prompt">&gt;</span> ' + cmd;
        out.appendChild(line);

        var res = document.createElement("div");
        if (cmd === "help") res.innerText = "Available: help, clear, date, reload";
        else if (cmd === "clear") { out.innerHTML = ""; inp.value = ""; return; }
        else if (cmd === "date") res.innerText = new Date().toString();
        else if (cmd === "reload") { window.location.reload(); return; }
        else res.innerText = cmd ? "Unknown command: " + cmd : "";

        out.appendChild(res);
        inp.value = "";
        out.scrollTop = out.scrollHeight;
      }
    };
  },

  editor: function(body) {
    var saved = localStorage.getItem("AETHER_STORAGE_NOTES") || "Aether-OS scratchpad notes.";
    body.innerHTML = 
      '<div style="display:flex; flex-direction:column; height:100%; gap:6px;">' +
        '<div style="display:flex; justify-content:space-between; align-items:center;">' +
          '<span style="font-size:0.7rem; font-family:\'JetBrains Mono\'; color:var(--text-muted);">localStorage/notes.txt</span>' +
          '<button class="ui-action-btn" id="note-write">SAVE</button>' +
        '</div>' +
        '<textarea id="note-buffer" style="flex:1; background:#000; border:1px solid var(--panel-border); border-radius:var(--radius-box); color:var(--text-bright); font-family:\'JetBrains Mono\'; font-size:0.78rem; padding:0.6rem; outline:none; resize:none;">' + saved + '</textarea>' +
      '</div>';

    body.querySelector("#note-write").onclick = function() {
      localStorage.setItem("AETHER_STORAGE_NOTES", body.querySelector("#note-buffer").value);
      alert("Saved to browser storage.");
    };
  },

  files: function(body, engine) {
    body.innerHTML = 
      '<div style="font-family:\'JetBrains Mono\'; font-size:0.72rem; color:var(--text-muted); margin-bottom:8px;">VIRTUAL FILESYSTEM</div>' +
      '<div style="display:flex; gap:8px;">' +
        '<div id="file-item" style="border:1px solid var(--panel-border); padding:8px 12px; cursor:pointer; font-family:\'JetBrains Mono\'; font-size:0.75rem; background:var(--win-head);">' +
          'notes.txt' +
        '</div>' +
      '</div>';

    body.querySelector("#file-item").onclick = function() {
      engine.mount({ id: "editor", title: "Scratchpad", construct: Catalog.editor });
    };
  },

  painter: function(body) {
    body.innerHTML = 
      '<div style="display:flex; flex-direction:column; height:100%; gap:6px;">' +
        '<div style="display:flex; gap:6px; align-items:center;">' +
          '<input type="color" id="draw-color" value="#ff9800" style="background:transparent; border:none; cursor:pointer;" />' +
          '<input type="range" id="draw-size" min="1" max="24" value="3" />' +
          '<button class="ui-action-btn" id="draw-wipe">CLEAR</button>' +
        '</div>' +
        '<canvas id="draw-board" width="460" height="230" style="background:#ffffff; border:1px solid var(--panel-border); cursor:crosshair; flex:1;"></canvas>' +
      '</div>';

    var cvs = body.querySelector("#draw-board");
    var ctx = cvs.getContext("2d");
    var active = false;

    cvs.onmousedown = function() { active = true; };
    window.addEventListener("mouseup", function() { active = false; ctx.beginPath(); });
    cvs.onmousemove = function(e) {
      if (!active) return;
      var rect = cvs.getBoundingClientRect();
      ctx.lineWidth = body.querySelector("#draw-size").value;
      ctx.lineCap = "square";
      ctx.strokeStyle = body.querySelector("#draw-color").value;
      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    };
    body.querySelector("#draw-wipe").onclick = function() { ctx.clearRect(0, 0, cvs.width, cvs.height); };
  }
};

window.onload = function() {
  var Engine = new WindowEngine();
  bootTelemetry();
  bootWallpaper();
  updateTheme(Session.theme);
  updateTrayStyle(Session.trayStyle);

  function executeApp(key) {
    if (key === "browser") Engine.mount({ id: "browser", title: "Web Navigator", width: 620, height: 400, construct: Catalog.browser });
    else if (key === "camera") Engine.mount({ id: "camera", title: "Camera Feed", width: 480, height: 360, construct: Catalog.camera });
    else if (key === "calc") Engine.mount({ id: "calc", title: "Calculator", width: 300, height: 340, construct: Catalog.calc });
    else if (key === "calendar") Engine.mount({ id: "calendar", title: "Calendar", width: 320, height: 280, construct: Catalog.calendar });
    else if (key === "themes") Engine.mount({ id: "themes", title: "Theme Studio", width: 400, height: 300, construct: Catalog.themes });
    else if (key === "terminal") Engine.mount({ id: "terminal", title: "Terminal", width: 500, height: 300, construct: Catalog.terminal });
    else if (key === "editor") Engine.mount({ id: "editor", title: "Scratchpad", width: 460, height: 320, construct: Catalogue.painter});
else if (key === "files") Engine.mount({ id: "files", title: "File Manager", width: 380, height: 240, construct: Catalog.files });
   else if (key === "painter") Engine.mount({ id: "painter", title: "Canvas Painter", width: 480, height: 340, construct: Catalog.painter });
 }

 var launchButtons = document.querySelectorAll("[data-launch]");
 for (var i = 0; i < launchButtons.length; i++) {
   launchButtons[i].addEventListener("click", function(e) {
     e.stopPropagation();
     var key = this.getAttribute("data-launch");
     executeApp(key);
     var rootMenu = document.getElementById("root-menu");
     if (rootMenu) rootMenu.classList.add("hidden");
   });
 }

 var dock = document.getElementById("dock-shelf");
 var dockToggle = document.getElementById("dock-panel-toggle");
 if (dockToggle && dock) {
   dockToggle.onclick = function() { dock.classList.toggle("dock-closed"); };
 }

 var rootBtn = document.getElementById("pickaxe-menu-trigger");
 var rootMenu = document.getElementById("root-menu");

 function toggleRoot(e) {
   if (e) e.stopPropagation();
   if (rootMenu) rootMenu.classList.toggle("hidden");
 }

 if (rootBtn) rootBtn.addEventListener("click", toggleRoot);
 window.addEventListener("keydown", function(e) {
   if (e.key === "Meta" || e.keyCode === 91 || e.keyCode === 92) {
     e.preventDefault();
     toggleRoot();
   }
 });

 document.addEventListener("click", function() {
   if (rootMenu) rootMenu.classList.add("hidden");
   var ctx = document.getElementById("ctx-menu");
   if (ctx) ctx.classList.add("hidden");
 });

 if (rootMenu) {
   rootMenu.addEventListener("click", function(e) { e.stopPropagation(); });
 }

 var rebootBtn = document.getElementById("reboot-trigger");
 if (rebootBtn) rebootBtn.onclick = function() { window.location.reload(); };

 var ctx = document.getElementById("ctx-menu");
 var workspace = document.getElementById("workspace");
 if (workspace && ctx) {
   workspace.addEventListener("contextmenu", function(e) {
     e.preventDefault();
     ctx.style.left = e.clientX + "px";
     ctx.style.top = e.clientY + "px";
     ctx.classList.remove("hidden");
   });
 }

 if (ctx) {
   var ctxRows = ctx.querySelectorAll("[data-action]");
   for (var k = 0; k < ctxRows.length; k++) {
     ctxRows[k].addEventListener("click", function() {
       var act = this.getAttribute("data-action");
       if (act === "browser") executeApp("browser");
       else if (act === "notes") executeApp("editor");
       else if (act === "term") executeApp("terminal");
       else if (act === "themes") executeApp("themes");
       else if (act === "toggle-dock" && dock) dock.classList.toggle("dock-closed");
       else if (act === "reload") window.location.reload();
     });
   }
 }

 // Open the first application automatically
 executeApp("themes");
};