/* ==============================================
   Loading Screen (skipped on repeat visits)
   ============================================== */
const loader = document.getElementById('loader');
const loaderCount = document.getElementById('loaderCount');
const loaderBar = document.querySelector('.loader__bar');

const hasVisited = sessionStorage.getItem('mingo_visited');

if (hasVisited) {
  // Skip loader entirely on repeat visit
  loader.classList.add('done');
  triggerHeroAnims();
} else {
  sessionStorage.setItem('mingo_visited', '1');
  runLoader();
}

function runLoader() {
  const duration = 1400;

  function easeOutQuad(t) { return t * (2 - t); }

  const startTime = performance.now();

  function updateCounter(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    loaderCount.textContent = Math.round(easeOutQuad(progress) * 100);

    if (progress < 1) {
      requestAnimationFrame(updateCounter);
    } else {
      loaderCount.textContent = 100;
      setTimeout(() => {
        loader.classList.add('done');
        triggerHeroAnims();
      }, 300);
    }
  }

  requestAnimationFrame(() => {
    loaderBar.classList.add('go');
    requestAnimationFrame(updateCounter);
  });
}

/* ==============================================
   Hero Animations (JS-only stagger, no CSS delay)
   ============================================== */
function triggerHeroAnims() {
  const fadeEls = document.querySelectorAll('.fade-up');
  fadeEls.forEach((el, i) => {
    setTimeout(() => el.classList.add('in'), i * 180);
  });
}

/* ==============================================
   Copyright Year (dynamic)
   ============================================== */
const footerCopy = document.getElementById('footerCopy');
if (footerCopy) {
  footerCopy.textContent = `© ${new Date().getFullYear()} みんご. All rights reserved.`;
}

/* ==============================================
   Navigation — Scroll Behavior
   ============================================== */
const nav = document.getElementById('nav');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

/* ==============================================
   Navigation — Overlay Toggle
   ============================================== */
const navToggle = document.getElementById('navToggle');
const navOverlay = document.getElementById('navOverlay');
const overlayLinks = document.querySelectorAll('.nav-overlay__link');

let savedScrollY = 0;

function openNav() {
  savedScrollY = window.scrollY;
  navToggle.classList.add('active');
  navToggle.setAttribute('aria-label', 'メニューを閉じる');
  navOverlay.classList.add('active');
  navOverlay.setAttribute('aria-hidden', 'false');
  nav.classList.add('overlay-open');
  // iOS scroll-lock: fix body position instead of overflow:hidden
  document.body.style.position = 'fixed';
  document.body.style.top = `-${savedScrollY}px`;
  document.body.style.width = '100%';
  // Move focus into overlay
  const firstLink = navOverlay.querySelector('a');
  if (firstLink) setTimeout(() => firstLink.focus(), 50);
}

function closeNav() {
  navToggle.classList.remove('active');
  navToggle.setAttribute('aria-label', 'メニューを開く');
  navOverlay.classList.remove('active');
  navOverlay.setAttribute('aria-hidden', 'true');
  nav.classList.remove('overlay-open');
  // Restore scroll position
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  window.scrollTo(0, savedScrollY);
  navToggle.focus();
}

navToggle.addEventListener('click', () => {
  navOverlay.classList.contains('active') ? closeNav() : openNav();
});

overlayLinks.forEach(link => link.addEventListener('click', closeNav));
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeNav(); });

// Focus trap inside overlay
navOverlay.addEventListener('keydown', e => {
  if (!navOverlay.classList.contains('active') || e.key !== 'Tab') return;
  const focusable = [...navOverlay.querySelectorAll('a, button')].filter(
    el => !el.hasAttribute('disabled') && el.offsetParent !== null
  );
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey) {
    if (document.activeElement === first) { e.preventDefault(); last.focus(); }
  } else {
    if (document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});

/* ==============================================
   Scroll Reveal (IntersectionObserver)
   ============================================== */
const revealEls = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;

    const siblings = [...entry.target.parentElement.querySelectorAll('.reveal:not(.in-view)')];
    const idx = siblings.indexOf(entry.target);
    const delay = Math.max(idx * 80, 0);

    entry.target.style.transitionDelay = delay + 'ms';
    entry.target.classList.add('in-view');

    // Clear delay after the longest transition property finishes
    const longestDuration = 900;
    setTimeout(() => {
      entry.target.style.transitionDelay = '';
    }, longestDuration + delay);

    revealObserver.unobserve(entry.target);
  });
}, {
  threshold: 0.08,
  rootMargin: '0px 0px -48px 0px'
});

