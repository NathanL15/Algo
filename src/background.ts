import { Message } from './types';

chrome.runtime.onMessage.addListener((request: Message, sender, sendResponse) => {
    console.log('Background script received message:', request);
    
    if (request.action === 'getProblemInfo') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id) {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'getProblemInfo' }, (response) => {
                    console.log('Received response from content script:', response);
                    sendResponse(response);
                });
            }
        });
        return true; // needed for async sendResponse
    }
});

chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
}); 