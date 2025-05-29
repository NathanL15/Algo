// Import configuration
import config from './config.js';

// DOM Elements
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');

// State
let currentProblemInfo = null;
let retryCount = 0;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Get the current tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab) {
            throw new Error('No active tab found');
        }

        // Check if we're on a LeetCode problem page
        if (!tab.url?.includes('leetcode.com/problems/')) {
            addMessage('Please navigate to a LeetCode problem page to use this extension.', 'bot');
            return;
        }

        // Get problem info from content script
        await getProblemInfo(tab.id);

        // Set up event listeners
        sendButton.addEventListener('click', handleSendMessage);
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            }
        });

        // Auto-resize textarea
        userInput.addEventListener('input', () => {
            userInput.style.height = 'auto';
            userInput.style.height = userInput.scrollHeight + 'px';
        });
    } catch (error) {
        console.error('Initialization error:', error);
        addMessage('Error: Failed to initialize the extension. Please try reloading the page.', 'bot');
    }
});

// Get problem info with retry logic
async function getProblemInfo(tabId) {
    return new Promise((resolve, reject) => {
        const tryGetInfo = () => {
            chrome.tabs.sendMessage(tabId, { action: 'getProblemInfo' }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('Error getting problem info:', chrome.runtime.lastError);
                    if (retryCount < MAX_RETRIES) {
                        retryCount++;
                        console.log(`Retrying... (${retryCount}/${MAX_RETRIES})`);
                        setTimeout(tryGetInfo, RETRY_DELAY);
                    } else {
                        addMessage('Error: Could not access LeetCode page. Please make sure you are on a problem page.', 'bot');
                        reject(chrome.runtime.lastError);
                    }
                    return;
                }
                
                if (response) {
                    currentProblemInfo = response;
                    console.log('Problem info received:', {
                        title: response.title,
                        hasDescription: !!response.description,
                        hasCode: !!response.code
                    });
                    resolve(response);
                } else {
                    console.error('No problem info received');
                    if (retryCount < MAX_RETRIES) {
                        retryCount++;
                        console.log(`Retrying... (${retryCount}/${MAX_RETRIES})`);
                        setTimeout(tryGetInfo, RETRY_DELAY);
                    } else {
                        addMessage('Error: Could not get problem information. Please make sure you are on a LeetCode problem page.', 'bot');
                        reject(new Error('No problem info available'));
                    }
                }
            });
        };

        tryGetInfo();
    });
}

// Handle sending messages
async function handleSendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    // Add user message to chat
    addMessage(message, 'user');
    userInput.value = '';
    userInput.style.height = 'auto';

    // Show loading state
    const loadingMessage = addMessage('Thinking...', 'bot', true);

    try {
        if (!currentProblemInfo) {
            // Try to get problem info again
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab) {
                await getProblemInfo(tab.id);
            }
            
            if (!currentProblemInfo) {
                throw new Error('No problem information available. Please make sure you are on a LeetCode problem page.');
            }
        }

        // Send message to backend
        const response = await sendToBackend(message);
        
        // Update loading message with actual response
        loadingMessage.querySelector('.message-content').textContent = response;
    } catch (error) {
        console.error('Error sending message:', error);
        loadingMessage.querySelector('.message-content').textContent = 
            `Sorry, I encountered an error: ${error.message}. Please try again.`;
    }
}

// Add a message to the chat
function addMessage(content, sender, isLoading = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    messageDiv.innerHTML = `
        <div class="message-content">
            ${content}
        </div>
    `;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return messageDiv;
}

// Send message to backend
async function sendToBackend(message) {
    if (!config.BACKEND_API_ENDPOINT) {
        throw new Error('Backend API endpoint not configured');
    }

    try {
        const response = await fetch(config.BACKEND_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message,
                problemInfo: currentProblemInfo
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.details || 'Failed to get response from backend');
        }

        const data = await response.json();
        return data.hint;
    } catch (error) {
        console.error('Backend error:', error);
        throw new Error('Failed to connect to the backend server. Please make sure it is running.');
    }
} 