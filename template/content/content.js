chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const { action, payload } = message;
  switch (action) {
    case 'example':
      console.log('[content] received:', action, payload);
      break;
  }
  return true;
});
