import './style.css';
import gsap from 'gsap';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const motion = matchMedia('(prefers-reduced-motion: reduce)');
const duration = (seconds) => motion.matches ? 0 : seconds;

const app = $('#app');
const themePanel = $('#themePanel');
const tribute = $('#marvel-tribute');
const video = $('#marvel-video');
const playButton = $('#playMarvel');
const opening = $('#openingScreen');
const transition = $('#transition');

let activeModal = null;
let previousFocus = null;
let transitioning = false;
let transitionTimeline;
let tributeShown = false;

function readStorage(kind, key) {
  try {
    return window[kind].getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(kind, key, value) {
  try {
    window[kind].setItem(key, value);
  } catch {
    // Storage is optional for rn i dont wanna deal with it rn
  }
}

function setTheme(theme) {
  const valid = ['dark', 'light', 'venice'].includes(theme)
    ? theme
    : 'dark';

  document.documentElement.dataset.theme = valid;

  $$('.theme-option').forEach((option) => {
    const selected = option.dataset.theme === valid;

    option.classList.toggle('active', selected);
    option.setAttribute('aria-pressed', String(selected));
  });

  document.dispatchEvent(new Event('friction:themechange'));
}

setTheme(readStorage('localStorage', 'friction-theme'));

$$('.theme-option').forEach((option) => {
  option.addEventListener('click', () => {
    setTheme(option.dataset.theme);

    writeStorage(
      'localStorage',
      'friction-theme',
      option.dataset.theme
    );
  });
});

function focusableElements(element) {
  return [
    ...element.querySelectorAll(
      'button, a[href], input, select, textarea, video[controls], [tabindex]'
    )
  ].filter(
    (item) =>
      item.tabIndex >= 0 &&
      !item.disabled &&
      item.getClientRects().length
  );
}

function closeModal() {
  if (!activeModal) return;

  const closing = activeModal;
  activeModal = null;

  closing.classList.remove('active');
  closing.setAttribute('aria-hidden', 'true');

  app.inert = false;
  document.body.classList.remove('modal-open', 'marvel-active');

  if (closing === tribute) {
    video.pause();
    video.currentTime = 0;
    playButton.hidden = true;
  }

  previousFocus?.focus({ preventScroll: true });
}

function openModal(element, trigger = document.activeElement) {
  if (activeModal || transitioning) return false;

  previousFocus = trigger;
  activeModal = element;

  element.classList.add('active');
  element.setAttribute('aria-hidden', 'false');

  document.body.classList.add('modal-open');
  app.inert = true;

  requestAnimationFrame(() => {
    if (activeModal === element) {
      focusableElements(element)[0]?.focus({
        preventScroll: true
      });
    }
  });

  return true;
}

$('#themeButton').addEventListener(
  'click',
  () => openModal(themePanel)
);

$('#closeTheme').addEventListener('click', closeModal);
$('#closeMarvel').addEventListener('click', closeModal);

themePanel.addEventListener('click', (event) => {if (event.target === themePanel) closeModal();});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (activeModal) closeModal();
    else if (transitioning) finishTransition();

    return;
  }

  if (event.key !== 'Tab' || !activeModal) return;

  const elements = focusableElements(activeModal);
  const first = elements[0];
  const last = elements.at(-1);

  if (!first) {
    event.preventDefault();
    return;
  }

  if (
    event.shiftKey &&
    (
      document.activeElement === first ||
      !activeModal.contains(document.activeElement)
    )
  ) {
    event.preventDefault();
    last.focus();
  } else if (
    !event.shiftKey &&
    (
      document.activeElement === last ||
      !activeModal.contains(document.activeElement)
    )
  ) {
    event.preventDefault();
    first.focus();
  }
});

let selectedDoor;

function finishTransition() {
  transitionTimeline?.kill();

  gsap.set(transition, {
    autoAlpha: 0,
    pointerEvents: 'none'
  });

  transitioning = false;
  app.inert = false;

  document.body.classList.remove('modal-open');
  selectedDoor?.focus({ preventScroll: true });
}

