/* 4Feet2Move - versie B: vanilla JS, geen afhankelijkheden */
(function () {
  "use strict";
  var doc = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---- Header: glas bij scrollen, voortgangslijn ---- */
  var header = $(".site-header");
  var sticky = $(".sticky-cta");
  var hero = $(".hero");
  var parallaxEls = reduce ? [] : $$("[data-parallax]");
  var ticking = false;

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (header) {
      header.classList.toggle("is-solid", y > 40);
      var h = document.body.scrollHeight - window.innerHeight;
      header.style.setProperty("--p", h > 0 ? Math.min(1, y / h).toFixed(4) : 0);
    }
    if (sticky) {
      var limit = hero ? hero.offsetHeight * 0.7 : 300;
      sticky.classList.toggle("is-visible", y > limit && !doc.classList.contains("at-end"));
    }
    var vh = window.innerHeight;
    parallaxEls.forEach(function (el) {
      var host = el.parentElement;
      var r = host.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      var speed = parseFloat(el.getAttribute("data-parallax")) || 0.15;
      var center = r.top + r.height / 2 - vh / 2;
      el.style.transform = "translate3d(0," + (-center * speed).toFixed(1) + "px,0)";
    });
    ticking = false;
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }
  window.addEventListener("scroll", req, { passive: true });
  window.addEventListener("resize", req);
  onScroll();

  /* sticky knop verbergen bij footer/contactblok */
  if (sticky && "IntersectionObserver" in window) {
    var hide = $$(".site-footer, .whatsapp-card");
    var inView = 0;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { inView += e.isIntersecting ? 1 : -1; });
      doc.classList.toggle("at-end", inView > 0);
      onScroll();
    });
    hide.forEach(function (el) { io.observe(el); });
  }

  /* ---- Mobiel menu ---- */
  var toggle = $(".menu-toggle");
  var nav = $(".nav");
  if (toggle && nav) {
    $$("a", nav).forEach(function (a, i) { a.style.setProperty("--i", i); });
    var setMenu = function (open) {
      header.classList.toggle("menu-open", open);
      document.body.classList.toggle("is-locked", open);
      toggle.setAttribute("aria-expanded", open);
      toggle.setAttribute("aria-label", open ? "Menu sluiten" : "Menu openen");
    };
    toggle.addEventListener("click", function () { setMenu(!header.classList.contains("menu-open")); });
    $$("a", nav).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && header.classList.contains("menu-open")) { setMenu(false); toggle.focus(); }
    });
    window.matchMedia("(min-width: 960px)").addEventListener("change", function (m) { if (m.matches) setMenu(false); });
  }

  /* ---- Scroll-reveal ---- */
  var reveals = $$(".reveal, .mask");
  if ("IntersectionObserver" in window && !reduce) {
    var ro = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var t = e.target.__reveal || e.target;
        t.classList.add("is-in");
        ro.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    reveals.forEach(function (el) {
      if (el.classList.contains("mask")) {
        /* clip-path op het element zelf telt mee voor IntersectionObserver: observeer de ouder */
        var host = el.parentElement;
        host.__reveal = el;
        ro.observe(host);
      } else ro.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---- Magnetische knoppen ---- */
  if (!reduce && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    $$(".btn:not(.nav .btn)").forEach(function (b) {
      b.addEventListener("mousemove", function (e) {
        var r = b.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.18;
        var y = (e.clientY - r.top - r.height / 2) * 0.28;
        b.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px)";
      });
      b.addEventListener("mouseleave", function () { b.style.transform = ""; });
    });
  }

  /* ---- Carousel ---- */
  $$("[data-carousel]").forEach(function (root) {
    var track = $(".carousel__track", root);
    var cards = $$(".rcard", track);
    var prev = $("[data-prev]", root);
    var next = $("[data-next]", root);
    var dotsEl = $(".dots", root);
    var dots = cards.map(function (c, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", "Ga naar review " + (i + 1));
      b.addEventListener("click", function () { goTo(i); });
      dotsEl.appendChild(b);
      return b;
    });
    function step() { return cards[0].getBoundingClientRect().width + 24; }
    function goTo(i) { track.scrollTo({ left: cards[i].offsetLeft - cards[0].offsetLeft, behavior: reduce ? "auto" : "smooth" }); }
    function update() {
      var max = track.scrollWidth - track.clientWidth;
      var idx = Math.round(track.scrollLeft / step());
      if (track.scrollLeft >= max - 4) idx = cards.length - 1;
      idx = Math.max(0, Math.min(cards.length - 1, idx));
      dots.forEach(function (d, i) { if (i === idx) d.setAttribute("aria-current", "true"); else d.removeAttribute("aria-current"); });
      prev.disabled = track.scrollLeft <= 4;
      next.disabled = track.scrollLeft >= max - 4;
      // passen alle kaarten al in beeld, dan zijn pijlen en puntjes overbodig
      root.classList.toggle("is-static", max <= 4);
    }
    prev.addEventListener("click", function () { track.scrollBy({ left: -step(), behavior: reduce ? "auto" : "smooth" }); });
    next.addEventListener("click", function () { track.scrollBy({ left: step(), behavior: reduce ? "auto" : "smooth" }); });
    track.addEventListener("scroll", function () { requestAnimationFrame(update); }, { passive: true });
    window.addEventListener("resize", update);
    update();
  });

  /* ---- FAQ-accordeon ---- */
  $$(".acc__btn").forEach(function (btn) {
    var panel = document.getElementById(btn.getAttribute("aria-controls"));
    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", !open);
      panel.classList.toggle("is-open", !open);
    });
  });
  if (location.hash && $(location.hash + ".acc__btn")) $(location.hash + ".acc__btn").click();

  /* ---- Skala der Ausbildung ---- */
  var skala = $("[data-skala]");
  if (skala) {
    var tabs = $$("[role=tab]", skala);
    var items = $$(".skala-item", skala);
    var phaseCards = $$("[data-fase-card]");
    var fases = { 1: [1, 2, 3], 2: [4, 5], 3: [6] };
    var faseOf = function (n) { return n <= 3 ? 1 : n <= 5 ? 2 : 3; };
    var current = 1;
    var select = function (n, focus, animate) {
      current = n;
      tabs.forEach(function (t) {
        var on = +t.dataset.n === n;
        t.setAttribute("aria-selected", on);
        t.tabIndex = on ? 0 : -1;
        if (on && focus) t.focus();
      });
      items.forEach(function (it) {
        var on = +it.dataset.n === n;
        it.hidden = !on;
        if (on && animate === false) it.style.animation = "none"; else it.style.animation = "";
      });
      phaseCards.forEach(function (c) { c.classList.toggle("is-active", +c.dataset.faseCard === faseOf(n)); });
    };
    var hl = function (f) { tabs.forEach(function (t) { t.classList.toggle("is-fase", !!f && faseOf(+t.dataset.n) === f); }); };
    tabs.forEach(function (t) {
      t.addEventListener("click", function () { select(+t.dataset.n); });
      t.addEventListener("keydown", function (e) {
        var k = e.key, n = current;
        if (k === "ArrowUp" || k === "ArrowLeft") n = Math.min(6, n + 1);
        else if (k === "ArrowDown" || k === "ArrowRight") n = Math.max(1, n - 1);
        else if (k === "Home") n = 1;
        else if (k === "End") n = 6;
        else return;
        e.preventDefault();
        select(n, true);
      });
    });
    phaseCards.forEach(function (c) {
      var f = +c.dataset.faseCard;
      c.addEventListener("mouseenter", function () { hl(f); });
      c.addEventListener("mouseleave", function () { hl(0); });
      $("button", c).addEventListener("focus", function () { hl(f); });
      $("button", c).addEventListener("blur", function () { hl(0); });
      $("button", c).addEventListener("click", function () {
        select(fases[f][0]);
        var target = $(".skala", document);
        if (target) target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
      });
    });
    select(1, false, false);
  }

  /* ---- Dialog (uitleg Skala) ---- */
  $$("[data-open-dialog]").forEach(function (btn) {
    var dlg = document.getElementById(btn.getAttribute("data-open-dialog"));
    if (!dlg) return;
    btn.addEventListener("click", function () {
      if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
    });
    $$("[data-close-dialog]", dlg).forEach(function (c) {
      c.addEventListener("click", function () { if (dlg.close) dlg.close(); else dlg.removeAttribute("open"); });
    });
    dlg.addEventListener("click", function (e) {
      if (e.target === dlg && dlg.close) dlg.close();
    });
  });

  /* ---- Zwevende vormen ----
     De vormen blijven golvend (CSS-morph) en dwalen langzaam rond. Raken twee vormen
     elkaar, dan kaatsen ze precies op hun rand af (geen overlap). Aan de rand van de
     sectie verdwijnt een vorm; na een korte pauze komt er elders, op een willekeurige
     plek aan de rand, een nieuwe vorm binnen (andere grootte/kleur).
     Alleen zichtbare secties worden berekend; bij "verminderde beweging" staat alles stil. */
  (function () {
    var sections = $$(".section, .hero").filter(function (s) { return s.querySelector(".blob"); });
    if (!sections.length || reduce) return;

    var small = window.matchMedia("(max-width: 700px)");
    var rnd = function (a, b) { return a + Math.random() * (b - a); };
    var rem = parseFloat(getComputedStyle(doc).fontSize) || 16;
    var RAD = 0.5; // straal = halve breedte: de vorm vult zijn vak, dus rand raakt rand

    // extra kleine vormen in dezelfde kleuren als de sectie zelf
    sections.forEach(function (sec) {
      var palette = $$(".blob", sec).map(function (el) {
        return (el.className.match(/blob--\w+/) || ["blob--blush"])[0];
      });
      sec.__palette = palette;
      var n = small.matches ? 2 : 3;
      for (var i = 0; i < n; i++) {
        var el = document.createElement("span");
        el.className = "blob " + palette[Math.floor(Math.random() * palette.length)];
        el.setAttribute("aria-hidden", "true");
        el.style.width = el.style.height = rnd(5, 11) + "rem";
        sec.insertBefore(el, sec.firstChild);
      }
    });

    // elke sectie krijgt een eigen laag die de vormen afknipt: ze komen nooit over de banner of een andere sectie heen
    sections.forEach(function (sec) {
      var layer = document.createElement("div");
      layer.className = "blob-layer";
      layer.setAttribute("aria-hidden", "true");
      $$(".blob", sec).forEach(function (el) { layer.appendChild(el); });
      sec.insertBefore(layer, sec.firstChild);
    });

    var tanks = sections.map(function (sec) {
      var sr = sec.getBoundingClientRect();
      var bubbles = $$(".blob", sec).map(function (el) {
        var r = el.getBoundingClientRect();
        var fresh = !el.style.left && !el.style.right && !el.style.top && !el.style.bottom;
        // nooit breder dan 75% van de sectie (op mobiel zijn de ontwerp-vormen anders breder dan het scherm)
        var size = Math.min(r.width, sr.width * 0.75);
        if (size < r.width) { el.style.width = el.style.height = size + "px"; }
        var a = rnd(0, Math.PI * 2), sp = rnd(12, 28) * (size < 220 ? 1.4 : 1);
        return {
          el: el, size: size, rad: size * RAD, alive: true, wait: 0,
          x: fresh ? rnd(size / 2, Math.max(size / 2 + 1, sr.width - size / 2)) : r.left - sr.left + size / 2,
          y: fresh ? rnd(size / 2, Math.max(size / 2 + 1, sr.height - size / 2)) : r.top - sr.top + size / 2,
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp
        };
      });
      return { sec: sec, bubbles: bubbles, visible: false };
    });
    // vanaf hier regelt het script de plaatsing (CSS-drift uit, positie via transform)
    doc.classList.add("physics");

    // Schuift een sectie (bv. contact) gedeeltelijk over de banner heen, dan begint de afknip pas
    // onder de banner. Zo komt een vorm nooit over de foto. Ook formaat bijstellen na een schermwissel.
    function fitToViewport() {
      tanks.forEach(function (t) {
        var layer = t.sec.firstChild, prev = t.sec.previousElementSibling;
        var cut = 0;
        if (prev && prev.classList.contains("hero")) {
          cut = Math.max(0, prev.getBoundingClientRect().bottom - t.sec.getBoundingClientRect().top);
        }
        layer.style.clipPath = cut ? "inset(" + Math.ceil(cut) + "px 0 0 0)" : "";
        var max = t.sec.clientWidth * 0.75;
        t.bubbles.forEach(function (b) {
          if (b.size > max) {
            b.size = max; b.rad = max * RAD;
            b.el.style.width = b.el.style.height = max + "px";
          }
        });
      });
    }
    fitToViewport();
    window.addEventListener("resize", fitToViewport);
    window.addEventListener("load", fitToViewport);

    function overlaps(t, x, y, rad, skip) {
      return t.bubbles.some(function (o) {
        return o !== skip && o.alive && Math.hypot(o.x - x, o.y - y) < o.rad + rad;
      });
    }

    // nieuwe vorm vlak buiten een willekeurige rand laten binnendrijven
    function respawn(t, b) {
      var w = t.sec.clientWidth, h = t.sec.clientHeight;
      var cap = small.matches ? 14 : 28;
      for (var tries = 0; tries < 10; tries++) {
        var size = Math.min(rnd(5, cap) * rem * (Math.random() < 0.45 ? 0.5 : 1), w * 0.75);
        var rad = size * RAD, edge = Math.floor(Math.random() * 4), x, y, ang;
        if (edge === 0) { x = rnd(0, w); y = -rad - 4; ang = Math.PI / 2; }
        else if (edge === 1) { x = w + rad + 4; y = rnd(0, h); ang = Math.PI; }
        else if (edge === 2) { x = rnd(0, w); y = h + rad + 4; ang = -Math.PI / 2; }
        else { x = -rad - 4; y = rnd(0, h); ang = 0; }
        if (overlaps(t, x, y, rad, b)) continue;
        var sp = rnd(14, 30) * (size < 220 ? 1.4 : 1);
        ang += rnd(-0.6, 0.6);
        var pal = t.sec.__palette;
        b.el.className = "blob " + pal[Math.floor(Math.random() * pal.length)];
        b.el.style.width = b.el.style.height = size + "px";
        b.size = size; b.rad = rad; b.x = x; b.y = y;
        b.vx = Math.cos(ang) * sp; b.vy = Math.sin(ang) * sp;
        b.alive = true; b.el.style.visibility = "";
        return;
      }
      b.wait = 1.5; // geen vrije plek: even later opnieuw proberen
    }

    function step(t, dt) {
      var w = t.sec.clientWidth, h = t.sec.clientHeight, bs = t.bubbles, i, j;
      for (i = 0; i < bs.length; i++) {
        var b = bs[i];
        if (!b.alive) {
          b.wait -= dt;
          if (b.wait <= 0) respawn(t, b);
          continue;
        }
        // zachte slingering: de richting draait langzaam, dat geeft een golvend pad
        var turn = (Math.random() - 0.5) * 0.4 * dt, cos = Math.cos(turn), sin = Math.sin(turn);
        var vx = b.vx * cos - b.vy * sin; b.vy = b.vx * sin + b.vy * cos; b.vx = vx;
        b.x += b.vx * dt; b.y += b.vy * dt;
        // helemaal buiten de sectie en nog van het beeld af bewegend: laat de vorm verdwijnen
        var gone = (b.x < -b.rad - 6 && b.vx < 0) || (b.x > w + b.rad + 6 && b.vx > 0) ||
                   (b.y < -b.rad - 6 && b.vy < 0) || (b.y > h + b.rad + 6 && b.vy > 0);
        if (gone) { b.alive = false; b.wait = rnd(1.5, 6); b.el.style.visibility = "hidden"; }
      }
      // botsingen: randen raken elkaar -> direct uit elkaar en afketsen (elastisch).
      // Meerdere rondes, zodat ook drie vormen tegelijk netjes uit elkaar gaan.
      for (var pass = 0; pass < 4; pass++) {
        var touched = false;
        for (i = 0; i < bs.length; i++) {
          for (j = i + 1; j < bs.length; j++) {
            var p = bs[i], q = bs[j];
            if (!p.alive || !q.alive) continue;
            var dx = q.x - p.x, dy = q.y - p.y, min = p.rad + q.rad, d2 = dx * dx + dy * dy;
            if (d2 >= min * min) continue;
            touched = true;
            var d = Math.sqrt(d2) || 0.01, nx = dx / d, ny = dy / d;
            if (!d2) { nx = 1; ny = 0; }
            var mp = p.rad * p.rad, mq = q.rad * q.rad, push = min - d;
            p.x -= nx * push * mq / (mp + mq); p.y -= ny * push * mq / (mp + mq);
            q.x += nx * push * mp / (mp + mq); q.y += ny * push * mp / (mp + mq);
            var rel = (p.vx - q.vx) * nx + (p.vy - q.vy) * ny;
            // naar elkaar toe: elastisch kaatsen. Bijna dezelfde kant op: toch een duidelijke
            // afstoot (14 px/s), zodat ze niet samen blijven drijven.
            if (rel > -14) {
              var imp = (rel + (rel > 0 ? rel : 14)) / (mp + mq);
              p.vx -= imp * mq * nx; p.vy -= imp * mq * ny;
              q.vx += imp * mp * nx; q.vy += imp * mp * ny;
            }
          }
        }
        if (!touched) break;
      }
      for (i = 0; i < bs.length; i++) {
        var s = Math.hypot(bs[i].vx, bs[i].vy), lo = 10, hi = 40;
        if (s > hi) { bs[i].vx *= hi / s; bs[i].vy *= hi / s; }
        else if (s < lo) { var f = s ? lo / s : 1; bs[i].vx = s ? bs[i].vx * f : lo; bs[i].vy *= f; }
      }
    }

    function draw(t) {
      t.bubbles.forEach(function (b) {
        b.el.style.transform = "translate3d(" + (b.x - b.size / 2).toFixed(1) + "px," + (b.y - b.size / 2).toFixed(1) + "px,0)";
      });
    }

    // begin zonder overlap: schuif vormen die over elkaar liggen uit elkaar
    tanks.forEach(function (t) {
      for (var k = 0; k < 20; k++) {
        var moved = false;
        for (var i = 0; i < t.bubbles.length; i++) for (var j = i + 1; j < t.bubbles.length; j++) {
          var p = t.bubbles[i], q = t.bubbles[j], dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy) || 0.01, m = p.rad + q.rad;
          if (d < m) { var s = (m - d) / 2 + 1; p.x -= dx / d * s; p.y -= dy / d * s; q.x += dx / d * s; q.y += dy / d * s; moved = true; }
        }
        if (!moved) break;
      }
      draw(t);
    });

    var last = 0, raf = 0;
    function frame(now) {
      raf = 0;
      var dt = Math.max(0, Math.min((now - last) / 1000, 0.05));
      last = now;
      var any = false;
      tanks.forEach(function (t) { if (t.visible) { any = true; step(t, dt); draw(t); } });
      if (any) raf = requestAnimationFrame(frame);
    }
    function run() { if (!raf && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } }

    if ("IntersectionObserver" in window) {
      var vis = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          tanks.forEach(function (t) { if (t.sec === e.target) t.visible = e.isIntersecting; });
        });
        run();
      }, { rootMargin: "100px 0px" });
      tanks.forEach(function (t) { vis.observe(t.sec); });
    } else {
      tanks.forEach(function (t) { t.visible = true; });
      run();
    }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else { run(); }
    });
    window.__tanks = tanks; // alleen voor testen
  })();
})();
