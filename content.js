class RobloxRichPlayerFinderContent {
    constructor() {
        this.setupMessageListener();
        this.cache = new Map();
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'searchRichPlayers') {
                this.searchRichPlayers(request.communityUrl)
                    .then(sendResponse)
                    .catch(error => {
                        console.error('Search error:', error);
                        sendResponse({ success: false, error: error.message });
                    });
                return true; // Keep message channel open for async response
            }
            
            if (request.action === 'refreshRichPlayers') {
                this.refreshRichPlayers(request.communityUrl)
                    .then(sendResponse)
                    .catch(error => {
                        console.error('Refresh error:', error);
                        sendResponse({ success: false, error: error.message });
                    });
                return true; // Keep message channel open for async response
            }
        });
    }

    async searchRichPlayers(communityUrl) {
        try {
            const groupId = this.extractGroupId(communityUrl);
            if (!groupId) {
                throw new Error('Invalid community URL');
            }

            const members = await this.getGroupMembers(groupId);
            const richPlayers = await this.filterRichPlayers(members);
            
            return {
                success: true,
                players: richPlayers
            };
        } catch (error) {
            console.error('Search error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async refreshRichPlayers(communityUrl) {
        // Clear cache and search again
        this.cache.clear();
        return this.searchRichPlayers(communityUrl);
    }

    extractGroupId(url) {
        const match = url.match(/\/groups\/(\d+)/);
        return match ? match[1] : null;
    }

    async getGroupMembers(groupId) {
        const cacheKey = `members_${groupId}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const members = [];
        let cursor = '';
        let pageCount = 0;
        const maxPages = 10; // Limit to prevent excessive requests

        try {
            while (pageCount < maxPages) {
                const url = `https://groups.roblox.com/v1/groups/${groupId}/users?limit=100&sortOrder=Asc&cursor=${cursor}`;
                
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch group members: ${response.status}`);
                }

                const data = await response.json();
                
                if (!data.data || data.data.length === 0) {
                    break;
                }

                members.push(...data.data);
                cursor = data.nextPageCursor;
                
                if (!cursor) {
                    break;
                }

                pageCount++;
                
                // Add delay to avoid rate limiting
                await this.delay(1000);
            }

            this.cache.set(cacheKey, members);
            return members;
        } catch (error) {
            console.error('Error fetching group members:', error);
            throw new Error('Failed to fetch group members');
        }
    }

    async filterRichPlayers(members) {
        const richPlayers = [];
        const minValue = 10000; // 10,000 Robux minimum

        for (let i = 0; i < Math.min(members.length, 50); i++) { // Limit to first 50 members for performance
            try {
                const member = members[i];
                const userInventory = await this.getUserInventory(member.user.userId);
                
                if (userInventory.totalValue >= minValue) {
                    richPlayers.push({
                        userId: member.user.userId,
                        username: member.user.username,
                        totalValue: userInventory.totalValue,
                        limitedCount: userInventory.limitedCount,
                        avgValue: userInventory.avgValue
                    });
                }

                // Add delay to avoid rate limiting
                await this.delay(500);
            } catch (error) {
                console.error(`Error processing member ${members[i].user.username}:`, error);
                continue;
            }
        }

        // Sort by total value (highest first)
        return richPlayers.sort((a, b) => b.totalValue - a.totalValue);
    }

    async getUserInventory(userId) {
        const cacheKey = `inventory_${userId}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            // Get user's limited items
            const inventoryUrl = `https://inventory.roblox.com/v1/users/${userId}/items/List/Limited/100`;
            const response = await fetch(inventoryUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch inventory: ${response.status}`);
            }

            const inventoryData = await response.json();
            
            if (!inventoryData.data) {
                const emptyResult = { totalValue: 0, limitedCount: 0, avgValue: 0 };
                this.cache.set(cacheKey, emptyResult);
                return emptyResult;
            }

            let totalValue = 0;
            let valuableLimiteds = 0;

            // Process each limited item
            for (const item of inventoryData.data) {
                if (item.recentAveragePrice && item.recentAveragePrice > 0) {
                    totalValue += item.recentAveragePrice;
                    valuableLimiteds++;
                }
            }

            const avgValue = valuableLimiteds > 0 ? Math.round(totalValue / valuableLimiteds) : 0;
            
            const result = {
                totalValue: Math.round(totalValue),
                limitedCount: valuableLimiteds,
                avgValue: avgValue
            };

            this.cache.set(cacheKey, result);
            return result;

        } catch (error) {
            console.error(`Error fetching inventory for user ${userId}:`, error);
            const emptyResult = { totalValue: 0, limitedCount: 0, avgValue: 0 };
            this.cache.set(cacheKey, emptyResult);
            return emptyResult;
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Alternative method using Roblox's catalog API for more accurate pricing
    async getItemValue(itemId) {
        try {
            const url = `https://economy.roblox.com/v1/assets/${itemId}/details`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                return 0;
            }

            const data = await response.json();
            return data.PriceInRobux || 0;
        } catch (error) {
            console.error(`Error fetching item value for ${itemId}:`, error);
            return 0;
        }
    }
}

// Initialize the content script
new RobloxRichPlayerFinderContent();