// 4Feet2Move – kleine, losse onderdelen. Elk onderdeel doet niets als het
// bijbehorende element niet op de pagina staat, dus dit script kan overal laden.

// Jaartal in de footer
document.querySelectorAll("[data-year]").forEach((el) => {
  el.textContent = new Date().getFullYear();
});

// Meldingen na versturen van het contactformulier (?verzonden=1)
const notice = document.querySelector("[data-sent-notice]");
if (notice && new URLSearchParams(location.search).has("verzonden")) {
  notice.hidden = false;
}

// Uitleg van vaktermen op de aanbod-pagina (werkt met klik, tik en toetsenbord)
document.querySelectorAll(".term").forEach((btn) => {
  const note = document.getElementById(btn.getAttribute("aria-controls"));
  btn.addEventListener("click", () => {
    const open = note.hidden;
    note.hidden = !open;
    btn.setAttribute("aria-expanded", open);
  });
});

// Beoordelingen-slider
const slider = document.querySelector(".slider");
if (slider) {
  const slides = [...slider.children];
  const dotsEl = document.querySelector(".dots");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let index = 0;
  let timer;

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
    dots.forEach((dot, n) => dot.setAttribute("aria-current", n === index));
    if (byUser) stop();
  }

  function start() {
    if (reduceMotion) return;
    timer = setInterval(() => show(index + 1), 5000);
  }

  function stop() {
    clearInterval(timer);
    timer = null;
  }

  document.querySelector(".slider-prev").addEventListener("click", () => show(index - 1, true));
  document.querySelector(".slider-next").addEventListener("click", () => show(index + 1, true));

  // pauzeer als iemand de beoordelingen leest
  const view = document.querySelector(".slider-view");
  view.addEventListener("mouseenter", stop);
  view.addEventListener("focusin", stop);
  view.addEventListener("mouseleave", () => timer || start());

  // "Lees meer" alleen tonen als de tekst echt wordt afgekapt
  function updateMoreButtons() {
    slides.forEach((slide) => {
      const card = slide.querySelector(".card");
      const text = card.querySelector(".card__text");
      const btn = card.querySelector(".card__more");
      const wasOpen = card.classList.contains("is-open");
      card.classList.remove("is-open");
      const clipped = text.scrollHeight > text.clientHeight + 1;
      card.classList.toggle("is-open", wasOpen);
      text.classList.toggle("is-clipped", clipped && !wasOpen);
      btn.classList.toggle("is-needed", clipped || wasOpen);
    });
  }

  slides.forEach((slide) => {
    const card = slide.querySelector(".card");
    const btn = card.querySelector(".card__more");
    btn.addEventListener("click", () => {
      stop();
      const open = card.classList.toggle("is-open");
      btn.textContent = open ? "Lees minder" : "Lees meer";
      btn.setAttribute("aria-expanded", open);
      card.querySelector(".card__text").classList.toggle("is-clipped", !open);
    });
  });

  addEventListener("resize", updateMoreButtons);
  addEventListener("load", updateMoreButtons);
  updateMoreButtons();
  show(0);
  start();
}
