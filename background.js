let popupPort = null;

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "popup") {
    popupPort = port;
    port.onDisconnect.addListener(() => (popupPort = null));
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.command === "startScrolling" || message.command === "stopScrolling") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { command: message.command, mode: message.mode });
    });
  }

  if (message.command === "usernamesCollected") {
    const { followers, following } = message.data;
    chrome.storage.local.set({ followers, following }, () => {
      console.log("Usernames saved to storage.");
    });
  }

  if (message.command === "progressUpdate") {
    if (popupPort) {
      popupPort.postMessage({
        command: "progressUpdate",
        scanned: message.scanned,
        total: message.total
      });
    }
  }
});
