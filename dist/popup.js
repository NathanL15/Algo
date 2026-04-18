/******/ (() => { // webpackBootstrap
/******/ 	"use strict";

;// ./src/config.ts
const fallbackUrl = 'http://localhost:3000';
const rawApiBaseUrl =  true ? "http://localhost:3000" : 0;
const API_BASE_URL = rawApiBaseUrl.replace(/\/$/, '');

;// ./src/popup.ts

const problemInfo = document.getElementById('problem-info');
const loadingSpinner = document.getElementById('loading-spinner');
const errorMessage = document.getElementById('error-message');
const hintInput = document.getElementById('hint-input');
const sendButton = document.getElementById('send-button');
const hintResponse = document.getElementById('hint-response');
function requestProblemInfo() {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: 'getProblemInfo' }, (response) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
                return;
            }
            resolve(response ?? null);
        });
    });
}
function showLoading() {
    loadingSpinner.style.display = 'block';
    errorMessage.style.display = 'none';
    hintResponse.style.display = 'none';
}
function showError(message) {
    loadingSpinner.style.display = 'none';
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    hintResponse.style.display = 'none';
}
function showHint(hint) {
    loadingSpinner.style.display = 'none';
    errorMessage.style.display = 'none';
    hintResponse.textContent = hint;
    hintResponse.style.display = 'block';
}
async function getProblemInfo() {
    showLoading();
    try {
        const response = await requestProblemInfo();
        if (!response) {
            showError('No problem information found. Please make sure you are on a LeetCode problem page.');
            return;
        }
        problemInfo.innerHTML = `
            <h3>${response.title}</h3>
            <p><strong>Difficulty:</strong> ${response.difficulty}</p>
            <p><strong>Language:</strong> ${response.language}</p>
            <p><strong>Tags:</strong> ${response.tags.join(', ')}</p>
        `;
        problemInfo.style.display = 'block';
        loadingSpinner.style.display = 'none';
    }
    catch (error) {
        console.error('Error getting problem info:', error);
        showError('Error getting problem information. Please try again.');
    }
}
async function sendHintRequest() {
    const hint = hintInput.value.trim();
    if (!hint)
        return;
    showLoading();
    try {
        const response = await requestProblemInfo();
        if (!response) {
            showError('No problem information found. Please make sure you are on a LeetCode problem page.');
            return;
        }
        const apiResponse = await fetch(`${API_BASE_URL}/api/hints`, {
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
    }
    catch (error) {
        console.error('Error sending hint request:', error);
        showError('Error sending hint request. Please try again.');
    }
}
document.addEventListener('DOMContentLoaded', () => {
    getProblemInfo();
    sendButton.addEventListener('click', sendHintRequest);
    hintInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendHintRequest();
        }
    });
});

/******/ })()
;