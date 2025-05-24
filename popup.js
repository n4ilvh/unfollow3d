const followers = [];
const following = [];
const unfollow = [];

document.getElementById("followers").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {
      command: "startScrolling",
      mode: "followers",
    });
  });
});

document.getElementById("following").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {
      command: "startScrolling",
      mode: "following",
    });
  });
});

document.getElementById("stop").addEventListener("click", () => {
  chrome.runtime.sendMessage({ command: "stopScrolling" });
});

// Use the compareBtn (not compareView div)
document.getElementById("compareBtn").addEventListener("click", () => {
  document.getElementById("mainView").style.display = "none";
  document.getElementById("compareView").style.display = "block";

  // Show followers and following in compareContent
  const compareContent = document.getElementById("compareContent");
  
  compareContent.innerHTML = `
    <h3>Not following you back (${unfollow.length}):</h3>
    <ul>${unfollow.map(u => `<li>${u}</li>`).join("")}</ul>
    <h3>Followers (${followers.length}):</h3>
    <ul>${followers.map(u => `<li>${u}</li>`).join("")}</ul>
    <h3>Following (${following.length}):</h3>
    <ul>${following.map(u => `<li>${u}</li>`).join("")}</ul>
  `;
});

document.getElementById("backBtn").addEventListener("click", () => {
  document.getElementById("compareView").style.display = "none";
  document.getElementById("mainView").style.display = "block";
});



chrome.runtime.onMessage.addListener((message) => {
  if (message.command === "usernamesCollected") {
    const followersList = message.data.followers.slice(2); // skip "reels" + username
    const followingList = message.data.following.slice(2);

    // Find users who don't follow back
    const unfollowList = followingList.filter(user => !followersList.includes(user));

    // Save to chrome storage so it persists
    chrome.storage.local.set({
      followers: followersList,
      following: followingList,
      unfollow: unfollowList
    }, () => {
      console.log("User data saved to storage!");
    });
  }
});


  // Finds out who is not following the user
  function findUnfollowers(followingList, followersList) {
    return followingList.filter(user => !followersList.includes(user));
  }
  
