const messenger = {
  sendToBackground(action, payload = {}) {
    return chrome.runtime.sendMessage({ action, payload });
  },

  sendToTab(tabId, action, payload = {}) {
    return chrome.tabs.sendMessage(tabId, { action, payload });
  },

  onMessage(handler) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      handler(message, sender);
      // Keep port open for async reply
      return true;
    });
  },

  queryTabs(query) {
    return chrome.tabs.query(query);
  },
};

export { messenger };
