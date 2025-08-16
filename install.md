# Quick Installation Guide

## Step 1: Prepare the Extension

1. Make sure all files are in the same folder:
   - `manifest.json`
   - `popup.html`
   - `popup.css`
   - `popup.js`
   - `content.js`
   - `background.js`
   - `README.md`
   - `icons/` folder (with icon files)

## Step 2: Generate Icons (Optional but Recommended)

The extension will work without icons, but for a complete experience:

1. Use an online SVG to PNG converter (like https://convertio.co/svg-png/)
2. Convert `icons/icon.svg` to the following sizes:
   - 16x16 pixels → save as `icons/icon16.png`
   - 48x48 pixels → save as `icons/icon48.png`
   - 128x128 pixels → save as `icons/icon128.png`

## Step 3: Install in Chrome

1. Open Google Chrome
2. Go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the folder containing all the extension files
6. The extension should now appear in your extensions list

## Step 4: Use the Extension

1. Navigate to any Roblox page (required!)
2. Click the extension icon in your Chrome toolbar
3. Enter a Roblox community URL (e.g., `https://www.roblox.com/groups/1234567/Group-Name`)
4. Click "Search for List" to find rich players
5. Use "Refresh" to update the data

## Troubleshooting

- If the extension doesn't work, make sure you're on a Roblox page
- Check that all files are present in the folder
- Try refreshing the page and the extension
- Ensure the community URL is correct and the group is public

## Note

This extension respects Roblox's rate limits and only searches through the first 50 members of a community for performance reasons. Results are cached to improve speed on subsequent searches.