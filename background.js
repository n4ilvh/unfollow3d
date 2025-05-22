chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.clear();
  });
  