/**
 * TimerHub — Shared site behavior
 * Header scroll state, mobile drawer, FAQ accordion, scroll reveals,
 * and a reusable fullscreen focus-mode helper for tool pages.
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    initHeaderScroll();
    initMobileDrawer();
    initFaqAccordions();
    initScrollReveal();
    initYear();
  });

  function initHeaderScroll() {
    const header = document.querySelector('.site-header');
    if (!header) return;
    const onScroll = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 12);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function initMobileDrawer() {
    const toggle = document.querySelector('.menu-toggle');
    const drawer = document.querySelector('.mobile-drawer');
    if (!toggle || !drawer) return;
    const close = () => {
      drawer.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    };
    const open = () => {
      drawer.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    };
    toggle.addEventListener('click', () => {
      const isOpen = drawer.classList.contains('is-open');
      isOpen ? close() : open();
    });
    drawer.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  }

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

  function initScrollReveal() {
    const targets = document.querySelectorAll('.reveal');
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

  function initYear() {
    document.querySelectorAll('[data-year]').forEach((el) => {
      el.textContent = new Date().getFullYear();
    });
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
