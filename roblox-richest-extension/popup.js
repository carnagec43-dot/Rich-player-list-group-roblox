const groupUrlInput = document.getElementById('groupUrl');
const searchBtn = document.getElementById('searchBtn');
const refreshBtn = document.getElementById('refreshBtn');
const statusEl = document.getElementById('status');
const resultsEl = document.getElementById('results');

let lastSearch = null;

searchBtn.addEventListener('click', async () => {
  const urlText = groupUrlInput.value.trim();
  if (!urlText) {
    setStatus('Enter a Roblox group link.');
    return;
  }
  const groupId = extractGroupId(urlText);
  if (!groupId) {
    setStatus('Could not parse group ID from the link.');
    return;
  }
  lastSearch = { groupId };
  refreshBtn.disabled = true;
  resultsEl.innerHTML = '';
  await runSearch(groupId);
});

refreshBtn.addEventListener('click', async () => {
  if (!lastSearch) return;
  refreshBtn.disabled = true;
  resultsEl.innerHTML = '';
  await runSearch(lastSearch.groupId);
});

function extractGroupId(text) {
  // Common patterns: https://www.roblox.com/groups/12345/Name, ...?groupId=12345, numeric input
  const directId = text.match(/\b(\d{3,})\b/);
  if (text.includes('/groups/')) {
    const m = text.match(/\/groups\/(\d+)\//);
    if (m) return m[1];
  }
  const q = text.match(/[?&]groupId=(\d+)/);
  if (q) return q[1];
  // Fallback: first long number in the string
  if (directId) return directId[1];
  return null;
}

function setStatus(message) {
  statusEl.textContent = message || '';
}

function renderProgress(label, fraction) {
  const pct = Math.floor(Math.min(1, Math.max(0, fraction)) * 100);
  statusEl.innerHTML = `${label} <span class="badge">${pct}%</span>` +
    `<div class="progress"><div style="width:${pct}%"></div></div>`;
}

async function runSearch(groupId) {
  try {
    setStatus('Fetching group roles...');
    const roles = await fetchGroupRoles(groupId);
    if (!roles.length) {
      setStatus('No roles found or group not accessible.');
      return;
    }

    // Fetch members role-by-role
    let allMembers = [];
    let roleIndex = 0;
    for (const role of roles) {
      roleIndex += 1;
      setStatus(`Fetching members in role: ${role.name} (${roleIndex}/${roles.length})`);
      const members = await fetchAllRoleMembers(groupId, role.id);
      allMembers = allMembers.concat(members);
    }

    // Deduplicate by userId
    const idToMember = new Map();
    for (const m of allMembers) {
      idToMember.set(m.user.userId, m.user);
    }
    const members = Array.from(idToMember.values());
    if (!members.length) {
      setStatus('No members found.');
      return;
    }

    setStatus(`Found ${members.length} members. Fetching collectibles...`);

    // Fetch collectibles with limited concurrency
    const concurrency = 8;
    let completed = 0;
    const memberChunks = chunkArray(members, concurrency);

    const userToCollectibles = new Map();

    for (const chunk of memberChunks) {
      await Promise.all(chunk.map(async (user) => {
        const inv = await fetchAllCollectibles(user.userId);
        userToCollectibles.set(user.userId, inv);
        completed += 1;
        renderProgress('Collectibles', completed / members.length);
      }));
    }

    // Gather all assetIds for creator check and details lookup
    const allItems = [];
    for (const [userId, items] of userToCollectibles.entries()) {
      for (const it of items) {
        // Normalize field names defensively
        const assetId = it.assetId || it.asset?.id || it.id;
        const rap = it.recentAveragePrice || it.recentAveragePriceInRobux || it.recentAveragePriceInRobuxRAP || it.rap;
        if (!assetId) continue;
        allItems.push({ userId, assetId, rap });
      }
    }

    if (!allItems.length) {
      setStatus('No collectibles found among members.');
      resultsEl.innerHTML = renderTable([]);
      refreshBtn.disabled = false;
      return;
    }

    // Batch fetch asset details to filter Roblox-created items
    renderProgress('Fetching asset details', 0);
    const assetIdSet = new Set(allItems.map(x => x.assetId));
    const assetIds = Array.from(assetIdSet);

    const assetIdToCreatorId = new Map();
    let detailCompleted = 0;
    const detailBatches = chunkArray(assetIds, 80);
    for (const batch of detailBatches) {
      const details = await fetchAssetDetailsBatch(batch);
      for (const d of details) {
        const id = d.id || d.assetId;
        const creatorId = d.creatorTargetId || (d.creator && (d.creator.id || d.creator.creatorTargetId));
        if (id != null && creatorId != null) {
          assetIdToCreatorId.set(Number(id), Number(creatorId));
        }
      }
      detailCompleted += batch.length;
      renderProgress('Fetching asset details', detailCompleted / assetIds.length);
    }

    // Aggregate per user: sum of RAP for Roblox-created limiteds with RAP >= 10000
    const ROBLOX_CREATOR_ID = 1;
    const threshold = 10000;

    const rows = [];
    for (const user of members) {
      const inv = userToCollectibles.get(user.userId) || [];
      let total = 0;
      let qualifyingCount = 0;
      for (const it of inv) {
        const assetId = it.assetId || it.asset?.id || it.id;
        const rap = it.recentAveragePrice || it.recentAveragePriceInRobux || it.recentAveragePriceInRobuxRAP || it.rap || 0;
        if (!assetId || !rap) continue;
        const creatorId = assetIdToCreatorId.get(Number(assetId));
        if (creatorId === ROBLOX_CREATOR_ID && rap >= threshold) {
          total += rap;
          qualifyingCount += 1;
        }
      }
      rows.push({ userId: user.userId, username: user.username, displayName: user.displayName, total, qualifyingCount });
    }

    rows.sort((a, b) => b.total - a.total);

    resultsEl.innerHTML = renderTable(rows);
    setStatus(`Done. ${rows.length} members ranked.`);
  } catch (err) {
    console.error(err);
    setStatus('Error: ' + (err && err.message ? err.message : 'Failed'));
  } finally {
    refreshBtn.disabled = false;
  }
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    method: 'GET',
    credentials: 'omit',
    cache: 'no-cache',
    ...options,
    headers: {
      'accept': 'application/json',
      ...(options.headers || {})
    }
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText} for ${url} -> ${text?.slice(0,200)}`);
  }
  return res.json();
}

async function fetchGroupRoles(groupId) {
  const url = `https://groups.roblox.com/v1/groups/${groupId}/roles`;
  const json = await fetchJson(url);
  return json.roles || json.data || [];
}

