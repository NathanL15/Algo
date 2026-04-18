import { Message, ProblemInfo } from './types';

chrome.runtime.onMessage.addListener((request: Message, _sender, sendResponse) => {
    if (request.action !== 'getProblemInfo') {
        return false;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const [activeTab] = tabs;

        if (!activeTab?.id) {
            sendResponse(null);
            return;
        }

        chrome.tabs.sendMessage(activeTab.id, { action: 'getProblemInfo' }, (response: ProblemInfo | null) => {
            sendResponse(response ?? null);
        });
    });

    return true;
});