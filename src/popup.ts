import { ProblemInfo } from './types';

// Get DOM elements
const problemInfo = document.getElementById('problem-info') as HTMLDivElement;
const loadingSpinner = document.getElementById('loading-spinner') as HTMLDivElement;
const errorMessage = document.getElementById('error-message') as HTMLDivElement;
const hintInput = document.getElementById('hint-input') as HTMLTextAreaElement;
const sendButton = document.getElementById('send-button') as HTMLButtonElement;
const hintResponse = document.getElementById('hint-response') as HTMLDivElement;

// Show loading spinner
function showLoading(): void {
    loadingSpinner.style.display = 'block';
    errorMessage.style.display = 'none';
    hintResponse.style.display = 'none';
}

// Show error message
function showError(message: string): void {
    loadingSpinner.style.display = 'none';
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    hintResponse.style.display = 'none';
}

// Show hint response
function showHint(hint: string): void {
    loadingSpinner.style.display = 'none';
    errorMessage.style.display = 'none';
    hintResponse.textContent = hint;
    hintResponse.style.display = 'block';
}

// Get problem info from the current tab
async function getProblemInfo(): Promise<void> {
    showLoading();
    
    try {
        const response = await new Promise<ProblemInfo>((resolve, reject) => {
            chrome.runtime.sendMessage({ action: 'getProblemInfo' }, (response) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(response);
                }
            });
        });

        if (!response) {
            showError('No problem information found. Please make sure you are on a LeetCode problem page.');
            return;
        }

        // Display problem info
        problemInfo.innerHTML = `
            <h3>${response.title}</h3>
            <p><strong>Difficulty:</strong> ${response.difficulty}</p>
            <p><strong>Language:</strong> ${response.language}</p>
            <p><strong>Tags:</strong> ${response.tags.join(', ')}</p>
        `;
        problemInfo.style.display = 'block';
        loadingSpinner.style.display = 'none';

    } catch (error) {
        console.error('Error getting problem info:', error);
        showError('Error getting problem information. Please try again.');
    }
}

// Send hint request
async function sendHintRequest(): Promise<void> {
    const hint = hintInput.value.trim();
    if (!hint) return;

    showLoading();

    try {
        const response = await new Promise<ProblemInfo>((resolve, reject) => {
            chrome.runtime.sendMessage({ action: 'getProblemInfo' }, (response) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(response);
                }
            });
        });

        if (!response) {
            showError('No problem information found. Please make sure you are on a LeetCode problem page.');
            return;
        }

        const apiResponse = await fetch('https://algo-de3g.onrender.com/api/hints', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: hint,
                problemInfo: response
            })
        });

        if (!apiResponse.ok) {
            throw new Error('API request failed');
        }

        const data = await apiResponse.json();
        showHint(data.hint || 'No hint received.');

    } catch (error) {
        console.error('Error sending hint request:', error);
        showError('Error sending hint request. Please try again.');
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    getProblemInfo();

    sendButton.addEventListener('click', sendHintRequest);

    hintInput.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendHintRequest();
        }
    });
}); 