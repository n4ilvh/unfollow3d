const followers = [];
const following = [];
const unfollow = [];

chrome.storage.local.get(["followers", "following", "unfollow"], (result) => {
  if (result.followers) followers.push(...result.followers);
  if (result.following) following.push(...result.following);
  if (result.unfollow) unfollow.push(...result.unfollow);
});

// "?" is pressed
document.getElementById("helpBtn").addEventListener("click", () =>{
  document.getElementById("mainView").style.display = "none";
  document.getElementById("helpView").style.display = "block";
})

// "Scan Followers" is pressed
document.getElementById("followersBtn").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {
      command: "startScrolling",
      mode: "followers",
    });
  });
});

// "Scan Following" is pressed
document.getElementById("followingBtn").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {
      command: "startScrolling",
      mode: "following",
    });
  });
});

// "Stop" is pressed
document.getElementById("stopBtn").addEventListener("click", () => {
  chrome.runtime.sendMessage({ command: "stopScrolling" });
});

// "Compare" is pressed
document.getElementById("compareBtn").addEventListener("click", () => {
  document.getElementById("mainView").style.display = "none";
  document.getElementById("compareView").style.display = "block";

  // Show followers and following in compareContent
  const compareContent = document.getElementById("compareContent");
  
  // If followers are not scanned but following is
  if (followers.length == 0 && !following.length == 0){
    compareContent.innerHTML = `
    <h3>Followers not scanned</h3>
    <h3>Following (${following.length}):</h3>
    <ul>${following.map(u => `<li>${u}</li>`).join("")}</ul>
  `;
  }

  // If following is not scanned but followers are
  else if (!followers.length == 0 && following.length == 0) {
    compareContent.innerHTML = `
    <h3>Following not scanned</h3>
    <h3>Followers (${followers.length}):</h3>
    <ul>${followers.map(u => `<li>${u}</li>`).join("")}</ul>
  `;
  }

  else if (followers.length == 0 && following.length == 0) {
    compareContent.innerHTML = `
    <h3>Followers not scanned</h3>
    <h3>Following not scanned</h3>
  `;
  }

  else {
    compareContent.innerHTML = `
  <h3>Not following you back (${unfollow.length}):</h3>
  <ul>${unfollow.map(u => `<li><a style="color:rgb(133, 51, 163)"href="https://instagram.com/${u}" target="_blank">${u}</a></li>`).join("")}</ul>
  <h3>Followers (${followers.length}):</h3>
  <ul>${followers.map(u => `<li><a href="https://instagram.com/${u}" target="_blank">${u}</a></li>`).join("")}</ul>
  <h3>Following (${following.length}):</h3>
  <ul>${following.map(u => `<li><a href="https://instagram.com/${u}" target="_blank">${u}</a></li>`).join("")}</ul>
`;
  }
});

document.getElementById("backBtn").addEventListener("click", () => {
  document.getElementById("compareView").style.display = "none";
  document.getElementById("mainView").style.display = "block";
});

document.getElementById("resetBtn").addEventListener("click", () => {
  unfollow.length = 0;
  followers.length = 0;
  following.length = 0;
  chrome.storage.local.clear();
  document.getElementById("compareView").style.display = "block";

  const compareContent = document.getElementById("compareContent");
  
  compareContent.innerHTML = `
    List has been reset.
  `;
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

    chrome.storage.local.set({
      followers: followers,
      following: following,
      unfollow: unfollow
    });
  }
});


  // Finds out who is not following the user
  function findUnfollowers(followingList, followersList) {
    return followingList.filter(user => !followersList.includes(user));
  }
  
