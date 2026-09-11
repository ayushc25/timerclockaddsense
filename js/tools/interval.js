/**
 * TimerHub — Interval Timer
 * Prepare -> Work -> Rest -> ... -> Work -> Complete, driven by a fresh
 * TimerEngine countdown per phase. A 3-2-1 beep cue is derived from each
 * phase's onTick remaining-ms value (no separate setInterval), plus a
 * transition() chime whenever the phase changes.
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const setupEl = document.querySelector('[data-interval-setup]');
    const stage = document.querySelector('[data-timer-stage]');
    if (!setupEl || !stage) return;

    const digitsEl = stage.querySelector('[data-digits]');
    const badgeEl = stage.querySelector('[data-phase-badge]');
    const statusTextEl = stage.querySelector('[data-status-text]');
    const roundCurrentEl = stage.querySelector('[data-round-current]');
    const roundTotalEl = stage.querySelector('[data-round-total]');
    const nextPhaseEl = stage.querySelector('[data-next-phase]');
    const startPauseBtn = stage.querySelector('[data-start-pause-btn]');
    const resetBtn = stage.querySelector('[data-reset-btn]');
    const soundBtn = stage.querySelector('[data-sound-toggle]');

    const startBtn = setupEl.querySelector('[data-start-btn]');
    const fieldWork = document.getElementById('field-work');
    const fieldRest = document.getElementById('field-rest');
    const fieldRounds = document.getElementById('field-rounds');
    const fieldPrep = document.getElementById('field-prep');
    const presetBtns = setupEl.querySelectorAll('[data-preset]');

    const config = { work: 30000, rest: 15000, rounds: 8, prep: 10000 };
    let phase = 'prepare';
    let round = 1;
    let engine = null;
    let lastBeepSecond = null;

    // ---------- Prefill from query params (?work=, &rest=, &rounds=) ----------
    const params = new URLSearchParams(window.location.search);
    if (params.has('work')) {
      const v = parseInt(params.get('work'), 10);
      if (v > 0) fieldWork.value = v;
    }
    if (params.has('rest')) {
      const v = parseInt(params.get('rest'), 10);
      if (v >= 0) fieldRest.value = v;
    }
    if (params.has('rounds')) {
      const v = parseInt(params.get('rounds'), 10);
      if (v > 0) fieldRounds.value = v;
    }

    // ---------- Presets ----------
    presetBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        presetBtns.forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        fieldWork.value = btn.dataset.work;
        fieldRest.value = btn.dataset.rest;
        fieldRounds.value = btn.dataset.rounds;
        if (btn.dataset.prep !== undefined) fieldPrep.value = btn.dataset.prep;
      });
    });
    [fieldWork, fieldRest, fieldRounds, fieldPrep].forEach((f) => {
      f.addEventListener('input', () => presetBtns.forEach((b) => b.classList.remove('is-active')));
    });

    function readConfig() {
      config.work = Math.max(1, parseInt(fieldWork.value, 10) || 30) * 1000;
      config.rest = Math.max(0, parseInt(fieldRest.value, 10) || 0) * 1000;
      config.rounds = Math.max(1, parseInt(fieldRounds.value, 10) || 1);
      config.prep = Math.max(0, parseInt(fieldPrep.value, 10) || 0) * 1000;
    }

    function phaseDuration(p) {
      if (p === 'prepare') return config.prep;
      if (p === 'work') return config.work;
      if (p === 'rest') return config.rest;
      return 0;
    }

    function phaseLabel(p) {
      return { prepare: 'Prepare', work: 'Work', rest: 'Rest', complete: 'Complete' }[p] || '';
    }

    function nextLabel(p) {
      if (p === 'prepare') return 'Work';
      if (p === 'work') {
        if (round >= config.rounds) return 'Complete';
        return config.rest > 0 ? 'Rest' : 'Work';
      }
      if (p === 'rest') return 'Work';
      return '—';
    }

    function renderMeta() {
      badgeEl.textContent = phaseLabel(phase);
      stage.dataset.phase = phase;
      roundCurrentEl.textContent = String(round);
      roundTotalEl.textContent = String(config.rounds);
      nextPhaseEl.textContent = nextLabel(phase);
    }

    function renderDigits(ms) {
      digitsEl.textContent = window.TimerHubTime.formatDuration(ms, { showHours: false });
    }

    function setPlayIcon(showPause) {
      const svg = startPauseBtn.querySelector('svg');
      svg.innerHTML = showPause
        ? '<path d="M7 5v14M17 5v14"/>'
        : '<path d="M8 5v14l11-7z"/>';
    }

    function setEngineState(state, label) {
      stage.dataset.state = state;
      statusTextEl.textContent = label;
    }

    function startPhaseEngine(p) {
      phase = p;
      renderMeta();
      const dur = phaseDuration(p);
      lastBeepSecond = null;
      if (engine) engine.destroy();

      if (dur <= 0) {
        // Zero-length phase (e.g. rest = 0 for EMOM-style work) — skip straight through.
        advancePhase();
        return;
      }

      renderDigits(dur);
      engine = new window.TimerHubTime.TimerEngine({
        mode: 'countdown',
        durationMs: dur,
        onTick(remaining) {
          renderDigits(remaining);
          const secondsLeft = Math.ceil(remaining / 1000);
          if (remaining > 0 && secondsLeft <= 3 && secondsLeft !== lastBeepSecond) {
            lastBeepSecond = secondsLeft;
            window.TimerHubAudio.beep();
          }
        },
        onComplete() {
          advancePhase();
        },
      });
      engine.start();

      const label = p === 'work' ? 'Working' : p === 'rest' ? 'Resting' : 'Get Ready';
      setEngineState('running', label);
      setPlayIcon(true);
      startPauseBtn.setAttribute('aria-label', 'Pause');
    }

    function advancePhase() {
      if (phase === 'prepare') {
        window.TimerHubAudio.transition();
        startPhaseEngine('work');
        return;
      }
      if (phase === 'work') {
        if (round >= config.rounds) {
          finishWorkout();
          return;
        }
        if (config.rest > 0) {
          window.TimerHubAudio.transition();
          startPhaseEngine('rest');
        } else {
          round += 1;
          window.TimerHubAudio.transition();
          startPhaseEngine('work');
        }
        return;
      }
      if (phase === 'rest') {
        round += 1;
        window.TimerHubAudio.transition();
        startPhaseEngine('work');
      }
    }

    function finishWorkout() {
      phase = 'complete';
      if (engine) engine.destroy();
      renderMeta();
      renderDigits(0);
      setEngineState('complete', 'Workout Complete');
      startPauseBtn.hidden = true;
      window.TimerHubAudio.complete();
      window.TimerHubToast('Workout complete');
    }

    // ---------- Controls ----------
    startBtn.addEventListener('click', () => {
      readConfig();
      round = 1;
      setupEl.hidden = true;
      stage.hidden = false;
      startPauseBtn.hidden = false;
      startPhaseEngine(config.prep > 0 ? 'prepare' : 'work');
    });

    startPauseBtn.addEventListener('click', () => {
      if (!engine) return;
      if (stage.dataset.state === 'running') {
        engine.pause();
        setEngineState('paused', 'Paused');
        setPlayIcon(false);
        startPauseBtn.setAttribute('aria-label', 'Resume');
      } else if (stage.dataset.state === 'paused') {
        engine.start();
        const label = phase === 'work' ? 'Working' : phase === 'rest' ? 'Resting' : 'Get Ready';
        setEngineState('running', label);
        setPlayIcon(true);
        startPauseBtn.setAttribute('aria-label', 'Pause');
      }
    });

    resetBtn.addEventListener('click', () => {
      if (engine) { engine.destroy(); engine = null; }
      round = 1;
      phase = 'prepare';
      stage.hidden = true;
      stage.dataset.state = 'ready';
      startPauseBtn.hidden = false;
      setPlayIcon(true);
      setupEl.hidden = false;
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
