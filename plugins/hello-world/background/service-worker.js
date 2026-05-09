import { storage } from '../utils/storage.js';
import { messenger } from '../utils/messenger.js';

// Extension install / update
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    storage.set({ installTime: Date.now() });
  }
});

// Message routing hub
messenger.onMessage((message, sender) => {
  const { action, payload } = message;
  switch (action) {
    case 'example':
      console.log('[background] received:', action, payload, 'from:', sender);
      break;
  }
});
