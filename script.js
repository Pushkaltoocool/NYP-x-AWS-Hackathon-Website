/* ================================================================
   AWS × NYP Cloud Kiro Buildathon — script.js
   No external libraries. Works by double-clicking index.html.
   ================================================================ */

/* ----------------------------------------------------------------
   CONFIGURATION — edit these values to update the site
   ---------------------------------------------------------------- */
const CONFIG = {
  // Main event date/time in Singapore Time (SGT = UTC+8)
  // Format: 'YYYY-MM-DDTHH:MM:00+08:00'
  eventDate: '2026-08-19T10:00:00+08:00',

  // Section IDs used for navigation highlight (must match id="" in HTML)
  navSections: [
    'hero', 'quickinfo', 'overview', 'dates', 'workshop',
    'problems', 'team-info', 'programme', 'presentation', 'faq',
    'register', 'help',
  ],
};

/* ----------------------------------------------------------------
   UTILITY HELPERS
   ---------------------------------------------------------------- */

/** Pad a number to 2 digits */
function pad(n) {
  return String(n).padStart(2, '0');
}

/** Throttle function calls — avoids scroll handler spam */
function throttle(fn, ms) {
  let last = 0;
  return function (...args) {
    const now = Date.now();
    if (now - last >= ms) {
      last = now;
      fn.apply(this, args);
    }
  };
}

/* ----------------------------------------------------------------
   1. THEME TOGGLE
   ---------------------------------------------------------------- */
(function initTheme() {
  const root = document.documentElement;
  const toggle = document.getElementById('themeToggle');
  const storageKey = 'site-theme';
  const media = window.matchMedia('(prefers-color-scheme: dark)');

  function storedTheme() {
    try {
      return localStorage.getItem(storageKey);
    } catch (error) {
      return null;
    }
  }

  function systemTheme() {
    return media.matches ? 'dark' : 'light';
  }

  function setTheme(theme, persist) {
    const nextTheme = theme === 'dark' ? 'dark' : 'light';
    root.dataset.theme = nextTheme;

    if (persist) {
      try {
        localStorage.setItem(storageKey, nextTheme);
      } catch (error) {
        // Ignore storage failures; the toggle still works for this page view.
      }
    }

    if (!toggle) return;
    const isDark = nextTheme === 'dark';
    toggle.setAttribute('aria-pressed', String(isDark));
    toggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    const label = toggle.querySelector('.nav__theme-text');
    if (label) label.textContent = isDark ? 'Light' : 'Dark';
  }

  setTheme(storedTheme() || root.dataset.theme || systemTheme(), false);

  if (toggle) {
    toggle.addEventListener('click', () => {
      setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true);
    });
  }

  media.addEventListener('change', () => {
    if (!storedTheme()) setTheme(systemTheme(), false);
  });
})();

/* ----------------------------------------------------------------
   2. NAVIGATION: sticky style on scroll + mobile toggle
   ---------------------------------------------------------------- */
(function initNav() {
  const nav     = document.getElementById('nav');
  const toggle  = document.getElementById('navToggle');
  const links   = document.getElementById('navLinks');

  if (!nav || !toggle || !links) return;

  // Apply scrolled style when user scrolls past hero
  const onScroll = throttle(() => {
    nav.classList.toggle('nav--scrolled', window.scrollY > 40);
  }, 50);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load

  // Mobile hamburger toggle
  toggle.addEventListener('click', () => {
    const isOpen = links.classList.toggle('is-open');
    toggle.classList.toggle('is-open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
    // Prevent body scroll when menu is open
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close menu when a link is clicked
  links.querySelectorAll('.nav__link').forEach(link => {
    link.addEventListener('click', () => {
      links.classList.remove('is-open');
      toggle.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  // Close menu if user presses Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && links.classList.contains('is-open')) {
      links.classList.remove('is-open');
      toggle.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      toggle.focus();
    }
  });
})();

/* ----------------------------------------------------------------
   2. ACTIVE NAV LINK based on visible section
   ---------------------------------------------------------------- */
(function initActiveNav() {
  const navLinks = document.querySelectorAll('.nav__link');
  if (!navLinks.length) return;

  const sections = CONFIG.navSections
    .map(id => document.getElementById(id))
    .filter(Boolean);

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        navLinks.forEach(link => {
          const href = link.getAttribute('href');
          link.classList.toggle('is-active', href === `#${id}`);
        });
      });
    },
    {
      rootMargin: `-${getComputedStyle(document.documentElement).getPropertyValue('--nav-h') || '64px'} 0px -60% 0px`,
      threshold:  0,
    }
  );

  sections.forEach(section => observer.observe(section));
})();

/* ----------------------------------------------------------------
   3. SMOOTH SCROLL for all anchor links
   ---------------------------------------------------------------- */
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href').slice(1);
      if (!targetId) return;
      const target = document.getElementById(targetId);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Update URL without triggering scroll again
      history.pushState(null, '', `#${targetId}`);
    });
  });
})();

