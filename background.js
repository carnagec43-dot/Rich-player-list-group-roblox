// Background service worker for Roblox Rich Player Finder
chrome.runtime.onInstalled.addListener(() => {
    console.log('Roblox Rich Player Finder extension installed');
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
    // This will open the popup automatically due to manifest configuration
    console.log('Extension icon clicked');
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'log') {
        console.log('Content script log:', request.message);
    }
    return true;
});

// Handle storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        console.log('Storage changed:', changes);
    }
});