async function fetchAllRoleMembers(groupId, roleId) {
  const out = [];
  let cursor = '';
  do {
    const url = `https://groups.roblox.com/v1/groups/${groupId}/roles/${roleId}/users?limit=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`;
    const json = await fetchJson(url);
    const data = json.data || [];
    for (const item of data) {
      // item.user = { userId, username, displayName }
      if (item && item.user) out.push(item);
    }
    cursor = json.nextPageCursor || json.nextCursor || null;
  } while (cursor);
  return out;
}

async function fetchAllCollectibles(userId) {
  const out = [];
  let cursor = '';
  do {
    const url = `https://inventory.roblox.com/v1/users/${userId}/assets/collectibles?limit=100&sortOrder=Asc${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`;
    const json = await fetchJson(url);
    const data = json.data || [];
    for (const item of data) {
      out.push(item);
    }
    cursor = json.nextPageCursor || json.nextCursor || null;
  } while (cursor);
  return out;
}

async function fetchAssetDetailsBatch(assetIds) {
  // Use catalog batch details endpoint
  const url = 'https://catalog.roblox.com/v1/catalog/items/details';
  const body = {
    items: assetIds.map(id => ({ itemType: 'Asset', id }))
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'accept': 'application/json'
    },
    credentials: 'omit',
    cache: 'no-cache',
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText} for details -> ${text?.slice(0,200)}`);
  }
  const json = await res.json();
  return json.data || json || [];
}

function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

function renderTable(rows) {
  const header = `
    <table class="table">
      <thead>
        <tr>
          <th>#</th>
          <th>User</th>
          <th>Total RAP (Roblox-made, >= 10k)</th>
          <th class="small">Items</th>
        </tr>
      </thead>
      <tbody>
  `;

  const body = rows.map((r, idx) => {
    const profileUrl = `https://www.roblox.com/users/${r.userId}/profile`;
    return `
      <tr>
        <td>${idx + 1}</td>
        <td><a href="${profileUrl}" target="_blank" rel="noopener">${escapeHtml(r.username || r.displayName || r.userId)}</a></td>
        <td>${formatRobux(r.total)}</td>
        <td class="small">${r.qualifyingCount}</td>
      </tr>
    `;
  }).join('');

  const footer = '</tbody></table>';
  return header + body + footer;
}

function formatRobux(value) {
  if (!value || isNaN(value)) return '0';
  return `${Number(value).toLocaleString()} R$`;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s]));
}