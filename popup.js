class RobloxRichPlayerFinder {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.loadSavedData();
    }

    initializeElements() {
        this.communityUrlInput = document.getElementById('communityUrl');
        this.searchBtn = document.getElementById('searchBtn');
        this.refreshBtn = document.getElementById('refreshBtn');
        this.statusDiv = document.getElementById('status');
        this.progressBar = document.getElementById('progress');
        this.resultsList = document.getElementById('resultsList');
        this.playerCount = document.getElementById('playerCount');
    }

    bindEvents() {
        this.searchBtn.addEventListener('click', () => this.handleSearch());
        this.refreshBtn.addEventListener('click', () => this.handleRefresh());
        this.communityUrlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch();
            }
        });
    }

    async loadSavedData() {
        try {
            const data = await chrome.storage.local.get(['lastCommunityUrl', 'lastResults']);
            if (data.lastCommunityUrl) {
                this.communityUrlInput.value = data.lastCommunityUrl;
            }
            if (data.lastResults) {
                this.displayResults(data.lastResults);
            }
        } catch (error) {
            console.error('Error loading saved data:', error);
        }
    }

    async handleSearch() {
        const communityUrl = this.communityUrlInput.value.trim();
        
        if (!communityUrl) {
            this.showStatus('Please enter a Roblox community URL', 'error');
            return;
        }

        if (!this.isValidRobloxCommunityUrl(communityUrl)) {
            this.showStatus('Please enter a valid Roblox community URL', 'error');
            return;
        }

        this.setLoadingState(true);
        this.showStatus('Searching for rich players...', 'info');
        this.showProgress();

        try {
            // Save the URL
            await chrome.storage.local.set({ lastCommunityUrl: communityUrl });

            // Send message to content script to start search
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab.url.includes('roblox.com')) {
                this.showStatus('Please navigate to a Roblox page first', 'error');
                this.setLoadingState(false);
                this.hideProgress();
                return;
            }

            const response = await chrome.tabs.sendMessage(tab.id, {
                action: 'searchRichPlayers',
                communityUrl: communityUrl
            });

            if (response.success) {
                this.showStatus(`Found ${response.players.length} rich players!`, 'success');
                this.displayResults(response.players);
                await chrome.storage.local.set({ lastResults: response.players });
            } else {
                this.showStatus(response.error || 'Failed to search for players', 'error');
            }
        } catch (error) {
            console.error('Search error:', error);
            this.showStatus('Error occurred while searching. Please try again.', 'error');
        } finally {
            this.setLoadingState(false);
            this.hideProgress();
        }
    }

    async handleRefresh() {
        const communityUrl = this.communityUrlInput.value.trim();
        
        if (!communityUrl) {
            this.showStatus('No community URL to refresh', 'error');
            return;
        }

        this.setLoadingState(true, 'refresh');
        this.showStatus('Refreshing player list...', 'info');
        this.showProgress();

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab.url.includes('roblox.com')) {
                this.showStatus('Please navigate to a Roblox page first', 'error');
                this.setLoadingState(false);
                this.hideProgress();
                return;
            }

            const response = await chrome.tabs.sendMessage(tab.id, {
                action: 'refreshRichPlayers',
                communityUrl: communityUrl
            });

            if (response.success) {
                this.showStatus(`Refreshed! Found ${response.players.length} rich players`, 'success');
                this.displayResults(response.players);
                await chrome.storage.local.set({ lastResults: response.players });
            } else {
                this.showStatus(response.error || 'Failed to refresh players', 'error');
            }
        } catch (error) {
            console.error('Refresh error:', error);
            this.showStatus('Error occurred while refreshing. Please try again.', 'error');
        } finally {
            this.setLoadingState(false);
            this.hideProgress();
        }
    }

    isValidRobloxCommunityUrl(url) {
        const robloxCommunityPattern = /^https?:\/\/(www\.)?roblox\.com\/groups\/\d+/i;
        return robloxCommunityPattern.test(url);
    }

    setLoadingState(isLoading, buttonType = 'search') {
        const button = buttonType === 'refresh' ? this.refreshBtn : this.searchBtn;
        const otherButton = buttonType === 'refresh' ? this.searchBtn : this.refreshBtn;
        
        if (isLoading) {
            button.classList.add('loading');
            button.disabled = true;
            otherButton.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
            otherButton.disabled = false;
        }
    }

    showStatus(message, type = 'info') {
        this.statusDiv.textContent = message;
        this.statusDiv.className = `status-message ${type}`;
    }

    showProgress() {
        this.progressBar.style.display = 'block';
        const progressFill = this.progressBar.querySelector('.progress-fill');
        progressFill.style.width = '100%';
    }

    hideProgress() {
        this.progressBar.style.display = 'none';
        const progressFill = this.progressBar.querySelector('.progress-fill');
        progressFill.style.width = '0%';
    }

    displayResults(players) {
        if (!players || players.length === 0) {
            this.resultsList.innerHTML = `
                <div class="empty-state">
                    <p>No rich players found in this community</p>
                </div>
            `;
            this.playerCount.textContent = '0 players';
            return;
        }

        this.playerCount.textContent = `${players.length} player${players.length !== 1 ? 's' : ''}`;

        const playersHtml = players.map(player => `
            <div class="player-card">
                <div class="player-header">
                    <div class="player-avatar">
                        ${player.username.charAt(0).toUpperCase()}
                    </div>
                    <div class="player-info">
                        <h4>${player.username}</h4>
                        <a href="https://www.roblox.com/user/${player.userId}/profile" target="_blank">
                            View Profile
                        </a>
                    </div>
                </div>
                <div class="player-stats">
                    <div class="stat-item">
                        <div class="stat-value">${this.formatNumber(player.totalValue)}</div>
                        <div class="stat-label">Total Value</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${player.limitedCount}</div>
                        <div class="stat-label">Limiteds</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${this.formatNumber(player.avgValue)}</div>
                        <div class="stat-label">Avg Value</div>
                    </div>
                </div>
            </div>
        `).join('');

        this.resultsList.innerHTML = playersHtml;
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }
}

// Initialize the extension when the popup loads
document.addEventListener('DOMContentLoaded', () => {
    new RobloxRichPlayerFinder();
});