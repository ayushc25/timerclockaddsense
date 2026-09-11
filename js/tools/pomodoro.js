/**
 * TimerHub — Pomodoro Timer tool logic
 * Focus -> Short Break repeating, Long Break after N focus sessions.
 * Auto-advances between phases (with an optional pause-and-confirm mode),
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
    const badgeEl = stage.querySelector('[data-phase-badge]');
    const sessionCurrentEl = stage.querySelector('[data-session-current]');
    const sessionTotalEl = stage.querySelector('[data-session-total]');
    const nextPhaseEl = stage.querySelector('[data-next-phase]');
    const toggleBtn = stage.querySelector('[data-action="toggle"]');
    const toggleIcon = stage.querySelector('[data-toggle-icon]');
    const resetBtn = stage.querySelector('[data-action="reset"]');
    const skipBtn = stage.querySelector('[data-action="skip"]');
    const soundBtn = stage.querySelector('[data-action="sound"]');

    const focusInput = document.querySelector('[data-setting="focus"]');
    const shortInput = document.querySelector('[data-setting="short"]');
    const longInput = document.querySelector('[data-setting="long"]');
    const countInput = document.querySelector('[data-setting="count"]');
    const pauseAutoAdvanceInput = document.querySelector('[data-setting="pause-auto-advance"]');

    const RING_CIRC = 565.5;
    const ICON_PLAY = '<path d="M8 5v14l11-7z"/>';
    const ICON_PAUSE = '<path d="M7 5v14M17 5v14"/>';

    // Live settings (applied at the start of the next phase)
    let settings = {
      focusMin: 25,
      shortMin: 5,
      longMin: 15,
      sessionsBeforeLong: 4,
      pauseAutoAdvance: false,
    };

    // Cycle state
    let phase = 'focus'; // 'focus' | 'short' | 'long'
    let sessionIndex = 1; // which focus session we're on within the current cycle (1-based)
    let awaitingAdvance = false; // true when auto-advance is paused, waiting for user tap

    function phaseDurationMs(p) {
      if (p === 'focus') return settings.focusMin * 60000;
      if (p === 'short') return settings.shortMin * 60000;
      return settings.longMin * 60000;
    }

    function phaseLabel(p) {
      if (p === 'focus') return 'Focus session';
      if (p === 'short') return 'Short break';
      return 'Long break';
    }

    function phaseBadgeLabel(p) {
      if (p === 'focus') return 'Focus';
      if (p === 'short') return 'Short Break';
      return 'Long Break';
    }

    function nextPhaseOf(p, idx) {
      if (p === 'focus') {
        return idx >= settings.sessionsBeforeLong ? 'long' : 'short';
      }
      // after any break, we go back to focus
      return 'focus';
    }

    const engine = new TimerHubTime.TimerEngine({
      mode: 'countdown',
      durationMs: phaseDurationMs(phase),
      onTick: (remaining) => render(remaining),
      onComplete: onPhaseComplete,
    });

    function stagePhaseAttr(p) {
      return p === 'focus' ? 'work' : 'rest';
    }

    function render(remainingMs) {
      digitsEl.textContent = TimerHubTime.formatDuration(remainingMs, { showHours: 'auto' });
      const frac = engine.durationMs > 0 ? remainingMs / engine.durationMs : 0;
      ringEl.setAttribute('stroke-dashoffset', String(RING_CIRC * (1 - frac)));
    }

    function updateMeta() {
      badgeEl.textContent = phaseBadgeLabel(phase);
      captionEl.textContent = phaseLabel(phase);
      stage.setAttribute('data-phase', stagePhaseAttr(phase));
      sessionCurrentEl.textContent = String(Math.min(sessionIndex, settings.sessionsBeforeLong));
      sessionTotalEl.textContent = String(settings.sessionsBeforeLong);
      nextPhaseEl.textContent = phaseBadgeLabel(nextPhaseOf(phase, sessionIndex));
    }

    function setState(state) {
      stage.setAttribute('data-state', state);
      const labels = {
        ready: 'Ready to focus',
        running: phase === 'focus' ? 'Focusing' : 'On break',
        paused: 'Paused',
        complete: 'Cycle complete',
      };
      statusEl.textContent = labels[state] || '';
      toggleBtn.setAttribute('aria-label', state === 'running' ? 'Pause' : 'Start');
      toggleIcon.innerHTML = state === 'running' ? ICON_PAUSE : ICON_PLAY;
    }

    function loadPhase(p, { autoStart } = { autoStart: false }) {
      phase = p;
      const ms = phaseDurationMs(p);
      engine.reset(ms);
      updateMeta();
      render(engine.remaining);
      if (autoStart) {
        engine.start();
        setState('running');
      } else {
        setState('ready');
      }
    }

    function onPhaseComplete() {
      const finishedPhase = phase;
      const wasFinalOfCycle = finishedPhase === 'long';

      if (wasFinalOfCycle) {
        TimerHubAudio.complete();
        TimerHubToast('Pomodoro cycle complete — nice work');
        sessionIndex = 1;
        loadPhase('focus', { autoStart: false });
        setState('ready');
        return;
      }

      TimerHubAudio.transition();
      const upcoming = nextPhaseOf(finishedPhase, sessionIndex);

      // advance session index only when a focus session just finished
      if (finishedPhase === 'focus') {
        // session index stays the same until the break for it finishes; increment after break
      }

      if (settings.pauseAutoAdvance) {
        awaitingAdvance = true;
        phase = upcoming;
        const ms = phaseDurationMs(upcoming);
        engine.reset(ms);
        if (finishedPhase !== 'focus') sessionIndex += 1;
        updateMeta();
        render(engine.remaining);
        setState('ready');
        TimerHubToast(`${phaseLabel(upcoming)} up next — tap start when ready`);
      } else {
        if (finishedPhase !== 'focus') sessionIndex += 1;
        loadPhase(upcoming, { autoStart: true });
      }
    }

    function readSettingsFromInputs() {
      settings.focusMin = Math.max(1, parseInt(focusInput.value, 10) || 25);
      settings.shortMin = Math.max(1, parseInt(shortInput.value, 10) || 5);
      settings.longMin = Math.max(1, parseInt(longInput.value, 10) || 15);
      settings.sessionsBeforeLong = Math.max(2, parseInt(countInput.value, 10) || 4);
      settings.pauseAutoAdvance = !!pauseAutoAdvanceInput.checked;
    }

    [focusInput, shortInput, longInput, countInput].forEach((input) => {
      input.addEventListener('change', () => {
        readSettingsFromInputs();
        // Only refresh the on-screen duration if the current phase isn't running.
        if (stage.getAttribute('data-state') !== 'running') {
          engine.reset(phaseDurationMs(phase));
          updateMeta();
          render(engine.remaining);
        } else {
          updateMeta();
        }
      });
    });
    pauseAutoAdvanceInput.addEventListener('change', readSettingsFromInputs);

    toggleBtn.addEventListener('click', () => {
      const state = stage.getAttribute('data-state');
      if (state === 'running') {
        engine.pause();
        setState('paused');
      } else {
        engine.start();
        setState('running');
      }
    });

    resetBtn.addEventListener('click', () => {
      sessionIndex = 1;
      loadPhase('focus', { autoStart: false });
    });

    skipBtn.addEventListener('click', () => {
      engine.pause();
      onPhaseComplete();
    });

    soundBtn.addEventListener('click', () => {
      const enabled = TimerHubAudio.toggle();
      soundBtn.classList.toggle('is-active', enabled);
      soundBtn.setAttribute('aria-label', enabled ? 'Sound on' : 'Sound off');
    });
    soundBtn.classList.toggle('is-active', TimerHubAudio.enabled);

    // Query params: focus, break (minutes) pre-fill settings
    const params = new URLSearchParams(window.location.search);
    const qFocus = parseFloat(params.get('focus'));
    const qBreak = parseFloat(params.get('break'));
    if (!Number.isNaN(qFocus) && qFocus > 0) focusInput.value = qFocus;
    if (!Number.isNaN(qBreak) && qBreak > 0) shortInput.value = qBreak;

    readSettingsFromInputs();
    loadPhase('focus', { autoStart: false });

    window.TimerHubFullscreen();
  });
})();