revealEls.forEach(el => revealObserver.observe(el));

/* ==============================================
   Custom Cursor (pointer devices only)
   ============================================== */
if (window.matchMedia('(pointer: fine)').matches) {
  const cursorDot = document.getElementById('cursorDot');
  let curX = 0, curY = 0;
  let dotX = 0, dotY = 0;
  // Offset to center the dot (half of 8px default size)
  const offset = 4;

  function lerp(a, b, t) { return a + (b - a) * t; }

  document.addEventListener('mouseleave', () => {
    cursorDot.style.opacity = '0';
  });

  let rafActive = false;

  function animDot() {
    const dx = curX - dotX;
    const dy = curY - dotY;
    dotX += dx * 0.11;
    dotY += dy * 0.11;
    cursorDot.style.transform = `translate(${dotX - offset}px, ${dotY - offset}px)`;
    // Stop rAF when cursor has converged (saves idle CPU)
    if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
      requestAnimationFrame(animDot);
    } else {
      rafActive = false;
    }
  }

  document.addEventListener('mousemove', e => {
    curX = e.clientX;
    curY = e.clientY;
    cursorDot.style.opacity = '1';
    if (!rafActive) {
      rafActive = true;
      requestAnimationFrame(animDot);
    }
  }, { passive: true });

  // Reset cursor-dot position anchor (remove the CSS translate(-50%,-50%))
  cursorDot.style.left = '0';
  cursorDot.style.top = '0';

  const hoverTargets = document.querySelectorAll(
    'a, button, .work-item, .skill-card'
  );
  hoverTargets.forEach(el => {
    el.addEventListener('mouseenter', () => cursorDot.classList.add('active'));
    el.addEventListener('mouseleave', () => cursorDot.classList.remove('active'));
  });
}

/* ==============================================
   Contact Form
   ============================================== */
const contactForm = document.getElementById('contactForm');
const submitBtn = document.getElementById('submitBtn');

if (contactForm) {
  contactForm.addEventListener('submit', async e => {
    e.preventDefault();

    // Client-side validation
    const requiredFields = contactForm.querySelectorAll('[required]');
    let valid = true;

    requiredFields.forEach(field => {
      field.style.borderColor = '';
      const isEmpty = !field.value.trim();
      const isEmailInvalid = field.type === 'email' && field.value.trim() && !field.validity.valid;

      if (isEmpty || isEmailInvalid) {
        field.style.borderColor = 'var(--accent)';
        valid = false;
        field.addEventListener('input', () => {
          field.style.borderColor = '';
        }, { once: true });
      }
    });

    if (!valid) return;

    // Disable button during submission
    submitBtn.disabled = true;
    const btnLabel = submitBtn.querySelector('span');
    btnLabel.textContent = '送信中…';

    try {
      const formData = new FormData(contactForm);
      const action = contactForm.getAttribute('action');

      // Only attempt fetch if Formspree ID is set
      if (action && !action.includes('YOUR_FORM_ID')) {
        const res = await fetch(action, {
          method: 'POST',
          body: formData,
          headers: { 'Accept': 'application/json' }
        });
        if (!res.ok) throw new Error('送信に失敗しました。');
      }

      // Success
      btnLabel.textContent = '送信しました ✓';
      submitBtn.classList.add('sent');
      contactForm.reset();

      setTimeout(() => {
        btnLabel.textContent = '送信する';
        submitBtn.classList.remove('sent');
        submitBtn.disabled = false;
      }, 3500);

    } catch {
      btnLabel.textContent = '送信失敗。再度お試しください';
      submitBtn.disabled = false;
      setTimeout(() => { btnLabel.textContent = '送信する'; }, 3000);
    }
  });
}

/* ==============================================
   Smooth Anchor Scroll (respects prefers-reduced-motion)
   ============================================== */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY - nav.offsetHeight;
    window.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  });
});

/* ==============================================
   Work Card — Hover Parallax (subtle)
   ============================================== */
document.querySelectorAll('.work-item__thumb').forEach(thumb => {
  const img = thumb.querySelector('img');
  if (!img) return;

  thumb.addEventListener('mousemove', e => {
    const rect = thumb.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    img.style.transform = `scale(1.06) translate(${x * -12}px, ${y * -8}px)`;
  }, { passive: true });

  thumb.addEventListener('mouseleave', () => {
    // Use scale(1) not '' so the CSS transition plays out smoothly
    img.style.transform = 'scale(1)';
    // Clean up inline style after transition completes
    img.addEventListener('transitionend', () => {
      img.style.transform = '';
    }, { once: true });
  });
});
