// DOM Elements
const communityUrlInput = document.getElementById('communityUrl');
const searchBtn = document.getElementById('searchBtn');
const refreshBtn = document.getElementById('refreshBtn');
const statusMessage = document.getElementById('statusMessage');
const loadingSpinner = document.getElementById('loadingSpinner');
const playersList = document.getElementById('playersList');

// State
let currentGroupId = null;
let currentResults = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadSavedData();
    attachEventListeners();
});

function attachEventListeners() {
    searchBtn.addEventListener('click', handleSearch);
    refreshBtn.addEventListener('click', handleRefresh);
    
    // Allow Enter key to trigger search
    communityUrlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
}

// Parse Roblox group URL to extract group ID
function parseGroupUrl(url) {
    try {
        // Handle various Roblox group URL formats
        const patterns = [
            /roblox\.com\/groups\/(\d+)/,
            /roblox\.com\/groups\/configure\?id=(\d+)/,
            /roblox\.com\/My\/Groups\.aspx\?gid=(\d+)/
        ];
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
                return parseInt(match[1]);
            }
        }
        
        // If it's just a number, assume it's a group ID
        if (/^\d+$/.test(url.trim())) {
            return parseInt(url.trim());
        }
        
        return null;
    } catch (error) {
        console.error('Error parsing group URL:', error);
        return null;
    }
}

// Show status message
function showStatus(message, type = 'info') {
    statusMessage.textContent = message;
    statusMessage.className = `status-${type}`;
    statusMessage.style.display = 'block';
}

// Hide status message
function hideStatus() {
    statusMessage.style.display = 'none';
}

// Show/hide loading spinner
function setLoading(isLoading) {
    if (isLoading) {
        loadingSpinner.classList.remove('hidden');
        searchBtn.disabled = true;
        refreshBtn.disabled = true;
    } else {
        loadingSpinner.classList.add('hidden');
        searchBtn.disabled = false;
        refreshBtn.disabled = false;
    }
}

// Fetch group members with pagination
async function fetchGroupMembers(groupId) {
    const members = [];
    let cursor = '';
    let totalFetched = 0;
    const maxMembers = 100; // Limit to prevent excessive API calls
    
    try {
        do {
            const url = `https://groups.roblox.com/v1/groups/${groupId}/users?sortOrder=Asc&limit=100${cursor ? `&cursor=${cursor}` : ''}`;
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch group members: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.data && data.data.length > 0) {
                members.push(...data.data);
                totalFetched += data.data.length;
                cursor = data.nextPageCursor;
                
                showStatus(`Fetched ${totalFetched} members...`, 'info');
                
                // Limit the number of members to analyze
                if (totalFetched >= maxMembers) {
                    break;
                }
            } else {
                break;
            }
            
            // Small delay to respect rate limits
            await new Promise(resolve => setTimeout(resolve, 100));
            
        } while (cursor && totalFetched < maxMembers);
        
        return members;
    } catch (error) {
        console.error('Error fetching group members:', error);
        throw error;
    }
}

// Fetch user's limiteds and calculate total value
async function analyzeUserLimiteds(userId) {
    try {
        // Fetch user's collectibles (limiteds)
        const response = await fetch(
            `https://inventory.roblox.com/v1/users/${userId}/assets/collectibles?sortOrder=Asc&limit=100`
        );
        
        if (!response.ok) {
            return { totalValue: 0, limitedCount: 0, limiteds: [] };
        }
        
        const data = await response.json();
        
        if (!data.data || data.data.length === 0) {
            return { totalValue: 0, limitedCount: 0, limiteds: [] };
        }
        
        let totalValue = 0;
        const valuableLimiteds = [];
        
        // Analyze each limited item
        for (const item of data.data) {
            try {
                // Get item details and current market price
                const itemResponse = await fetch(
                    `https://economy.roblox.com/v2/assets/${item.assetId}/details`
                );
                
                if (itemResponse.ok) {
                    const itemData = await itemResponse.json();
                    
                    // Check if it's a limited item and get its value
                    if (itemData.IsLimited || itemData.IsLimitedUnique) {
                        // Try to get recent sale price or use suggested price
                        let itemValue = 0;
                        
                        if (itemData.PriceInRobux) {
                            itemValue = itemData.PriceInRobux;
                        } else if (itemData.SalePrice) {
                            itemValue = itemData.SalePrice;
                        }
                        
                        // Only count items worth 10k+ Robux
                        if (itemValue >= 10000) {
                            totalValue += itemValue;
                            valuableLimiteds.push({
                                name: itemData.Name,
                                value: itemValue,
                                assetId: item.assetId
                            });
                        }
                    }
                }
                
                // Small delay to respect rate limits
                await new Promise(resolve => setTimeout(resolve, 50));
                
            } catch (itemError) {
                console.warn(`Error analyzing item ${item.assetId}:`, itemError);
            }
        }
        
        return {
            totalValue,
            limitedCount: valuableLimiteds.length,
            limiteds: valuableLimiteds
        };
        
    } catch (error) {
        console.error(`Error analyzing limiteds for user ${userId}:`, error);
        return { totalValue: 0, limitedCount: 0, limiteds: [] };
    }
}

