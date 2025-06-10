let scrollInterval;
const followers = new Set();
const following = new Set();
let currentMode = "followers";
let scannedCount = 0;
let totalCount = 0;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.command === "startScrolling") {
    currentMode = message.mode || "followers";
    scannedCount = 0;
    totalCount = 0;
    console.log("Scrolling started");
    const centerElem = getElementAtCenter();
    const scrollable = findScrollableParent(centerElem);

    if (scrollable && !scrollInterval) {
      scrollInterval = setInterval(() => {
        scrollable.scrollBy(0, 999999);
        collectUsernames();
      }, 1);
    }

    sendResponse?.({ status: "scrolling started" });
  }

  if (message.command === "stopScrolling") {
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
  while (element && element !== document.body) {
    const style = getComputedStyle(element);
    if (
      (style.overflowY === "auto" || style.overflowY === "scroll") &&
      element.scrollHeight > element.clientHeight
    ) {
      return element;
    }
    element = element.parentElement;
  }
  return null;
}

function collectUsernames() {
  const links = document.querySelectorAll("a[href^='/'");
  links.forEach((link) => {
    const href = link.getAttribute("href");
    if (/^\/[^/]+\/$/.test(href)) {
      const username = "@" + href.replaceAll("/", "");
      if (username) {
        currentMode === "followers" 
          ? followers.add(username)
          : following.add(username);
      }
    }
  });

  scannedCount = currentMode === "followers" ? followers.size : following.size;
  
  // Update total count only if we haven't set it yet or if we've scanned more than current total
  if (totalCount === 0 || scannedCount > totalCount) {
    totalCount = getTotalCount(currentMode);
  }

  chrome.runtime.sendMessage({
    command: "progressUpdate",
    scanned: scannedCount,
    total: totalCount,
    mode: currentMode
  });
}

  // Update counts
  scannedCount = currentMode === "followers" ? followers.size : following.size;
  totalCount = getTotalCount(currentMode);

  // Send progress update
  chrome.runtime.sendMessage({
    command: "progressUpdate",
    scanned: scannedCount,
    total: totalCount,
    mode: currentMode
  });


function getTotalCount(mode) {
  // Try to get the count from the profile header (most reliable)
  const selector = mode === 'followers' 
    ? 'header section ul li:nth-child(2) a span span' 
    : 'header section ul li:nth-child(3) a span span';
  
  const countElement = document.querySelector(selector);
  if (countElement) {
    const countText = countElement.textContent;
    // Handle numbers like "1,234" or "12.3k"
    return parseCountText(countText);
  }

  // If not found in header, try the dialog title (when list is open)
  const dialogTitle = document.querySelector('[role="dialog"] header span');
  if (dialogTitle) {
    const titleText = dialogTitle.textContent;
    const countMatch = titleText.match(/([\d,]+)/);
    if (countMatch) {
      return parseCountText(countMatch[1]);
    }
  }

  // Final fallback - count visible list items
  return document.querySelectorAll('[role="dialog"] ul li').length;
}

function parseCountText(text) {
  // Remove commas and convert to number
  const cleanText = text.replace(/,/g, '');
  
  // Handle "k" format (like 12.3k)
  if (cleanText.includes('k')) {
    return Math.floor(parseFloat(cleanText) * 1000);
  }
  
  // Handle "m" format (like 1.2m)
  if (cleanText.includes('m')) {
    return Math.floor(parseFloat(cleanText) * 1000000);
  }
  
  return parseInt(cleanText, 10) || 0;
}

