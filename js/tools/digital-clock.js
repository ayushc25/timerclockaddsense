/**
 * TimerHub — Digital Clock
 * A simple, live, fullscreen-friendly clock display. Purely a readout —
 * no sound, no timing engine needed — updated once a second from the
 * device's own system clock.
 */
(function () {
  'use strict';

  const timeEl = document.querySelector('[data-clock-time]');
  const dateEl = document.querySelector('[data-clock-date]');
  const formatRow = document.querySelector('[data-format-row]');
  const secondsRow = document.querySelector('[data-seconds-row]');

  if (!timeEl) return;

  const { formatClock } = window.TimerHubTime;
  const dateFormatter = new Intl.DateTimeFormat(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  let hour12 = true;
  let showSeconds = true;

  function render() {
    const now = new Date();
    timeEl.textContent = formatClock(now, { hour12, showSeconds });
    dateEl.textContent = dateFormatter.format(now);
  }

  render();
  setInterval(render, 1000);

  formatRow.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-format]');
    if (!chip) return;
    hour12 = chip.dataset.format === '12';
    formatRow.querySelectorAll('.chip').forEach((c) => c.classList.toggle('is-active', c === chip));
    render();
  });

  secondsRow.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-seconds]');
    if (!chip) return;
    showSeconds = chip.dataset.seconds === 'on';
    secondsRow.querySelectorAll('.chip').forEach((c) => c.classList.toggle('is-active', c === chip));
    render();
  });

  if (window.TimerHubFullscreen) window.TimerHubFullscreen();
})();
