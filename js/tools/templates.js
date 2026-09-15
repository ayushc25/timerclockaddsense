/**
 * TimerHub — Templates
 * Renders the template library: single, ready-configured timers that
 * deep-link into the matching tool page with advisory query params.
 */
(function () {
  'use strict';

  const ICONS = {
    book: '<path d="M4 5.5A2.5 2.5 0 016.5 3H20v15.5H6.5A2.5 2.5 0 004 21V5.5z"/><path d="M4 18.5A2.5 2.5 0 016.5 16H20"/>',
    focus: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/>',
    bolt: '<path d="M13 2L4 14h6l-1 8 9-12h-6z" stroke-linejoin="round"/>',
    bell: '<path d="M11 5L6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 010 7"/>',
    presentation: '<rect x="3" y="4" width="18" height="12" rx="1"/><path d="M8 20l4-4 4 4M12 16v0"/>',
    pot: '<path d="M4 10h16v4a6 6 0 01-6 6h-4a6 6 0 01-6-6v-4z"/><path d="M4 10a2 2 0 012-2h12a2 2 0 012 2M9 8V5M15 8V5"/>',
    egg: '<path d="M12 3C8 8 6 12.5 6 15.5a6 6 0 0012 0C18 12.5 16 8 12 3z"/>',
    chess: '<path d="M12 2l1.5 3H15l-1 2 2 2-2 1 1 3H9l1-3-2-1 2-2-1-2h1.5z"/><path d="M7 22h10M8 22v-3h8v3"/>',
  };

  const TEMPLATES = [
    {
      title: '25-Minute Study',
      description: 'A single focused Pomodoro-length block for reading or study.',
      href: '../tools/countdown.html?minutes=25&label=Study',
      icon: 'book',
    },
    {
      title: '50-Minute Deep Work',
      description: 'One long, uninterrupted block for your hardest task of the day.',
      href: '../tools/countdown.html?minutes=50&label=Deep+Work',
      icon: 'focus',
    },
    {
      title: 'HIIT 30/30',
      description: 'Eight rounds of 30 seconds work, 30 seconds rest — no setup needed.',
      href: '../tools/interval.html?work=30&rest=30&rounds=8',
      icon: 'bolt',
    },
    {
      title: '10-Minute Meditation',
      description: 'A quiet ten-minute sit, with a soft bell to open and close.',
      href: '../tools/meditation-timer.html?minutes=10',
      icon: 'bell',
    },
    {
      title: '15-Minute Presentation',
      description: 'Keep a talk or a pitch inside a clean fifteen-minute slot.',
      href: '../tools/meeting-timer.html?minutes=15',
      icon: 'presentation',
    },
    {
      title: '5-Minute Cooking Timer',
      description: 'A quick countdown for anything on the stove or in the oven.',
      href: '../tools/countdown.html?minutes=5&label=Cooking',
      icon: 'pot',
    },
    {
      title: '3-Minute Egg Timer',
      description: 'The exact window for a soft-boiled egg, ready in one tap.',
      href: '../tools/countdown.html?minutes=3&label=Egg+Timer',
      icon: 'egg',
    },
    {
      title: 'Bullet Chess 1+0',
      description: 'A one-minute-per-side bullet clock, no increment, set instantly.',
      href: '../tools/chess-clock.html?minutes=1&increment=0',
      icon: 'chess',
    },
  ];

  const grid = document.querySelector('[data-template-grid]');
  if (!grid) return;

  const cardsHtml = [];
  TEMPLATES.forEach((t, idx) => {
    cardsHtml.push(`
      <a href="${t.href}" class="card template-card reveal">
        <div class="tool-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${ICONS[t.icon]}</svg></div>
        <div class="template-meta">
          <h3>${t.title}</h3>
          <p>${t.description}</p>
        </div>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" style="flex-shrink:0;color:var(--color-ink-faint);"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </a>
    `);
    if (idx === 2 || idx === 5) {
      cardsHtml.push(`
        <div class="ad-slot ad-slot-wide ad-slot-break reveal" role="complementary" aria-label="Advertisement placeholder">Advertisement Space</div>
      `);
    }
  });
  cardsHtml.push(`
    <div class="ad-slot ad-slot-wide ad-slot-break reveal" role="complementary" aria-label="Advertisement placeholder">Advertisement Space</div>
  `);

  grid.innerHTML = cardsHtml.join('');
})();
