// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'openChat') {
        // Open the popup
        chrome.windows.create({
            url: 'popup.html',
            type: 'popup',
            width: 400,
            height: 600
        });
    }
});

// Check if we're on a LeetCode problem page
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url?.includes('leetcode.com/problems/')) {
        // Enable the extension icon
        chrome.action.enable(tabId);
    } else {
        // Disable the extension icon
        chrome.action.disable(tabId);
    }
}); 