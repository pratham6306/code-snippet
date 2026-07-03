/**
 * detail.js
 * 
 * Page-specific script for snippet-detail.html.
 * Extracts the snippet 'id' query parameter from the URL, fetches 
 * details from the DRF backend, and renders them.
 * Also configures copy-to-clipboard, highlight viewing, and deletes.
 */

// Import reusable client API functions
import { getSnippet, deleteSnippet, initAuthWidget } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Auth Widget (Login/Logout buttons) in navbar
    initAuthWidget();

    // 1. Mobile Menu Toggler
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('show');
        });
    }

    // 2. Close alert banner
    const alertCloseBtn = document.getElementById('alertClose');
    const alertContainer = document.getElementById('alertContainer');
    if (alertCloseBtn && alertContainer) {
        alertCloseBtn.addEventListener('click', () => {
            alertContainer.classList.add('hidden');
        });
    }

    // 3. Extract snippet ID from URL search query string (?id=X)
    const urlParams = new URLSearchParams(window.location.search);
    const snippetId = urlParams.get('id');

    if (!snippetId) {
        showError('No snippet ID was provided in the URL. Please return to the list and select a snippet.');
        document.getElementById('loadingIndicator').classList.add('hidden');
        return;
    }

    // Load snippet details
    loadSnippetDetails(snippetId);
});

/**
 * Fetches and displays snippet details.
 */
async function loadSnippetDetails(id) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const detailCard = document.getElementById('detailCard');

    try {
        // GET /snippets/<id>/
        const snippet = await getSnippet(id);

        // Populate fields
        document.getElementById('snippetTitle').textContent = snippet.title || 'Untitled Snippet';
        document.getElementById('snippetLang').textContent = snippet.language;
        document.getElementById('snippetStyle').textContent = snippet.style;
        document.getElementById('snippetLinenos').textContent = snippet.linenos ? 'Lines: Enabled' : 'Lines: Disabled';
        document.getElementById('snippetId').textContent = snippet.id;
        document.getElementById('snippetOwner').textContent = snippet.owner || 'anonymous';
        
        // Display raw code in monospace pre block
        const codeElement = document.getElementById('snippetCode');
        codeElement.textContent = snippet.code;
        
        // Adjust virtual window header title based on language
        const ext = getFileExtension(snippet.language);
        document.getElementById('windowTitle').textContent = `snippet_${snippet.id}.${ext}`;

        // Configure Action Buttons
        const editBtn = document.getElementById('editBtn');
        editBtn.href = `edit-snippet.html?id=${snippet.id}`;

        const highlightBtn = document.getElementById('highlightBtn');
        highlightBtn.addEventListener('click', () => {
            window.open(`http://127.0.0.1:8000/snippets/${snippet.id}/highlight/`, '_blank');
        });

        const deleteBtn = document.getElementById('deleteBtn');
        deleteBtn.addEventListener('click', () => {
            confirmAndDelete(snippet.id, snippet.title);
        });

        const copyBtn = document.getElementById('copyBtn');
        copyBtn.addEventListener('click', () => {
            copyCodeToClipboard(snippet.code);
        });

        // Hide loader, show detail card
        loadingIndicator.classList.add('hidden');
        detailCard.classList.remove('hidden');
    } catch (error) {
        loadingIndicator.classList.add('hidden');
        showError(`Failed to fetch snippet details: ${error.message}`);
    }
}

/**
 * Handles confirmation and deletion.
 */
async function confirmAndDelete(id, title) {
    const isConfirmed = confirm(`Are you sure you want to delete the snippet "${title}"? This action cannot be undone.`);
    
    if (!isConfirmed) return;

    try {
        // DELETE /snippets/<id>/
        await deleteSnippet(id);
        
        // Redirect back to list on success
        alert(`Snippet "${title}" successfully deleted.`);
        window.location.href = 'snippets.html';
    } catch (error) {
        showError(`Failed to delete snippet: ${error.message}`);
    }
}

/**
 * Copies code block to system clipboard and gives UI feedback.
 */
async function copyCodeToClipboard(codeText) {
    const copyBtn = document.getElementById('copyBtn');
    try {
        await navigator.clipboard.writeText(codeText);
        copyBtn.textContent = 'Copied!';
        copyBtn.style.borderColor = '#10b981';
        copyBtn.style.color = '#10b981';
        
        setTimeout(() => {
            copyBtn.textContent = 'Copy Code';
            copyBtn.style.borderColor = '';
            copyBtn.style.color = '';
        }, 2000);
    } catch (err) {
        console.error('Failed to copy text: ', err);
        alert('Failed to copy code to clipboard.');
    }
}

/**
 * Displays error banner alert.
 */
function showError(message) {
    const alertContainer = document.getElementById('alertContainer');
    const alertMessage = document.getElementById('alertMessage');
    
    if (alertContainer && alertMessage) {
        alertMessage.textContent = message;
        alertContainer.classList.remove('hidden');
    }
}

/**
 * Returns simple file extensions based on Pygments language name.
 */
function getFileExtension(lang) {
    const extensions = {
        'python': 'py',
        'javascript': 'js',
        'html': 'html',
        'css': 'css',
        'c++': 'cpp',
        'cpp': 'cpp',
        'go': 'go',
        'ruby': 'rb',
        'java': 'java',
        'php': 'php',
        'bash': 'sh',
        'shell': 'sh'
    };
    return extensions[lang.toLowerCase()] || 'txt';
}
