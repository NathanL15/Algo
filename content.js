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
            
            // Method 1: Try to get code from Monaco editor's view-lines
            const monacoEditor = document.querySelector('.monaco-editor');
            if (monacoEditor) {
                const viewLines = monacoEditor.querySelectorAll('.view-line');
                if (viewLines.length > 0) {
                    code = Array.from(viewLines)
                        .map(line => {
                            // Extract text content from spans within the line
                            const spans = line.querySelectorAll('span');
                            return Array.from(spans)
                                .map(span => span.textContent)
                                .join('');
                        })
                        .join('\n');
                    console.log('Found code using Monaco view-lines:', code);
                }
            }

            // Method 2: Try to get code from editor container
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
                        console.log('Found code using editor container');
                    }
                }
            }

            // Method 3: Try to get code from any code-related element
            if (!code) {
                const codeSelectors = [
                    'div[class*="editor"]',
                    'div[class*="code"]',
                    'pre[class*="code"]',
                    'div[class*="solution"]'
                ];
                
                for (const selector of codeSelectors) {
                    const element = document.querySelector(selector);
                    if (element) {
                        const lines = element.querySelectorAll('.view-line, .line');
                        if (lines.length > 0) {
                            code = Array.from(lines)
                                .map(line => {
                                    const spans = line.querySelectorAll('span');
                                    return Array.from(spans)
                                        .map(span => span.textContent)
                                        .join('');
                                })
                                .join('\n');
                            console.log('Found code using selector:', selector);
                            break;
                        }
                    }
                }
            }

            // Log the code-related elements for debugging
            console.log('Code-related elements found:', {
                monacoEditor: !!document.querySelector('.monaco-editor'),
                viewLines: document.querySelectorAll('.view-line').length,
                codeLines: document.querySelectorAll('.line').length,
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