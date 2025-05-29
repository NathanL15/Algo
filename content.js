// Create and inject the chat bubble
function createChatBubble() {
    const bubble = document.createElement('div');
    bubble.id = 'algo-chat-bubble';
    bubble.innerHTML = `
        <div class="bubble-icon">🤖</div>
    `;
    document.body.appendChild(bubble);

    // Add click handler to open chat
    bubble.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'openChat' });
    });
}

// Get current problem information
function getProblemInfo() {
    try {
        // Wait for the page to be fully loaded
        if (!document.querySelector('[data-cy="question-title"]')) {
            console.log('Waiting for LeetCode page to load...');
            return null;
        }

        const title = document.querySelector('[data-cy="question-title"]')?.textContent?.trim() || '';
        const description = document.querySelector('[data-cy="question-content"]')?.textContent?.trim() || '';
        const code = document.querySelector('.monaco-editor')?.textContent?.trim() || '';

        if (!title) {
            console.log('Could not find problem title');
            return null;
        }

        console.log('Found problem:', title);
        return {
            title,
            description,
            code
        };
    } catch (error) {
        console.error('Error getting problem info:', error);
        return null;
    }
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getProblemInfo') {
        const info = getProblemInfo();
        console.log('Sending problem info:', info);
        sendResponse(info);
    }
    return true; // Keep the message channel open for async response
});

// Initialize the chat bubble when the page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createChatBubble);
} else {
    createChatBubble();
}

// Add styles for the chat bubble
const style = document.createElement('style');
style.textContent = `
    #algo-chat-bubble {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 60px;
        height: 60px;
        background-color: #2563eb;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s;
        z-index: 10000;
    }

    #algo-chat-bubble:hover {
        transform: scale(1.1);
    }

    .bubble-icon {
        font-size: 24px;
    }
`;
document.head.appendChild(style); 