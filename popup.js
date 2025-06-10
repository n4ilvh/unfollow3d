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
  document.getElementById("scanner").style.display = "block";
  updateProgress(0, 0);
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {
      command: "startScrolling",
      mode: "followers",
    });
  });
});

// "Scan Following" is pressed
document.getElementById("followingBtn").addEventListener("click", () => {
  document.getElementById("scanner").style.display = "block";
  updateProgress(0, 0);
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {
      command: "startScrolling",
      mode: "following",
    });
  });
});

// "Stop" is pressed
document.getElementById("stopBtn").addEventListener("click", () => {
  document.getElementById("scanner").style.display = "none";
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
    <ul>${following.map(u => `<li><a style="color:rgb(133, 51, 163)" href="https://instagram.com/${u}" target="_blank">${u}</a></li>`).join("")}</ul>
  `;
    dropdownListener();
  }

  // If following is not scanned but followers are
  else if (!followers.length == 0 && following.length == 0) {
    compareContent.innerHTML = `
    <span style="color: rgb(255, 255, 255)">
      <h3>Following not scanned</h3>
    </span>
    ${createDropdown("Followers", followers)}
  `;
    dropdownListener();
  }

  // If nothing has been scanned
  else if (followers.length == 0 && following.length == 0) {
    compareContent.innerHTML = `
    
    <span style="color: rgb(255, 255, 255)">
      <h3>Followers not scanned</h3>
      <h3>Following not scanned</h3>
    </span>
  `;
    dropdownListener();
  }

  // If both following and followers are scanned
  else {
    compareContent.innerHTML = `
      
      ${createDropdown("Not Following You Back", unfollow)}
      ${createDropdown("Followers", followers)}
      ${createDropdown("Following", following)}
    `;
    dropdownListener();
  }
});

document.getElementById("compareBackBtn").addEventListener("click", () => {
  document.getElementById("compareView").style.display = "none";
  document.getElementById("helpView").style.display = "none";
  document.getElementById("mainView").style.display = "block";
});

document.getElementById("helpBackBtn").addEventListener("click", () => {
  document.getElementById("helpView").style.display = "none";
  document.getElementById("mainView").style.display = "block";
});

// If "Reset" is pressed
document.getElementById("resetBtn").addEventListener("click", () => {
  unfollow.length = 0;
  followers.length = 0;
  following.length = 0;
  chrome.storage.local.set({ following: [] });
  chrome.storage.local.set({ followers: [] });

  chrome.storage.local.clear(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { command: "resetData" });
    });
  });
  document.getElementById("compareView").style.display = "block";

  const compareContent = document.getElementById("compareContent");
  
  compareContent.innerHTML = `
    <p style="color: white";>List has been reset.</p>
    ${createDropdown("Not Following You Back", unfollow)}
    ${createDropdown("Followers", followers)}
    ${createDropdown("Following", following)}
  `;
});


chrome.runtime.onMessage.addListener((message) => {
  if (message.command === "usernamesCollected") {
    followers.length = 0;
    following.length = 0;

    followers.push(...message.data.followers);
    following.push(...message.data.following);

    // Removes "reels" and user's username from the arrays
    // followers.splice(0, 2);
    // following.splice(0, 2);

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

  // Dropdown function
  function createDropdown(title, data) {
    return `
      <div class="dropdown" style="margin-bottom: 10px;">
        <button class="dropdown-toggle" style="background:none; border:none; color:white; font-size:16px; cursor:pointer; display:flex; align-items:center; gap:6px;">
          <span class="arrow" style="transition: transform 0.5s;">&#9654;</span> ${title} (${data.length})
        </button>
        <ul style="display:none; padding-left: 20px;">
          ${data.map(u => `<li><a style="color:rgb(133, 51, 163)" href="https://instagram.com/${u}" target="_blank">${u}</a></li>`).join("")}
        </ul>
      </div>
    `;
  }
  
  function updateProgress(scanned, total) {
    const percent = total > 0 ? Math.min(100, Math.floor((scanned / total) * 100)) : 0;
    const progressBar = document.getElementById('scanProgressBar');
    
    // Smooth transition
    progressBar.style.transition = 'width 0.3s ease';
    progressBar.style.width = percent + '%';
    
    document.getElementById('progressText').textContent = 
      total > 0 ? `${percent}% scanned (${scanned}/${total})` : 'Scanning...';
  }
  
  function dropdownListener(){
    document.querySelectorAll(".dropdown-toggle").forEach(btn => {
      btn.style.width = "200px";
      
      btn.addEventListener("click", () => {
        const list = btn.nextElementSibling;
        const arrow = btn.querySelector(".arrow");
        const isOpen = list.style.display === "block";

        list.style.display = isOpen ? "none" : "block";
        arrow.style.transform = isOpen ? "rotate(0deg)" : "rotate(90deg)";
      });
    });
  }
  // Listen for updates from content.js
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "progressUpdate") {
      updateProgress(message.scanned, message.total);
    }
  });
  
  const port = chrome.runtime.connect({ name: "popup" });
  port.onMessage.addListener((message) => {
  if (message.command === "progressUpdate") {
    updateProgress(message.scanned, message.total);
  }
});
  