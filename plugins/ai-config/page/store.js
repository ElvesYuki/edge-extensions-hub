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

const STORE_KEY = 'LOCAL_CONFIG_JSON';
const BACKUP_STORE_KEY = 'LOCAL_CONFIG_JSON_BACKUP';

const store = {
  async loadConfig() {
    const data = await storage.get([STORE_KEY]);
    if (data[STORE_KEY]) {
      try {
        return JSON.parse(data[STORE_KEY]);
      } catch (e) {
        console.error('Failed to parse stored config:', e);
        return null;
      }
    }
    return null;
  },

  async saveConfig(config) {
    const json = JSON.stringify(config);
    try {
      await storage.set({ [STORE_KEY]: json });
      return true;
    } catch (e) {
      if (e.message && e.message.includes('quota')) {
        console.error('Storage quota exceeded');
      }
      throw e;
    }
  },

  async backupCurrentConfig() {
    const data = await storage.get([STORE_KEY]);
    if (!data[STORE_KEY]) return false;
    await storage.set({ [BACKUP_STORE_KEY]: data[STORE_KEY] });
    return true;
  },

  async restoreBackupConfig() {
    const data = await storage.get([BACKUP_STORE_KEY]);
    if (!data[BACKUP_STORE_KEY]) return null;
    await storage.set({ [STORE_KEY]: data[BACKUP_STORE_KEY] });
    try {
      return JSON.parse(data[BACKUP_STORE_KEY]);
    } catch (e) {
      console.error('Failed to parse backup config:', e);
      return null;
    }
  },

  async backupExists() {
    const data = await storage.get([BACKUP_STORE_KEY]);
    return !!data[BACKUP_STORE_KEY];
  },

  async clearConfig() {
    await storage.remove([STORE_KEY]);
  },

  async exists() {
    const data = await storage.get([STORE_KEY]);
    return !!data[STORE_KEY];
  },
};

export { storage, store, STORE_KEY, BACKUP_STORE_KEY };
