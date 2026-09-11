/**
 * TimerHub — Meeting Timer
 * A calm, professional countdown for meetings and presentations. Drives a
 * single TimerEngine countdown, layering in two non-alarming warning
 * stages (5 min / 1 min remaining) driven off the engine's onTick value.
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const setupEl = document.querySelector('[data-meeting-setup]');
    const stage = document.querySelector('[data-timer-stage]');
    if (!setupEl || !stage) return;

    const digitsEl = stage.querySelector('[data-digits]');
    const captionEl = stage.querySelector('[data-caption]');
    const ringEl = stage.querySelector('[data-ring]');
    const statusTextEl = stage.querySelector('[data-status-text]');
    const startPauseBtn = stage.querySelector('[data-start-pause-btn]');
    const resetBtn = stage.querySelector('[data-reset-btn]');
    const soundBtn = stage.querySelector('[data-sound-toggle]');
    const addTimeBtns = stage.querySelectorAll('[data-add-time]');

    const startBtn = setupEl.querySelector('[data-start-btn]');
    const fieldHours = document.getElementById('field-hours');
    const fieldMinutes = document.getElementById('field-minutes');
    const presetBtns = setupEl.querySelectorAll('[data-minutes]');

    const RING_CIRCUMFERENCE = 565.5;
    const FIVE_MIN_MS = 5 * 60 * 1000;
    const ONE_MIN_MS = 60 * 1000;

    let engine = null;
    let totalMs = 20 * 60 * 1000;
    let warned5 = false;
    let warned1 = false;

    // ---------- Prefill from query param (?minutes=) ----------
    const params = new URLSearchParams(window.location.search);
    if (params.has('minutes')) {
      const v = parseInt(params.get('minutes'), 10);
      if (v > 0) {
        fieldHours.value = Math.floor(v / 60);
        fieldMinutes.value = v % 60;
        presetBtns.forEach((b) => b.classList.toggle('is-active', Number(b.dataset.minutes) === v));
      }
    }

    // ---------- Presets ----------
    presetBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        presetBtns.forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        const mins = Number(btn.dataset.minutes);
        fieldHours.value = 0;
        fieldMinutes.value = mins;
      });
    });
    [fieldHours, fieldMinutes].forEach((f) => {
      f.addEventListener('input', () => presetBtns.forEach((b) => b.classList.remove('is-active')));
    });

    function readDuration() {
      const h = Math.max(0, parseInt(fieldHours.value, 10) || 0);
      const m = Math.max(0, parseInt(fieldMinutes.value, 10) || 0);
      totalMs = Math.max(60000, h * 3600000 + m * 60000);
    }

    function renderDigits(remaining) {
      digitsEl.textContent = window.TimerHubTime.formatDuration(remaining, { showHours: totalMs >= 3600000 });
    }

    function renderRing(remaining) {
      const frac = totalMs > 0 ? remaining / totalMs : 0;
      ringEl.setAttribute('stroke-dashoffset', String(RING_CIRCUMFERENCE * (1 - frac)));
    }

    function renderCaption(text) {
      captionEl.textContent = text;
    }

    function setPlayIcon(showPause) {
      const svg = startPauseBtn.querySelector('svg');
      svg.innerHTML = showPause
        ? '<path d="M7 5v14M17 5v14"/>'
        : '<path d="M8 5v14l11-7z"/>';
    }

    function updateWarningStage(remaining) {
      let level = null;
      if (remaining > 0 && remaining <= ONE_MIN_MS) level = '1min';
      else if (remaining > ONE_MIN_MS && remaining <= FIVE_MIN_MS) level = '5min';

      if (level) stage.dataset.warning = level;
      else delete stage.dataset.warning;

      if (!warned5 && remaining <= FIVE_MIN_MS && remaining > 0) {
        warned5 = true;
        window.TimerHubAudio.transition();
      }
      if (!warned1 && remaining <= ONE_MIN_MS && remaining > 0) {
        warned1 = true;
        window.TimerHubAudio.transition();
      }
    }

    function buildEngine() {
      if (engine) engine.destroy();
      engine = new window.TimerHubTime.TimerEngine({
        mode: 'countdown',
        durationMs: totalMs,
        onTick(remaining) {
          renderDigits(remaining);
          renderRing(remaining);
          updateWarningStage(remaining);
        },
        onComplete() {
          finishMeeting();
        },
      });
    }

    function finishMeeting() {
      stage.dataset.state = 'complete';
      delete stage.dataset.warning;
      renderDigits(0);
      renderRing(0);
      statusTextEl.textContent = 'Time is up';
      renderCaption('Your allotted time has ended.');
      startPauseBtn.hidden = true;
      window.TimerHubAudio.complete();
      window.TimerHubToast('Time is up');
    }

    // ---------- Controls ----------
    startBtn.addEventListener('click', () => {
      readDuration();
      warned5 = false;
      warned1 = false;
      setupEl.hidden = true;
      stage.hidden = false;
      startPauseBtn.hidden = false;
      renderCaption(`of ${window.TimerHubTime.formatDuration(totalMs, { showHours: totalMs >= 3600000 })} allotted`);
      buildEngine();
      renderDigits(totalMs);
      renderRing(totalMs);
      engine.start();
      stage.dataset.state = 'running';
      statusTextEl.textContent = 'Meeting in progress';
      setPlayIcon(true);
      startPauseBtn.setAttribute('aria-label', 'Pause');
    });

    startPauseBtn.addEventListener('click', () => {
      if (!engine) return;
      if (stage.dataset.state === 'running') {
        engine.pause();
        stage.dataset.state = 'paused';
        statusTextEl.textContent = 'Paused';
        setPlayIcon(false);
        startPauseBtn.setAttribute('aria-label', 'Resume');
      } else if (stage.dataset.state === 'paused') {
        engine.start();
        stage.dataset.state = 'running';
        statusTextEl.textContent = 'Meeting in progress';
        setPlayIcon(true);
        startPauseBtn.setAttribute('aria-label', 'Pause');
      }
    });

    resetBtn.addEventListener('click', () => {
      if (engine) { engine.destroy(); engine = null; }
      warned5 = false;
      warned1 = false;
      delete stage.dataset.warning;
      stage.dataset.state = 'ready';
      stage.hidden = true;
      startPauseBtn.hidden = false;
      setPlayIcon(true);
      setupEl.hidden = false;
    });

    addTimeBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!engine) return;
        const ms = Number(btn.dataset.addTime) || 0;
        engine.addTime(ms);
        totalMs += ms;
        renderCaption(`of ${window.TimerHubTime.formatDuration(totalMs, { showHours: totalMs >= 3600000 })} allotted`);
        // Re-evaluate warning stage immediately against the new total.
        updateWarningStage(engine.remaining);
        renderRing(engine.remaining);
      });
    });

    soundBtn.addEventListener('click', () => {
      const enabled = window.TimerHubAudio.toggle();
      soundBtn.classList.toggle('is-active', enabled);
      soundBtn.setAttribute('aria-label', enabled ? 'Sound on' : 'Sound off');
    });
    soundBtn.classList.toggle('is-active', window.TimerHubAudio.enabled);

    // ---------- Fullscreen ----------
    if (typeof window.TimerHubFullscreen === 'function') {
      window.TimerHubFullscreen();
    }
  });
})();
