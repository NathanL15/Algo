// Keep track of injected tabs
const injectedTabs = new Set();

// Function to inject content script
async function injectContentScript(tabId) {
    try {
        console.log('Attempting to inject content script into tab:', tabId);
        
        await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content.js']
        });
        
        injectedTabs.add(tabId);
        console.log('Content script successfully injected into tab:', tabId);
    } catch (error) {
        console.error('Failed to inject content script:', error);
        injectedTabs.delete(tabId);
    }
}

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    console.log('Tab updated:', {
        tabId,
        status: changeInfo.status,
        url: tab.url
    });

    // Check if the page is a LeetCode problem page and has finished loading
    if (changeInfo.status === 'complete' && tab.url?.includes('leetcode.com/problems/')) {
        // Only inject if not already injected
        if (!injectedTabs.has(tabId)) {
            injectContentScript(tabId);
        }
    }
});

// Clean up when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
    console.log('Tab closed:', tabId);
    injectedTabs.delete(tabId);
});

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Received message in background:', request);
    
    if (request.action === 'openChat') {
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
    if (changeInfo.status === 'complete') {
        if (tab.url?.includes('leetcode.com/problems/')) {
            console.log('Enabling extension for LeetCode problem page:', tabId);
            chrome.action.enable(tabId);
        } else {
            console.log('Disabling extension for non-LeetCode page:', tabId);
            chrome.action.disable(tabId);
        }
    }
}); 