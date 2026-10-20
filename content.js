(async () => {
  'use strict';
  const { enabled = true } = await chrome.storage.local.get({ enabled: true });
  if (!enabled) return;
  const mounted = new Map();
  const normalize = value => value.replace(/\s+/g, ' ').trim().toLowerCase();
  const isCheckValve = description => /check[\s\u00a0-]+valves?/i.test(description);
  const visible = element => element.isConnected && element.getClientRects().length > 0;

  function gridInfo(grid) {
    const headers = [...grid.querySelectorAll('th[role="columnheader"]')];
    const title = h => normalize(h.getAttribute('aria-label') || h.textContent);
    if (!['serial number', 'description', 'staged', 'passed', 'failed', 'chart']
      .every(name => headers.some(h => title(h) === name))) return null;
    const description = headers.find(h => title(h) === 'description');
    const column = description.getAttribute('aria-colindex');
    return column && /^\d+$/.test(column) ? { column } : null;
  }

  function items(grid) {
    const info = gridInfo(grid);
    if (!info) return [];
    return [...grid.querySelectorAll('tr.k-master-row[data-kendo-grid-item-index]')].flatMap(row => {
      const checkbox = row.querySelector('td[data-kendo-grid-column-index="0"] input[type="checkbox"]');
      const description = row.querySelector(`td[aria-colindex="${info.column}"]`);
      if (!checkbox || !description || checkbox.disabled || checkbox.matches(':disabled')) return [];
      return [{ key: row.getAttribute('data-kendo-grid-item-index'), checkbox,
        description: description.textContent, excluded: isCheckValve(description.textContent) }];
    });
  }

  function mount(grid) {
    const bar = document.createElement('div');
    bar.className = 'it-asset-selector';
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', 'Bulk asset selection');
    const controls = ['Select all', 'Select all but check valves'].map(text => {
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'checkbox';
      label.append(input, document.createTextNode(text));
      bar.append(label);
      return input;
    });
    const status = document.createElement('span');
    status.className = 'it-asset-selector-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    bar.append(status);
    grid.before(bar);
    const state = { bar, controls, busy: false, update, grid };

    function update() {
      if (state.busy) return;
      const rows = items(grid);
      const selected = rows.filter(r => r.checkbox.checked).length;
      const regular = rows.filter(r => !r.excluded);
      const checkedRegular = regular.filter(r => r.checkbox.checked).length;
      controls[0].checked = rows.length > 0 && selected === rows.length;
      controls[0].indeterminate = selected > 0 && selected < rows.length;
      controls[1].checked = regular.length > 0 && checkedRegular === regular.length &&
        !rows.some(r => r.excluded && r.checkbox.checked);
      controls[1].indeterminate = selected > 0 && !controls[1].checked;
      controls[0].disabled = rows.length === 0;
      controls[1].disabled = rows.length === 0;
      const text = `${selected} of ${rows.length} selectable assets selected · Current list`;
      if (status.textContent !== text) status.textContent = text;
    }

    async function select(mode, checked) {
      if (state.busy) return;
      state.busy = true;
      controls.forEach(c => { c.disabled = true; });
      status.textContent = 'Updating asset selection…';
      const snapshot = items(grid).map(r => ({ key: r.key, description: r.description }));
      let failed = false;
      try {
        for (const original of snapshot) {
          if (!visible(grid) || !bar.isConnected) break;
          const row = items(grid).find(r => r.key === original.key && r.description === original.description);
          if (!row) continue;
          const desired = checked && (mode === 'all' || !row.excluded);
          // Unchecking the second control clears only its non-check-valve subset.
          if (!checked && mode === 'except' && row.excluded) continue;
          if (row.checkbox.checked !== desired) {
            row.checkbox.click();
            await new Promise(resolve => setTimeout(resolve, 0));
            const current = items(grid).find(r => r.key === original.key && r.description === original.description);
            if (current && current.checkbox.checked !== desired) failed = true;
          }
        }
      } finally {
        state.busy = false;
        update();
        if (failed) status.textContent += ' · Some items could not be changed; review selection.';
      }
    }
    controls[0].addEventListener('change', () => select('all', controls[0].checked));
    controls[1].addEventListener('change', () => select('except', controls[1].checked));
    grid.addEventListener('change', schedule);
    grid.addEventListener('click', schedule);
    mounted.set(grid, state);
    update();
  }

  let scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    setTimeout(() => { scheduled = false; refresh(); }, 40);
  }
  function refresh() {
    for (const [grid, state] of mounted) {
      if (!visible(grid) || !gridInfo(grid) || !state.bar.isConnected) {
        state.bar.remove();
        grid.removeEventListener('change', schedule);
        grid.removeEventListener('click', schedule);
        mounted.delete(grid);
      } else state.update();
    }
    if (!/^\/jobs\/detail\//.test(location.pathname)) return;
    for (const grid of document.querySelectorAll('app-asset-group-grid-new kendo-grid')) {
      if (!mounted.has(grid) && visible(grid) && gridInfo(grid)) mount(grid);
    }
  }
  new MutationObserver(records => {
    if (records.some(r => !r.target.closest?.('.it-asset-selector'))) schedule();
  }).observe(document.body, { childList: true, subtree: true, attributes: true,
    attributeFilter: ['class', 'style', 'hidden', 'checked', 'disabled', 'aria-selected'] });
  window.addEventListener('popstate', schedule);
  refresh();
})();
