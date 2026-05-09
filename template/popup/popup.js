import { storage } from '../utils/storage.js';
import { messenger } from '../utils/messenger.js';

document.addEventListener('DOMContentLoaded', async () => {
  const content = document.getElementById('content');

  const data = await storage.get(['init']);
  if (!data.init) {
    await storage.set({ init: true });
  }

  content.textContent = '{{PLUGIN_NAME}} is ready.';
});
