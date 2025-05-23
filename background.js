chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.command === "startScrolling" || message.command === "stopScrolling") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { command: message.command });
    });
  }
});
