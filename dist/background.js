/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background script received message:', request);
    if (request.action === 'getProblemInfo') {
        // Forward the request to the content script
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id) {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'getProblemInfo' }, (response) => {
                    console.log('Received response from content script:', response);
                    sendResponse(response);
                });
            }
        });
        return true; // Keep the message channel open for async response
    }
});
// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
});


/******/ })()
;