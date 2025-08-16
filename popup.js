class RobloxRichPlayerFinder {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.loadStoredData();
    }

    initializeElements() {
        this.communityLinkInput = document.getElementById('communityLink');
        this.searchBtn = document.getElementById('searchBtn');
        this.refreshBtn = document.getElementById('refreshBtn');
        this.statusElement = document.getElementById('status');
        this.progressElement = document.getElementById('progress');
        this.resultsList = document.getElementById('resultsList');
        this.playerCount = document.getElementById('playerCount');
    }

    bindEvents() {
        this.searchBtn.addEventListener('click', () => this.handleSearch());
        this.refreshBtn.addEventListener('click', () => this.handleRefresh());
        this.communityLinkInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });
    }

    async loadStoredData() {
        try {
            const data = await chrome.storage.local.get(['lastCommunityLink', 'lastResults']);
            if (data.lastCommunityLink) {
                this.communityLinkInput.value = data.lastCommunityLink;
            }
            if (data.lastResults) {
                this.displayResults(data.lastResults);
            }
        } catch (error) {
            console.error('Error loading stored data:', error);
        }
    }

    async handleSearch() {
        const communityLink = this.communityLinkInput.value.trim();
        
        if (!communityLink) {
            this.showStatus('Please enter a Roblox community link', 'error');
            return;
        }

        if (!this.isValidRobloxCommunityLink(communityLink)) {
            this.showStatus('Please enter a valid Roblox community link', 'error');
            return;
        }

        this.setLoadingState(true);
        this.showStatus('Searching for rich players...', '');
        this.showProgress(true);

        try {
            // Extract group ID from the link
            const groupId = this.extractGroupId(communityLink);
            if (!groupId) {
                throw new Error('Could not extract group ID from link');
            }

            // Store the community link
            await chrome.storage.local.set({ lastCommunityLink: communityLink });

            // Send message to content script to start searching
            const results = await this.searchRichPlayers(groupId);
            
            // Store results
            await chrome.storage.local.set({ lastResults: results });
            
            this.displayResults(results);
            this.showStatus(`Found ${results.length} rich players!`, 'success');
        } catch (error) {
            console.error('Search error:', error);
            this.showStatus('Error searching for players. Please try again.', 'error');
        } finally {
            this.setLoadingState(false);
            this.showProgress(false);
        }
    }

    async handleRefresh() {
        const communityLink = this.communityLinkInput.value.trim();
        
        if (!communityLink) {
            this.showStatus('Please enter a community link first', 'error');
            return;
        }

        this.setLoadingState(true, 'refresh');
        this.showStatus('Refreshing results...', '');
        this.showProgress(true);

        try {
            const groupId = this.extractGroupId(communityLink);
            const results = await this.searchRichPlayers(groupId);
            
            await chrome.storage.local.set({ lastResults: results });
            this.displayResults(results);
            this.showStatus(`Refreshed! Found ${results.length} rich players`, 'success');
        } catch (error) {
            console.error('Refresh error:', error);
            this.showStatus('Error refreshing results. Please try again.', 'error');
        } finally {
            this.setLoadingState(false, 'refresh');
            this.showProgress(false);
        }
    }

    async searchRichPlayers(groupId) {
        // This is a simulation since we can't directly access Roblox's API
        // In a real implementation, you would need to:
        // 1. Use Roblox's API to get group members
        // 2. Check each member's inventory for limited items
        // 3. Calculate the total value of limiteds worth 10,000+ Robux
        
        return new Promise((resolve) => {
            setTimeout(() => {
                // Simulated results - replace with actual API calls
                const mockResults = this.generateMockResults(groupId);
                resolve(mockResults);
            }, 3000); // Simulate API delay
        });
    }

    generateMockResults(groupId) {
        const mockPlayers = [
            {
                username: 'RichPlayer123',
                displayName: 'RichPlayer123',
                userId: 123456789,
                avatarUrl: null,
                totalValue: 2500000,
                limitedCount: 15,
                topLimited: 'Dominus Empyreus',
                topLimitedValue: 500000
            },
            {
                username: 'WealthyTrader',
                displayName: 'WealthyTrader',
                userId: 987654321,
                avatarUrl: null,
                totalValue: 1800000,
                limitedCount: 12,
                topLimited: 'Sparkle Time Fedora',
                topLimitedValue: 300000
            },
            {
                username: 'LimitedCollector',
                displayName: 'LimitedCollector',
                userId: 456789123,
                avatarUrl: null,
                totalValue: 1200000,
                limitedCount: 8,
                topLimited: 'Dominus Aureus',
                topLimitedValue: 200000
            },
            {
                username: 'RobuxMillionaire',
                displayName: 'RobuxMillionaire',
                userId: 789123456,
                avatarUrl: null,
                totalValue: 950000,
                limitedCount: 6,
                topLimited: 'Dominus Frigidus',
                topLimitedValue: 150000
            },
            {
                username: 'EliteTrader',
                displayName: 'EliteTrader',
                userId: 321654987,
                avatarUrl: null,
                totalValue: 750000,
                limitedCount: 5,
                topLimited: 'Dominus Vespertilio',
                topLimitedValue: 120000
            }
        ];

        return mockPlayers.sort((a, b) => b.totalValue - a.totalValue);
    }

    displayResults(results) {
        if (!results || results.length === 0) {
            this.resultsList.innerHTML = `
                <div class="empty-state">
                    <p>No rich players found in this community</p>
                </div>
            `;
            this.playerCount.textContent = '0 players';
            return;
        }

        this.playerCount.textContent = `${results.length} players`;
        
        const resultsHTML = results.map(player => `
            <div class="player-card">
                <div class="player-header">
                    <div class="player-avatar">
                        ${player.avatarUrl ? 
                            `<img src="${player.avatarUrl}" alt="${player.displayName}" style="width: 100%; height: 100%; border-radius: 50%;">` :
                            player.displayName.charAt(0).toUpperCase()
                        }
                    </div>
                    <a href="https://www.roblox.com/user/${player.userId}/profile" 
                       target="_blank" 
                       class="player-name">
                        ${player.displayName}
                    </a>
                </div>
                <div class="player-stats">
                    <div class="stat-item">
                        💰 Total Value: <span class="stat-value">${this.formatRobux(player.totalValue)}</span>
                    </div>
                    <div class="stat-item">
                        🎯 Limiteds: <span class="stat-value">${player.limitedCount}</span>
                    </div>
                    <div class="stat-item">
                        👑 Top Item: <span class="stat-value">${player.topLimited}</span>
                    </div>
                </div>
            </div>
        `).join('');

        this.resultsList.innerHTML = resultsHTML;
    }

    formatRobux(amount) {
        if (amount >= 1000000) {
            return `${(amount / 1000000).toFixed(1)}M`;
        } else if (amount >= 1000) {
            return `${(amount / 1000).toFixed(1)}K`;
        }
        return amount.toString();
    }

    isValidRobloxCommunityLink(link) {
        const robloxGroupPattern = /^https?:\/\/(www\.)?roblox\.com\/groups\/\d+/i;
        return robloxGroupPattern.test(link);
    }

    extractGroupId(link) {
        const match = link.match(/\/groups\/(\d+)/);
        return match ? match[1] : null;
    }

    setLoadingState(isLoading, buttonType = 'search') {
        const button = buttonType === 'search' ? this.searchBtn : this.refreshBtn;
        const textElement = button.querySelector('.btn-text');
        const loadingElement = button.querySelector('.btn-loading');

        if (isLoading) {
            button.disabled = true;
            textElement.style.display = 'none';
            loadingElement.style.display = 'inline';
        } else {
            button.disabled = false;
            textElement.style.display = 'inline';
            loadingElement.style.display = 'none';
        }
    }

    showStatus(message, type = '') {
        this.statusElement.textContent = message;
        this.statusElement.className = `status-message ${type}`;
    }

    showProgress(show) {
        this.progressElement.style.display = show ? 'block' : 'none';
    }
}

// Initialize the extension when the popup loads
document.addEventListener('DOMContentLoaded', () => {
    new RobloxRichPlayerFinder();
});