$$('.door').forEach((door) => {
  door.addEventListener('click', () => {
    if (transitioning || activeModal) return;

    selectedDoor = door;
    transitioning = true;

    $('#transitionTitle').textContent = door.dataset.show.toUpperCase();

    $('#transitionNumber').textContent = door.dataset.number;

    $('#transitionStatus').textContent = 'ENTERING STORY';

    transition.focus({ preventScroll: true });
    app.inert = true;
    document.body.classList.add('modal-open');

    transitionTimeline = gsap.timeline({onComplete: finishTransition});

    transitionTimeline
      .set(transition, {
        autoAlpha: 1,
        pointerEvents: 'all'
      })
      .fromTo(
        '.transition-content',
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: duration(0.8),
          ease: 'power3.out'
        }
      )
      .to({}, { duration: duration(1) })
      .call(() => {
        $('#transitionTitle').textContent =
          `${door.dataset.show.toUpperCase()} COMING SOON`;

        $('#transitionStatus').textContent =
          'THIS STORY IS STILL IN DEVELOPMENT';
      })
      .to({}, {
        duration: motion.matches ? 1.5 : 2
      })
      .to(transition, {
        autoAlpha: 0,
        duration: duration(0.6)
      });
  });
});


function startIntro() {
  if (motion.matches) return;

  opening.classList.add('active');

  const fallback = setTimeout(() => {
    opening.classList.remove('active');
  }, 5000);

  gsap.timeline({
    onComplete: () => {
      clearTimeout(fallback);
      opening.classList.remove('active');
      document.dispatchEvent(new Event('friction:ready'));
    }
  })
    .fromTo(
      '.opening-content span',
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.8 }
    )
    .to(opening, {
      opacity: 0,
      duration: 0.8,
      delay: 0.4
    });

  gsap.from('.navbar, .intro, .door, .footer', {
    y: 18,
    opacity: 0,
    duration: 0.7,
    stagger: 0.04,
    delay: 1.3,
    clearProps: 'transform,opacity'
  });
}

startIntro();

const dot = $('.cursor-dot');
const ring = $('.cursor-ring');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');

let ringTween;

window.addEventListener('pointermove', (event) => {
  if (!finePointer.matches || motion.matches) return;

  document.body.classList.add('custom-cursor');

  gsap.set(dot, {
    x: event.clientX,
    y: event.clientY
  });

  ringTween?.kill();

  ringTween = gsap.to(ring, {
    x: event.clientX,
    y: event.clientY,
    duration: 0.18,
    ease: 'power2.out'
  });
}, { passive: true });

function resetCursor() {document.body.classList.remove('custom-cursor');}

document.documentElement.addEventListener(
  'pointerleave',
  resetCursor
);

window.addEventListener('blur', resetCursor);
finePointer.addEventListener('change', resetCursor);

motion.addEventListener('change', () => {
  resetCursor();

  if (motion.matches) {opening.classList.remove('active');}
});

$$('.door').forEach((door) => {
  door.addEventListener('pointerenter', () => {
    const accent = getComputedStyle(door)
      .getPropertyValue('--door-accent')
      .trim();

    document.documentElement.style.setProperty(
      '--cursor-door-color',
      accent
    );

    ring.classList.add('cursor-ring-active');
  });

  door.addEventListener('pointerleave', () => {
    document.documentElement.style.removeProperty(
      '--cursor-door-color'
    );

    ring.classList.remove('cursor-ring-active');
  });
});

async function playTribute() {
  playButton.hidden = true;

  try {
    await video.play();
  } catch {
    if (activeModal === tribute) {
      playButton.textContent = 'PLAY TRIBUTE';
      playButton.hidden = false;
    }
  }
}

playButton.addEventListener('click', playTribute);

video.addEventListener('ended', () => {
  if (activeModal === tribute) closeModal();
});

video.addEventListener('error', () => {
  if (activeModal !== tribute) return;

  playButton.textContent = 'Video Unavailable — Close to Continue';

  playButton.hidden = false;
});

let activeTime = 0;
let lastTick = performance.now();

const tributeTimer = setInterval(() => {
  const now = performance.now();
  const delta = now - lastTick;

  lastTick = now;

  if (
    readStorage('sessionStorage', 'frictionMarvelShown') ||
    tributeShown
  ) {
    clearInterval(tributeTimer);
    return;
  }

  if (!document.hidden && !activeModal && !transitioning) {activeTime += delta;}

  if (
    activeTime < 60000 ||
    motion.matches ||
    document.hidden ||
    activeModal ||
    transitioning
  ) {
    return;
  }

  showTribute();
}, 250);

document.addEventListener('visibilitychange', () => {
  lastTick = performance.now();
});

function showTribute() {
  if (activeModal) closeModal();
  if (!openModal(tribute, $('#themeButton'))) return;

  tributeShown = true;

  writeStorage(
    'sessionStorage',
    'frictionMarvelShown',
    '1'
  );

  document.body.classList.add('marvel-active');

  video.currentTime = 0;
  playTribute();
}


import('./prism.js').catch((error) => {
  console.warn('Prism unavailable:', error);
});