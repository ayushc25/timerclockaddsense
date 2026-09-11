/**
 * TimerHub — Chess Clock tool
 * Two independent countdown engines (one per player), tap-to-switch turns,
 * Fischer increment, and flag detection. Only one engine ever runs at a time.
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const stage = document.querySelector('[data-timer-stage]');
    if (!stage) return;

    const statusText = stage.querySelector('[data-status-text]');
    const setupPanel = stage.querySelector('[data-setup]');
    const presetRow = stage.querySelector('[data-time-presets]');
    const minutesInput = stage.querySelector('[data-input="minutes"]');
    const incrementInput = stage.querySelector('[data-input="increment"]');
    const startGameBtn = stage.querySelector('[data-action="start-game"]');

    const chessClock = stage.querySelector('[data-chess-clock]');
    const gameControls = stage.querySelector('[data-game-controls]');
    const newGameBtn = stage.querySelector('[data-action="new-game"]');
    const resetBtn = stage.querySelector('[data-action="reset"]');
    const pauseToggleBtn = stage.querySelector('[data-action="pause-toggle"]');
    const pauseIcon = stage.querySelector('[data-pause-icon]');

    const playerButtons = {
      1: stage.querySelector('.chess-player[data-player="1"]'),
      2: stage.querySelector('.chess-player[data-player="2"]'),
    };
    const labelEls = {
      1: stage.querySelector('[data-label="1"]'),
      2: stage.querySelector('[data-label="2"]'),
    };
    const timeEls = {
      1: stage.querySelector('[data-time="1"]'),
      2: stage.querySelector('[data-time="2"]'),
    };

    const soundToggle = stage.querySelector('[data-action="sound"]');

    const ICON_PAUSE = '<path d="M7 5v14M17 5v14"/>';
    const ICON_PLAY = '<path d="M8 5v14l11-7z"/>';

    let engines = { 1: null, 2: null };
    let incrementMs = 0;
    let activePlayer = 1;
    let flagged = null;

    // --- Prefill from query params (e.g. arriving from a Templates page) ---
    (function prefillFromQuery() {
      const params = new URLSearchParams(window.location.search);
      const qMinutes = parseInt(params.get('minutes'), 10);
      const qIncrement = parseInt(params.get('increment'), 10);
      if (Number.isFinite(qMinutes) && qMinutes > 0) minutesInput.value = qMinutes;
      if (Number.isFinite(qIncrement) && qIncrement >= 0) incrementInput.value = qIncrement;
    })();

    // --- Setup: presets ---
    presetRow.querySelectorAll('.chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        presetRow.querySelectorAll('.chip').forEach((c) => c.classList.remove('is-active'));
        chip.classList.add('is-active');
        minutesInput.value = chip.getAttribute('data-minutes');
        incrementInput.value = chip.getAttribute('data-increment');
      });
    });
    [minutesInput, incrementInput].forEach((input) => {
      input.addEventListener('input', () => {
        presetRow.querySelectorAll('.chip').forEach((c) => c.classList.remove('is-active'));
      });
    });

    function formatTime(ms) {
      return TimerHubTime.formatDuration(Math.max(0, ms), { showHours: 'auto' });
    }

    function renderPlayer(n, remainingMs) {
      timeEls[n].textContent = formatTime(remainingMs);
    }

    function makeEngine(n, durationMs) {
      return new TimerHubTime.TimerEngine({
        mode: 'countdown',
        durationMs,
        onTick: (remaining) => renderPlayer(n, remaining),
        onComplete: () => flagPlayer(n),
      });
    }

    function updateActiveUI() {
      [1, 2].forEach((n) => {
        const isActive = n === activePlayer;
        playerButtons[n].classList.toggle('is-active', isActive && !flagged);
        if (flagged) {
          labelEls[n].textContent = n === flagged ? 'Out of Time' : 'Opponent Wins';
        } else if (stage.getAttribute('data-state') === 'paused') {
          labelEls[n].textContent = isActive ? 'Paused' : 'Waiting';
        } else {
          labelEls[n].textContent = isActive ? 'Your Turn' : 'Waiting';
        }
      });
    }

    function setState(state, label) {
      stage.setAttribute('data-state', state);
      if (label) statusText.textContent = label;
    }

    function startGame() {
      const minutes = Math.max(1, parseInt(minutesInput.value, 10) || 5);
      const incSeconds = Math.max(0, parseInt(incrementInput.value, 10) || 0);
      incrementMs = incSeconds * 1000;
      const durationMs = minutes * 60 * 1000;

      engines[1] = makeEngine(1, durationMs);
      engines[2] = makeEngine(2, durationMs);
      renderPlayer(1, durationMs);
      renderPlayer(2, durationMs);

      activePlayer = 1;
      flagged = null;

      setupPanel.hidden = true;
      chessClock.hidden = false;
      gameControls.hidden = false;
      newGameBtn.hidden = true;
      pauseIcon.innerHTML = ICON_PAUSE;
      pauseToggleBtn.setAttribute('aria-label', 'Pause game');

      setState('running', 'Player 1 to move');
      updateActiveUI();
      engines[1].start();
    }

    function endTurn(n) {
      const state = stage.getAttribute('data-state');
      if (state !== 'running' || flagged) return;
      if (n !== activePlayer) return;

      engines[n].pause();
      engines[n].addTime(incrementMs);
      renderPlayer(n, engines[n].remaining);

      if (soundToggle.classList.contains('is-active')) TimerHubAudio.click();

      activePlayer = n === 1 ? 2 : 1;
      updateActiveUI();
      statusText.textContent = `Player ${activePlayer} to move`;
      engines[activePlayer].start();
    }

    function flagPlayer(n) {
      flagged = n;
      [1, 2].forEach((p) => { if (engines[p]) engines[p].pause(); });
      playerButtons[n].classList.add('is-flagged');
      playerButtons[n].classList.remove('is-active');
      playerButtons[1].disabled = true;
      playerButtons[2].disabled = true;
      updateActiveUI();
      setState('complete', `Player ${n} has run out of time`);
      TimerHubAudio.complete();
      const winner = n === 1 ? 2 : 1;
      window.TimerHubToast(`Time — Player ${n} has run out of time. Player ${winner} wins on time.`);
      gameControls.hidden = true;
      newGameBtn.hidden = false;
    }

    function pauseGame() {
      if (flagged) return;
      engines[activePlayer].pause();
      setState('paused', 'Game paused');
      pauseIcon.innerHTML = ICON_PLAY;
      pauseToggleBtn.setAttribute('aria-label', 'Resume game');
      updateActiveUI();
    }

    function resumeGame() {
      if (flagged) return;
      engines[activePlayer].start();
      setState('running', `Player ${activePlayer} to move`);
      pauseIcon.innerHTML = ICON_PAUSE;
      pauseToggleBtn.setAttribute('aria-label', 'Pause game');
      updateActiveUI();
    }

    function backToSetup() {
      [1, 2].forEach((n) => {
        if (engines[n]) engines[n].destroy();
        engines[n] = null;
        playerButtons[n].classList.remove('is-flagged', 'is-active');
        playerButtons[n].disabled = false;
      });
      flagged = null;
      activePlayer = 1;
      setupPanel.hidden = false;
      chessClock.hidden = true;
      gameControls.hidden = true;
      newGameBtn.hidden = true;
      setState('setup', 'Set up your game');
    }

    playerButtons[1].addEventListener('click', () => endTurn(1));
    playerButtons[2].addEventListener('click', () => endTurn(2));

    startGameBtn.addEventListener('click', startGame);
    resetBtn.addEventListener('click', backToSetup);
    newGameBtn.addEventListener('click', backToSetup);

    pauseToggleBtn.addEventListener('click', () => {
      const state = stage.getAttribute('data-state');
      if (state === 'running') pauseGame();
      else if (state === 'paused') resumeGame();
    });

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
  });
})();
