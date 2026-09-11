/**
 * TimerHub Time Utilities
 * Timestamp-based timing helpers shared by every tool. Using Date.now()
 * deltas (rather than counting fixed setInterval ticks) keeps displayed
 * time accurate across throttled/inactive background tabs, delayed
 * JS execution, and pause/resume cycles.
 */
(function (global) {
  'use strict';

  function pad(num, len = 2) { return String(Math.trunc(num)).padStart(len, '0'); }

  /** Format milliseconds as H:MM:SS or MM:SS, optionally with centiseconds */
  function formatDuration(ms, opts = {}) {
    const { showHours = 'auto', showMillis = false } = opts;
    const totalMs = Math.max(0, Math.round(ms));
    const hours = Math.floor(totalMs / 3600000);
    const minutes = Math.floor((totalMs % 3600000) / 60000);
    const seconds = Math.floor((totalMs % 60000) / 1000);
    const centis = Math.floor((totalMs % 1000) / 10);

    const includeHours = showHours === true || (showHours === 'auto' && hours > 0);
    let str = includeHours
      ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
      : `${pad(minutes)}:${pad(seconds)}`;
    if (showMillis) str += `.${pad(centis)}`;
    return str;
  }

  function formatClock(date = new Date(), opts = {}) {
    const { hour12 = true, showSeconds = true } = opts;
    let h = date.getHours();
    const m = date.getMinutes();
    const s = date.getSeconds();
    let suffix = '';
    if (hour12) {
      suffix = h >= 12 ? ' PM' : ' AM';
      h = h % 12 || 12;
    } else {
      h = pad(h);
    }
    const base = `${hour12 ? h : h}:${pad(m)}${showSeconds ? ':' + pad(s) : ''}`;
    return base + suffix;
  }

  /**
   * A drift-corrected countdown/stopwatch engine.
   * mode: 'countdown' | 'stopwatch'
   */
  class TimerEngine {
    constructor({ mode = 'countdown', durationMs = 0, onTick, onComplete } = {}) {
      this.mode = mode;
      this.durationMs = durationMs;
      this.elapsedBeforeStart = 0;
      this.startedAt = null;
      this.running = false;
      this.completed = false;
      this.onTick = onTick || (() => {});
      this.onComplete = onComplete || (() => {});
      this._raf = null;
    }

    get elapsed() {
      if (!this.running || this.startedAt === null) return this.elapsedBeforeStart;
      return this.elapsedBeforeStart + (Date.now() - this.startedAt);
    }

    get remaining() {
      if (this.mode !== 'countdown') return null;
      return Math.max(0, this.durationMs - this.elapsed);
    }

    setDuration(ms) {
      this.durationMs = ms;
      this.elapsedBeforeStart = 0;
      this.startedAt = null;
      this.completed = false;
    }

    addTime(ms) {
      this.durationMs = Math.max(0, this.durationMs + ms);
      this.completed = false;
      if (this.mode === 'countdown' && this.remaining > 0) this.completed = false;
    }

    start() {
      if (this.running) return;
      this.running = true;
      this.completed = false;
      this.startedAt = Date.now();
      this._loop();
    }

    pause() {
      if (!this.running) return;
      this.elapsedBeforeStart = this.elapsed;
      this.running = false;
      this.startedAt = null;
      if (this._raf) cancelAnimationFrame(this._raf);
    }

    reset(durationMs = this.durationMs) {
      this.pause();
      this.durationMs = durationMs;
      this.elapsedBeforeStart = 0;
      this.completed = false;
    }

    _loop() {
      if (!this.running) return;
      if (this.mode === 'countdown') {
        const remaining = this.remaining;
        this.onTick(remaining);
        if (remaining <= 0 && !this.completed) {
          this.completed = true;
          this.running = false;
          this.onComplete();
          return;
        }
      } else {
        this.onTick(this.elapsed);
      }
      this._raf = requestAnimationFrame(() => this._loop());
    }

    destroy() {
      if (this._raf) cancelAnimationFrame(this._raf);
      this.running = false;
    }
  }

  global.TimerHubTime = { formatDuration, formatClock, pad, TimerEngine };
})(window);
