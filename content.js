// Create and inject the chat bubble
function createChatBubble() {
    // Check if bubble already exists
    if (document.getElementById('algo-chat-bubble')) {
        return;
    }

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
        console.log('Attempting to get problem info...');
        
        // Check if we're on a LeetCode problem page
        if (!window.location.href.includes('leetcode.com/problems/')) {
            console.log('Not on a LeetCode problem page');
            return null;
        }

        // Wait for the page to be fully loaded
        if (document.readyState !== 'complete') {
            console.log('Page is still loading...');
            return null;
        }

        // Try different selectors for the title
        const titleSelectors = [
            '[data-cy="question-title"]',
            '.mr-2.text-lg',
            'h3[class*="title"]',
            'div[class*="title"]'
        ];

        let title = null;
        for (const selector of titleSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                title = element.textContent.trim();
                console.log('Found title using selector:', selector);
                break;
            }
        }

        if (!title) {
            console.log('Could not find problem title with any selector');
            return null;
        }

        // Try different selectors for the description
        const descriptionSelectors = [
            '[data-cy="question-content"]',
            'div[class*="content"]',
            'div[class*="description"]'
        ];

        let description = null;
        for (const selector of descriptionSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                description = element.textContent.trim();
                console.log('Found description using selector:', selector);
                break;
            }
        }

        // Try different selectors for the code
        const codeSelectors = [
            '.monaco-editor',
            'div[class*="editor"]',
            'div[class*="code"]'
        ];

        let code = null;
        for (const selector of codeSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                code = element.textContent.trim();
                console.log('Found code using selector:', selector);
                break;
            }
        }

        console.log('Problem info retrieved:', {
            title,
            hasDescription: !!description,
            hasCode: !!code
        });

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
    console.log('Received message:', request);
    
    if (request.action === 'getProblemInfo') {
        const info = getProblemInfo();
        console.log('Sending problem info:', info);
        sendResponse(info);
    }
    return true; // Keep the message channel open for async response
});

// Initialize the chat bubble and styles
function initialize() {
    console.log('Initializing content script...');
    
    // Add styles only if they don't exist
    if (!document.getElementById('algo-chat-styles')) {
        const style = document.createElement('style');
        style.id = 'algo-chat-styles';
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
    }

    // Create chat bubble
    createChatBubble();
}

// Initialize when the page is ready
if (document.readyState === 'loading') {
    console.log('Document still loading, waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    console.log('Document already loaded, initializing immediately...');
    initialize();
} 