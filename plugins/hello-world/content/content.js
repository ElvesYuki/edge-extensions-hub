chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const { action, payload } = message;
  switch (action) {
    case 'greet':
      console.log('[hello-world content]', payload);
      sendResponse({ ok: true });
      break;
  }
  return true;
});
