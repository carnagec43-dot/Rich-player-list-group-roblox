# Roblox Rich Player Finder

A Chrome extension that helps you find the richest players in Roblox communities based on their limited items worth over 10,000 Robux.

## Features

- 🔍 Search for rich players in any Roblox community
- 💰 Filter players by limited items worth 10,000+ Robux
- 📊 Display total value, limited count, and average value
- 🔄 Refresh functionality to get updated data
- 💾 Save and restore previous searches
- 🎨 Modern, user-friendly interface

## Installation

### Method 1: Load as Unpacked Extension (Recommended for Development)

1. Download or clone this repository to your local machine
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the folder containing this extension
5. The extension should now appear in your extensions list

### Method 2: Install from Chrome Web Store (When Available)

1. Visit the Chrome Web Store (link will be provided when published)
2. Click "Add to Chrome"
3. Confirm the installation

## Usage

1. **Navigate to any Roblox page** (required for the extension to work)
2. **Click the extension icon** in your Chrome toolbar
3. **Enter a Roblox community URL** in the format: `https://www.roblox.com/groups/1234567/Group-Name`
4. **Click "Search for List"** to find rich players
5. **Use "Refresh"** to update the data

## How It Works

The extension:
1. Fetches member lists from the specified Roblox community
2. Analyzes each member's inventory for limited items
3. Calculates the total value of limited items worth 10,000+ Robux
4. Displays results sorted by total value (highest first)

## Features Explained

### Rich Player Detection
- Searches through user inventories for limited items
- Only counts items worth 10,000+ Robux
- Calculates total value, item count, and average value per item

### Performance Optimizations
- Caches results to avoid repeated API calls
- Limits searches to first 50 members for performance
- Includes rate limiting to respect Roblox's API limits

### User Interface
- Clean, modern design with gradient backgrounds
- Real-time progress indicators
- Error handling and status messages
- Responsive layout that works on different screen sizes

## Technical Details

### Files Structure
```
├── manifest.json          # Extension configuration
├── popup.html            # Main popup interface
├── popup.css             # Styling for the popup
├── popup.js              # Popup functionality
├── content.js            # Content script for API calls
├── background.js         # Background service worker
├── icons/                # Extension icons
└── README.md            # This file
```

### APIs Used
- Roblox Groups API: `https://groups.roblox.com/v1/groups/{groupId}/users`
- Roblox Inventory API: `https://inventory.roblox.com/v1/users/{userId}/items/List/Limited/100`
- Roblox Economy API: `https://economy.roblox.com/v1/assets/{itemId}/details`

## Privacy & Security

- No personal data is collected or stored
- All data is processed locally in your browser
- No external servers are used
- Respects Roblox's rate limits and terms of service

## Troubleshooting

### Common Issues

1. **"Please navigate to a Roblox page first"**
   - Make sure you're on any Roblox.com page before using the extension

2. **"Failed to fetch group members"**
   - Check if the community URL is correct
   - Ensure the community is public and accessible

3. **"No rich players found"**
   - The community might not have members with valuable limiteds
   - Try a larger or more active community

4. **Extension not working**
   - Refresh the page and try again
   - Check if the extension is enabled in Chrome settings
   - Try disabling and re-enabling the extension

### Performance Notes

- Large communities may take longer to search
- The extension limits searches to prevent excessive API calls
- Results are cached to improve performance on subsequent searches

## Contributing

Feel free to submit issues, feature requests, or pull requests to improve the extension.

## License

This project is open source and available under the MIT License.

## Disclaimer

This extension is not affiliated with Roblox Corporation. Use at your own discretion and in accordance with Roblox's Terms of Service.