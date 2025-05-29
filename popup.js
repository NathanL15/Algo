// DOM Elements
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');

// State
let currentProblemInfo = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Get the current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Get problem info from content script
    chrome.tabs.sendMessage(tab.id, { action: 'getProblemInfo' }, (response) => {
        if (response) {
            currentProblemInfo = response;
        }
    });

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
});

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
        // Send message to backend
        const response = await sendToBackend(message);
        
        // Update loading message with actual response
        loadingMessage.querySelector('.message-content').textContent = response;
    } catch (error) {
        loadingMessage.querySelector('.message-content').textContent = 
            'Sorry, I encountered an error. Please try again.';
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
    // TODO: Replace with actual backend API endpoint
    const API_ENDPOINT = 'YOUR_BACKEND_API_ENDPOINT';

    const response = await fetch(API_ENDPOINT, {
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
        throw new Error('Failed to get response from backend');
    }

    const data = await response.json();
    return data.hint;
} 