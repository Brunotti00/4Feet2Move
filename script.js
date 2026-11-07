// 4Feet2Move – kleine, losse onderdelen. Elk onderdeel doet niets als het
// bijbehorende element niet op de pagina staat, dus dit script kan overal laden.

const root = document.documentElement;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");

// Jaartal in de footer
document.querySelectorAll("[data-year]").forEach((el) => {
  el.textContent = new Date().getFullYear();
});

// Melding na versturen van het contactformulier (?verzonden=1)
const notice = document.querySelector("[data-sent-notice]");
if (notice && new URLSearchParams(location.search).has("verzonden")) {
  notice.hidden = false;
}

// Onderwerp vooraf kiezen via ?onderwerp=Proefles25 (knoppen op andere pagina's)
const subject = document.getElementById("onderwerp");
const wanted = new URLSearchParams(location.search).get("onderwerp");
if (subject && wanted && [...subject.options].some((o) => o.value === wanted)) {
  subject.value = wanted;
}

// Dialog (Skala-uitleg): knop opent, kruisje/knop/achtergrond/Esc sluit
document.querySelectorAll("[data-open-dialog]").forEach((btn) => {
  const dialog = document.getElementById(btn.dataset.openDialog);
  if (!dialog || typeof dialog.showModal !== "function") return;
  btn.addEventListener("click", () => {
    dialog.showModal();
    root.classList.add("has-dialog");
    dialog.querySelector(".dialog__inner").scrollTop = 0;
  });
  dialog.addEventListener("close", () => root.classList.remove("has-dialog"));
  dialog.addEventListener("click", (e) => {
    // klik op de donkere achtergrond (buiten het witte vak) sluit
    if (e.target === dialog || e.target.closest("[data-close]")) dialog.close();
  });
});

// Zachte fade-in bij scrollen
if (!reduceMotion.matches && "IntersectionObserver" in window) {
  root.classList.add("js");
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
  );
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
}

// Beoordelingen-slider (home) -------------------------------------------
const slider = document.querySelector(".slider");
if (slider) {
  const slides = [...slider.children];
  const dotsEl = document.querySelector(".dots");
  const view = document.querySelector(".slider-view");
  let index = 0;
  let timer = null;

  const dots = slides.map((_, i) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", `Beoordeling ${i + 1}`);
    dot.addEventListener("click", () => show(i, true));
    dotsEl.append(dot);
    return dot;
  });

  function show(i, byUser = false) {
    index = (i + slides.length) % slides.length;
    slider.style.transform = `translateX(${-index * 100}%)`;
    slides.forEach((slide, n) => slide.toggleAttribute("inert", n !== index));
    dots.forEach((dot, n) => dot.setAttribute("aria-current", n === index));
    if (byUser) stop();
  }

  const start = () => {
    if (!reduceMotion.matches && !timer) timer = setInterval(() => show(index + 1), 7000);
  };
  const stop = () => {
    clearInterval(timer);
    timer = null;
  };

  document.querySelector(".slider-prev").addEventListener("click", () => show(index - 1, true));
  document.querySelector(".slider-next").addEventListener("click", () => show(index + 1, true));
  view.addEventListener("mouseenter", stop);
  view.addEventListener("focusin", stop);
  view.addEventListener("mouseleave", start);

  // swipe op touchscreens
  let x0 = null;
  view.addEventListener("touchstart", (e) => (x0 = e.touches[0].clientX), { passive: true });
  view.addEventListener("touchend", (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1), true);
    x0 = null;
  });

  show(0);
  start();
}

// Zwevende vormen --------------------------------------------------------------
// In elke .pattern-sectie dwalen een paar roze, golvende vormen rond (vlak, zonder rand
// of glans). Raken twee vormen elkaar, dan kaatsen ze precies op hun rand af: de
// botsing gebruikt de echte, steeds veranderende omtrek van elke vorm. Aan de rand van
// de sectie verdwijnt een vorm; na een korte pauze komt er elders een nieuwe binnen
// (willekeurige plek, grootte en vorm). Alleen zichtbare secties worden berekend; bij
// een verborgen tab pauzeert alles; bij "verminderde beweging" staan ze stil.
const tanks = [...document.querySelectorAll(".pattern")].map((sec) => {
  const wrap = document.createElement("div");
  wrap.className = "blobs";
  wrap.setAttribute("aria-hidden", "true");
  const canvas = document.createElement("canvas");
  wrap.append(canvas);
  sec.prepend(wrap);
  return { sec, canvas, ctx: canvas.getContext("2d"), w: 0, h: 0, blobs: [], visible: false };
});

