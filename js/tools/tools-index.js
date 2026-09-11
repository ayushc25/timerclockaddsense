/**
 * TimerHub — All Time Tools directory page
 * Live search + category chip filtering (combined with AND logic).
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    const grid = document.getElementById('tools-grid');
    const emptyState = document.getElementById('tools-empty');
    const searchInput = document.getElementById('tool-search');
    const chips = document.querySelectorAll('#category-chips .chip');
    if (!grid) return;

    const cards = Array.from(grid.querySelectorAll('[data-tool-card]'));
    let activeCategory = 'all';

    function applyFilters() {
      const query = (searchInput.value || '').trim().toLowerCase();
      let visibleCount = 0;

      cards.forEach((card) => {
        const categories = (card.getAttribute('data-categories') || '').split(' ');
        const name = (card.getAttribute('data-name') || '').toLowerCase();
        const desc = (card.getAttribute('data-desc') || '').toLowerCase();

        const matchesCategory = activeCategory === 'all' || categories.includes(activeCategory);
        const matchesSearch = !query || name.includes(query) || desc.includes(query);
        const visible = matchesCategory && matchesSearch;

        card.style.display = visible ? '' : 'none';
        if (visible) visibleCount++;
      });

      emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
      grid.style.display = visibleCount === 0 ? 'none' : '';
    }

    searchInput.addEventListener('input', applyFilters);

    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        chips.forEach((c) => c.classList.remove('is-active'));
        chip.classList.add('is-active');
        activeCategory = chip.getAttribute('data-category');
        applyFilters();
      });
    });

    // Support linking directly to a category via URL hash, e.g. tools/index.html#fitness
    const hash = (window.location.hash || '').replace('#', '').toLowerCase();
    const matchingChip = Array.from(chips).find((c) => c.getAttribute('data-category') === hash);
    if (matchingChip) {
      chips.forEach((c) => c.classList.remove('is-active'));
      matchingChip.classList.add('is-active');
      activeCategory = hash;
    }

    applyFilters();
  }
})();
