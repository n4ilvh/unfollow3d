let scrollInterval;
const followers = new Set();
const following = new Set();
let currentMode = "followers"; // default mode

chrome.runtime.onMessage.addListener((message) => {
  if (message.command === "startScrolling") {
    currentMode = message.mode || "followers";  // set mode from message
    const centerElem = getElementAtCenter();
    const scrollable = findScrollableParent(centerElem);
    if (scrollable && !scrollInterval) {
      scrollInterval = setInterval(() => {
        scrollable.scrollBy(0, 200);
        collectUsernames();
      }, 100);
    }
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
    if (
      /^\/[^/]+\/$/.test(href) &&
      !href.includes("explore") &&
      !href.includes("direct") &&
      !href.includes("stories")
    ) {
      const username = href.replaceAll("/", "");
      if (username) {
        if (currentMode === "followers") {
          followers.add(username);
        } else if (currentMode === "following") {
          following.add(username);
        }
      }
    }
  });
}
