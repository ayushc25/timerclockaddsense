/**
 * TimerHub — Timer tool (general-purpose countdown)
 * Drift-resilient, tab-throttling immune, state-persisted countdown timer.
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', init);

  const CIRC = 565.5;
  const STORAGE_KEY = 'timer';

  function init() {
    const stage = document.querySelector('[data-timer-stage]');
    if (!stage) return;

    const digits = stage.querySelector('[data-digits]');
    const caption = stage.querySelector('[data-caption]');
    const ring = stage.querySelector('[data-ring]');
    const statusLabel = stage.querySelector('[data-status-label]');
    const presetRow = stage.querySelector('[data-preset-row]');
    const durationPicker = stage.querySelector('[data-duration-picker]');
    const resetRow = stage.querySelector('[data-reset-row]');

    const hoursInput = document.getElementById('dp-hours');
    const minutesInput = document.getElementById('dp-minutes');
    const secondsInput = document.getElementById('dp-seconds');

    const btnPrimary = document.getElementById('btn-primary');
    const primaryIcon = document.querySelector('[data-primary-icon]');
    const btnAdd = document.getElementById('btn-add');
    const btnRemove = document.getElementById('btn-remove');
    const btnReset = document.getElementById('btn-reset');
    const btnNew = document.getElementById('btn-new');
    const soundToggle = document.getElementById('sound-toggle');

    let durationMs = getPickerDurationMs();
    let engine = null;

    function getPickerDurationMs() {
      const h = clamp(parseInt(hoursInput.value, 10) || 0, 0, 23);
      const m = clamp(parseInt(minutesInput.value, 10) || 0, 0, 59);
      const s = clamp(parseInt(secondsInput.value, 10) || 0, 0, 59);
      return (h * 3600 + m * 60 + s) * 1000;
    }

    function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

    function setPickerFromMs(ms) {
      const totalSec = Math.round(ms / 1000);
      hoursInput.value = Math.floor(totalSec / 3600);
      minutesInput.value = Math.floor((totalSec % 3600) / 60);
      secondsInput.value = totalSec % 60;
    }

    function renderIcon(mode) {
      // mode: 'play' | 'pause' | 'complete'
      if (mode === 'pause') {
        primaryIcon.innerHTML = '<path d="M7 5v14M17 5v14"/>';
        btnPrimary.setAttribute('aria-label', 'Pause timer (Space)');
      } else if (mode === 'complete') {
        primaryIcon.innerHTML = '<path d="M5 13l4 4L19 7"/>';
        btnPrimary.setAttribute('aria-label', 'Timer complete (Space to reset)');
      } else {
        primaryIcon.innerHTML = '<path d="M8 5v14l11-7z"/>';
        btnPrimary.setAttribute('aria-label', mode === 'resume' ? 'Resume timer (Space)' : 'Start timer (Space)');
      }
    }

    function renderTime(remainingMs) {
      digits.textContent = TimerHubTime.formatDuration(remainingMs, { showHours: 'auto' });
      caption.textContent = 'of ' + TimerHubTime.formatDuration(durationMs, { showHours: 'auto' });
      const frac = durationMs > 0 ? remainingMs / durationMs : 0;
      ring.setAttribute('stroke-dashoffset', String(CIRC * (1 - frac)));
    }

    function setState(state, label) {
      stage.setAttribute('data-state', state);
      if (label) statusLabel.textContent = label;
      persist();
    }

    function persist() {
      const curState = stage.getAttribute('data-state');
      if (curState === 'running' && engine) {
        TimerHubTime.TimerHubState.save(STORAGE_KEY, {
          state: 'running',
          durationMs,
          targetEndTime: engine.targetEndTime,
          hours: hoursInput.value,
          minutes: minutesInput.value,
          seconds: secondsInput.value
        });
      } else if (curState === 'paused' && engine) {
        TimerHubTime.TimerHubState.save(STORAGE_KEY, {
          state: 'paused',
          durationMs,
          remainingMs: engine.remaining,
          hours: hoursInput.value,
          minutes: minutesInput.value,
          seconds: secondsInput.value
        });
      } else if (curState === 'ready') {
        TimerHubTime.TimerHubState.save(STORAGE_KEY, {
          state: 'ready',
          durationMs,
          hours: hoursInput.value,
          minutes: minutesInput.value,
          seconds: secondsInput.value
        });
      } else {
        TimerHubTime.TimerHubState.clear(STORAGE_KEY);
      }
    }

    function goReady() {
      if (engine) engine.destroy();
      engine = null;
      durationMs = getPickerDurationMs();
      renderTime(durationMs);
      setState('ready', 'Ready to start');
      renderIcon('play');
      durationPicker.style.pointerEvents = '';
      durationPicker.style.opacity = '';
      presetRow.style.pointerEvents = '';
      presetRow.style.opacity = '';
      resetRow.style.display = 'none';
      btnAdd.disabled = false;
      btnRemove.disabled = false;
    }

    function lockPickerUI(locked) {
      durationPicker.style.opacity = locked ? '0.45' : '';
      durationPicker.style.pointerEvents = locked ? 'none' : '';
      presetRow.style.opacity = locked ? '0.45' : '';
      presetRow.style.pointerEvents = locked ? 'none' : '';
    }

    function createEngine(resumeRemaining = null) {
      if (engine) engine.destroy();
      engine = new TimerHubTime.TimerEngine({
        mode: 'countdown',
        durationMs,
        onTick: (remaining) => {
          renderTime(remaining);
        },
        onComplete: onComplete,
      });
      if (resumeRemaining !== null) {
        engine.elapsedBeforeStart = durationMs - resumeRemaining;
      }
    }

    function start() {
      if (durationMs <= 0) durationMs = getPickerDurationMs();
      if (durationMs <= 0) return;
      TimerHubAudio.unlock();
      TimerHubAudio.beep();
      createEngine();
      engine.start();
      setState('running', 'Timer running');
      renderIcon('pause');
      lockPickerUI(true);
      resetRow.style.display = 'none';
    }

    function pause() {
      if (!engine) return;
      engine.pause();
      setState('paused', 'Timer paused');
      renderIcon('resume');
    }

    function resume() {
      if (!engine) return;
      TimerHubAudio.unlock();
      TimerHubAudio.beep();
      engine.start();
      setState('running', 'Timer running');
      renderIcon('pause');
    }

    function onComplete() {
      setState('complete', 'Timer complete');
      renderIcon('complete');
      renderTime(0);
      TimerHubAudio.complete();
      window.TimerHubToast('Timer complete');
      resetRow.style.display = 'flex';
      lockPickerUI(false);
      TimerHubTime.TimerHubState.clear(STORAGE_KEY);
    }

    function resetToCurrentDuration() {
      if (engine) engine.reset(durationMs);
      renderTime(durationMs);
      setState('ready', 'Ready to start');
      renderIcon('play');
      lockPickerUI(false);
      resetRow.style.display = 'none';
    }

    function adjustTime(deltaMs) {
      const state = stage.getAttribute('data-state');
      if (state === 'running' || state === 'paused') {
        engine.addTime(deltaMs);
        durationMs = Math.max(0, durationMs + deltaMs);
        renderTime(engine.remaining);
        persist();
      } else {
        durationMs = Math.max(0, durationMs + deltaMs);
        setPickerFromMs(durationMs);
        renderTime(durationMs);
        persist();
      }
    }

    // --- Presets ---
    presetRow.querySelectorAll('[data-preset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        presetRow.querySelectorAll('.chip').forEach((c) => c.classList.remove('is-active'));
        btn.classList.add('is-active');
        const mins = parseInt(btn.getAttribute('data-preset'), 10);
        durationMs = mins * 60 * 1000;
        setPickerFromMs(durationMs);
        renderTime(durationMs);
        persist();
      });
    });

    // --- Duration picker manual edits ---
    [hoursInput, minutesInput, secondsInput].forEach((input) => {
      input.addEventListener('input', () => {
        presetRow.querySelectorAll('.chip').forEach((c) => c.classList.remove('is-active'));
        durationMs = getPickerDurationMs();
        renderTime(durationMs);
        persist();
      });
    });

    // --- Controls ---
    btnPrimary.addEventListener('click', () => {
      const state = stage.getAttribute('data-state');
      if (state === 'ready') start();
      else if (state === 'running') pause();
      else if (state === 'paused') resume();
      else if (state === 'complete') goReady();
    });

    btnAdd.addEventListener('click', () => adjustTime(60000));
    btnRemove.addEventListener('click', () => adjustTime(-60000));

    btnReset.addEventListener('click', resetToCurrentDuration);
    btnNew.addEventListener('click', goReady);

    // --- Sound toggle ---
    const updateSoundToggleUI = () => {
      const enabled = TimerHubAudio.enabled;
      soundToggle.classList.toggle('is-active', enabled);
      soundToggle.setAttribute('aria-label', enabled ? 'Sound on (M to mute, click settings to adjust)' : 'Sound off (M to unmute)');
      soundToggle.querySelector('svg').innerHTML = enabled
        ? '<path d="M11 5L6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 010 7"/>'
        : '<path d="M11 5L6 9H3v6h3l5 4z"/><path d="M17 9l4 4M21 9l-4 4" stroke-linecap="round"/>';
    };

    soundToggle.addEventListener('click', (e) => {
      // Primary click toggles mute
      TimerHubAudio.toggle();
      updateSoundToggleUI();
    });

    window.addEventListener('timerhub:soundchange', updateSoundToggleUI);
    updateSoundToggleUI();

    // --- Fullscreen ---
    window.TimerHubFullscreen();

    // --- Restore State from LocalStorage ---
    function restoreState() {
      const saved = TimerHubTime.TimerHubState.load(STORAGE_KEY);
      if (!saved) {
        renderTime(durationMs);
        setState('ready', 'Ready to start');
        return;
      }

      if (saved.hours != null) hoursInput.value = saved.hours;
      if (saved.minutes != null) minutesInput.value = saved.minutes;
      if (saved.seconds != null) secondsInput.value = saved.seconds;
      if (saved.durationMs) durationMs = saved.durationMs;

      if (saved.state === 'running' && saved.targetEndTime) {
        const remaining = saved.targetEndTime - Date.now();
        if (remaining > 0) {
          createEngine(remaining);
          engine.start({ resumeRemaining: remaining });
          setState('running', 'Timer running');
          renderIcon('pause');
          lockPickerUI(true);
          resetRow.style.display = 'none';
          window.TimerHubToast('Restored active countdown', 2000);
          return;
        } else {
          // Finished while away
          renderTime(0);
          setState('complete', 'Timer complete');
          renderIcon('complete');
          resetRow.style.display = 'flex';
          lockPickerUI(false);
          window.TimerHubToast('Timer completed while tab was closed', 4000);
          TimerHubTime.TimerHubState.clear(STORAGE_KEY);
          return;
        }
      } else if (saved.state === 'paused' && saved.remainingMs != null) {
        createEngine(saved.remainingMs);
        renderTime(saved.remainingMs);
        setState('paused', 'Timer paused');
        renderIcon('resume');
        lockPickerUI(true);
        resetRow.style.display = 'none';
        return;
      }

      // Default ready
      renderTime(durationMs);
      setState('ready', 'Ready to start');
    }

    restoreState();
  }
})();
