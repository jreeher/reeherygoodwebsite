// ============================================================
//  Jordan Reeher's Website — script.js
//
//  HIDDEN EASTER EGGS:
//  1. Konami Code (up up down down left right left right b a)
//  2. Click the JR nav logo 5x fast
//  3. Hidden CSS snail on the books page (peeks in from right)
//  4. Type "COWBOY" anywhere on any page
//  5. Type "DINO" anywhere on any page
//  6. Type "SNAIL" anywhere on any page
//  7. Click the star glyph in the footer
//  8. Hit the secret ? block in the platformer (homepage)
// ============================================================


// ===== SCROLL REVEAL =====
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 80);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.fade-up').forEach(el => revealObserver.observe(el));


// ===== HAMBURGER MENU =====
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('nav-links');
if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
}


// ===== NAV LOGO — CLICK 5x EASTER EGG =====
let logoClicks = 0;
let logoTimer  = null;
const navLogo  = document.getElementById('nav-logo');

if (navLogo) {
  navLogo.addEventListener('click', e => {
    e.preventDefault();
    logoClicks++;
    clearTimeout(logoTimer);
    logoTimer = setTimeout(() => { logoClicks = 0; }, 2200);

    if (logoClicks === 2) showToast('Interesting...');
    if (logoClicks === 3) showToast('Keep going...');
    if (logoClicks === 4) showToast('Almost there...');

    if (logoClicks >= 5) {
      logoClicks = 0;
      navLogo.classList.add('dizzy');
      setTimeout(() => navLogo.classList.remove('dizzy'), 700);
      showEaster(
        'Okay okay, ENOUGH!',
        "You clicked me five times! I'm getting dizzy!\n\nFine, you earned a secret: Jordan's favorite dinosaur is the Brachiosaurus. You can tell people that."
      );
    }
  });
}


// ===== QUOTE MACHINE =====
const QUOTES = [
  '"You are perfect just the way you are." — Rubisnail',
  '"There are SO many ways to play." — Deano the Dino',
  '"Even the prickliest almonds have their reasons." — The Coconut Cowboy',
  '"Sleep is just an adventure with your eyes closed." — The Fluff of a Thousand Pillows',
  '"Every great story starts with a blank page and one weird idea."',
  '"Be yourself. Unless you can be a dinosaur. Always be a dinosaur."',
  '"The best books are the ones read one more time."',
  '"Making things is weird and scary and completely worth it."',
  '"Sometimes the cowboy is the almond. Think about it."',
  '"A snail walks into a bar... actually, it takes a while."',
];

const quoteDisplay = document.getElementById('quoteDisplay');
const quoteBtn     = document.getElementById('quoteBtn');
let lastQuoteIdx   = -1;

function newQuote() {
  if (!quoteDisplay) return;
  let idx;
  do { idx = Math.floor(Math.random() * QUOTES.length); } while (idx === lastQuoteIdx);
  lastQuoteIdx = idx;

  quoteDisplay.style.opacity = '0';
  setTimeout(() => {
    quoteDisplay.textContent = QUOTES[idx];
    quoteDisplay.style.opacity = '1';
  }, 300);
}

if (quoteDisplay) {
  quoteDisplay.style.transition = 'opacity 0.3s';
  newQuote();
}
if (quoteBtn) quoteBtn.addEventListener('click', newQuote);


// ===== MAKE IT RAIN BUTTON =====
const bookRainBtn = document.getElementById('bookRainBtn');
if (bookRainBtn) {
  bookRainBtn.addEventListener('click', () => {
    const colors = [
      '#FF6B6B','#FFD93D','#6BCB77','#4CC9F0',
      '#C77DFF','#FF85A1','#FF9F43','#9B5DE5'
    ];
    for (let i = 0; i < 50; i++) {
      setTimeout(() => {
        const p = document.createElement('div');
        const size = Math.random() * 16 + 8;
        p.style.cssText = `
          position: fixed;
          left: ${Math.random() * 100}vw;
          top: -60px;
          width: ${size}px;
          height: ${size}px;
          background: ${colors[Math.floor(Math.random() * colors.length)]};
          border-radius: ${Math.random() > 0.5 ? '50%' : '4px'};
          pointer-events: none;
          z-index: 8999;
          animation: confetti-fall ${(Math.random() * 1.5 + 1.5).toFixed(1)}s linear forwards;
          animation-delay: ${(Math.random() * 0.8).toFixed(2)}s;
        `;
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 3500);
      }, i * 50);
    }
    showToast('IT\'S RAINING!');
  });
}


// ===== HIDDEN SNAIL EASTER EGG (books page) =====
const hiddenSnail = document.getElementById('hiddenSnail');
if (hiddenSnail) {
  hiddenSnail.addEventListener('click', () => {
    showEaster(
      'Psst! Over here!',
      "Rubisnail has a secret message just for you:\n\n\"You are exactly the right amount of you. Don't change a thing for anyone — unless YOU want to. You do you, friend.\""
    );
  });
}


