const storage = {
  get(keys) {
    return chrome.storage.local.get(keys);
  },

  set(items) {
    return chrome.storage.local.set(items);
  },

  remove(keys) {
    return chrome.storage.local.remove(keys);
  },

  clear() {
    return chrome.storage.local.clear();
  },
};

export { storage };
