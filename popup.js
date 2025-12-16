const followers = [];
const following = [];
const unfollow = [];

chrome.storage.local.get(["followers", "following", "unfollow"], (result) => {
  if (result.followers) followers.push(...result.followers);
  if (result.following) following.push(...result.following);
  if (result.unfollow) unfollow.push(...result.unfollow);
});

// "?" is pressed on the main screen
document.getElementById("helpBtnMain").addEventListener("click", () =>{
  document.getElementById("helpView").style.display = "block";
  document.getElementById("mainView").style.display = "none";
});

// "?" is pressed on the compare screen
document.getElementById("helpBtnCompare").addEventListener("click", () =>{
  document.getElementById("helpView").style.display = "block";
  document.getElementById("compareView").style.display = "none";
});



// "Scan Followers" is pressed
document.getElementById("followersBtn").addEventListener("click", () => {
  console.log("Scan Followers button clicked");
  document.getElementById("scanner").style.display = "block";
  initializeProgressBar();
  updateProgress(0, 0);
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && tabs[0].url.includes("instagram.com")) {
      console.log("Sending startScrolling message to tab");
      chrome.tabs.sendMessage(tabs[0].id, {
        command: "startScrolling",
        mode: "followers",
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("Error sending message:", chrome.runtime.lastError);
          document.getElementById("stopBtn").style.display = "none";
          document.getElementById("progressText").textContent = "Please refresh Instagram page";
        } else {
          console.log("Message sent successfully");
        }
      });
    } else {
      console.log("Instagram not open");
      document.getElementById("stopBtn").style.display = "none";
      document.getElementById("progressText").textContent = "Please open Instagram first";
    }
  });
});

// "Scan Following" is pressed
document.getElementById("followingBtn").addEventListener("click", () => {
  document.getElementById("scanner").style.display = "block";
  initializeProgressBar();
  updateProgress(0, 0);
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && tabs[0].url.includes("instagram.com")) {
      chrome.tabs.sendMessage(tabs[0].id, {
        command: "startScrolling",
        mode: "following",
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("Error sending message:", chrome.runtime.lastError);
          document.getElementById("progressText").textContent = "Please refresh Instagram page";
        }
      });
    } else {
      document.getElementById("progressText").textContent = "Please open Instagram first";
    }
  });
});

// "save" is pressed
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
    document.getElementById("csvBtn").style.display = "none";
    document.getElementById("resetBtn").style.display = "block";
    compareContent.innerHTML = `
    <div class="combo-container"> 
      ${createDropdown("Not following you back (?)")}
      ${createDropdown("Followers not scanned")}
      ${createDropdown("Following", following)}
    </div>
  `;
  }

  // If following is not scanned but followers are
  else if (!followers.length == 0 && following.length == 0) {
    document.getElementById("csvBtn").style.display = "none";
    document.getElementById("resetBtn").style.display = "block";
    compareContent.innerHTML = `
    <div class="combo-container"> 
    ${createDropdown("Not following you back (?)")}
    ${createDropdown("Followers", followers)}
    ${createDropdown("Following not scanned")}
    </div>
  `;
  }

  // If nothing has been scanned
  else if (followers.length == 0 && following.length == 0) {
    document.getElementById("csvBtn").style.display = "none";
    document.getElementById("resetBtn").style.display = "none";
    compareContent.innerHTML = `
    <div class="combo-container"> 
      ${createDropdown("Not following you back (?)")}
      ${createDropdown("Followers not scanned")}
      ${createDropdown("Following not scanned")}
    </div>
  `;
  }

  // If both following and followers are scanned
  else {
    document.getElementById("resetBtn").style.display = "block";
    document.getElementById("csvBtn").style.display = "block";
    compareContent.innerHTML = `
      <div class="combo-container"> 
        ${createDropdown("Not following you back", unfollow)}
        ${createDropdown("Followers", followers)}
        ${createDropdown("Following", following)}
      </div>
    `;
  }
});


// if combo box is clicked
document.addEventListener("click", e => {
  const combo = e.target.closest(".combo");

  document.querySelectorAll(".combo-list").forEach(list => {
    if (!combo || !list.parentElement.contains(e.target)) {
      list.style.display = "none";
    }
  });

  if (!combo) return;

  if (e.target.classList.contains("combo-arrow") ||
      e.target.classList.contains("combo-input")) {
    const list = combo.querySelector(".combo-list");
    list.style.display = list.style.display === "block" ? "none" : "block";
  }
});

// if the compare screen back button is pressed
document.getElementById("compareBackBtn").addEventListener("click", () => {
  document.getElementById("compareView").style.display = "none";
  document.getElementById("helpView").style.display = "none";
  document.getElementById("mainView").style.display = "block";
});

