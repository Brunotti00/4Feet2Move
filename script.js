// if (window.location.pathname === "/index.html") {
const nextEl = document.querySelector(".next");
const prevEl = document.querySelector(".prev");
const cardEl = document.querySelectorAll(".card");
const imageContainerEl = document.querySelector(".slider");
const dots = document.querySelectorAll(".dots span");
let currentImg = 1;
let timeout;

function startTimeout() {
  timeout = setTimeout(() => {
    currentImg++;
    updateImg();
  }, 3000);
}

function resetTimeout() {
  clearTimeout(timeout);
  if (!userClicked) {
    startTimeout();
  }
}

nextEl.addEventListener("click", () => {
  currentImg++;
  userClicked = true;
  resetTimeout();
  updateImg();
});

prevEl.addEventListener("click", () => {
  currentImg--;
  userClicked = true;
  resetTimeout();
  updateImg();
});

dots.forEach((dot, ind) => {
  dot.addEventListener("click", () => {
    currentImg = ind + 1;
    userClicked = true;
    resetTimeout();
    updateImg();
  });
});

function updateImg() {
  if (currentImg > cardEl.length) {
    currentImg = 1;
  } else if (currentImg < 1) {
    currentImg = cardEl.length;
  }

  imageContainerEl.style.transform = `translateX(${(currentImg - 1) * -33.33}%)`;
  updateDot();

  if (!userClicked) {
    startTimeout();
  }
}

function updateDot() {
  dots.forEach((dot, index) => {
    const cards = document.querySelectorAll('.card');
    cards.forEach((card) => {
      card.classList.remove('active');
    });
    if (index === currentImg - 1) {
      dot.classList.add("active");
    } else {
      dot.classList.remove("active");
    }
  });
}

let userClicked = false;
startTimeout();

document.addEventListener('DOMContentLoaded', function () {
    const moreBtns = document.querySelectorAll('.more');

    moreBtns.forEach((btn) => {
        btn.addEventListener('click', function () {
            userClicked = true;
            resetTimeout();
            const card = this.closest('.card');
            card.classList.toggle('active');
        });
    });

    function getComputedHeight(element) {
        const computedStyle = window.getComputedStyle(element);
        return element.clientHeight + parseFloat(computedStyle.marginTop) + parseFloat(computedStyle.marginBottom);
    }

    function shouldShowMoreButton(card) {
        const persoonImgHeight = getComputedHeight(card.querySelector('.persoon-img'));
        const content = card.querySelector('.content');
        const cardComputedStyle = window.getComputedStyle(card);
        const cardHeight = card.clientHeight - parseFloat(cardComputedStyle.paddingTop) - parseFloat(cardComputedStyle.paddingBottom);
        const textHeight = content.scrollHeight;

        console.log('PersoonImg Height:', persoonImgHeight);
        console.log('Text Height:', textHeight);
        console.log('Card Height:', cardHeight);

        return persoonImgHeight + textHeight > cardHeight;
    }

    moreBtns.forEach((btn) => {
        const card = btn.closest('.card');
        const content = card.querySelector('.content');

        if (shouldShowMoreButton(card)) {
            btn.style.display = 'inline-block';
            content.classList.add('has-more-button');
        } else {
            btn.style.display = 'none';
            content.classList.remove('has-more-button');
            content.style.height = 'fit-content';
            content.style.maxHeight = '400px';
            card.style.height = 'fit-content';
        }
    });
});
// }