# Roblox Rich Player Finder

A Google Chrome extension that helps you find the richest players in Roblox communities based on their limited items worth over 10,000 Robux.

## Features

- 🔍 **Search Communities**: Enter any Roblox community/group link to find rich players
- 💰 **Value Filtering**: Only shows players with limited items worth 10,000+ Robux
- 📊 **Detailed Stats**: View total value, limited count, and top items for each player
- 🔄 **Refresh Results**: Update the list with fresh data
- 💾 **Persistent Storage**: Saves your last search and results
- 🎨 **Modern UI**: Beautiful, responsive design with smooth animations

## Installation

### Method 1: Load as Unpacked Extension (Recommended for Development)

1. **Download the Extension**
   - Clone or download this repository to your computer
   - Extract the files to a folder

2. **Open Chrome Extensions Page**
   - Open Google Chrome
   - Navigate to `chrome://extensions/`
   - Or go to Menu → More Tools → Extensions

3. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner

4. **Load the Extension**
   - Click "Load unpacked"
   - Select the folder containing the extension files
   - The extension should now appear in your extensions list

5. **Pin the Extension** (Optional)
   - Click the puzzle piece icon in Chrome's toolbar
   - Find "Roblox Rich Player Finder" and click the pin icon

### Method 2: Install from Chrome Web Store (When Available)

*Note: This extension is not yet published on the Chrome Web Store*

## Usage

1. **Open the Extension**
   - Click the extension icon in your Chrome toolbar
   - The popup will open with the search interface

2. **Enter Community Link**
   - Paste a Roblox community/group link in the text box
   - Example: `https://www.roblox.com/groups/1234567/My-Group`

3. **Search for Rich Players**
   - Click the "🔍 Search for List" button
   - The extension will analyze the community and find rich players
   - Results will show players with limited items worth 10,000+ Robux

4. **View Results**
   - Each player card shows:
     - Username and profile link
     - Total value of limited items
     - Number of limited items owned
     - Top limited item and its value

5. **Refresh Results**
   - Click the "🔄 Refresh" button to update the list with fresh data

## How It Works

The extension works by:

1. **Extracting Group ID**: Parses the community link to get the group ID
2. **Fetching Members**: Retrieves the list of group members
3. **Analyzing Inventories**: Checks each member's inventory for limited items
4. **Calculating Values**: Determines the total value of limited items worth 10,000+ Robux
5. **Sorting Results**: Displays players sorted by total limited value

## Technical Details

### File Structure
```
roblox-rich-player-finder/
├── manifest.json          # Extension configuration
├── popup.html            # Main popup interface
├── popup.css             # Styling for the popup
├── popup.js              # Popup functionality
├── content.js            # Content script for Roblox pages
├── background.js         # Background service worker
├── icons/                # Extension icons
└── README.md             # This file
```

### Permissions Required
- `activeTab`: To interact with Roblox pages
- `storage`: To save search history and results
- `https://www.roblox.com/*`: To access Roblox websites
- `https://web.roblox.com/*`: To access Roblox web interface

### Browser Compatibility
- Google Chrome 88+
- Microsoft Edge 88+ (Chromium-based)
- Other Chromium-based browsers

## Limitations

⚠️ **Important Notes:**

1. **API Limitations**: This extension currently uses simulated data. To work with real Roblox data, you would need to:
   - Implement proper Roblox API calls
   - Handle rate limiting and authentication
   - Parse inventory data from Roblox's endpoints

2. **Roblox Terms of Service**: Ensure compliance with Roblox's terms of service when implementing real API calls

3. **Performance**: Large communities may take time to analyze due to the number of members

## Development

### Prerequisites
- Google Chrome browser
- Basic knowledge of HTML, CSS, and JavaScript

### Making Changes
1. Edit the source files as needed
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test your changes

### Debugging
- Open Chrome DevTools for the popup by right-clicking the extension icon
- Check the console for any errors
- Use the background page console for debugging background scripts

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

If you encounter any issues or have questions:
1. Check the browser console for error messages
2. Ensure you're using a supported browser version
3. Verify the Roblox community link is valid
4. Try refreshing the extension

## Future Enhancements

- [ ] Real Roblox API integration
- [ ] Export results to CSV/JSON
- [ ] Advanced filtering options
- [ ] Historical data tracking
- [ ] Notifications for new rich players
- [ ] Dark mode support
- [ ] Mobile browser support

---

**Disclaimer**: This extension is for educational purposes. Always respect Roblox's terms of service and user privacy when implementing real functionality.