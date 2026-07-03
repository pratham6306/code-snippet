/**
 * create.js
 * 
 * Page-specific script for create-snippet.html.
 * Handles the validation, serializes form fields, and performs
 * a POST request via api.js to register a new code snippet.
 */

// Import reusable client API function
import { createSnippet, initAuthWidget } from './api.js';

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

    // 2. Setup Alert Close Button
    const alertCloseBtn = document.getElementById('alertClose');
    const alertContainer = document.getElementById('alertContainer');
    if (alertCloseBtn && alertContainer) {
        alertCloseBtn.addEventListener('click', () => {
            alertContainer.classList.add('hidden');
        });
    }

    // 3. Form Submit Listener
    const form = document.getElementById('createSnippetForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
});

/**
 * Handles the creation form submission.
 */
async function handleFormSubmit(e) {
    // Prevent default browser form submission (which reloads the page)
    e.preventDefault();

    const submitBtn = document.getElementById('submitBtn');
    const alertContainer = document.getElementById('alertContainer');

    // Extract form values
    const titleVal = document.getElementById('snippetTitle').value.trim();
    const codeVal = document.getElementById('snippetCode').value;
    const languageVal = document.getElementById('snippetLanguage').value;
    const styleVal = document.getElementById('snippetStyle').value;
    const linenosVal = document.getElementById('snippetLinenos').checked;

    // Validation (DRF will also validate, but local checks are faster)
    if (!codeVal.trim()) {
        showFeedback('The Code field cannot be blank.', 'error');
        return;
    }

    // Disable button to prevent duplicate clicks during request lifecycle
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating...';
    alertContainer.classList.add('hidden'); // Clear previous messages

    // Assemble payload
    const payload = {
        title: titleVal,
        code: codeVal,
        language: languageVal,
        style: styleVal,
        linenos: linenosVal
    };

    try {
        // Call POST /snippets/
        // Why POST?
        // - POST is used to submit data to the server to create a new resource.
        const newSnippet = await createSnippet(payload);

        // Display success banner
        showFeedback(`Snippet "${newSnippet.title || 'Untitled'}" created successfully! Redirecting...`, 'success');

        // Redirect back to list page after 1.5 seconds
        setTimeout(() => {
            window.location.href = 'snippets.html';
        }, 1500);

    } catch (error) {
        // Re-enable button
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Snippet';

        // Display DRF backend error response
        showFeedback(`Failed to create snippet: ${error.message}`, 'error');
    }
}

/**
 * Displays status banner alert.
 */
function showFeedback(message, type = 'error') {
    const alertContainer = document.getElementById('alertContainer');
    const alertMessage = document.getElementById('alertMessage');
    
    if (alertContainer && alertMessage) {
        alertMessage.textContent = message;
        alertContainer.className = 'alert-container'; // Reset classes
        
        if (type === 'success') {
            alertContainer.classList.add('success');
        } else {
            alertContainer.classList.add('error');
        }
        
        alertContainer.classList.remove('hidden');
        
        // Auto scroll to top to see alert
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}
