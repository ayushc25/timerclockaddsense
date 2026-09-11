/**
 * TimerHub — Metronome tool
 * Uses a lookahead-style scheduler on top of the Web Audio clock rather than
 * the shared rAF-based TimerEngine, since musicians notice audio jitter that
 * a visual timing loop would hide. See scheduleLoop() below for the
 * trade-off this implies given we can only call TimerHubAudio's public
 * click()/accentClick() methods (its precise oscillator scheduling via
 * _tone() is private).
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', init);

  const MIN_BPM = 30;
  const MAX_BPM = 250;
  const SCHEDULER_INTERVAL_MS = 25;
  const LOOKAHEAD_SEC = 0.1; // ~100ms lookahead window
  const TAP_WINDOW_MS = 2000;
  const TAP_MAX_SAMPLES = 8;

  function init() {
    const stage = document.querySelector('[data-timer-stage]');
    if (!stage) return;

    const statusText = stage.querySelector('[data-status-text]');
    const pulse = stage.querySelector('[data-pulse]');
    const bpmDisplay = stage.querySelector('[data-bpm]');
    const bpmInput = stage.querySelector('[data-input="bpm"]');
    const beatDotsWrap = stage.querySelector('[data-beat-dots]');
    const timeSigRow = stage.querySelector('[data-time-sig-row]');
    const volumeInput = stage.querySelector('[data-input="volume"]');
    const toggleBtn = stage.querySelector('[data-action="toggle"]');
    const toggleIcon = stage.querySelector('[data-toggle-icon]');
    const bpmUpBtn = stage.querySelector('[data-action="bpm-up"]');
    const bpmDownBtn = stage.querySelector('[data-action="bpm-down"]');
    const tapBtn = stage.querySelector('[data-action="tap-tempo"]');

    const ICON_PLAY = '<path d="M8 5v14l11-7z"/>';
    const ICON_PAUSE = '<path d="M7 5v14M17 5v14"/>';

    let bpm = clampBpm(parseInt(bpmInput.value, 10) || 120);
    let beatsPerMeasure = parseInt(timeSigRow.querySelector('.chip.is-active').getAttribute('data-beats'), 10);
    let currentBeat = 0;
    let running = false;
    let audioCtx = null;
    let nextBeatTime = 0;
    let schedulerHandle = null;
    let tapTimes = [];

    function clampBpm(v) { return Math.max(MIN_BPM, Math.min(MAX_BPM, v)); }

    function renderBpm() {
      bpmDisplay.textContent = String(bpm);
      bpmInput.value = bpm;
    }

    function buildBeatDots() {
      beatDotsWrap.innerHTML = '';
      for (let i = 0; i < beatsPerMeasure; i++) {
        const dot = document.createElement('span');
        dot.className = 'beat-dot';
        if (i === 0) dot.classList.add('is-accent');
        beatDotsWrap.appendChild(dot);
      }
    }

    function flashBeat(beatIndex) {
      const isAccent = beatIndex === 0;
      pulse.classList.add('is-beat');
      if (isAccent) pulse.classList.add('is-accent');
      setTimeout(() => {
        pulse.classList.remove('is-beat');
        pulse.classList.remove('is-accent');
      }, 90);

      const dots = beatDotsWrap.querySelectorAll('.beat-dot');
      dots.forEach((d, i) => d.classList.toggle('is-current', i === beatIndex));
    }

    function playBeat(beatIndex) {
      if (beatIndex === 0) TimerHubAudio.accentClick();
      else TimerHubAudio.click();
      flashBeat(beatIndex);
    }

    // --- Lookahead-style scheduler ---
    // A true sample-accurate scheduler would schedule each oscillator's
    // start time directly against the AudioContext clock. Since only the
    // public click()/accentClick() methods are available (they fire
    // immediately against ctx.currentTime), we instead poll frequently and
    // fire a beat as soon as its target time falls inside a short lookahead
    // window. This keeps the visual pulse and the audio click perfectly in
    // sync with each other, at the cost of each beat landing up to
    // ~LOOKAHEAD_SEC early relative to a perfect grid — a deliberate
    // trade-off of visual/beat consistency over sample-accurate scheduling.
    function scheduleLoop() {
      while (nextBeatTime <= audioCtx.currentTime + LOOKAHEAD_SEC) {
        playBeat(currentBeat);
        nextBeatTime += 60 / bpm;
        currentBeat = (currentBeat + 1) % beatsPerMeasure;
      }
    }

    function start() {
      audioCtx = TimerHubAudio.ensureContext();
      if (!audioCtx) return;
      running = true;
      currentBeat = 0;
      nextBeatTime = audioCtx.currentTime + 0.05;
      schedulerHandle = setInterval(scheduleLoop, SCHEDULER_INTERVAL_MS);
      stage.setAttribute('data-state', 'running');
      statusText.textContent = `Playing at ${bpm} BPM`;
      toggleIcon.innerHTML = ICON_PAUSE;
      toggleBtn.setAttribute('aria-label', 'Stop metronome');
    }

    function stop() {
      running = false;
      if (schedulerHandle) clearInterval(schedulerHandle);
      schedulerHandle = null;
      pulse.classList.remove('is-beat', 'is-accent');
      beatDotsWrap.querySelectorAll('.beat-dot').forEach((d) => d.classList.remove('is-current'));
      stage.setAttribute('data-state', 'ready');
      statusText.textContent = 'Ready to practice';
      toggleIcon.innerHTML = ICON_PLAY;
      toggleBtn.setAttribute('aria-label', 'Start metronome');
    }

    toggleBtn.addEventListener('click', () => { running ? stop() : start(); });

    // --- BPM controls ---
    function setBpm(newBpm) {
      bpm = clampBpm(newBpm);
      renderBpm();
      if (running) statusText.textContent = `Playing at ${bpm} BPM`;
    }
    bpmUpBtn.addEventListener('click', () => setBpm(bpm + 1));
    bpmDownBtn.addEventListener('click', () => setBpm(bpm - 1));
    bpmInput.addEventListener('input', () => {
      const v = parseInt(bpmInput.value, 10);
      if (Number.isFinite(v)) setBpm(v);
    });
    bpmInput.addEventListener('blur', renderBpm);

    // --- Tap tempo ---
    tapBtn.addEventListener('click', () => {
      const now = performance.now();
      if (tapTimes.length && now - tapTimes[tapTimes.length - 1] > TAP_WINDOW_MS) {
        tapTimes = [];
      }
      tapTimes.push(now);
      if (tapTimes.length > TAP_MAX_SAMPLES) tapTimes.shift();
      if (tapTimes.length >= 2) {
        let totalGap = 0;
        for (let i = 1; i < tapTimes.length; i++) totalGap += tapTimes[i] - tapTimes[i - 1];
        const avgGapMs = totalGap / (tapTimes.length - 1);
        setBpm(Math.round(60000 / avgGapMs));
      }
    });

    // --- Time signature ---
    timeSigRow.querySelectorAll('.chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        timeSigRow.querySelectorAll('.chip').forEach((c) => c.classList.remove('is-active'));
        chip.classList.add('is-active');
        beatsPerMeasure = parseInt(chip.getAttribute('data-beats'), 10);
        currentBeat = 0;
        buildBeatDots();
      });
    });

    // --- Volume ---
    volumeInput.value = TimerHubAudio.volume;
    volumeInput.addEventListener('input', () => {
      TimerHubAudio.volume = parseFloat(volumeInput.value);
    });

    // --- Fullscreen ---
    window.TimerHubFullscreen();

    renderBpm();
    buildBeatDots();
  }
})();
