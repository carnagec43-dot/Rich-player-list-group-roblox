// Utility to extract groupId from a Roblox group URL
function extractGroupId(url) {
  const match = url.match(/groups\\/(\\d+)/);
  return match ? match[1] : null;
}

const groupLinkInput = document.getElementById('groupLink');
const searchBtn = document.getElementById('searchBtn');
const refreshBtn = document.getElementById('refreshBtn');
const resultsEl = document.getElementById('results');
const statusEl = document.getElementById('status');

let lastGroupId = null;

searchBtn.addEventListener('click', async () => {
  const link = groupLinkInput.value.trim();
  const groupId = extractGroupId(link);
  if (!groupId) {
    alert('Invalid Roblox group link.');
    return;
  }
  lastGroupId = groupId;
  refreshBtn.disabled = false;
  await fetchAndDisplay(groupId);
});

refreshBtn.addEventListener('click', async () => {
  if (lastGroupId) {
    await fetchAndDisplay(lastGroupId);
  }
});

async function fetchAndDisplay(groupId) {
  clearResults();
  setStatus('Fetching group members...');
  try {
    const members = await fetchAllGroupMembers(groupId);
    setStatus(`Found ${members.length} members. Evaluating wealth...`);

    const richData = [];
    let processed = 0;
    for (const member of members) {
      const totalValue = await calculateUserLimitedValue(member.user.userId);
      processed++;
      setStatus(`Processed ${processed}/${members.length}`);
      if (totalValue > 0) {
        richData.push({
          name: member.user.username,
          value: totalValue,
          userId: member.user.userId
        });
      }
    }

    richData.sort((a, b) => b.value - a.value);

    if (richData.length === 0) {
      setStatus('No members with limiteds over 10,000 Robux found.');
      return;
    }
    setStatus(`Displaying top ${richData.length} rich members.`);
    for (const entry of richData) {
      const li = document.createElement('li');
      li.textContent = `${entry.name} - ${entry.value.toLocaleString()} Robux`;
      li.addEventListener('click', () => {
        chrome.tabs.create({ url: `https://www.roblox.com/users/${entry.userId}/profile` });
      });
      resultsEl.appendChild(li);
    }
  } catch (err) {
    console.error(err);
    setStatus('Error fetching data. Check console.');
  }
}

function clearResults() {
  resultsEl.innerHTML = '';
}

function setStatus(msg) {
  statusEl.textContent = msg;
}

// Fetch all group members, paginated
async function fetchAllGroupMembers(groupId) {
  let cursor = '';
  const members = [];
  const limit = 100;
  do {
    const url = `https://groups.roblox.com/v1/groups/${groupId}/users?limit=${limit}${cursor ? `&cursor=${cursor}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch group members');
    const data = await res.json();
    members.push(...data.data);
    cursor = data.nextPageCursor;
  } while (cursor);
  return members;
}

// Calculate a user's total limited value (assets >= 10,000 R$)
async function calculateUserLimitedValue(userId) {
  let cursor = '';
  let total = 0;
  const limit = 100;
  do {
    const url = `https://inventory.roblox.com/v1/users/${userId}/assets/collectibles?limit=${limit}&sortOrder=Asc${cursor ? `&cursor=${cursor}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch collectibles');
    const data = await res.json();
    for (const item of data.data) {
      const price = item.recentAveragePrice || item.originalPrice || 0;
      if (price >= 10000) total += price;
    }
    cursor = data.nextPageCursor;
  } while (cursor);
  return total;
}