// Main search function
async function handleSearch() {
    const url = communityUrlInput.value.trim();
    
    if (!url) {
        showStatus('Please enter a Roblox community URL', 'error');
        return;
    }
    
    const groupId = parseGroupUrl(url);
    
    if (!groupId) {
        showStatus('Invalid Roblox group URL. Please check the format.', 'error');
        return;
    }
    
    currentGroupId = groupId;
    setLoading(true);
    hideStatus();
    
    try {
        showStatus('Fetching group members...', 'info');
        const members = await fetchGroupMembers(groupId);
        
        if (members.length === 0) {
            showStatus('No members found in this group', 'error');
            setLoading(false);
            return;
        }
        
        showStatus(`Analyzing ${members.length} members for valuable limiteds...`, 'info');
        
        const richPlayers = [];
        let analyzed = 0;
        
        // Analyze each member's limiteds
        for (const member of members) {
            try {
                const limitedsData = await analyzeUserLimiteds(member.user.userId);
                analyzed++;
                
                showStatus(`Analyzed ${analyzed}/${members.length} players...`, 'info');
                
                if (limitedsData.totalValue >= 10000) {
                    richPlayers.push({
                        userId: member.user.userId,
                        username: member.user.username,
                        displayName: member.user.displayName,
                        totalValue: limitedsData.totalValue,
                        limitedCount: limitedsData.limitedCount,
                        limiteds: limitedsData.limiteds
                    });
                }
                
                // Small delay between users
                await new Promise(resolve => setTimeout(resolve, 200));
                
            } catch (error) {
                console.warn(`Error analyzing member ${member.user.username}:`, error);
            }
        }
        
        // Sort by total value (richest first)
        richPlayers.sort((a, b) => b.totalValue - a.totalValue);
        
        currentResults = richPlayers;
        displayResults(richPlayers);
        saveData();
        
        if (richPlayers.length === 0) {
            showStatus('No players found with 10k+ Robux in limiteds', 'info');
        } else {
            showStatus(`Found ${richPlayers.length} rich players!`, 'success');
        }
        
    } catch (error) {
        console.error('Search error:', error);
        showStatus(`Error: ${error.message}`, 'error');
    } finally {
        setLoading(false);
    }
}

// Handle refresh button
async function handleRefresh() {
    if (!currentGroupId) {
        showStatus('Please search for a group first', 'error');
        return;
    }
    
    await handleSearch();
}

// Display results in the UI
function displayResults(players) {
    playersList.innerHTML = '';
    
    if (players.length === 0) {
        playersList.innerHTML = '<div class="empty-state">No rich players found</div>';
        return;
    }
    
    players.forEach((player, index) => {
        const playerElement = document.createElement('div');
        playerElement.className = 'player-item';
        
        const limitedsList = player.limiteds.slice(0, 3).map(limited => 
            `${limited.name} (${formatRobux(limited.value)})`
        ).join(', ');
        
        const moreText = player.limiteds.length > 3 ? ` +${player.limiteds.length - 3} more` : '';
        
        playerElement.innerHTML = `
            <div class="player-name">#${index + 1} ${player.displayName || player.username}</div>
            <div class="player-value">Total Value: ${formatRobux(player.totalValue)}</div>
            <div class="player-limiteds">${player.limitedCount} valuable limiteds${limitedsList ? ': ' + limitedsList + moreText : ''}</div>
        `;
        
        // Add click handler to open Roblox profile
        playerElement.addEventListener('click', () => {
            window.open(`https://www.roblox.com/users/${player.userId}/profile`, '_blank');
        });
        
        playerElement.style.cursor = 'pointer';
        playersList.appendChild(playerElement);
    });
}

// Format Robux values
function formatRobux(value) {
    if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M R$`;
    } else if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K R$`;
    } else {
        return `${value} R$`;
    }
}

// Save data to Chrome storage
function saveData() {
    const data = {
        currentGroupId,
        currentResults,
        lastUrl: communityUrlInput.value
    };
    
    chrome.storage.local.set({ richPlayerData: data }, () => {
        console.log('Data saved');
    });
}

// Load saved data from Chrome storage
function loadSavedData() {
    chrome.storage.local.get(['richPlayerData'], (result) => {
        if (result.richPlayerData) {
            const data = result.richPlayerData;
            currentGroupId = data.currentGroupId;
            currentResults = data.currentResults || [];
            
            if (data.lastUrl) {
                communityUrlInput.value = data.lastUrl;
            }
            
            if (currentResults.length > 0) {
                displayResults(currentResults);
                showStatus(`Loaded ${currentResults.length} cached results`, 'success');
            }
        }
    });
}