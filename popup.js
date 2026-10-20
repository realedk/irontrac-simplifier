'use strict';
const toggle = document.getElementById('enabled');
const label = document.getElementById('setting-label');
const refresh = document.getElementById('refresh');
const status = document.getElementById('status');
let savedEnabled = true;

(async () => {
  try {
    const settings = await chrome.storage.local.get({ enabled: true });
    savedEnabled = settings.enabled;
    toggle.checked = savedEnabled;
    label.textContent = savedEnabled ? 'Enabled' : 'Disabled';
    toggle.disabled = false;
    refresh.disabled = false;
  } catch {
    status.textContent = 'Could not load the setting. Close and reopen this menu.';
  }
})();

toggle.addEventListener('change', async () => {
  toggle.disabled = true;
  refresh.disabled = true;
  try {
    await chrome.storage.local.set({ enabled: toggle.checked });
    savedEnabled = toggle.checked;
    label.textContent = savedEnabled ? 'Enabled' : 'Disabled';
    status.textContent = 'Setting saved. Click Refresh page to apply it.';
  } catch {
    toggle.checked = savedEnabled;
    status.textContent = 'Could not save the setting. Please try again.';
  } finally {
    toggle.disabled = false;
    refresh.disabled = false;
  }
});

refresh.addEventListener('click', async () => {
  refresh.disabled = true;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id === undefined) throw new Error('No active tab');
    await chrome.tabs.reload(tab.id);
    status.textContent = 'Page refreshed. The saved setting will apply on IronTrac.';
  } catch {
    status.textContent = 'Could not refresh this tab. Refresh it in Chrome to apply the changes.';
  } finally {
    refresh.disabled = false;
  }
});
