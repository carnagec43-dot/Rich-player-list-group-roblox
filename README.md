# Roblox Community Rich Player Finder

A Chrome extension that analyzes Roblox communities to find the richest players based on their valuable limiteds (items worth 10,000+ Robux).

## Features

- 🔍 **Smart URL Parsing**: Supports various Roblox group URL formats
- 💎 **Limited Analysis**: Identifies players with valuable limited items (10k+ Robux)
- 📊 **Rich List**: Displays players sorted by total limited value
- 🔄 **Refresh Function**: Update results with latest data
- 💾 **Data Persistence**: Saves results between sessions
- 🎨 **Modern UI**: Beautiful gradient design with smooth animations

## Installation

1. **Download the Extension**
   - Download or clone all files to a folder on your computer

2. **Open Chrome Extensions**
   - Open Google Chrome
   - Go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)

3. **Load the Extension**
   - Click "Load unpacked"
   - Select the folder containing the extension files
   - The extension should now appear in your extensions list

4. **Pin the Extension**
   - Click the extensions icon (puzzle piece) in Chrome toolbar
   - Find "Roblox Community Rich Player Finder"
   - Click the pin icon to keep it visible

## Usage

1. **Get a Roblox Group URL**
   - Go to any Roblox group page
   - Copy the URL (e.g., `https://www.roblox.com/groups/123456/group-name`)

2. **Search for Rich Players**
   - Click the extension icon in your Chrome toolbar
   - Paste the group URL in the text box
   - Click "Search for List"
   - Wait for the analysis to complete

3. **View Results**
   - Players are listed from richest to poorest
   - Click on any player to open their Roblox profile
   - See their total limited value and item count

4. **Refresh Results**
   - Click "Refresh" to update the data
   - Results are automatically saved between sessions

## Supported URL Formats

- `https://www.roblox.com/groups/123456/group-name`
- `https://www.roblox.com/groups/configure?id=123456`
- `https://www.roblox.com/My/Groups.aspx?gid=123456`
- Just the group ID: `123456`

## How It Works

1. **Extracts Group ID**: Parses the Roblox group URL to get the group ID
2. **Fetches Members**: Uses Roblox API to get group members (limited to 100 for performance)
3. **Analyzes Limiteds**: For each member, checks their collectible inventory
4. **Calculates Value**: Identifies limited items and their current market values
5. **Filters Results**: Only shows players with 10k+ Robux in valuable limiteds
6. **Sorts by Wealth**: Orders players from richest to poorest

## Technical Details

- **Manifest Version**: 3 (latest Chrome extension format)
- **Permissions**: Access to Roblox domains for API calls
- **Rate Limiting**: Includes delays to respect Roblox API limits
- **Error Handling**: Graceful handling of API failures and network issues
- **Storage**: Uses Chrome's local storage for persistence

## Limitations

- Analyzes up to 100 group members (to prevent excessive API calls)
- Only counts limiteds worth 10,000+ Robux
- Depends on Roblox API availability
- Market values may not be 100% accurate due to API limitations

## Troubleshooting

**Extension not loading?**
- Make sure all files are in the same folder
- Check that Developer mode is enabled
- Try refreshing the extensions page

**No results found?**
- Verify the group URL is correct
- Check if the group has members
- Some groups may have privacy settings that prevent access

**Slow performance?**
- Large groups may take time to analyze
- Each member's inventory must be checked individually
- The extension includes delays to respect rate limits

## Privacy & Security

- No personal data is collected or transmitted
- All data stays local on your device
- Only communicates with official Roblox APIs
- No tracking or analytics

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your internet connection
3. Try with a different Roblox group
4. Reload the extension in Chrome's extension manager

---

**Disclaimer**: This extension is not affiliated with Roblox Corporation. Use responsibly and respect Roblox's terms of service.