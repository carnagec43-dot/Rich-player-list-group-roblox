# Roblox Group Richest Finder (Chrome Extension)

- Enter a Roblox community or group link, click "Search for list" to fetch all members and rank them by the sum of RAP for Roblox-created limited items (RAP >= 10,000). Click Refresh to re-run the same search.

## Install (Developer Mode)

1. In Chrome, go to chrome://extensions
2. Enable Developer mode (top right).
3. Click "Load unpacked" and select the `roblox-richest-extension` folder.
4. Pin the extension, open it, paste a community link like `https://www.roblox.com/communities/35461612/Z9-Market#!/about`, and click Search.

## Notes

- RAP is derived from the Roblox collectibles API. Only assets with the creator id of Roblox (1) are counted and only if RAP >= 10,000.
- Large communities/groups may take time due to API pagination and rate limits. The popup shows progress.
- If an inventory is private or API calls fail, that user may show as 0.