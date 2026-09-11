/**
 * TimerHub — Meditation Timer tool
 * A minimal, calm countdown with an optional short settling period before
 * the session begins, and a soft bell (not the harsher completion chime)
 * at both the start and end of the sit.
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', init);

  const CIRC = 565.5;
  const PREP_MS = 10000;

  function init() {
    const stage = document.querySelector('[data-timer-stage]');
    if (!stage) return;

    const statusText = stage.querySelector('[data-status-text]');
    const digits = stage.querySelector('[data-digits]');
    const caption = stage.querySelector('[data-caption]');
    const ring = stage.querySelector('[data-ring]');
    const presetRow = stage.querySelector('[data-preset-row]');
    const customDuration = stage.querySelector('[data-custom-duration]');
    const minutesInput = stage.querySelector('[data-input="minutes"]');
    const prepToggle = stage.querySelector('[data-input="prep-toggle"]');

    const toggleBtn = stage.querySelector('[data-action="toggle"]');
    const toggleIcon = stage.querySelector('[data-toggle-icon]');
    const resetRow = stage.querySelector('[data-reset-row]');
    const resetBtn = stage.querySelector('[data-action="reset"]');
    const beginAnotherBtn = stage.querySelector('[data-action="begin-another"]');
    const soundToggle = stage.querySelector('[data-action="sound"]');

    const ICON_PLAY = '<path d="M8 5v14l11-7z"/>';
    const ICON_PAUSE = '<path d="M7 5v14M17 5v14"/>';

    let sessionMs = getMinutes() * 60 * 1000;
    let phase = 'idle'; // idle | prep | session
    let engine = null;

    // --- Prefill from query param (e.g. arriving from a Templates page) ---
    (function prefillFromQuery() {
      const params = new URLSearchParams(window.location.search);
      const qMinutes = parseInt(params.get('minutes'), 10);
      if (Number.isFinite(qMinutes) && qMinutes > 0) {
        minutesInput.value = qMinutes;
        presetRow.querySelectorAll('.chip').forEach((c) => {
          c.classList.toggle('is-active', parseInt(c.getAttribute('data-minutes'), 10) === qMinutes);
        });
        sessionMs = qMinutes * 60 * 1000;
      }
    })();

    function getMinutes() {
      return Math.max(1, parseInt(minutesInput.value, 10) || 20);
    }

    function renderIdlePreview() {
      digits.textContent = TimerHubTime.formatDuration(sessionMs, { showHours: 'auto' });
      caption.textContent = 'minutes of stillness';
      ring.setAttribute('stroke-dashoffset', '0');
    }

    function setState(state, label) {
      stage.setAttribute('data-state', state);
      if (label) statusText.textContent = label;
    }

    // --- Presets ---
    presetRow.querySelectorAll('.chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        presetRow.querySelectorAll('.chip').forEach((c) => c.classList.remove('is-active'));
        chip.classList.add('is-active');
        const mins = parseInt(chip.getAttribute('data-minutes'), 10);
        minutesInput.value = mins;
        sessionMs = mins * 60 * 1000;
        renderIdlePreview();
      });
    });
    minutesInput.addEventListener('input', () => {
      presetRow.querySelectorAll('.chip').forEach((c) => c.classList.remove('is-active'));
      sessionMs = getMinutes() * 60 * 1000;
      renderIdlePreview();
    });

    function lockSetupUI(locked) {
      presetRow.style.opacity = locked ? '0.45' : '';
      presetRow.style.pointerEvents = locked ? 'none' : '';
      customDuration.style.opacity = locked ? '0.45' : '';
      customDuration.style.pointerEvents = locked ? 'none' : '';
      prepToggle.disabled = locked;
    }

    function beginSession() {
      sessionMs = getMinutes() * 60 * 1000;
      lockSetupUI(true);
      resetRow.style.display = 'flex';
      toggleIcon.innerHTML = ICON_PAUSE;
      toggleBtn.setAttribute('aria-label', 'Pause');

      if (prepToggle.checked) {
        startPrep();
      } else {
        TimerHubAudio.bell();
        startSession();
      }
    }

    function startPrep() {
      phase = 'prep';
      setState('running', 'Settling in...');
      caption.textContent = 'Settle in...';
      engine = new TimerHubTime.TimerEngine({
        mode: 'countdown',
        durationMs: PREP_MS,
        onTick: (remaining) => {
          digits.textContent = TimerHubTime.formatDuration(remaining, { showHours: false });
          ring.setAttribute('stroke-dashoffset', String(CIRC * (1 - remaining / PREP_MS)));
        },
        onComplete: () => {
          TimerHubAudio.bell();
          startSession();
        },
      });
      engine.start();
    }

    function startSession() {
      phase = 'session';
      setState('running', 'Session running');
      caption.textContent = 'minutes of stillness';
      engine = new TimerHubTime.TimerEngine({
        mode: 'countdown',
        durationMs: sessionMs,
        onTick: (remaining) => {
          digits.textContent = TimerHubTime.formatDuration(remaining, { showHours: 'auto' });
          ring.setAttribute('stroke-dashoffset', String(CIRC * (1 - remaining / sessionMs)));
        },
        onComplete: onSessionComplete,
      });
      engine.start();
    }

    function onSessionComplete() {
      TimerHubAudio.bell();
      setState('complete', 'Session complete');
      caption.textContent = 'Your session has ended. Take a moment before you continue.';
      digits.textContent = '00:00';
      ring.setAttribute('stroke-dashoffset', String(CIRC));
      window.TimerHubToast('Your session has ended. Take a moment before you continue.');
      toggleBtn.hidden = true;
      resetRow.style.display = 'none';
      beginAnotherBtn.hidden = false;
    }

    function togglePauseResume() {
      const state = stage.getAttribute('data-state');
      if (state === 'ready') {
        beginSession();
      } else if (state === 'running') {
        engine.pause();
        setState('paused', phase === 'prep' ? 'Settling — paused' : 'Session paused');
        toggleIcon.innerHTML = ICON_PLAY;
        toggleBtn.setAttribute('aria-label', 'Resume');
      } else if (state === 'paused') {
        engine.start();
        setState('running', phase === 'prep' ? 'Settling in...' : 'Session running');
        toggleIcon.innerHTML = ICON_PAUSE;
        toggleBtn.setAttribute('aria-label', 'Pause');
      }
    }

    function reset() {
      if (engine) engine.destroy();
      engine = null;
      phase = 'idle';
      lockSetupUI(false);
      renderIdlePreview();
      setState('ready', 'Ready when you are');
      toggleIcon.innerHTML = ICON_PLAY;
      toggleBtn.setAttribute('aria-label', 'Begin session');
      toggleBtn.hidden = false;
      resetRow.style.display = 'none';
      beginAnotherBtn.hidden = true;
    }

    toggleBtn.addEventListener('click', togglePauseResume);
    resetBtn.addEventListener('click', reset);
    beginAnotherBtn.addEventListener('click', reset);

    // --- Sound toggle ---
    soundToggle.addEventListener('click', () => {
      const enabled = TimerHubAudio.toggle();
      soundToggle.classList.toggle('is-active', enabled);
      soundToggle.setAttribute('aria-label', enabled ? 'Sound on' : 'Sound off');
      soundToggle.querySelector('svg').innerHTML = enabled
        ? '<path d="M11 5L6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 010 7"/>'
        : '<path d="M11 5L6 9H3v6h3l5 4z"/><path d="M17 9l4 4M21 9l-4 4" stroke-linecap="round"/>';
    });
    if (!TimerHubAudio.enabled) {
      soundToggle.classList.remove('is-active');
      soundToggle.setAttribute('aria-label', 'Sound off');
      soundToggle.querySelector('svg').innerHTML = '<path d="M11 5L6 9H3v6h3l5 4z"/><path d="M17 9l4 4M21 9l-4 4" stroke-linecap="round"/>';
    }

    // --- Fullscreen ---
    window.TimerHubFullscreen();

    renderIdlePreview();
  }
})();
