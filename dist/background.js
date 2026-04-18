/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action !== 'getProblemInfo') {
        return false;
    }
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const [activeTab] = tabs;
        if (!activeTab?.id) {
            sendResponse(null);
            return;
        }
        chrome.tabs.sendMessage(activeTab.id, { action: 'getProblemInfo' }, (response) => {
            sendResponse(response ?? null);
        });
    });
    return true;
});


/******/ })()
;