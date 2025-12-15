let popupPort = null;

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "popup") {
    popupPort = port;
    console.log("Popup connected to background");
    port.onDisconnect.addListener(() => {
      console.log("Popup disconnected from background");
      popupPort = null;
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background received message:", message);
  
  if (message.command === "startScrolling" || message.command === "stopScrolling") {
    console.log("Forwarding scrolling command to tab");
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { 
          command: message.command, 
          mode: message.mode 
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error("Error sending to tab:", chrome.runtime.lastError);
          }
        });
      }
    });
  }

  if (message.command === "usernamesCollected") {
    console.log("Saving usernames to storage");
    const { followers, following } = message.data;
    chrome.storage.local.set({ followers, following }, () => {
      console.log("Usernames saved to storage.");
    });
  }

  if (message.command === "progressUpdate") {
    console.log("Progress update received in background:", message.scanned, "/", message.total);
    
    // Forward to popup if connected
    if (popupPort) {
      console.log("Forwarding progress update to popup");
      popupPort.postMessage({
        command: "progressUpdate",
        scanned: message.scanned,
        total: message.total
      });
    } else {
      console.log("Popup port not connected, cannot forward progress update");
    }
    
    // Also send directly via runtime message (fallback)
    chrome.runtime.sendMessage({
      command: "progressUpdate",
      scanned: message.scanned,
      total: message.total
    }).catch(err => {
      console.log("Direct runtime message failed (popup closed):", err);
    });
  }
  
  return true; // Keep message channel open for async response
});