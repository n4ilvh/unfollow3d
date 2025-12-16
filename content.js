let scrollInterval;
const followers = new Set();
const following = new Set();
let currentMode = "followers";
let scannedCount = 0;
let totalCount = 0;
let totalMode = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.command === "startScrolling") {
    currentMode = message.mode || "followers";
    scannedCount = 0;
    totalCount = 0;
    console.log("Scrolling started for mode:", currentMode);
    
    // Clear existing interval if any
    if (scrollInterval) {
      clearInterval(scrollInterval);
      scrollInterval = null;
    }
    
    // Start scrolling
    scrollInterval = setInterval(() => {
      const scrollable = findScrollableParent(getElementAtCenter());
      if (scrollable) {
        scrollable.scrollBy(0, 300);
      }
      collectUsernames();
    }, 100); // Increased interval for better performance
    
    sendResponse?.({ status: "scrolling started" });
  }

  if (message.command === "stopScrolling") {
    console.log("Scrolling stopped");
    clearInterval(scrollInterval);
    scrollInterval = null;

    chrome.runtime.sendMessage({
      command: "usernamesCollected",
      data: {
        followers: Array.from(followers),
        following: Array.from(following),
      },
    });
  }

  if (message.command === "resetData") {
    console.log("resetData received in content.js");
    followers.clear();
    following.clear();
    scannedCount = 0;
    totalCount = 0;
  }

  if (message.action === "getProgress") {
    sendResponse?.({ scanned: scannedCount, total: totalCount });
  }
});

function getElementAtCenter() {
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  return document.elementFromPoint(centerX, centerY);
}

function findScrollableParent(element) {
  let current = element || document.body;
  
  while (current && current !== document.documentElement) {
    const style = getComputedStyle(current);
    const hasScrollableContent = current.scrollHeight > current.clientHeight;
    
    if ((style.overflowY === "auto" || style.overflowY === "scroll") && hasScrollableContent) {
      return current;
    }
    
    current = current.parentElement;
  }
  
  // Fallback to document scrolling
  return document.scrollingElement || document.documentElement;
}

function collectUsernames() {
  try {
    // 1. Find the scrollable container
    const dialog = document.querySelector('[role="dialog"]');
    const scrollContainer = dialog ? dialog : document;
    
    // 2. Find all links (Instagram usernames are usually in <a> tags)
    const candidates = scrollContainer.querySelectorAll('a[href^="/"]');
    const seen = new Set();
    
    candidates.forEach((link) => {
      const href = link.getAttribute("href");
      
      // Match Instagram username pattern
      if (href && /^\/[A-Za-z0-9_.]{1,30}\/?$/.test(href)) {
        const username = href.replace(/^\//, '').replace(/\/$/, '');
        
        // Skip if we've already seen this username
        if (seen.has(username)) return;
        seen.add(username);
        
        // Validate it's a user link (not a post or story)
        if (!href.includes('/p/') && 
            !href.includes('/stories/') && 
            !href.includes('/reel/') &&
            !href.includes('/tv/')) {
          
          const fullUsername = "@" + username;
          
          if (currentMode === "followers") {
            followers.add(fullUsername);
          } else {
            following.add(fullUsername);
          }
        }
      }
    });

    // Update progress
    updateProgressTracking();

  } catch (error) {
    console.error("Error in collectUsernames:", error);
  }
}

function updateProgressTracking() {
  scannedCount = currentMode === "followers"
    ? followers.size
    : following.size;

  // Recalculate total when mode changes
  if (totalMode !== currentMode) {
    totalCount = 0;
    totalMode = currentMode;
  }

  // Only set total when dialog header matches mode
  const detectedTotal = getTotalCountFromDialog(currentMode);
  if (detectedTotal > 0) {
    totalCount = detectedTotal;
  }

  console.log(`Progress: ${scannedCount}/${totalCount} (${currentMode})`);

  chrome.runtime.sendMessage({
    command: "progressUpdate",
    scanned: scannedCount,
    total: totalCount,
    mode: currentMode
  });
}


function getTotalCountFromDialog(mode) {
  const selector =
    mode === "followers"
      ? `a[href$="/followers/"] span span`
      : `a[href$="/following/"] span span`;

  const element = document.querySelector(selector);
  if (!element) return 0;

  const text = element.textContent || element.innerText;
  const match = text.match(/[\d,.kKmM]+/);
  return match ? parseCountText(match[0]) : 0;
}

function parseCountText(text) {
  const clean = text.replace(/,/g, '');
  
  if (clean.includes('k')) {
    return Math.floor(parseFloat(clean) * 1000);
  }
  
  if (clean.includes('m')) {
    return Math.floor(parseFloat(clean) * 1000000);
  }
  
  return parseInt(clean, 10) || 0;
}

