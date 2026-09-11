/**
 * TimerHub Sound System
 * Lightweight Web Audio API wrapper for timer tones, completion chimes,
 * and metronome clicks. Initializes lazily on first user interaction to
 * respect browser autoplay restrictions.
 */
(function (global) {
  'use strict';

  const STORAGE_KEY = 'timerhub_sound_prefs';

  function loadPrefs() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return { enabled: true, volume: 0.6 };
  }

  function savePrefs(prefs) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)); } catch (e) { /* ignore */ }
  }

  class SoundSystem {
    constructor() {
      this.ctx = null;
      this.prefs = loadPrefs();
      this.masterGain = null;
    }

    ensureContext() {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        return this.ctx;
      }
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.prefs.volume;
      this.masterGain.connect(this.ctx.destination);
      return this.ctx;
    }

    get enabled() { return this.prefs.enabled; }
    set enabled(v) { this.prefs.enabled = v; savePrefs(this.prefs); }

    get volume() { return this.prefs.volume; }
    set volume(v) {
      this.prefs.volume = v;
      savePrefs(this.prefs);
      if (this.masterGain) this.masterGain.gain.value = v;
    }

    toggle() { this.enabled = !this.enabled; return this.enabled; }

    _tone({ freq = 880, duration = 0.16, type = 'sine', gain = 0.5, delay = 0, glideTo = null }) {
      if (!this.prefs.enabled) return;
      const ctx = this.ensureContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      const startAt = ctx.currentTime + delay;
      osc.type = type;
      osc.frequency.setValueAtTime(freq, startAt);
      if (glideTo) osc.frequency.linearRampToValueAtTime(glideTo, startAt + duration);
      g.gain.setValueAtTime(0, startAt);
      g.gain.linearRampToValueAtTime(gain, startAt + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(startAt);
      osc.stop(startAt + duration + 0.02);
    }

    /** Short single beep — used for interval / tick cues */
    beep() { this._tone({ freq: 720, duration: 0.09, type: 'sine', gain: 0.45 }); }

    /** Soft click — metronome default beat */
    click() { this._tone({ freq: 1000, duration: 0.045, type: 'square', gain: 0.35 }); }

    /** Accented click — metronome downbeat */
    accentClick() { this._tone({ freq: 1400, duration: 0.05, type: 'square', gain: 0.5 }); }

    /** Warm ascending chime — session / timer completion */
    complete() {
      this._tone({ freq: 523.25, duration: 0.22, type: 'sine', gain: 0.5, delay: 0 });
      this._tone({ freq: 659.25, duration: 0.24, type: 'sine', gain: 0.5, delay: 0.14 });
      this._tone({ freq: 783.99, duration: 0.34, type: 'sine', gain: 0.55, delay: 0.28 });
    }

    /** Gentle two-tone transition cue — e.g. work -> rest */
    transition() {
      this._tone({ freq: 660, duration: 0.14, type: 'sine', gain: 0.45 });
      this._tone({ freq: 880, duration: 0.18, type: 'sine', gain: 0.45, delay: 0.12 });
    }

    /** Soft bell for meditation start/end */
    bell() {
      this._tone({ freq: 396, duration: 1.1, type: 'sine', gain: 0.35, glideTo: 392 });
      this._tone({ freq: 792, duration: 0.9, type: 'sine', gain: 0.18, delay: 0.02 });
    }

    /** Alarm ring pattern — repeating urgent tone (returns stop function) */
    ringAlarm() {
      if (!this.prefs.enabled) return () => {};
      let stopped = false;
      const ring = () => {
        if (stopped) return;
        this._tone({ freq: 880, duration: 0.28, type: 'triangle', gain: 0.55 });
        this._tone({ freq: 988, duration: 0.28, type: 'triangle', gain: 0.55, delay: 0.32 });
      };
      ring();
      const interval = setInterval(ring, 900);
      return () => { stopped = true; clearInterval(interval); };
    }
  }

  global.TimerHubAudio = new SoundSystem();
})(window);
