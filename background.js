// Background service worker for Roblox Rich Player Finder
// This script runs in the background and handles extension lifecycle events

class BackgroundService {
    constructor() {
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Handle extension installation
        chrome.runtime.onInstalled.addListener((details) => {
            this.handleInstallation(details);
        });

        // Handle extension startup
        chrome.runtime.onStartup.addListener(() => {
            this.handleStartup();
        });

        // Handle messages from popup and content scripts
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true; // Keep the message channel open for async responses
        });
    }

    handleInstallation(details) {
        console.log('Roblox Rich Player Finder extension installed:', details.reason);
        
        if (details.reason === 'install') {
            // First time installation
            this.initializeExtension();
        } else if (details.reason === 'update') {
            // Extension updated
            this.handleUpdate(details.previousVersion);
        }
    }

    handleStartup() {
        console.log('Roblox Rich Player Finder extension started');
        // Any startup tasks can go here
    }

    async handleMessage(request, sender, sendResponse) {
        try {
            switch (request.action) {
                case 'getExtensionInfo':
                    sendResponse({
                        success: true,
                        data: {
                            name: 'Roblox Rich Player Finder',
                            version: '1.0',
                            description: 'Find the richest players in Roblox communities'
                        }
                    });
                    break;

                case 'searchRichPlayers':
                    await this.handleRichPlayerSearch(request, sender, sendResponse);
                    break;

                case 'getStoredData':
                    const data = await chrome.storage.local.get(request.keys);
                    sendResponse({ success: true, data });
                    break;

                case 'storeData':
                    await chrome.storage.local.set(request.data);
                    sendResponse({ success: true });
                    break;

                default:
                    sendResponse({ success: false, error: 'Unknown action' });
            }
        } catch (error) {
            console.error('Background script error:', error);
            sendResponse({ success: false, error: error.message });
        }
    }

    async handleRichPlayerSearch(request, sender, sendResponse) {
        try {
            const { groupId } = request;
            
            // Send message to content script to perform the search
            const tabs = await chrome.tabs.query({ 
                url: ['https://www.roblox.com/*', 'https://web.roblox.com/*'] 
            });

            if (tabs.length === 0) {
                // No Roblox tabs open, create a new one
                const newTab = await chrome.tabs.create({
                    url: `https://www.roblox.com/groups/${groupId}`,
                    active: false
                });

                // Wait for the page to load
                await new Promise(resolve => {
                    chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
                        if (tabId === newTab.id && changeInfo.status === 'complete') {
                            chrome.tabs.onUpdated.removeListener(listener);
                            resolve();
                        }
                    });
                });

                // Send message to the new tab
                const response = await chrome.tabs.sendMessage(newTab.id, {
                    action: 'searchRichPlayers',
                    groupId: groupId
                });

                // Close the tab after getting results
                await chrome.tabs.remove(newTab.id);

                sendResponse(response);
            } else {
                // Use the first available Roblox tab
                const response = await chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'searchRichPlayers',
                    groupId: groupId
                });

                sendResponse(response);
            }
        } catch (error) {
            console.error('Error in rich player search:', error);
            sendResponse({ success: false, error: error.message });
        }
    }

    async initializeExtension() {
        // Set up initial storage
        await chrome.storage.local.set({
            extensionInstalled: true,
            installDate: new Date().toISOString(),
            lastCommunityLink: '',
            lastResults: []
        });

        console.log('Extension initialized successfully');
    }

    handleUpdate(previousVersion) {
        console.log(`Extension updated from version ${previousVersion} to 1.0`);
        // Handle any migration logic here if needed
    }
}

// Initialize the background service
new BackgroundService();