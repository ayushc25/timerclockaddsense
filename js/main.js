/**
 * TimerHub — Shared site behavior
 * Header scroll state, dark theme switcher, mobile drawer, FAQ accordion,
 * scroll reveals, global accessibility keyboard shortcuts, audio settings modal,
 * and a reusable fullscreen focus-mode helper for tool pages.
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initHeaderScroll();
    initMobileDrawer();
    initBackButtons();
    initFaqAccordions();
    initScrollReveal();
    initYear();
    initKeyboardShortcuts();
    initAudioSettingsModal();
    initCookieConsent();
  });

  /* ---------- Theme Management ---------- */
  function initTheme() {
    const THEME_KEY = 'timerhub_theme';
    const getSavedTheme = () => {
      try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
    };
    const setSavedTheme = (theme) => {
      try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
    };

    const saved = getSavedTheme();
    const currentTheme = saved === 'dark' ? 'dark' : 'light';

    document.documentElement.setAttribute('data-theme', currentTheme);

    const updateToggleLabels = (theme) => {
      document.querySelectorAll('.theme-toggle-btn').forEach((btn) => {
        const isDark = theme === 'dark';
        btn.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
        btn.setAttribute('title', isDark ? 'Light theme (Alt+T)' : 'Dark theme (Alt+T)');
      });
    };
    updateToggleLabels(currentTheme);

    document.querySelectorAll('.theme-toggle-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const nowTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', nowTheme);
        setSavedTheme(nowTheme);
        updateToggleLabels(nowTheme);
        window.TimerHubToast && window.TimerHubToast(nowTheme === 'dark' ? 'Dark theme enabled' : 'Light theme enabled', 1800);
      });
    });
  }

  /* ---------- Header Scroll ---------- */
  function initHeaderScroll() {
    const header = document.querySelector('.site-header');
    if (!header) return;
    const onScroll = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 12);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Mobile Navigation Drawer ---------- */
  function initMobileDrawer() {
    const toggle = document.querySelector('.menu-toggle');
    const drawer = document.querySelector('.mobile-drawer');
    const header = document.querySelector('.site-header');
    if (!toggle || !drawer) return;

    const hamburgerSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
    const closeSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>';

    const updateDrawerPosition = () => {
      if (header) {
        const h = Math.round(header.getBoundingClientRect().height);
        drawer.style.top = `${h}px`;
      }
    };

    const close = () => {
      drawer.classList.remove('is-open');
      toggle.classList.remove('is-active');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.innerHTML = hamburgerSvg;
      document.body.style.overflow = '';
    };
    const open = () => {
      updateDrawerPosition();
      drawer.classList.add('is-open');
      toggle.classList.add('is-active');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.innerHTML = closeSvg;
      document.body.style.overflow = 'hidden';
    };
    toggle.addEventListener('click', () => {
      const isOpen = drawer.classList.contains('is-open');
      isOpen ? close() : open();
    });
    drawer.querySelectorAll('a, [data-drawer-close]').forEach((el) => el.addEventListener('click', close));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawer.classList.contains('is-open')) close(); });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 900 && drawer.classList.contains('is-open')) {
        close();
      } else if (drawer.classList.contains('is-open')) {
        updateDrawerPosition();
      }
    }, { passive: true });
  }

  /* ---------- Back Navigation ---------- */
  function initBackButtons() {
    document.querySelectorAll('[data-back-btn]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const hasHistory = window.history.length > 1;
        let isSameSite = false;
        try {
          if (document.referrer) {
            const ref = new URL(document.referrer, window.location.origin);
            isSameSite = ref.origin === window.location.origin;
          }
        } catch (err) {
          isSameSite = false;
        }

        if (hasHistory && isSameSite) {
          e.preventDefault();
          window.history.back();
        }
      });
    });

    const homeBack = document.querySelector('.home-back-nav');
    if (homeBack) {
      try {
        if (document.referrer) {
          const ref = new URL(document.referrer, window.location.origin);
          if (ref.origin === window.location.origin && ref.pathname !== window.location.pathname) {
            homeBack.style.display = 'flex';
          }
        }
      } catch (err) {}
    }
  }

  /* ---------- FAQ Accordions ---------- */
  function initFaqAccordions() {
    document.querySelectorAll('.faq-item').forEach((item) => {
      const question = item.querySelector('.faq-question');
      if (!question) return;
      question.addEventListener('click', () => {
        const isOpen = item.classList.contains('is-open');
        item.classList.toggle('is-open', !isOpen);
        question.setAttribute('aria-expanded', String(!isOpen));
      });
    });
  }

  /* ---------- Scroll Reveal ---------- */
  function initScrollReveal() {
    const targets = document.querySelectorAll('.reveal:not(.is-visible)');
    if (!targets.length) return;
    if (!('IntersectionObserver' in window)) {
      targets.forEach((t) => t.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    targets.forEach((t) => io.observe(t));
  }
  window.TimerHubInitScrollReveal = initScrollReveal;

  /* ---------- Year helper ---------- */
  function initYear() {
    document.querySelectorAll('[data-year]').forEach((el) => {
      el.textContent = new Date().getFullYear();
    });
  }

  /* ---------- Accessibility: Global Keyboard Shortcuts ---------- */
  function initKeyboardShortcuts() {
    // Inject Shortcuts Modal
    let modal = document.getElementById('shortcuts-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'shortcuts-modal';
      modal.className = 'modal-backdrop';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-labelledby', 'shortcuts-title');
      modal.innerHTML = `
        <div class="modal-card">
          <div class="modal-header">
            <h3 class="modal-title" id="shortcuts-title">Keyboard Shortcuts</h3>
            <button class="modal-close-btn" data-modal-close aria-label="Close shortcuts dialog">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="shortcuts-grid">
            <div class="shortcut-row">
              <span class="shortcut-desc">Start / Pause / Resume timer</span>
              <kbd class="kbd-key">Space</kbd>
            </div>
            <div class="shortcut-row">
              <span class="shortcut-desc">Reset current timer</span>
              <kbd class="kbd-key">R</kbd>
            </div>
            <div class="shortcut-row">
              <span class="shortcut-desc">Toggle sound / Mute</span>
              <kbd class="kbd-key">M</kbd>
            </div>
            <div class="shortcut-row">
              <span class="shortcut-desc">Toggle Fullscreen focus</span>
              <kbd class="kbd-key">F</kbd>
            </div>
            <div class="shortcut-row">
              <span class="shortcut-desc">Toggle Dark / Light theme</span>
              <kbd class="kbd-key">Alt + T</kbd>
            </div>
            <div class="shortcut-row">
              <span class="shortcut-desc">Exit Fullscreen / Close modal</span>
              <kbd class="kbd-key">Esc</kbd>
            </div>
            <div class="shortcut-row">
              <span class="shortcut-desc">Open this shortcuts help</span>
              <kbd class="kbd-key">?</kbd>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      modal.querySelectorAll('[data-modal-close]').forEach((btn) => {
        btn.addEventListener('click', () => modal.classList.remove('is-open'));
      });
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('is-open');
      });
    }

    window.TimerHubShortcuts = {
      open() { modal.classList.add('is-open'); },
      close() { modal.classList.remove('is-open'); },
      toggle() { modal.classList.toggle('is-open'); }
    };

    // Global Key Listener
    document.addEventListener('keydown', (e) => {
      // Don't intercept if user is typing in form inputs
      const tag = document.activeElement ? document.activeElement.tagName.toUpperCase() : '';
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;

      // Theme toggle: Alt + T
      if (e.altKey && (e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        const toggleBtn = document.querySelector('.theme-toggle-btn');
        if (toggleBtn) toggleBtn.click();
        return;
      }

      // Open shortcuts modal: ? or Shift + /
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        window.TimerHubShortcuts.toggle();
        return;
      }

      // Close modal on Escape
      if (e.key === 'Escape') {
        if (modal.classList.contains('is-open')) {
          e.preventDefault();
          window.TimerHubShortcuts.close();
          return;
        }
        const audioModal = document.getElementById('audio-settings-modal');
        if (audioModal && audioModal.classList.contains('is-open')) {
          e.preventDefault();
          audioModal.classList.remove('is-open');
          return;
        }
      }

      // Timer tool page shortcuts
      const btnPrimary = document.getElementById('btn-primary');
      const btnReset = document.getElementById('btn-reset');
      const soundToggle = document.getElementById('sound-toggle');
      const fullscreenToggle = document.querySelector('[data-fullscreen-open]');

      // Space: Start / Pause
      if (e.code === 'Space' && btnPrimary && !modal.classList.contains('is-open')) {
        e.preventDefault();
        btnPrimary.click();
        return;
      }

      // R: Reset
      if ((e.key === 'r' || e.key === 'R') && !e.ctrlKey && !e.metaKey && btnReset) {
        e.preventDefault();
        btnReset.click();
        return;
      }

      // M: Mute / Sound
      if ((e.key === 'm' || e.key === 'M') && !e.ctrlKey && !e.metaKey && soundToggle) {
        e.preventDefault();
        soundToggle.click();
        return;
      }

      // F: Fullscreen
      if ((e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.metaKey && fullscreenToggle) {
        e.preventDefault();
        fullscreenToggle.click();
        return;
      }
    });

    // Wire up any shortcuts trigger buttons
    document.querySelectorAll('[data-shortcuts-trigger]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.TimerHubShortcuts.open();
      });
    });
  }

  /* ---------- Audio Settings Modal ---------- */
  function initAudioSettingsModal() {
    if (!window.TimerHubAudio) return;

    let modal = document.getElementById('audio-settings-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'audio-settings-modal';
      modal.className = 'modal-backdrop';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-labelledby', 'audio-modal-title');
      modal.innerHTML = `
        <div class="modal-card">
          <div class="modal-header">
            <h3 class="modal-title" id="audio-modal-title">Audio & Sound Alerts</h3>
            <button class="modal-close-btn" data-audio-modal-close aria-label="Close audio settings">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="audio-panel-body">
            <div class="setting-item">
              <div class="setting-label-row">
                <span class="setting-label">Sound Alerts</span>
                <button class="btn btn-sm" id="modal-sound-enable-btn">Enabled</button>
              </div>
            </div>
            <div class="setting-item">
              <div class="setting-label-row">
                <span class="setting-label">Master Volume</span>
                <span class="text-muted" id="volume-val-display">${Math.round(window.TimerHubAudio.volume * 100)}%</span>
              </div>
              <div class="volume-slider-wrap">
                <input type="range" class="volume-slider" id="master-volume-slider" min="0" max="1" step="0.05" value="${window.TimerHubAudio.volume}" aria-label="Master volume">
              </div>
            </div>
            <div class="setting-item">
              <div class="setting-label-row">
                <span class="setting-label">Completion Alert Sound</span>
                <button class="btn btn-sm btn-secondary" id="btn-sound-preview">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 010 7"/></svg>
                  Preview
                </button>
              </div>
              <div class="sound-type-grid" id="sound-type-selector">
                <button class="sound-choice-btn is-featured" data-sound-type="alarm">Timer Alarm (Alerting)</button>
                <button class="sound-choice-btn" data-sound-type="beep">Urgent Beep</button>
                <button class="sound-choice-btn" data-sound-type="digital">Digital Pulse</button>
                <button class="sound-choice-btn" data-sound-type="chime">Gentle Chime</button>
                <button class="sound-choice-btn" data-sound-type="bell">Zen Bell</button>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      const closeBtns = modal.querySelectorAll('[data-audio-modal-close]');
      closeBtns.forEach((b) => b.addEventListener('click', () => modal.classList.remove('is-open')));
      modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('is-open'); });

      // Volume slider
      const volSlider = modal.querySelector('#master-volume-slider');
      const volDisplay = modal.querySelector('#volume-val-display');
      volSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        window.TimerHubAudio.volume = val;
        volDisplay.textContent = `${Math.round(val * 100)}%`;
      });
      volSlider.addEventListener('change', () => {
        window.TimerHubAudio.preview();
      });

      // Sound Toggle
      const enableBtn = modal.querySelector('#modal-sound-enable-btn');
      const syncEnableBtn = () => {
        const isEnabled = window.TimerHubAudio.enabled;
        enableBtn.textContent = isEnabled ? 'Enabled' : 'Muted';
        enableBtn.className = isEnabled ? 'btn btn-sm btn-accent' : 'btn btn-sm btn-secondary';
      };
      syncEnableBtn();
      enableBtn.addEventListener('click', () => {
        window.TimerHubAudio.toggle();
        syncEnableBtn();
        if (window.TimerHubAudio.enabled) window.TimerHubAudio.preview();
      });

      // Sound Type selection
      const typeGrid = modal.querySelector('#sound-type-selector');
      const syncSelectedType = () => {
        const curType = window.TimerHubAudio.soundType;
        typeGrid.querySelectorAll('.sound-choice-btn').forEach((btn) => {
          btn.classList.toggle('is-selected', btn.getAttribute('data-sound-type') === curType);
        });
      };
      syncSelectedType();
      typeGrid.querySelectorAll('.sound-choice-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const type = btn.getAttribute('data-sound-type');
          window.TimerHubAudio.soundType = type;
          syncSelectedType();
          window.TimerHubAudio.preview(type);
        });
      });

      // Preview Button
      modal.querySelector('#btn-sound-preview').addEventListener('click', () => {
        window.TimerHubAudio.preview();
      });
    }

    window.TimerHubAudioModal = {
      open() {
        window.TimerHubAudio.unlock();
        modal.classList.add('is-open');
      },
      close() { modal.classList.remove('is-open'); }
    };

    document.querySelectorAll('[data-audio-settings-trigger]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.TimerHubAudioModal.open();
      });
    });
  }

  /* ---------- GDPR / CCPA Cookie Consent Banner ---------- */
  function initCookieConsent() {
    const CONSENT_KEY = 'timerhub_cookie_consent';
    let consent;
    try { consent = localStorage.getItem(CONSENT_KEY); } catch (e) { consent = null; }
    if (consent) return;

    const banner = document.createElement('aside');
    banner.className = 'cookie-banner';
    banner.setAttribute('aria-label', 'Cookie and privacy preferences');
    banner.innerHTML = `
      <div class="cookie-banner-text">
        TimerHub uses cookies and local storage to keep ongoing timers active, save your sound preferences, and display privacy-conscious advertisements supporting this free tool. See our <a href="${document.querySelector('a[href*="privacy.html"]')?.getAttribute('href') || '/privacy.html'}">Privacy Policy</a>.
      </div>
      <div class="cookie-banner-actions">
        <button class="btn btn-sm btn-secondary" id="cookie-decline-btn">Decline Optional</button>
        <button class="btn btn-sm btn-accent" id="cookie-accept-btn">Accept All</button>
      </div>
    `;
    document.body.appendChild(banner);

    setTimeout(() => banner.classList.add('is-visible'), 800);

    const closeBanner = (choice) => {
      try { localStorage.setItem(CONSENT_KEY, choice); } catch (e) {}
      banner.classList.remove('is-visible');
      setTimeout(() => banner.remove(), 400);
    };

    banner.querySelector('#cookie-accept-btn').addEventListener('click', () => closeBanner('accepted'));
    banner.querySelector('#cookie-decline-btn').addEventListener('click', () => closeBanner('essential_only'));
  }

  /** Toast helper used across tool pages for completion feedback */
  window.TimerHubToast = function showToast(message, duration = 3200) {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(() => toast.classList.remove('is-visible'), duration);
  };

  /** Generic fullscreen-focus toggler for tool pages */
  window.TimerHubFullscreen = function initFullscreen(rootSelector = '.fullscreen-focus') {
    const root = document.querySelector(rootSelector);
    const openBtns = document.querySelectorAll('[data-fullscreen-open]');
    const closeBtn = document.querySelector('[data-fullscreen-close]');
    if (!root) return { open() {}, close() {}, isActive: () => false };

    const stageHost = root.querySelector('[data-fullscreen-slot]');
    const originalParent = document.querySelector('[data-timer-stage]')?.parentElement;
    const stageEl = document.querySelector('[data-timer-stage]');

    function open() {
      if (stageEl && stageHost) stageHost.appendChild(stageEl);
      root.classList.add('is-active');
      document.body.classList.add('is-fullscreen-active');
      openBtns.forEach((b) => b.classList.add('is-active'));
    }
    function close() {
      if (stageEl && originalParent) originalParent.appendChild(stageEl);
      root.classList.remove('is-active');
      document.body.classList.remove('is-fullscreen-active');
      openBtns.forEach((b) => b.classList.remove('is-active'));
    }
    openBtns.forEach((b) => b.addEventListener('click', () => {
      root.classList.contains('is-active') ? close() : open();
    }));
    if (closeBtn) closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

    return { open, close, isActive: () => root.classList.contains('is-active') };
  };
})();