// if the help screen back button is pressed
document.getElementById("helpBackBtn").addEventListener("click", () => {
  document.getElementById("helpView").style.display = "none";
  document.getElementById("mainView").style.display = "block";
});

// If "Reset" is pressed
document.getElementById("resetBtn").addEventListener("click", () => {
  document.getElementById("resetBtn").style.display = "none";
  document.getElementById("csvBtn").style.display = "none";
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
        <div class="combo-container">
            <div style="color: black; font-weight: 100; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;  text-align: center; height: min-content;">List has been reset.</div>
          ${createDropdown("Not Following You Back (?)")}
          ${createDropdown("Followers (?)")}
          ${createDropdown("Following (?)")}
          </div>
        </div>
    </div>
  `;
});

document.getElementById("csvBtn").addEventListener("click", () => {
  downloadCSV(followers);
});



chrome.runtime.onMessage.addListener((message) => {
  if (message.command === "progressUpdate") {
    console.log("Progress update:", message);
    updateProgress(message.scanned, message.total);
  }
  
  if (message.command === "usernamesCollected") {
    document.getElementById("scanner").style.display = "none";
    followers.length = 0;
    following.length = 0;

    followers.push(...message.data.followers);
    following.push(...message.data.following);


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
  const hasData = Array.isArray(data);

  return `
    <div class="combo">
      <div class="combo-input">
        ${title}${hasData ? ` (${data.length})` : ""}
      </div>
      <div class="combo-arrow"></div>

      <div class="combo-list">
        ${
          hasData
            ? data.map(u => `
              <div class="combo-item">
                <a href="https://instagram.com/${u.slice(1)}" target="_blank">${u}</a>
              </div>
            `).join("")
            : ""
        }
      </div>
    </div>
  `;
}
  


const port = chrome.runtime.connect({ name: "popup" });

port.onMessage.addListener((message) => {
  console.log("Port message received in popup:", message);
  if (message.command === "progressUpdate") {
    console.log("Progress update via port:", message);
    updateProgress(message.scanned, message.total);
  }
});

function initializeProgressBar() {
  const progressBar = document.getElementById('progressBar');
  if (!progressBar) {
    console.error("Progress bar element not found!");
    return;
  }
  
  console.log("Initializing progress bar...");
  progressBar.innerHTML = ''; // Clear existing blocks
  
  // Create 10 progress blocks (fits better in 140px width)
  for (let i = 0; i < 10; i++) {
    const block = document.createElement('div');
    block.className = 'progress-block';
    block.style.backgroundColor = '#000080'; // Ensure color is set
    block.style.opacity = '0.3'; // Start with low opacity
    progressBar.appendChild(block);
  }
  
  console.log(`Created ${progressBar.children.length} progress blocks`);
}

function updateProgress(scanned, total) {
  const progressText = document.getElementById('progressText');
  const progressBar = document.getElementById('progressBar');
  
  if (!progressText) {
    console.error("Progress text element not found!");
    return;
  }
  
  if (!progressBar) {
    console.error("Progress bar element not found!");
    return;
  }
  
  console.log(`updateProgress called: scanned=${scanned}, total=${total}`);
  
  // Calculate percentage
  let percent = 0;
  if (total > 0) {
    percent = Math.min(100, Math.floor((scanned / total) * 100));
  }
  
  // Update progress blocks
  const blocks = progressBar.querySelectorAll('.progress-block');
  console.log(`Found ${blocks.length} progress blocks`);
  
  const blocksToFill = Math.floor((percent / 100) * blocks.length);
  console.log(`Filling ${blocksToFill} out of ${blocks.length} blocks (${percent}%)`);
  
  blocks.forEach((block, index) => {
    if (index < blocksToFill) {
      block.classList.add('filled');
      block.style.opacity = '1';
      block.style.backgroundColor = '#000080';
    } else {
      block.classList.remove('filled');
      block.style.opacity = '0.3';
      block.style.backgroundColor = '#000080';
    }
  });
  
  // Update text
  if (total > 0) {
    progressText.textContent = `Scanned: ${scanned} of ${total} (${percent}%)`;
  } else {
    progressText.textContent = `Scanned: ${scanned} users`;
  }
  
  // Force a repaint
  progressBar.style.display = 'none';
  progressBar.offsetHeight; // Trigger reflow
  progressBar.style.display = 'flex';
}

function downloadCSV(data) {
  const csv =
    "users not following you back:\n" +
    data.map(u => u.replace("@", "")).join("\n");

  chrome.runtime.sendMessage({
    type: "DOWNLOAD_CSV",
    csv
  });
}

function getDateTime() {
  return new Date().toLocaleString();
}