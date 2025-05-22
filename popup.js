function scrapeList(type) {
  const dialog = document.querySelector("div[role='dialog'] ul")?.parentElement;
  if (!dialog) {
    alert("Open your followers or following list popup on Instagram first.");
    return;
  }

  let lastScrollTop = 0;
  let sameScrollCount = 0;

  const scrollAndCollect = () => {
    dialog.scrollTop = dialog.scrollHeight;

    if (dialog.scrollTop === lastScrollTop) {
      sameScrollCount++;
    } else {
      sameScrollCount = 0;
    }
    lastScrollTop = dialog.scrollTop;

    // If scroll position hasn't changed after 5 tries, assume loaded all
    if (sameScrollCount >= 5) {
      // Collect usernames
      const users = [...dialog.querySelectorAll("ul li a")].map(a => a.textContent.trim()).filter(Boolean);
      chrome.storage.local.set({ [type]: users });
      alert(`${type.charAt(0).toUpperCase() + type.slice(1)} list scraped! ${users.length} users found.`);
    } else {
      setTimeout(scrollAndCollect, 500);
    }
  };

  scrollAndCollect();
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("scanFollowers").addEventListener("click", () => scrapeList("followers"));
  document.getElementById("scanFollowing").addEventListener("click", () => scrapeList("following"));
});