/* ----------------------------------------------------------------
   4. SCROLL REVEAL — fade-in when elements enter viewport
   ---------------------------------------------------------------- */
(function initReveal() {
  const elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;

  // Respect prefers-reduced-motion
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) {
    elements.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach((entry, i) => {
        if (!entry.isIntersecting) return;
        // Stagger siblings within the same parent
        const siblings = Array.from(entry.target.parentElement?.children || [])
          .filter(el => el.classList.contains('reveal'));
        const delay = siblings.indexOf(entry.target) * 80;
        setTimeout(() => entry.target.classList.add('is-visible'), delay);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  elements.forEach(el => observer.observe(el));
})();

/* ----------------------------------------------------------------
   5. COUNTDOWN TIMER
   ---------------------------------------------------------------- */
(function initCountdown() {
  const cdDays  = document.getElementById('cd-days');
  const cdHours = document.getElementById('cd-hours');
  const cdMins  = document.getElementById('cd-mins');
  const cdSecs  = document.getElementById('cd-secs');
  if (!cdDays || !cdHours || !cdMins || !cdSecs) return;

  const eventTime = new Date(CONFIG.eventDate).getTime();

  function update() {
    const now  = Date.now();
    const diff = eventTime - now;

    if (diff <= 0) {
      // Event has passed or started
      cdDays.textContent  = '00';
      cdHours.textContent = '00';
      cdMins.textContent  = '00';
      cdSecs.textContent  = '00';
      const wrapper = cdDays.closest('.hero__countdown');
      if (wrapper) {
        wrapper.setAttribute('aria-label', 'Event is live or has ended');
      }
      return;
    }

    const days  = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins  = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs  = Math.floor((diff % (1000 * 60)) / 1000);

    cdDays.textContent  = pad(days);
    cdHours.textContent = pad(hours);
    cdMins.textContent  = pad(mins);
    cdSecs.textContent  = pad(secs);

    setTimeout(update, 1000);
  }

  update();
})();

/* ----------------------------------------------------------------
   6. FAQ ACCORDION
   ---------------------------------------------------------------- */
(function initFaq() {
  document.querySelectorAll('.faq__q').forEach(button => {
    button.addEventListener('click', () => {
      const item    = button.closest('.faq__item');
      const answer  = item.querySelector('.faq__a');
      const isOpen  = button.getAttribute('aria-expanded') === 'true';

      // Close all other open items first
      document.querySelectorAll('.faq__q[aria-expanded="true"]').forEach(other => {
        if (other !== button) {
          other.setAttribute('aria-expanded', 'false');
          const otherAnswer = other.closest('.faq__item').querySelector('.faq__a');
          if (otherAnswer) otherAnswer.hidden = true;
        }
      });

      // Toggle current
      button.setAttribute('aria-expanded', String(!isOpen));
      answer.hidden = isOpen;
    });
  });
})();

/* ----------------------------------------------------------------
   7. MODAL SYSTEM (Problem Statement details)
   ---------------------------------------------------------------- */
(function initModals() {
  // Open modal when a [data-modal] button is clicked
  document.querySelectorAll('[data-modal]').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const modalId = trigger.getAttribute('data-modal');
      openModal(modalId);
    });
  });

  function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;

    modal.hidden = false;
    document.body.style.overflow = 'hidden';

    // Focus the modal box for keyboard users
    const box = modal.querySelector('.modal__box');
    if (box) {
      box.setAttribute('tabindex', '-1');
      box.focus();
    }

    // Trap focus inside modal
    modal._focusTrap = trapFocus(modal);
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = '';
    if (modal._focusTrap) {
      document.removeEventListener('keydown', modal._focusTrap);
      modal._focusTrap = null;
    }
  }

  // Close via backdrop click or close buttons
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', e => {
      if (e.target.hasAttribute('data-close') || e.target.closest('[data-close]')) {
        closeModal(modal);
      }
    });
  });

  // Close on Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal:not([hidden])').forEach(closeModal);
    }
  });

  // Basic focus trap helper
  function trapFocus(container) {
    const focusable = Array.from(
      container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter(el => !el.hasAttribute('disabled'));

    const first = focusable[0];
    const last  = focusable[focusable.length - 1];

    const handler = e => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    document.addEventListener('keydown', handler);
    return handler;
  }
})();

/* ----------------------------------------------------------------
   8. BACK TO TOP BUTTON
   ---------------------------------------------------------------- */
(function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;

  const onScroll = throttle(() => {
    btn.classList.toggle('is-visible', window.scrollY > 400);
  }, 100);
  window.addEventListener('scroll', onScroll, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

/* ----------------------------------------------------------------
   9. FLOATING HELP BUTTON — scrolls to #help section
   ---------------------------------------------------------------- */
(function initFloatingHelp() {
  const btn  = document.getElementById('floatingHelp');
  const help = document.getElementById('help');
  if (!btn || !help) return;

  btn.addEventListener('click', () => {
    help.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.pushState(null, '', '#help');
  });
})();