if (tanks.length) {
  const mobile = matchMedia("(max-width: 767px)");
  const TAU = Math.PI * 2;
  const BINS = 72;
  let last = 0;
  let raf = 0;
  let clock = 0; // seconden, voor het langzaam veranderen van de vorm

  const rnd = (a, b) => a + Math.random() * (b - a);

  // Vorm = vier kwart-ellipsen (zoals border-radius): h* = breedte-aandeel, v* = hoogte-aandeel
  function shapeAt(b, t) {
    const w = (p) => 0.5 + b.amp * Math.sin(t * p.f + p.ph);
    const htl = w(b.p[0]), hbl = w(b.p[1]), vtl = w(b.p[2]), vtr = w(b.p[3]);
    return { htl, htr: 1 - htl, hbl, hbr: 1 - hbl, vtl, vbl: 1 - vtl, vtr, vbr: 1 - vtr };
  }

  // omtrek-punten (relatief aan het middelpunt, kloksgewijs) en hun poolhoek/-straal
  function outline(b, sh) {
    const s = b.size, c = s / 2, pts = [];
    const corner = (cx, cy, rx, ry, a0, a1) => {
      for (let i = 0; i <= 10; i++) {
        const a = a0 + ((a1 - a0) * i) / 10;
        pts.push([cx + rx * Math.cos(a) - c, cy + ry * Math.sin(a) - c]);
      }
    };
    corner(sh.htl * s, sh.vtl * s, sh.htl * s, sh.vtl * s, Math.PI, Math.PI * 1.5);
    corner(s - sh.htr * s, sh.vtr * s, sh.htr * s, sh.vtr * s, Math.PI * 1.5, TAU);
    corner(s - sh.hbr * s, s - sh.vbr * s, sh.hbr * s, sh.vbr * s, 0, Math.PI / 2);
    corner(sh.hbl * s, s - sh.vbl * s, sh.hbl * s, sh.vbl * s, Math.PI / 2, Math.PI);
    return pts;
  }

  // straal van het middelpunt tot de rand, per richting (tabel met BINS richtingen)
  function polar(b) {
    const pts = outline(b, b.sh);
    const A = [], R = [];
    let prev = -Infinity;
    pts.forEach(([x, y]) => {
      let a = Math.atan2(y, x);
      while (a < prev) a += TAU;
      A.push(a); R.push(Math.hypot(x, y)); prev = a;
    });
    A.push(A[0] + TAU); R.push(R[0]);
    const table = new Float32Array(BINS);
    let max = 0;
    for (let k = 0; k < BINS; k++) {
      let th = (k / BINS) * TAU;
      while (th < A[0]) th += TAU;
      while (th >= A[0] + TAU) th -= TAU;
      let j = 0;
      while (j < A.length - 2 && A[j + 1] <= th) j++;
      const f = (th - A[j]) / (A[j + 1] - A[j] || 1);
      table[k] = R[j] + (R[j + 1] - R[j]) * f;
      if (table[k] > max) max = table[k];
    }
    b.table = table;
    b.maxR = max;
  }

  // straal in wereld-richting phi (rekening houdend met de vaste draaiing van de vorm)
  function radius(b, phi) {
    let x = (((phi - b.rot) % TAU) + TAU) % TAU;
    x = (x / TAU) * BINS;
    const i = Math.floor(x) % BINS, f = x - Math.floor(x);
    return b.table[i] + (b.table[(i + 1) % BINS] - b.table[i]) * f;
  }

  function makeBlob(size, x, y, vx, vy) {
    const b = {
      size, x, y, vx, vy, rot: rnd(0, TAU), alive: true, wait: 0,
      amp: rnd(0.08, 0.14), a: rnd(0.55, 0.9),
      p: [0, 1, 2, 3].map(() => ({ f: TAU / rnd(12, 24), ph: rnd(0, TAU) })),
    };
    b.sh = shapeAt(b, clock);
    polar(b);
    return b;
  }

  function newSize(tank) {
    const k = mobile.matches ? 0.65 : 1;
    // een paar grote, de rest klein tot middel (nooit breder dan 70% van de sectie)
    return Math.min((Math.random() < 0.4 ? rnd(170, 300) : rnd(60, 140)) * k, tank.w * 0.7);
  }

  function overlapsAny(tank, x, y, r, skip) {
    return tank.blobs.some((o) => o !== skip && o.alive && Math.hypot(o.x - x, o.y - y) < o.maxR + r);
  }

  function fill(tank) {
    const target = Math.max(3, Math.min(mobile.matches ? 5 : 7, Math.round(tank.h / 650) + 2));
    const blobs = [];
    tank.blobs = blobs;
    for (let n = 0, tries = 0; n < target && tries < 200; tries++) {
      const size = newSize(tank);
      const x = rnd(size * 0.4, Math.max(size * 0.4 + 1, tank.w - size * 0.4));
      const y = rnd(size * 0.4, Math.max(size * 0.4 + 1, tank.h - size * 0.4));
      if (overlapsAny(tank, x, y, size * 0.6, null)) continue;
      const ang = rnd(0, TAU), sp = rnd(10, 26) * (size < 150 ? 1.4 : 1);
      blobs.push(makeBlob(size, x, y, Math.cos(ang) * sp, Math.sin(ang) * sp));
      n++;
    }
  }

  // nieuwe vorm vlak buiten een willekeurige rand laten binnendrijven
  function respawn(tank, old) {
    const { w, h } = tank;
    for (let tries = 0; tries < 10; tries++) {
      const size = newSize(tank), r = size * 0.62, edge = Math.floor(Math.random() * 4);
      let x, y, ang;
      if (edge === 0) { x = rnd(0, w); y = -r - 4; ang = Math.PI / 2; }
      else if (edge === 1) { x = w + r + 4; y = rnd(0, h); ang = Math.PI; }
      else if (edge === 2) { x = rnd(0, w); y = h + r + 4; ang = -Math.PI / 2; }
      else { x = -r - 4; y = rnd(0, h); ang = 0; }
      if (overlapsAny(tank, x, y, r, old)) continue;
      ang += rnd(-0.6, 0.6);
      const sp = rnd(12, 28) * (size < 150 ? 1.4 : 1);
      Object.assign(old, makeBlob(size, x, y, Math.cos(ang) * sp, Math.sin(ang) * sp));
      return;
    }
    old.wait = 1.5; // geen vrije plek: even later opnieuw proberen
  }

  function resize(tank) {
    const w = tank.sec.offsetWidth, h = tank.sec.offsetHeight;
    if (!w || !h || (w === tank.w && h === tank.h)) return;
    const first = !tank.blobs.length;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    tank.w = w; tank.h = h;
    tank.canvas.width = Math.round(w * ratio);
    tank.canvas.height = Math.round(h * ratio);
    tank.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    if (first) fill(tank);
    draw(tank);
  }

  function step(tank, dt) {
    const { w, h, blobs: bs } = tank;
    for (const b of bs) {
      if (!b.alive) {
        b.wait -= dt;
        if (b.wait <= 0) respawn(tank, b);
        continue;
      }
      b.sh = shapeAt(b, clock);
      polar(b);
      // zachte slingering: de richting draait langzaam
      const turn = (Math.random() - 0.5) * 0.4 * dt, c = Math.cos(turn), s = Math.sin(turn);
      const vx = b.vx * c - b.vy * s; b.vy = b.vx * s + b.vy * c; b.vx = vx;
      b.x += b.vx * dt; b.y += b.vy * dt;
      const m = b.maxR + 6;
      if ((b.x < -m && b.vx < 0) || (b.x > w + m && b.vx > 0) || (b.y < -m && b.vy < 0) || (b.y > h + m && b.vy > 0)) {
        b.alive = false;
        b.wait = rnd(1.5, 6);
      }
    }
    // botsingen op de werkelijke rand van beide vormen. Meerdere rondes, zodat ook drie
    // vormen tegelijk netjes uit elkaar gaan; bij bijna dezelfde richting volgt toch een afstoot.
    for (let pass = 0; pass < 4; pass++) {
      let touched = false;
      for (let i = 0; i < bs.length; i++) {
        for (let j = i + 1; j < bs.length; j++) {
          const p = bs[i], q = bs[j];
          if (!p.alive || !q.alive) continue;
          const dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy) || 0.01;
          if (d >= p.maxR + q.maxR) continue;
          const phi = Math.atan2(dy, dx);
          const min = radius(p, phi) + radius(q, phi + Math.PI);
          if (d >= min) continue;
          touched = true;
          const nx = dx / d, ny = dy / d;
          const mp = p.size * p.size, mq = q.size * q.size, push = min - d;
          p.x -= nx * push * mq / (mp + mq); p.y -= ny * push * mq / (mp + mq);
          q.x += nx * push * mp / (mp + mq); q.y += ny * push * mp / (mp + mq);
          const rel = (p.vx - q.vx) * nx + (p.vy - q.vy) * ny;
          if (rel > -14) {
            // naar elkaar toe: elastisch kaatsen; bijna dezelfde kant op: toch een afstoot van 14 px/s
            const imp = (rel + (rel > 0 ? rel : 14)) / (mp + mq);
            p.vx -= imp * mq * nx; p.vy -= imp * mq * ny;
            q.vx += imp * mp * nx; q.vy += imp * mp * ny;
          }
        }
      }
      if (!touched) break;
    }
    for (const b of bs) {
      const sp = Math.hypot(b.vx, b.vy), lo = 9, hi = 40;
      if (sp > hi) { b.vx *= hi / sp; b.vy *= hi / sp; }
      else if (sp < lo) { const f = sp ? lo / sp : 1; b.vx = sp ? b.vx * f : lo; b.vy *= f; }
    }
  }

  function draw(tank) {
    const { ctx, w, h } = tank;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#f0bebe";
    for (const b of tank.blobs) {
      if (!b.alive) continue;
      const s = b.size, sh = b.sh;
      ctx.globalAlpha = b.a;
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rot);
      ctx.translate(-s / 2, -s / 2);
      ctx.beginPath();
      ctx.ellipse(sh.htl * s, sh.vtl * s, sh.htl * s, sh.vtl * s, 0, Math.PI, Math.PI * 1.5);
      ctx.ellipse(s - sh.htr * s, sh.vtr * s, sh.htr * s, sh.vtr * s, 0, Math.PI * 1.5, TAU);
      ctx.ellipse(s - sh.hbr * s, s - sh.vbr * s, sh.hbr * s, sh.vbr * s, 0, 0, Math.PI / 2);
      ctx.ellipse(sh.hbl * s, s - sh.vbl * s, sh.hbl * s, sh.vbl * s, 0, Math.PI / 2, Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  function frame(now) {
    raf = 0;
    const dt = Math.max(0, Math.min((now - last) / 1000, 0.05));
    last = now;
    clock += dt;
    let any = false;
    for (const tank of tanks) {
      if (!tank.visible) continue;
      any = true;
      step(tank, dt);
      draw(tank);
    }
    if (any) raf = requestAnimationFrame(frame);
  }

  function run() {
    if (raf || document.hidden || reduceMotion.matches) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  tanks.forEach(resize);

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        const tank = tanks.find((t) => t.sec === e.target);
        if (tank) tank.visible = e.isIntersecting;
      });
      run();
    },
    { rootMargin: "100px 0px" }
  );
  tanks.forEach((t) => io.observe(t.sec));

  if ("ResizeObserver" in window) {
    const ro = new ResizeObserver((entries) => {
      entries.forEach((e) => {
        const tank = tanks.find((t) => t.sec === e.target);
        if (tank) resize(tank);
      });
    });
    tanks.forEach((t) => ro.observe(t.sec));
  } else {
    addEventListener("resize", () => tanks.forEach(resize));
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else {
      run();
    }
  });

  reduceMotion.addEventListener("change", () => (reduceMotion.matches ? tanks.forEach(draw) : run()));
}
