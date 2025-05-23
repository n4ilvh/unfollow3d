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
    followers.length = 0;
    following.length = 0;

    followers.push(...message.data.followers);
    following.push(...message.data.following);

    // Removes "reels" and user's username from the arrays
    followers.splice(0, 2);
    following.splice(0, 2);

    // Find unfollowers
    const unfollowers = findUnfollowers(following, followers);
    unfollow.length = 0;
    unfollow.push(...unfollowers);

    console.log("Unfollowers:", unfollow);
  }
});


  // Finds out who is not following the user
  function findUnfollowers(followingList, followersList) {
    return followingList.filter(user => !followersList.includes(user));
  }
  
