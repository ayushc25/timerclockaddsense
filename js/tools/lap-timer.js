/**
 * TimerHub — Lap Timer tool
 * Same accurate core as the stopwatch, but foregrounds best/average lap stats.
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const stage = document.querySelector('[data-timer-stage]');
    if (!stage) return;

    const statusText = stage.querySelector('[data-status-text]');
    const digits = stage.querySelector('[data-digits]');
    const startPauseBtn = stage.querySelector('[data-start-pause]');
    const startIcon = stage.querySelector('[data-start-icon]');
    const resetBtn = stage.querySelector('[data-reset]');
    const lapBtn = stage.querySelector('[data-lap]');
    const lapListWrap = stage.querySelector('[data-lap-list-wrap]');
    const lapListEl = stage.querySelector('[data-lap-list]');
    const soundToggle = stage.querySelector('[data-sound-toggle]');
    const statBest = stage.querySelector('[data-stat-best]');
    const statAvg = stage.querySelector('[data-stat-avg]');
    const statCount = stage.querySelector('[data-stat-count]');

    const ICON_PLAY = '<path d="M8 5v14l11-7z"/>';
    const ICON_PAUSE = '<path d="M7 5v14M17 5v14"/>';

    let laps = [];
    let lastLapTotal = 0;
    let lapSoundOn = true;
    let lastRenderMs = -1;

    const engine = new TimerHubTime.TimerEngine({
      mode: 'stopwatch',
      onTick: (elapsed) => renderDigits(elapsed),
      onComplete: () => {},
    });

    function renderDigits(elapsed) {
      if (elapsed - lastRenderMs < 16 && engine.running) return;
      lastRenderMs = elapsed;
      digits.textContent = TimerHubTime.formatDuration(elapsed, { showMillis: true });
    }

    function setState(state) {
      stage.setAttribute('data-state', state);
      const labels = { ready: 'Ready', running: 'Running', paused: 'Paused' };
      statusText.textContent = labels[state] || state;
    }

    function updateButtons() {
      const running = engine.running;
      resetBtn.disabled = running;
      lapBtn.disabled = !running;
      startIcon.innerHTML = running ? ICON_PAUSE : ICON_PLAY;
      startPauseBtn.setAttribute('aria-label', running ? 'Pause lap timer' : (engine.elapsed > 0 ? 'Resume lap timer' : 'Start lap timer'));
    }

    function start() {
      engine.start();
      setState('running');
      updateButtons();
    }

    function pause() {
      engine.pause();
      renderDigits(engine.elapsed);
      setState('paused');
      updateButtons();
    }

    function reset() {
      engine.reset(0);
      laps = [];
      lastLapTotal = 0;
      lastRenderMs = -1;
      renderDigits(0);
      setState('ready');
      lapListWrap.hidden = true;
      lapListEl.innerHTML = '';
      renderStats();
      updateButtons();
    }

    function recordLap() {
      if (!engine.running) return;
      const total = engine.elapsed;
      const delta = total - lastLapTotal;
      lastLapTotal = total;
      laps.push({ index: laps.length + 1, delta, total });
      renderLaps();
      renderStats();
      if (lapSoundOn) TimerHubAudio.beep();
    }

    function renderStats() {
      if (!laps.length) {
        statBest.textContent = 'Best Lap —';
        statAvg.textContent = 'Average —';
        statCount.textContent = 'Laps 0';
        return;
      }
      const deltas = laps.map((l) => l.delta);
      const best = Math.min(...deltas);
      const avg = deltas.reduce((a, b) => a + b, 0) / deltas.length;
      statBest.textContent = `Best Lap ${TimerHubTime.formatDuration(best, { showMillis: true })}`;
      statAvg.textContent = `Average ${TimerHubTime.formatDuration(avg, { showMillis: true })}`;
      statCount.textContent = `Laps ${laps.length}`;
    }

    function renderLaps() {
      if (!laps.length) { lapListWrap.hidden = true; return; }
      lapListWrap.hidden = false;

      let bestIdx = -1, worstIdx = -1;
      if (laps.length >= 2) {
        let bestDelta = Infinity, worstDelta = -Infinity;
        laps.forEach((l, i) => {
          if (l.delta < bestDelta) { bestDelta = l.delta; bestIdx = i; }
          if (l.delta > worstDelta) { worstDelta = l.delta; worstIdx = i; }
        });
      }

      const rows = laps.map((l, i) => {
        const isBest = i === bestIdx;
        const isWorst = i === worstIdx;
        const cls = ['lap-row'];
        if (isBest) cls.push('is-best');
        if (isWorst) cls.push('is-worst');
        return `<div class="${cls.join(' ')}">
          <span class="lap-index">${l.index}</span>
          <span class="lap-delta">${TimerHubTime.formatDuration(l.delta, { showMillis: true })}</span>
          <span class="lap-total">${TimerHubTime.formatDuration(l.total, { showMillis: true })}</span>
        </div>`;
      }).reverse().join('');

      lapListEl.innerHTML = rows;
    }

    startPauseBtn.addEventListener('click', () => {
      if (engine.running) pause(); else start();
    });
    resetBtn.addEventListener('click', () => { if (!engine.running) reset(); });
    lapBtn.addEventListener('click', recordLap);

    soundToggle.addEventListener('click', () => {
      lapSoundOn = !lapSoundOn;
      soundToggle.classList.toggle('is-active', lapSoundOn);
      soundToggle.setAttribute('aria-label', lapSoundOn ? 'Lap sound on' : 'Lap sound off');
    });

    document.addEventListener('keydown', (e) => {
      if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      if (e.code === 'Space') { e.preventDefault(); engine.running ? pause() : start(); }
      else if (e.key.toLowerCase() === 'l') recordLap();
      else if (e.key.toLowerCase() === 'r' && !engine.running) reset();
    });

    if (window.TimerHubFullscreen) window.TimerHubFullscreen();

    renderDigits(0);
    renderStats();
    updateButtons();
  });
})();
