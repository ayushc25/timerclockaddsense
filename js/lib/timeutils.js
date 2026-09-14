/**
 * TimerHub Time Utilities & Resilience Engine
 * Provides drift-free timestamp calculation, background tab Web Worker ticks,
 * visibility change resynchronization, duration formatting, and cross-tab state persistence.
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
   * Shared background ticker using an inline Web Worker.
   * Modern browsers throttle setInterval and pause requestAnimationFrame
   * in inactive/background tabs. Web Workers run on a background thread and
   * are not subject to standard UI thread throttling.
   */
  let sharedWorker = null;
  const workerListeners = new Set();

  function initWorker() {
    if (sharedWorker || typeof window === 'undefined' || !window.Worker || !window.Blob) return;
    try {
      const code = `
        var timerId = null;
        self.onmessage = function(e) {
          if (e.data === 'start') {
            if (!timerId) {
              timerId = setInterval(function() {
                self.postMessage('tick');
              }, 200);
            }
          } else if (e.data === 'stop') {
            if (timerId) {
              clearInterval(timerId);
              timerId = null;
            }
          }
        };
      `;
      const blob = new Blob([code], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      sharedWorker = new Worker(workerUrl);
      sharedWorker.onmessage = function () {
        workerListeners.forEach((cb) => {
          try { cb(); } catch (err) { console.error(err); }
        });
      };
    } catch (e) {
      sharedWorker = null;
    }
  }

  function registerWorkerListener(callback) {
    initWorker();
    workerListeners.add(callback);
    if (sharedWorker && workerListeners.size === 1) {
      sharedWorker.postMessage('start');
    }
  }

  function unregisterWorkerListener(callback) {
    workerListeners.delete(callback);
    if (sharedWorker && workerListeners.size === 0) {
      sharedWorker.postMessage('stop');
    }
  }

  /**
   * Drift-corrected countdown/stopwatch engine with background tab resilience.
   * mode: 'countdown' | 'stopwatch'
   */
  class TimerEngine {
    constructor({ mode = 'countdown', durationMs = 0, onTick, onComplete } = {}) {
      this.mode = mode;
      this.durationMs = durationMs;
      this.elapsedBeforeStart = 0;
      this.startedAt = null;
      this.targetEndTime = null;
      this.running = false;
      this.completed = false;
      this.onTick = onTick || (() => {});
      this.onComplete = onComplete || (() => {});
      this._raf = null;
      this._workerCb = this._onWorkerTick.bind(this);
      this._visibilityCb = this._onVisibilityChange.bind(this);

      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', this._visibilityCb);
      }
    }

    get elapsed() {
      if (!this.running || this.startedAt === null) return this.elapsedBeforeStart;
      return this.elapsedBeforeStart + (Date.now() - this.startedAt);
    }

    get remaining() {
      if (this.mode !== 'countdown') return null;
      if (this.running && this.targetEndTime !== null) {
        return Math.max(0, this.targetEndTime - Date.now());
      }
      return Math.max(0, this.durationMs - this.elapsed);
    }

    setDuration(ms) {
      this.durationMs = ms;
      this.elapsedBeforeStart = 0;
      this.startedAt = null;
      this.targetEndTime = null;
      this.completed = false;
    }

    addTime(ms) {
      this.durationMs = Math.max(0, this.durationMs + ms);
      if (this.running && this.targetEndTime !== null) {
        this.targetEndTime += ms;
      }
      this.completed = false;
    }

    start(options = {}) {
      if (this.running) return;
      this.running = true;
      this.completed = false;
      this.startedAt = Date.now();

      if (this.mode === 'countdown') {
        const remaining = options.resumeRemaining != null ? options.resumeRemaining : Math.max(0, this.durationMs - this.elapsedBeforeStart);
        this.targetEndTime = Date.now() + remaining;
      }

      registerWorkerListener(this._workerCb);
      this._loop();
    }

    pause() {
      if (!this.running) return;
      this.elapsedBeforeStart = this.elapsed;
      this.running = false;
      this.startedAt = null;
      this.targetEndTime = null;
      if (this._raf) cancelAnimationFrame(this._raf);
      unregisterWorkerListener(this._workerCb);
    }

    reset(durationMs = this.durationMs) {
      this.pause();
      this.durationMs = durationMs;
      this.elapsedBeforeStart = 0;
      this.targetEndTime = null;
      this.completed = false;
    }

    _onWorkerTick() {
      if (!this.running) return;
      if (this.mode === 'countdown') {
        const remaining = this.remaining;
        // If tab is in background (or document hidden), dispatch tick updates
        if (document.hidden) {
          this.onTick(remaining);
        }
        if (remaining <= 0 && !this.completed) {
          this.completed = true;
          this.running = false;
          unregisterWorkerListener(this._workerCb);
          if (this._raf) cancelAnimationFrame(this._raf);
          this.onTick(0);
          this.onComplete();
        }
      } else {
        if (document.hidden) {
          this.onTick(this.elapsed);
        }
      }
    }

    _onVisibilityChange() {
      if (!this.running) return;
      if (document.visibilityState === 'visible') {
        // Tab just returned to foreground — immediately re-sync UI with true wall-clock time
        if (this.mode === 'countdown') {
          const remaining = this.remaining;
          this.onTick(remaining);
          if (remaining <= 0 && !this.completed) {
            this.completed = true;
            this.running = false;
            unregisterWorkerListener(this._workerCb);
            if (this._raf) cancelAnimationFrame(this._raf);
            this.onTick(0);
            this.onComplete();
            return;
          }
        } else {
          this.onTick(this.elapsed);
        }
        // Restart RAF loop
        if (this._raf) cancelAnimationFrame(this._raf);
        this._loop();
      }
    }

    _loop() {
      if (!this.running) return;
      if (this.mode === 'countdown') {
        const remaining = this.remaining;
        this.onTick(remaining);
        if (remaining <= 0 && !this.completed) {
          this.completed = true;
          this.running = false;
          unregisterWorkerListener(this._workerCb);
          if (this._raf) cancelAnimationFrame(this._raf);
          this.onTick(0);
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
      unregisterWorkerListener(this._workerCb);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', this._visibilityCb);
      }
      this.running = false;
    }
  }

  /** State persistence helper across reloads or accidental tab closures */
  const TimerHubState = {
    save(toolKey, stateData) {
      try {
        localStorage.setItem(`timerhub_state_${toolKey}`, JSON.stringify({
          ...stateData,
          savedAt: Date.now()
        }));
      } catch (e) { /* ignore storage quotas/errors */ }
    },

    load(toolKey) {
      try {
        const raw = localStorage.getItem(`timerhub_state_${toolKey}`);
        if (!raw) return null;
        return JSON.parse(raw);
      } catch (e) {
        return null;
      }
    },

    clear(toolKey) {
      try {
        localStorage.removeItem(`timerhub_state_${toolKey}`);
      } catch (e) { /* ignore */ }
    }
  };

  global.TimerHubTime = { formatDuration, formatClock, pad, TimerEngine, TimerHubState };
})(typeof window !== 'undefined' ? window : this);
