/**
 * TimerHub — Countdown Timer tool logic
 * Configuration-forward countdown: preset chips + full H:M:S entry,
 * drift-corrected via TimerHubTime.TimerEngine.
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const stage = document.querySelector('[data-timer-stage]');
    if (!stage) return;

    const digitsEl = stage.querySelector('[data-digits]');
    const captionEl = stage.querySelector('[data-caption]');
    const ringEl = stage.querySelector('[data-ring]');
    const statusEl = stage.querySelector('[data-status-text]');
    const headingEl = document.querySelector('[data-label-heading]');
    const hoursInput = stage.querySelector('[data-input="hours"]');
    const minutesInput = stage.querySelector('[data-input="minutes"]');
    const secondsInput = stage.querySelector('[data-input="seconds"]');
    const toggleBtn = stage.querySelector('[data-action="toggle"]');
    const toggleIcon = stage.querySelector('[data-toggle-icon]');
    const resetBtn = stage.querySelector('[data-action="reset"]');
    const addBtn = stage.querySelector('[data-action="add"]');
    const removeBtn = stage.querySelector('[data-action="remove"]');
    const soundBtn = stage.querySelector('[data-action="sound"]');
    const presetButtons = stage.querySelectorAll('[data-preset]');
    const RING_CIRC = 565.5;

    const ICON_PLAY = '<path d="M8 5v14l11-7z"/>';
    const ICON_PAUSE = '<path d="M7 5v14M17 5v14"/>';

    let customLabel = null;

    function readDurationMs() {
      const h = Math.max(0, Math.min(23, parseInt(hoursInput.value, 10) || 0));
      const m = Math.max(0, Math.min(59, parseInt(minutesInput.value, 10) || 0));
      const s = Math.max(0, Math.min(59, parseInt(secondsInput.value, 10) || 0));
      return (h * 3600 + m * 60 + s) * 1000;
    }

    function writeDurationFields(ms) {
      const totalSec = Math.round(ms / 1000);
      hoursInput.value = Math.floor(totalSec / 3600);
      minutesInput.value = Math.floor((totalSec % 3600) / 60);
      secondsInput.value = totalSec % 60;
    }

    let initialDurationMs = readDurationMs() || 5 * 60 * 1000;

    const engine = new TimerHubTime.TimerEngine({
      mode: 'countdown',
      durationMs: initialDurationMs,
      onTick: (remaining) => render(remaining),
      onComplete: onComplete,
    });

    function updateCaption() {
      if (customLabel) {
        captionEl.textContent = customLabel;
      } else {
        captionEl.textContent = 'Custom countdown';
      }
    }

    function render(remainingMs) {
      const showHours = engine.durationMs >= 3600000;
      digitsEl.textContent = TimerHubTime.formatDuration(remainingMs, { showHours: showHours ? true : 'auto' });
      const frac = engine.durationMs > 0 ? remainingMs / engine.durationMs : 0;
      ringEl.setAttribute('stroke-dashoffset', String(RING_CIRC * (1 - frac)));
    }

    function setState(state) {
      stage.setAttribute('data-state', state);
      const labels = {
        ready: 'Ready to start',
        running: 'Counting down',
        paused: 'Paused',
        complete: 'Complete',
      };
      statusEl.textContent = labels[state] || '';
      toggleBtn.setAttribute('aria-label', state === 'running' ? 'Pause countdown' : 'Start countdown');
      toggleIcon.innerHTML = state === 'running' ? ICON_PAUSE : ICON_PLAY;
    }

    function onComplete() {
      setState('complete');
      digitsEl.textContent = TimerHubTime.formatDuration(0, { showHours: engine.durationMs >= 3600000 });
      ringEl.setAttribute('stroke-dashoffset', '0');
      TimerHubAudio.complete();
      TimerHubToast('Countdown complete');
    }

    function startEngine() {
      if (stage.getAttribute('data-state') === 'complete' || stage.getAttribute('data-state') === 'ready') {
        const ms = readDurationMs();
        if (ms <= 0) return;
        engine.reset(ms);
      }
      engine.start();
      setState('running');
    }

    function pauseEngine() {
      engine.pause();
      setState('paused');
    }

    toggleBtn.addEventListener('click', () => {
      const state = stage.getAttribute('data-state');
      if (state === 'running') {
        pauseEngine();
      } else {
        startEngine();
      }
    });

    resetBtn.addEventListener('click', () => {
      const ms = readDurationMs();
      engine.reset(ms);
      setState('ready');
      render(engine.remaining);
    });

    addBtn.addEventListener('click', () => {
      engine.addTime(60000);
      writeDurationFields(engine.durationMs);
      render(engine.remaining);
      if (stage.getAttribute('data-state') === 'complete') setState('paused');
    });

    removeBtn.addEventListener('click', () => {
      const current = engine.remaining;
      const delta = Math.min(60000, current);
      engine.addTime(-delta);
      writeDurationFields(engine.durationMs);
      render(engine.remaining);
    });

    soundBtn.addEventListener('click', () => {
      const enabled = TimerHubAudio.toggle();
      soundBtn.classList.toggle('is-active', enabled);
      soundBtn.setAttribute('aria-label', enabled ? 'Sound on' : 'Sound off');
    });
    soundBtn.classList.toggle('is-active', TimerHubAudio.enabled);

    [hoursInput, minutesInput, secondsInput].forEach((input) => {
      input.addEventListener('change', () => {
        if (stage.getAttribute('data-state') === 'running') return;
        const ms = readDurationMs();
        engine.reset(ms);
        setState('ready');
        render(engine.remaining);
      });
    });

    presetButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        presetButtons.forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        const minutes = parseInt(btn.getAttribute('data-preset'), 10) || 0;
        writeDurationFields(minutes * 60000);
        const ms = readDurationMs();
        engine.reset(ms);
        setState('ready');
        render(engine.remaining);
      });
    });

    // Query params: minutes (pre-fill duration), label (caption/heading override)
    const params = new URLSearchParams(window.location.search);
    const qMinutes = parseFloat(params.get('minutes'));
    const qLabel = params.get('label');

    if (qLabel) {
      customLabel = qLabel;
      if (headingEl) headingEl.textContent = qLabel;
    }
    if (!Number.isNaN(qMinutes) && qMinutes > 0) {
      writeDurationFields(qMinutes * 60000);
    }

    updateCaption();
    const startingMs = readDurationMs() || 5 * 60 * 1000;
    engine.reset(startingMs);
    setState('ready');
    render(engine.remaining);

    window.TimerHubFullscreen();
  });
})();
