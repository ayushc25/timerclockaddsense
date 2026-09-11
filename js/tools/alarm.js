/**
 * TimerHub — Online Alarm
 * Lets a visitor pick a clock time, arms a timestamp-based countdown to
 * that moment, and rings an in-page alarm (with a choice of tone
 * "characters") when it fires. Everything runs off Date.now() deltas so
 * the countdown self-corrects rather than accumulating drift.
 */
(function () {
  'use strict';

  const stage = document.querySelector('[data-timer-stage]');
  const statusLabel = document.querySelector('[data-status-label]');
  const clockReadout = document.querySelector('[data-clock-readout]');
  const setView = document.querySelector('[data-set-view]');
  const armedView = document.querySelector('[data-armed-view]');
  const firePreview = document.querySelector('[data-fire-preview]');
  const timeInput = document.getElementById('alarm-time');
  const toneRow = document.querySelector('[data-tone-row]');
  const digits = document.querySelector('[data-digits]');
  const caption = document.querySelector('[data-caption]');
  const btnArm = document.getElementById('btn-arm');
  const stopRow = document.querySelector('[data-stop-row]');
  const btnStop = document.getElementById('btn-stop-alarm');
  const soundToggle = document.getElementById('sound-toggle');

  if (!stage) return;

  const { formatDuration, formatClock, TimerEngine } = window.TimerHubTime;

  let tone = 'classic';
  let engine = null;
  let stopSound = null;

  /* ---------- default time: a couple of minutes from now ---------- */
  (function setDefaultTime() {
    const d = new Date(Date.now() + 2 * 60000);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    timeInput.value = `${hh}:${mm}`;
  })();

  /* ---------- live current-time readout, once a second ---------- */
  function tickClock() {
    clockReadout.textContent = formatClock(new Date(), { hour12: true, showSeconds: true });
  }
  tickClock();
  setInterval(tickClock, 1000);

  /* ---------- compute next occurrence of the chosen time ---------- */
  function computeTarget(timeStr) {
    if (!timeStr) return null;
    const [h, m] = timeStr.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
    if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);
    return target;
  }

  function describeTarget(target) {
    const now = new Date();
    const isTomorrow = target.toDateString() !== now.toDateString();
    const timeStr = formatClock(target, { hour12: true, showSeconds: false });
    return `Rings ${isTomorrow ? 'tomorrow' : 'today'} at ${timeStr}`;
  }

  function updatePreview() {
    const target = computeTarget(timeInput.value);
    firePreview.textContent = target
      ? describeTarget(target)
      : 'Set a time above to see when the alarm will ring.';
  }
  timeInput.addEventListener('input', updatePreview);
  updatePreview();

  /* ---------- tone selection ---------- */
  toneRow.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-tone]');
    if (!chip) return;
    tone = chip.dataset.tone;
    toneRow.querySelectorAll('.chip').forEach((c) => c.classList.toggle('is-active', c === chip));
  });

  /** Different perceived "characters" built from the shared audio API. */
  function ringWithTone(selectedTone) {
    if (selectedTone === 'gentle') {
      let stopped = false;
      window.TimerHubAudio.bell();
      const id = setInterval(() => { if (!stopped) window.TimerHubAudio.bell(); }, 2400);
      return () => { stopped = true; clearInterval(id); };
    }
    if (selectedTone === 'urgent') {
      let stopped = false;
      const ring = () => {
        if (stopped) return;
        window.TimerHubAudio.beep();
        window.TimerHubAudio.accentClick();
      };
      ring();
      const id = setInterval(ring, 380);
      return () => { stopped = true; clearInterval(id); };
    }
    // classic
    return window.TimerHubAudio.ringAlarm();
  }

  /* ---------- state transitions ---------- */
  function showSetView() {
    stage.dataset.state = 'ready';
    statusLabel.textContent = 'No alarm set';
    setView.style.display = '';
    armedView.style.display = 'none';
    stopRow.style.display = 'none';
    btnArm.style.display = '';
    btnArm.textContent = 'Activate Alarm';
    btnArm.classList.remove('btn-secondary');
    btnArm.classList.add('btn-accent');
    updatePreview();
  }

  function armAlarm() {
    const target = computeTarget(timeInput.value);
    if (!target) return;

    const durationMs = target.getTime() - Date.now();
    stage.dataset.state = 'running';
    statusLabel.textContent = describeTarget(target);
    setView.style.display = 'none';
    armedView.style.display = '';
    caption.textContent = `until alarm at ${formatClock(target, { hour12: true, showSeconds: false })}`;
    btnArm.textContent = 'Cancel Alarm';
    btnArm.classList.remove('btn-accent');
    btnArm.classList.add('btn-secondary');

    engine = new TimerEngine({
      mode: 'countdown',
      durationMs,
      onTick: (remainingMs) => {
        digits.textContent = formatDuration(remainingMs, { showHours: true });
      },
      onComplete: () => {
        fireAlarm();
      },
    });
    engine.start();
  }

  function cancelAlarm() {
    if (engine) { engine.destroy(); engine = null; }
    showSetView();
  }

  function fireAlarm() {
    stage.dataset.state = 'complete';
    statusLabel.textContent = 'Alarm ringing';
    digits.textContent = '00:00:00';
    caption.textContent = 'time’s up';
    btnArm.style.display = 'none';
    stopRow.style.display = '';
    stopSound = ringWithTone(tone);
    window.TimerHubToast('Alarm');
  }

  function stopAlarm() {
    if (stopSound) { stopSound(); stopSound = null; }
    if (engine) { engine.destroy(); engine = null; }
    showSetView();
  }

  btnArm.addEventListener('click', () => {
    if (stage.dataset.state === 'running') cancelAlarm();
    else armAlarm();
  });
  btnStop.addEventListener('click', stopAlarm);

  /* ---------- sound toggle ---------- */
  function syncSoundToggle() {
    const on = window.TimerHubAudio.enabled;
    soundToggle.classList.toggle('is-active', on);
    soundToggle.setAttribute('aria-label', on ? 'Sound on' : 'Sound off');
  }
  soundToggle.addEventListener('click', () => {
    window.TimerHubAudio.toggle();
    syncSoundToggle();
  });
  syncSoundToggle();

  /* ---------- fullscreen ---------- */
  if (window.TimerHubFullscreen) window.TimerHubFullscreen();

  showSetView();
})();
