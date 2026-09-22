/**
 * TimerHub — Smart Routines
 * Renders the routine catalog, filters it by category, and runs the
 * in-page multi-stage routine player (auto-advancing countdown stages).
 */
(function () {
  'use strict';

  function createAdSlot() {
    const wrap = document.createElement('div');
    wrap.className = 'ad-slot ad-slot-wide ad-slot-break is-visible';
    wrap.setAttribute('role', 'complementary');
    wrap.setAttribute('aria-label', 'Advertisement');
    wrap.innerHTML = '<ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-7098448277553816" data-ad-slot="7380709218" data-ad-format="auto" data-full-width-responsive="true"></ins>';
    return wrap;
  }

  /* ------------------------------------------------------------------ */
  /* Routine catalog                                                     */
  /* Each routine's `stages` array is the *real*, fully expanded stage   */
  /* sequence the player runs. Repetitive blocks (e.g. 8 HIIT rounds)    */
  /* are authored with a small helper so the data stays readable, then   */
  /* collapsed back down into a handful of summary rows for the card.    */
  /* ------------------------------------------------------------------ */

  function repeat(n, stages) {
    const out = [];
    for (let i = 0; i < n; i++) out.push(...stages.map((s) => ({ ...s })));
    return out;
  }

  const ROUTINES = [
    {
      id: 'study-routine',
      title: 'Study Routine',
      category: 'Study',
      description: 'The classic 25/5 focus cycle, topped off with a longer recovery break after three rounds.',
      stages: [
        { label: 'Focus', seconds: 25 * 60, phase: 'work' },
        { label: 'Break', seconds: 5 * 60, phase: 'rest' },
        { label: 'Focus', seconds: 25 * 60, phase: 'work' },
        { label: 'Break', seconds: 5 * 60, phase: 'rest' },
        { label: 'Focus', seconds: 25 * 60, phase: 'work' },
        { label: 'Long Break', seconds: 15 * 60, phase: 'rest' },
      ],
    },
    {
      id: 'hiit-circuit',
      title: 'HIIT Circuit',
      category: 'Fitness',
      description: 'Eight rounds of hard effort and short recovery, bookended by a countdown to get into position.',
      stages: [
        { label: 'Prepare', seconds: 30, phase: 'prepare' },
        ...repeat(8, [
          { label: 'Work', seconds: 30, phase: 'work' },
          { label: 'Rest', seconds: 15, phase: 'rest' },
        ]),
      ],
    },
    {
      id: 'deep-work-block',
      title: 'Deep Work Block',
      category: 'Productivity',
      description: 'Two long, uninterrupted 50-minute focus blocks separated by a real ten-minute break.',
      stages: [
        { label: 'Focus', seconds: 50 * 60, phase: 'work' },
        { label: 'Break', seconds: 10 * 60, phase: 'rest' },
        { label: 'Focus', seconds: 50 * 60, phase: 'work' },
        { label: 'Break', seconds: 10 * 60, phase: 'rest' },
      ],
    },
    {
      id: 'simmer-rest-cooking',
      title: 'Simmer & Rest Cooking Routine',
      category: 'Cooking',
      description: 'Times a stovetop braise from the initial sear through a low simmer to the crucial resting stage.',
      stages: [
        { label: 'Sear', seconds: 10 * 60, phase: 'work' },
        { label: 'Simmer', seconds: 20 * 60, phase: 'work' },
        { label: 'Rest', seconds: 5 * 60, phase: 'rest' },
      ],
    },
    {
      id: 'mindful-reset',
      title: 'Mindful Reset',
      category: 'Meditation',
      description: 'A short guided structure for a midday sit — settle in, meditate, then ease back into your day.',
      stages: [
        { label: 'Settle', seconds: 2 * 60, phase: 'prepare' },
        { label: 'Meditate', seconds: 10 * 60, phase: 'rest' },
        { label: 'Gentle Return', seconds: 60, phase: 'work' },
      ],
    },
    {
      id: 'presentation-rehearsal',
      title: 'Presentation Rehearsal',
      category: 'Presentation',
      description: 'Rehearse a talk against the clock — opening hook, main content, audience questions, then a clean close.',
      stages: [
        { label: 'Opening', seconds: 5 * 60, phase: 'work' },
        { label: 'Main Content', seconds: 15 * 60, phase: 'work' },
        { label: 'Q&A', seconds: 5 * 60, phase: 'rest' },
        { label: 'Closing', seconds: 2 * 60, phase: 'work' },
      ],
    },
    {
      id: 'stretch-recovery',
      title: 'Full-Body Stretch & Recovery',
      category: 'Fitness',
      description: 'A gentle mobility sequence — warm up, four rounds of stretch-and-release, then a slow cool-down.',
      stages: [
        { label: 'Warm-Up', seconds: 2 * 60, phase: 'prepare' },
        ...repeat(4, [
          { label: 'Stretch', seconds: 45, phase: 'work' },
          { label: 'Release', seconds: 15, phase: 'rest' },
        ]),
        { label: 'Cool-Down', seconds: 3 * 60, phase: 'rest' },
      ],
    },
    {
      id: 'weekly-planning',
      title: 'Weekly Planning Session',
      category: 'Productivity',
      description: 'A weekly reset for getting organized — brain dump every open task, prioritize, block time, then review.',
      stages: [
        { label: 'Brain Dump', seconds: 5 * 60, phase: 'work' },
        { label: 'Prioritize', seconds: 15 * 60, phase: 'work' },
        { label: 'Calendar Block', seconds: 10 * 60, phase: 'work' },
        { label: 'Review', seconds: 5 * 60, phase: 'rest' },
      ],
    },
  ];

  /* ------------------------------------------------------------------ */
  /* Formatting helpers                                                  */
  /* ------------------------------------------------------------------ */

  function formatStageDuration(totalSeconds) {
    if (totalSeconds < 60) return `${totalSeconds}s`;
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return s === 0 ? `${m} min` : `${m}:${String(s).padStart(2, '0')} min`;
  }

  function stageSameShape(a, b) {
    return a.label === b.label && a.seconds === b.seconds && a.phase === b.phase;
  }

  /** Collapse a fully expanded stage list into a handful of readable card rows. */
  function summarizeStages(stages) {
    const rows = [];
    let i = 0;
    while (i < stages.length) {
      let collapsed = false;
      for (let patLen = 2; patLen >= 1 && !collapsed; patLen--) {
        if (i + patLen * 3 > stages.length) continue; // only collapse when it repeats at least 3x
        const pattern = stages.slice(i, i + patLen);
        let count = 1;
        let j = i + patLen;
        while (
          j + patLen <= stages.length &&
          pattern.every((p, k) => stageSameShape(p, stages[j + k]))
        ) {
          count++;
          j += patLen;
        }
        if (count >= 3) {
          const text = `${count}× ${pattern.map((s) => `${formatStageDuration(s.seconds)} ${s.label}`).join(' / ')}`;
          rows.push(text);
          i = j;
          collapsed = true;
        }
      }
      if (!collapsed) {
        rows.push(`${formatStageDuration(stages[i].seconds)} ${stages[i].label}`);
        i++;
      }
    }
    return rows;
  }

  function totalDurationLabel(stages) {
    const totalSeconds = stages.reduce((sum, s) => sum + s.seconds, 0);
    const mins = Math.round(totalSeconds / 60);
    return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m total` : `${mins} min total`;
  }

  /* ------------------------------------------------------------------ */
  /* Grid rendering + category filter                                    */
  /* ------------------------------------------------------------------ */

  const grid = document.querySelector('[data-routine-grid]');
  const chips = document.querySelectorAll('[data-category-chips] .chip');
  const routineViews = document.querySelectorAll('[data-routines-view]');
  const playerView = document.querySelector('[data-player-view]');

  function renderGrid(filter) {
    if (!grid) return;
    grid.innerHTML = '';
    const normFilter = (filter || 'all').toLowerCase();
    const filtered = ROUTINES.filter((r) => normFilter === 'all' || r.category.toLowerCase() === normFilter);

    if (filtered.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.style.gridColumn = '1 / -1';
      empty.style.textAlign = 'center';
      empty.style.padding = 'var(--space-2xl) var(--space-md)';
      empty.innerHTML = `
        <p style="color: var(--color-ink-muted); font-size: var(--fs-md); margin-bottom: var(--space-sm);">No routines found in this category.</p>
        <button class="btn btn-secondary" type="button" data-reset-category>View All Routines</button>
      `;
      grid.appendChild(empty);
      empty.querySelector('[data-reset-category]').addEventListener('click', () => {
        chips.forEach((c) => c.classList.toggle('is-active', (c.getAttribute('data-category') || '').toLowerCase() === 'all'));
        renderGrid('all');
      });
      return;
    }

    filtered.forEach((routine, idx) => {
      const card = document.createElement('div');
      card.className = 'card routine-card is-visible';
      const rows = summarizeStages(routine.stages);
      card.innerHTML = `
        <span class="badge badge-accent">${routine.category}</span>
        <h3>${routine.title}</h3>
        <p>${routine.description}</p>
        <div class="routine-stage-list">
          ${rows.map((r) => `<div class="routine-stage"><span><span class="stage-dot"></span>${r}</span></div>`).join('')}
        </div>
        <div class="routine-card-foot">
          <span class="blog-meta">${totalDurationLabel(routine.stages)}</span>
          <button class="btn btn-accent" data-start-routine="${routine.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 5v14l11-7z"/></svg>
            Start Routine
          </button>
        </div>
      `;
      grid.appendChild(card);

      if (normFilter === 'all' && (idx === 2 || idx === 5)) {
        grid.appendChild(createAdSlot());
        try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
      }
    });

    if (filtered.length > 0) {
      grid.appendChild(createAdSlot());
      try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
    }

    if (window.TimerHubInitScrollReveal) {
      window.TimerHubInitScrollReveal();
    }
  }

  if (chips.length) {
    chips.forEach((chip) => {
      chip.addEventListener('click', (e) => {
        e.preventDefault();
        chips.forEach((c) => c.classList.remove('is-active'));
        chip.classList.add('is-active');
        const category = chip.getAttribute('data-category') || 'all';
        renderGrid(category);
      });
    });
  }

  // Check URL hash if directly linking to a category, e.g. routines/index.html#fitness
  const initialHash = (window.location.hash || '').replace('#', '').trim().toLowerCase();
  let initialCategory = 'all';
  if (initialHash) {
    const matchingChip = Array.from(chips).find(
      (c) => (c.getAttribute('data-category') || '').toLowerCase() === initialHash
    );
    if (matchingChip) {
      chips.forEach((c) => c.classList.remove('is-active'));
      matchingChip.classList.add('is-active');
      initialCategory = initialHash;
    }
  }

  renderGrid(initialCategory);

  if (grid) {
    grid.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-start-routine]');
      if (!btn) return;
      const routine = ROUTINES.find((r) => r.id === btn.getAttribute('data-start-routine'));
      if (routine) startRoutine(routine);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Routine player                                                      */
  /* ------------------------------------------------------------------ */

  const CIRC = 565.5;
  const stageEl = document.querySelector('[data-timer-stage]');
  const statusText = document.querySelector('[data-status-text]');
  const phaseBadge = document.querySelector('[data-player-phase-badge]');
  const metaCurrent = document.querySelector('[data-meta-current]');
  const metaNext = document.querySelector('[data-meta-next]');
  const metaStageCount = document.querySelector('[data-meta-stage-count]');
  const digitsEl = document.querySelector('[data-digits]');
  const captionEl = document.querySelector('[data-caption]');
  const ringEl = document.querySelector('[data-ring]');
  const timelineEl = document.querySelector('[data-player-timeline]');
  const playerTitle = document.querySelector('[data-player-title]');
  const playerCategory = document.querySelector('[data-player-category]');
  const toggleBtn = document.querySelector('[data-action="toggle"]');
  const toggleIcon = document.querySelector('[data-toggle-icon]');
  const soundBtn = document.querySelector('[data-action="sound"]');
  const soundIcon = document.querySelector('[data-sound-icon]');

  let fullscreen = null;
  if (window.TimerHubFullscreen) fullscreen = window.TimerHubFullscreen();

  let activeRoutine = null;
  let stageIndex = 0;
  let engine = null;

  function setState(state) {
    stageEl.setAttribute('data-state', state);
  }

  function showPlayer() {
    routineViews.forEach((v) => (v.hidden = true));
    playerView.hidden = false;
    window.scrollTo({ top: playerView.offsetTop - 90, behavior: 'smooth' });
  }

  function showGrid() {
    playerView.hidden = true;
    routineViews.forEach((v) => (v.hidden = false));
    if (fullscreen && fullscreen.isActive()) fullscreen.close();
  }

  function renderTimeline() {
    if (!timelineEl || !activeRoutine) return;
    timelineEl.innerHTML = activeRoutine.stages
      .map((s, i) => {
        const status = i < stageIndex ? 'done' : i === stageIndex ? 'active' : 'upcoming';
        return `<span class="routine-timeline-stage" data-status="${status}">${s.label}</span>`;
      })
      .join('');
  }

  function renderStageMeta() {
    const stage = activeRoutine.stages[stageIndex];
    const nextStage = activeRoutine.stages[stageIndex + 1];
    stageEl.setAttribute('data-phase', stage.phase);
    phaseBadge.textContent = stage.label;
    metaCurrent.textContent = stage.label;
    metaNext.textContent = nextStage ? nextStage.label : 'Finish';
    metaStageCount.textContent = `Stage ${stageIndex + 1} of ${activeRoutine.stages.length}`;
    captionEl.textContent = `of this stage · ${activeRoutine.title}`;
    renderTimeline();
  }

  function renderTick(remainingMs) {
    const stage = activeRoutine.stages[stageIndex];
    const totalMs = stage.seconds * 1000;
    digitsEl.textContent = window.TimerHubTime.formatDuration(remainingMs);
    const frac = totalMs > 0 ? remainingMs / totalMs : 0;
    ringEl.setAttribute('stroke-dashoffset', String(CIRC * (1 - frac)));
  }

  function buildEngine() {
    const stage = activeRoutine.stages[stageIndex];
    engine = new window.TimerHubTime.TimerEngine({
      mode: 'countdown',
      durationMs: stage.seconds * 1000,
      onTick: renderTick,
      onComplete: onStageComplete,
    });
    renderTick(stage.seconds * 1000);
  }

  function onStageComplete() {
    const isLast = stageIndex >= activeRoutine.stages.length - 1;
    if (isLast) {
      setState('complete');
      statusText.textContent = 'Routine complete';
      toggleIcon.innerHTML = '<path d="M8 5v14l11-7z"/>';
      toggleBtn.setAttribute('aria-label', 'Start routine');
      window.TimerHubAudio.complete();
      window.TimerHubToast('Routine complete');
      renderTimeline();
      return;
    }
    window.TimerHubAudio.transition();
    stageIndex++;
    renderStageMeta();
    buildEngine();
    engine.start();
    setState('running');
    statusText.textContent = `Running — ${activeRoutine.stages[stageIndex].label}`;
  }

  function startRoutine(routine) {
    activeRoutine = routine;
    stageIndex = 0;
    playerTitle.textContent = routine.title;
    playerCategory.textContent = `${routine.category} Routine`;
    setState('ready');
    statusText.textContent = 'Ready to start';
    toggleIcon.innerHTML = '<path d="M8 5v14l11-7z"/>';
    renderStageMeta();
    buildEngine();
    showPlayer();
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      if (!engine) return;
      const state = stageEl.getAttribute('data-state');
      if (state === 'complete') return;
      if (engine.running) {
        engine.pause();
        setState('paused');
        statusText.textContent = `Paused — ${activeRoutine.stages[stageIndex].label}`;
        toggleIcon.innerHTML = '<path d="M8 5v14l11-7z"/>';
        toggleBtn.setAttribute('aria-label', 'Resume routine');
      } else {
        engine.start();
        setState('running');
        statusText.textContent = `Running — ${activeRoutine.stages[stageIndex].label}`;
        toggleIcon.innerHTML = '<path d="M7 5v14M17 5v14"/>';
        toggleBtn.setAttribute('aria-label', 'Pause routine');
      }
    });
  }

  const skipBtn = document.querySelector('[data-action="skip"]');
  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      if (!engine || !activeRoutine) return;
      if (stageEl.getAttribute('data-state') === 'complete') return;
      engine.destroy();
      onStageComplete();
    });
  }

  const stopBtn = document.querySelector('[data-action="stop"]');
  if (stopBtn) {
    stopBtn.addEventListener('click', () => {
      if (engine) engine.destroy();
      showGrid();
    });
  }

  const exitBtn = document.querySelector('[data-action="exit-routine"]');
  if (exitBtn) {
    exitBtn.addEventListener('click', () => {
      if (engine) engine.destroy();
      showGrid();
    });
  }

  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      const enabled = window.TimerHubAudio.toggle();
      soundBtn.classList.toggle('is-active', enabled);
      soundBtn.setAttribute('aria-label', enabled ? 'Sound on' : 'Sound off');
      soundIcon.innerHTML = enabled
        ? '<path d="M11 5L6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 010 7"/>'
        : '<path d="M11 5L6 9H3v6h3l5 4z"/><path d="M16 9l5 5M21 9l-5 5"/>';
    });
    soundBtn.classList.toggle('is-active', window.TimerHubAudio.enabled);
  }
})();
