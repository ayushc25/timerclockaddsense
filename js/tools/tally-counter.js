/**
 * TimerHub — Tally Counter tool
 * Simple increment/decrement counter with adjustable step, keyboard
 * support and an optional click sound.
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const stage = document.querySelector('.timer-stage');
    if (!stage) return;

    const valueEl = stage.querySelector('[data-tally-value]');
    const incBtn = stage.querySelector('[data-increment]');
    const decBtn = stage.querySelector('[data-decrement]');
    const resetBtn = stage.querySelector('[data-reset]');
    const stepChips = stage.querySelectorAll('[data-step]');
    const soundToggle = stage.querySelector('[data-sound-toggle]');

    let count = 0;
    let step = 1;
    let soundOn = false;

    function render() {
      valueEl.textContent = String(count);
    }

    function change(amount) {
      count += amount;
      render();
      if (soundOn) TimerHubAudio.click();
    }

    incBtn.addEventListener('click', () => change(step));
    decBtn.addEventListener('click', () => change(-step));

    resetBtn.addEventListener('click', () => {
      count = 0;
      render();
      if (window.TimerHubToast) TimerHubToast('Counter reset');
    });

    stepChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        stepChips.forEach((c) => c.classList.remove('is-active'));
        chip.classList.add('is-active');
        step = parseInt(chip.getAttribute('data-step'), 10) || 1;
      });
    });

    soundToggle.addEventListener('click', () => {
      soundOn = !soundOn;
      soundToggle.classList.toggle('is-active', soundOn);
      soundToggle.setAttribute('aria-label', soundOn ? 'Sound on' : 'Sound off');
    });

    document.addEventListener('keydown', (e) => {
      if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      if (e.key === 'ArrowUp' || e.key === '+' || e.key === '=') { e.preventDefault(); change(step); }
      else if (e.key === 'ArrowDown' || e.key === '-' || e.key === '_') { e.preventDefault(); change(-step); }
      else if (e.key.toLowerCase() === 'r') { count = 0; render(); if (window.TimerHubToast) TimerHubToast('Counter reset'); }
    });

    render();
  });
})();
