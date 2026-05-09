import { storage } from '../utils/storage.js';
import { messenger } from '../utils/messenger.js';

document.addEventListener('DOMContentLoaded', async () => {
  const content = document.getElementById('content');

  const data = await storage.get(['visitCount']);
  const count = (data.visitCount || 0) + 1;
  await storage.set({ visitCount: count });

  content.innerHTML = `
    <p><strong>Hello World</strong> is working!</p>
    <p>You have opened this popup <strong>${count}</strong> time${count > 1 ? 's' : ''}.</p>
    <hr style="margin: 12px 0; border: none; border-top: 1px solid #e0e0e0;">
    <p style="font-size: 12px; color: #888;">
      Manifest V3 | chrome.storage.local | ES Module
    </p>
  `;
});
