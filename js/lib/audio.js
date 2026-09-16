/**
 * TimerHub Sound System
 * Lightweight Web Audio API wrapper with early gesture pre-unlocking,
 * volume controls, sound previewing, and tone customization.
 * Respects browser autoplay restrictions by priming audio contexts on first touch/click.
 */
(function (global) {
  'use strict';

  const STORAGE_KEY = 'timerhub_sound_prefs';

  function loadPrefs() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        // Automatically upgrade old default 'chime' to 'alarm' unless explicitly customized
        if (p && (!p.soundType || (p.soundType === 'chime' && !p._userExplicit))) {
          p.soundType = 'alarm';
        }
        return p;
      }
    } catch (e) { /* ignore */ }
    return { enabled: true, volume: 0.7, soundType: 'alarm' };
  }

  function savePrefs(prefs) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)); } catch (e) { /* ignore */ }
  }

  class SoundSystem {
    constructor() {
      this.ctx = null;
      this.prefs = loadPrefs();
      this.masterGain = null;
      this._unlocked = false;

      // Auto-unlock on the very first user interaction anywhere on the page
      this._bindUnlockGestures();
    }

    _bindUnlockGestures() {
      const unlockHandler = () => {
        this.unlock();
        ['pointerdown', 'keydown', 'touchstart', 'click'].forEach((evt) => {
          window.removeEventListener(evt, unlockHandler, true);
        });
      };
      ['pointerdown', 'keydown', 'touchstart', 'click'].forEach((evt) => {
        window.addEventListener(evt, unlockHandler, { capture: true, once: true, passive: true });
      });
    }

    /** Pre-unlock Web Audio context and prime audio hardware */
    unlock() {
      if (this._unlocked && this.ctx && this.ctx.state === 'running') return;
      try {
        const ctx = this.ensureContext();
        if (!ctx) return;
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        // Play an inaudible buffer to prime browser audio pipeline
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
        this._unlocked = true;
      } catch (e) {
        // Ignore autoplay errors on unprivileged gestures
      }
    }

    ensureContext() {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
        return this.ctx;
      }
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.prefs.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      return this.ctx;
    }

    get enabled() { return Boolean(this.prefs.enabled); }
    set enabled(v) {
      this.prefs.enabled = Boolean(v);
      savePrefs(this.prefs);
      this._emitChange();
    }

    get volume() { return typeof this.prefs.volume === 'number' ? this.prefs.volume : 0.7; }
    set volume(v) {
      const vol = Math.max(0, Math.min(1, Number(v) || 0));
      this.prefs.volume = vol;
      savePrefs(this.prefs);
      if (this.ctx && this.masterGain) {
        this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.masterGain.gain.setValueAtTime(vol, this.ctx.currentTime);
      }
      this._emitChange();
    }

    get soundType() { return this.prefs.soundType || 'alarm'; }
    set soundType(t) {
      this.prefs.soundType = t;
      this.prefs._userExplicit = true;
      savePrefs(this.prefs);
      this._emitChange();
    }

    toggle() {
      this.enabled = !this.enabled;
      return this.enabled;
    }

    _emitChange() {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('timerhub:soundchange', { detail: this.prefs }));
      }
    }

    _tone({ freq = 880, duration = 0.16, type = 'sine', gain = 0.5, delay = 0, glideTo = null }) {
      if (!this.prefs.enabled) return;
      this.unlock();
      const ctx = this.ensureContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      const startAt = ctx.currentTime + delay;

      osc.type = type;
      osc.frequency.setValueAtTime(freq, startAt);
      if (glideTo) osc.frequency.linearRampToValueAtTime(glideTo, startAt + duration);

      g.gain.setValueAtTime(0, startAt);
      g.gain.linearRampToValueAtTime(gain, startAt + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

      osc.connect(g);
      g.connect(this.masterGain);

      osc.start(startAt);
      osc.stop(startAt + duration + 0.02);
    }

    /** Short single beep — used for interval / tick cues */
    beep() { this._tone({ freq: 880, duration: 0.09, type: 'triangle', gain: 0.5 }); }

    /** Soft click — metronome default beat */
    click() { this._tone({ freq: 1000, duration: 0.045, type: 'square', gain: 0.35 }); }

    /** Accented click — metronome downbeat */
    accentClick() { this._tone({ freq: 1400, duration: 0.05, type: 'square', gain: 0.5 }); }

    /** Alarming timer/session completion alert tone */
    complete() {
      const type = this.prefs.soundType || 'alarm';
      if (type === 'bell') {
        this.bell();
      } else if (type === 'digital') {
        this._tone({ freq: 1046.5, duration: 0.1, type: 'triangle', gain: 0.55 });
        this._tone({ freq: 1046.5, duration: 0.1, type: 'triangle', gain: 0.55, delay: 0.14 });
        this._tone({ freq: 1318.5, duration: 0.1, type: 'triangle', gain: 0.58, delay: 0.28 });
        this._tone({ freq: 1567.98, duration: 0.26, type: 'triangle', gain: 0.62, delay: 0.42 });
      } else if (type === 'beep') {
        // Fast urgent 4-beep alarm pattern
        this._tone({ freq: 987.77, duration: 0.1, type: 'triangle', gain: 0.58, delay: 0 });
        this._tone({ freq: 987.77, duration: 0.1, type: 'triangle', gain: 0.58, delay: 0.15 });
        this._tone({ freq: 987.77, duration: 0.1, type: 'triangle', gain: 0.58, delay: 0.30 });
        this._tone({ freq: 1318.51, duration: 0.28, type: 'triangle', gain: 0.65, delay: 0.45 });
      } else if (type === 'chime') {
        // Gentle ascending chime (sweet & calm)
        this._tone({ freq: 523.25, duration: 0.22, type: 'sine', gain: 0.5, delay: 0 });
        this._tone({ freq: 659.25, duration: 0.24, type: 'sine', gain: 0.5, delay: 0.14 });
        this._tone({ freq: 783.99, duration: 0.34, type: 'sine', gain: 0.55, delay: 0.28 });
      } else {
        // Default: 'alarm' — Attention-grabbing double-burst digital timer alarm
        // Burst 1: Alert pulses
        this._tone({ freq: 987.77, duration: 0.10, type: 'triangle', gain: 0.60, delay: 0 });
        this._tone({ freq: 987.77, duration: 0.10, type: 'triangle', gain: 0.60, delay: 0.13 });
        // Burst 2: Higher pitch urgent alert
        this._tone({ freq: 1174.66, duration: 0.10, type: 'triangle', gain: 0.62, delay: 0.32 });
        this._tone({ freq: 1174.66, duration: 0.10, type: 'triangle', gain: 0.62, delay: 0.45 });
        // Burst 3: Climax alert chime
        this._tone({ freq: 1318.51, duration: 0.12, type: 'triangle', gain: 0.65, delay: 0.64 });
        this._tone({ freq: 1567.98, duration: 0.32, type: 'triangle', gain: 0.70, delay: 0.78 });
      }
    }

    /** Gentle two-tone transition cue — e.g. work -> rest */
    transition() {
      this._tone({ freq: 660, duration: 0.14, type: 'sine', gain: 0.45 });
      this._tone({ freq: 880, duration: 0.18, type: 'sine', gain: 0.45, delay: 0.12 });
    }

    /** Soft bell for meditation start/end */
    bell() {
      this._tone({ freq: 396, duration: 1.1, type: 'sine', gain: 0.38, glideTo: 392 });
      this._tone({ freq: 792, duration: 0.9, type: 'sine', gain: 0.2, delay: 0.02 });
    }

    /** Sound preview helper for settings UI */
    preview(type = this.prefs.soundType || 'alarm') {
      const prevType = this.prefs.soundType;
      this.prefs.soundType = type;
      this.complete();
      this.prefs.soundType = prevType;
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
})(typeof window !== 'undefined' ? window : this);