// ===== KONAMI CODE =====
//  up up down down left right left right b a
const KONAMI_SEQ = [
  'ArrowUp','ArrowUp','ArrowDown','ArrowDown',
  'ArrowLeft','ArrowRight','ArrowLeft','ArrowRight',
  'b','a'
];
let konamiIdx = 0;

document.addEventListener('keydown', e => {
  if (e.key === KONAMI_SEQ[konamiIdx]) {
    konamiIdx++;
    if (konamiIdx === KONAMI_SEQ.length) {
      konamiIdx = 0;
      launchConfetti(100);
      showEaster(
        'CHEAT CODE ACTIVATED!',
        "The legendary Konami Code!\n\nYou've unlocked: +30 lives, infinite cool points, and Jordan's eternal respect. Achievement unlocked: You Are A Legend."
      );
    }
  } else {
    konamiIdx = 0;
  }
});


// ===== KEYBOARD SECRET WORDS =====
let keyBuffer = '';

document.addEventListener('keypress', e => {
  keyBuffer += e.key.toUpperCase();
  if (keyBuffer.length > 12) keyBuffer = keyBuffer.slice(-12);

  if (keyBuffer.includes('COWBOY')) {
    keyBuffer = '';
    launchConfetti(40);
    showEaster(
      'YEEHAW!',
      "You typed COWBOY and summoned The Coconut Cowboy!\n\nHe tips his hat to you and says: \"Ain't nothing wrong with being a little nutty, partner.\""
    );
  }

  if (keyBuffer.includes('DINO')) {
    keyBuffer = '';
    showEaster(
      'ROOOAARRR!',
      "Deano the Dino has entered the chat!\n\nHe wants you to know there are MANY ways to play — and you just found one of them."
    );
  }

  if (keyBuffer.includes('SNAIL')) {
    keyBuffer = '';
    showEaster(
      'Well, hello there.',
      "You spelled out SNAIL! Rubisnail is very flattered.\n\nShe says hi and reminds you: slow and steady wins the race — but it's also okay to stop and smell the flowers along the way."
    );
  }
});


// ===== FOOTER SECRET (star glyph) =====
const footerSecret = document.getElementById('footerSecret');
if (footerSecret) {
  footerSecret.addEventListener('click', () => {
    showEaster(
      'You Found the Coconut!',
      "Congratulations! You found the secret star hidden in the footer.\n\nThe Coconut Cowboy says this makes you an honorary citizen of Coconut Island. Population: you, Hank, and a very mean almond."
    );
  });
}


// ===== EASTER EGG OVERLAY =====
function showEaster(title, msg) {
  const overlay = document.getElementById('easter-overlay');
  const titleEl = document.getElementById('easter-title');
  const msgEl   = document.getElementById('easter-msg');
  if (!overlay) return;
  if (titleEl) titleEl.textContent = title;
  if (msgEl)   msgEl.textContent   = msg;
  overlay.classList.add('active');
}

function closeEaster() {
  const overlay = document.getElementById('easter-overlay');
  if (overlay) overlay.classList.remove('active');
}

// Close on backdrop click
document.addEventListener('click', e => {
  const overlay = document.getElementById('easter-overlay');
  if (e.target === overlay) closeEaster();
});

// Close on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeEaster();
});

window.closeEaster  = closeEaster;
window.showEaster   = showEaster;


// ===== TOAST =====
let toastTimer = null;
function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}
window.showToast = showToast;


// ===== CONFETTI =====
function launchConfetti(count = 70) {
  const colors = [
    '#FF6B6B','#FFD93D','#6BCB77','#4CC9F0',
    '#C77DFF','#FF85A1','#FF9F43','#9B5DE5'
  ];
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const p = document.createElement('div');
      p.className = 'confetti-piece';
      const size = Math.random() * 10 + 6;
      p.style.cssText = `
        left: ${Math.random() * 100}vw;
        width: ${size}px;
        height: ${size}px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        border-radius: ${Math.random() > 0.5 ? '50%' : '3px'};
        animation-duration: ${(Math.random() * 2 + 1.8).toFixed(1)}s;
        animation-delay: ${(Math.random() * 0.6).toFixed(2)}s;
      `;
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 4000);
    }, i * 18);
  }
}
window.launchConfetti = launchConfetti;


// ===== CONSOLE EASTER EGG =====
console.log(
  '%c JR %c\n\nHey, you found the console!\n\nHidden secrets: try the Konami Code on any page, or type COWBOY, DINO, or SNAIL. Look for a little purple shape peeking in on the books page. And jump into the ? block on the homepage.\n\nHappy hunting.',
  'font-size: 16px; font-weight: bold; color: #FFD93D; background: #14213D; padding: 8px 14px; border-radius: 6px;',
  'font-size: 12px; color: #888;'
);
