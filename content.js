// Only inject once
if (!window.__algoChatInjected) {
    window.__algoChatInjected = true;

    // Create floating button
    const button = document.createElement('div');
    button.id = 'algo-chat-fab';
    button.innerHTML = '<span>💬</span>';
    document.body.appendChild(button);

    // Create chat container (hidden by default)
    const chat = document.createElement('div');
    chat.id = 'algo-chat-dropdown';
    chat.innerHTML = `
        <div class="algo-chat-header">
            <span>Algo! Assistant</span>
            <button id="algo-chat-close">&times;</button>
        </div>
        <div class="algo-chat-messages"></div>
        <div class="algo-chat-input">
            <textarea placeholder="Ask for a hint..."></textarea>
            <button>Send</button>
        </div>
    `;
    chat.style.display = 'none';
    document.body.appendChild(chat);

    // Show chat on button click
    button.onclick = () => {
        chat.style.display = 'flex';
        button.style.display = 'none';
    };

    // Hide chat on close
    chat.querySelector('#algo-chat-close').onclick = () => {
        chat.style.display = 'none';
        button.style.display = 'flex';
    };

    // Send message
    const sendBtn = chat.querySelector('.algo-chat-input button');
    const input = chat.querySelector('.algo-chat-input textarea');
    const messages = chat.querySelector('.algo-chat-messages');
    sendBtn.onclick = async () => {
        const msg = input.value.trim();
        if (!msg) return;
        addMessage('user', msg);
        input.value = '';
        // Fetch hint from backend (replace with your endpoint)
        try {
            const res = await fetch('https://algo-de3g.onrender.com/api/hints', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: msg, problemInfo: getProblemInfo() })
            });
            const data = await res.json();
            addMessage('assistant', data.hint || 'No hint received.');
        } catch (e) {
            addMessage('assistant', 'Error getting hint.');
        }
    };
    input.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendBtn.click();
        }
    });

    function addMessage(role, text) {
        const div = document.createElement('div');
        div.className = 'algo-message ' + role;
        div.textContent = text;
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
    }

    function getProblemInfo() {
        try {
            console.log('Attempting to get problem info...');
            
            // Check if we're on a LeetCode problem page
            if (!window.location.href.includes('leetcode.com/problems/')) {
                console.log('Not on a LeetCode problem page');
                return null;
            }

            // Get problem URL
            const url = window.location.href;

            // Get problem title - try multiple selectors
            const titleSelectors = [
                '[data-cy="question-title"]',
                'div[class*="title"]',
                'h3[class*="title"]',
                'div[class*="question-title"]'
            ];
            let title = '';
            for (const selector of titleSelectors) {
                const element = document.querySelector(selector);
                if (element) {
                    title = element.textContent.trim();
                    console.log('Found title using selector:', selector);
                    break;
                }
            }

            // Get problem description - try multiple selectors
            const descriptionSelectors = [
                '[data-cy="question-content"]',
                'div[class*="content"]',
                'div[class*="description"]',
                'div[class*="question-content"]'
            ];
            let description = '';
            for (const selector of descriptionSelectors) {
                const element = document.querySelector(selector);
                if (element) {
                    description = element.textContent.trim();
                    console.log('Found description using selector:', selector);
                    break;
                }
            }

            // Get current code - try multiple methods
            let code = '';
            
            // Method 1: Try to get code using Monaco editor API
            try {
                if (window.monaco && window.monaco.editor) {
                    const models = window.monaco.editor.getModels();
                    if (models && models.length > 0) {
                        code = models[0].getValue();
                        console.log('Found code using Monaco editor API');
                    }
                }
            } catch (error) {
                console.log('Error accessing Monaco editor API:', error);
            }

            // Method 2: Try to get code from Monaco editor's view-lines (fallback)
            if (!code) {
                const monacoEditor = document.querySelector('.monaco-editor');
                if (monacoEditor) {
                    const viewLines = monacoEditor.querySelectorAll('.view-line');
                    if (viewLines.length > 0) {
                        code = Array.from(viewLines)
                            .map(line => {
                                const spans = line.querySelectorAll('span');
                                return Array.from(spans)
                                    .map(span => span.textContent)
                                    .join('');
                            })
                            .join('\n');
                        console.log('Found code using Monaco view-lines (fallback)');
                    }
                }
            }

            // Method 3: Try to get code from editor container (last resort)
            if (!code) {
                const editorContainer = document.querySelector('.editor-container');
                if (editorContainer) {
                    const codeLines = editorContainer.querySelectorAll('.view-line');
                    if (codeLines.length > 0) {
                        code = Array.from(codeLines)
                            .map(line => {
                                const spans = line.querySelectorAll('span');
                                return Array.from(spans)
                                    .map(span => span.textContent)
                                    .join('');
                            })
                            .join('\n');
                        console.log('Found code using editor container (last resort)');
                    }
                }
            }

            // Log the code-related elements for debugging
            console.log('Code-related elements found:', {
                hasMonacoAPI: !!(window.monaco && window.monaco.editor),
                monacoModels: window.monaco?.editor?.getModels()?.length || 0,
                monacoEditor: !!document.querySelector('.monaco-editor'),
                viewLines: document.querySelectorAll('.view-line').length,
                extractedCode: code
            });

            // Get programming language - try multiple selectors
            const languageSelectors = [
                '.select-dropdown',
                'div[class*="language-select"]',
                'div[class*="language"]',
                'select[class*="language"]'
            ];
            let language = '';
            for (const selector of languageSelectors) {
                const element = document.querySelector(selector);
                if (element) {
                    language = element.textContent.trim();
                    console.log('Found language using selector:', selector);
                    break;
                }
            }

            // Get test cases passed - try multiple selectors
            const testCasesSelectors = [
                '[data-cy="test-cases-passed"]',
                'div[class*="test-cases"]',
                'div[class*="passed"]',
                'div[class*="status"]'
            ];
            let testCasesPassed = '';
            for (const selector of testCasesSelectors) {
                const element = document.querySelector(selector);
                if (element) {
                    testCasesPassed = element.textContent.trim();
                    console.log('Found test cases using selector:', selector);
                    break;
                }
            }

            // Get difficulty level - try multiple selectors
            const difficultySelectors = [
                '[diff]',
                'div[class*="difficulty"]',
                'span[class*="difficulty"]',
                'div[class*="level"]'
            ];
            let difficulty = '';
            for (const selector of difficultySelectors) {
                const element = document.querySelector(selector);
                if (element) {
                    difficulty = element.textContent.trim();
                    console.log('Found difficulty using selector:', selector);
                    break;
                }
            }

            // Get problem tags/categories - try multiple selectors
            const tagSelectors = [
                '.tag__2PqS',
                'div[class*="tag"]',
                'span[class*="tag"]',
                'div[class*="category"]'
            ];
            const tags = [];
            for (const selector of tagSelectors) {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                    elements.forEach(tag => tags.push(tag.textContent.trim()));
                    console.log('Found tags using selector:', selector);
                    break;
                }
            }

            // Log the DOM structure for debugging
            console.log('Current DOM structure:', {
                titleElement: document.querySelector('[data-cy="question-title"]')?.outerHTML,
                descriptionElement: document.querySelector('[data-cy="question-content"]')?.outerHTML,
                codeElement: document.querySelector('.monaco-editor')?.outerHTML,
                languageElement: document.querySelector('.select-dropdown')?.outerHTML
            });

            console.log('Problem info retrieved:', {
                title,
                hasDescription: !!description,
                hasCode: !!code,
                language,
                testCasesPassed,
                difficulty,
                tags
            });

            return {
                url,
                title,
                description,
                code,
                language,
                testCasesPassed,
                difficulty,
                tags
            };
        } catch (error) {
            console.error('Error getting problem info:', error);
            return null;
        }
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
            #algo-chat-fab {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 60px;
                height: 60px;
                background-color: #2D3748;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                transition: all 0.2s ease;
                z-index: 10000;
                border: 2px solid #4FD1C5;
            }

            #algo-chat-fab:hover {
                transform: scale(1.1);
                background-color: #1A202C;
                box-shadow: 0 6px 16px rgba(79, 209, 197, 0.2);
            }

            #algo-chat-dropdown {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 300px;
                height: 450px;
                background-color: #1A202C;
                border-radius: 12px;
                display: flex;
                flex-direction: column;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
                border: 1px solid #2D3748;
                z-index: 10000;
            }

            .algo-chat-header {
                padding: 12px;
                background-color: #2D3748;
                border-radius: 12px 12px 0 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid #4FD1C5;
            }

            .algo-chat-header span {
                color: #E2E8F0;
                font-weight: 600;
                font-size: 14px;
            }

            #algo-chat-close {
                background: none;
                border: none;
                color: #E2E8F0;
                font-size: 20px;
                cursor: pointer;
                padding: 4px;
                transition: color 0.2s;
            }

            #algo-chat-close:hover {
                color: #4FD1C5;
            }

            .algo-chat-messages {
                flex: 1;
                padding: 12px;
                overflow-y: auto;
                background-color: #1A202C;
            }

            .algo-message {
                margin-bottom: 8px;
                padding: 10px;
                border-radius: 8px;
                max-width: 85%;
                line-height: 1.4;
                font-size: 13px;
            }

            .algo-message.user {
                background-color: #2D3748;
                color: #E2E8F0;
                margin-left: auto;
                border: 1px solid #4FD1C5;
            }

            .algo-message.assistant {
                background-color: #2D3748;
                color: #E2E8F0;
                margin-right: auto;
                border: 1px solid #4FD1C5;
            }

            .algo-chat-input {
                padding: 12px;
                background-color: #2D3748;
                border-radius: 0 0 12px 12px;
                display: flex;
                gap: 8px;
                border-top: 1px solid #4FD1C5;
                align-items: center;
            }

            .algo-chat-input textarea {
                flex: 1;
                padding: 8px 12px;
                border-radius: 8px;
                border: 1px solid #4A5568;
                background-color: #1A202C;
                color: #E2E8F0;
                resize: none;
                font-family: inherit;
                font-size: 14px;
                line-height: 1.4;
                transition: border-color 0.2s;
                height: 42px;
                min-height: 42px;
                max-height: 42px;
            }

            .algo-chat-input button {
                padding: 6px 12px;
                background-color: #4FD1C5;
                color: #1A202C;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.2s;
                height: 42px;
                font-size: 13px;
            }

            .algo-chat-input button:hover {
                background-color: #38B2AC;
                transform: translateY(-1px);
            }

            /* Scrollbar styling */
            .algo-chat-messages::-webkit-scrollbar {
                width: 6px;
            }

            .algo-chat-messages::-webkit-scrollbar-track {
                background: #2D3748;
                border-radius: 3px;
            }

            .algo-chat-messages::-webkit-scrollbar-thumb {
                background: #4FD1C5;
                border-radius: 3px;
            }

            .algo-chat-messages::-webkit-scrollbar-thumb:hover {
                background: #38B2AC;
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