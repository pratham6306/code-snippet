/**
 * edit.js
 * 
 * Page-specific script for edit-snippet.html.
 * Loads the existing snippet data based on the URL parameter 'id', 
 * populates the form, and submits modifications via PUT requests.
 */

// Import reusable API helper functions
import { getSnippet, updateSnippet, initAuthWidget } from './api.js';

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

    // 2. Alert Box Closer
    const alertCloseBtn = document.getElementById('alertClose');
    const alertContainer = document.getElementById('alertContainer');
    if (alertCloseBtn && alertContainer) {
        alertCloseBtn.addEventListener('click', () => {
            alertContainer.classList.add('hidden');
        });
    }

    // 3. Extract Snippet ID from URL Query String
    const urlParams = new URLSearchParams(window.location.search);
    const snippetId = urlParams.get('id');

    if (!snippetId) {
        showFeedback('No snippet ID was provided. Cannot edit snippet.', 'error');
        document.getElementById('loadingIndicator').classList.add('hidden');
        return;
    }

    // Configure Cancel & Back URLs to return to the snippet's detail page
    document.getElementById('backToDetail').href = `snippet-detail.html?id=${snippetId}`;
    document.getElementById('cancelBtn').href = `snippet-detail.html?id=${snippetId}`;

    // Load current values
    fetchAndPopulateForm(snippetId);

    // 4. Form Submit Listener
    const form = document.getElementById('editSnippetForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            handleFormSubmit(e, snippetId);
        });
    }
});

/**
 * Fetches the snippet from backend and pre-fills form fields.
 */
async function fetchAndPopulateForm(id) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const formContainer = document.getElementById('formContainer');

    try {
        // GET /snippets/<id>/
        const snippet = await getSnippet(id);

        // Pre-fill inputs
        document.getElementById('snippetTitle').value = snippet.title || '';
        document.getElementById('snippetCode').value = snippet.code || '';
        document.getElementById('snippetLanguage').value = snippet.language;
        document.getElementById('snippetStyle').value = snippet.style;
        document.getElementById('snippetLinenos').checked = snippet.linenos;

        // Display form
        loadingIndicator.classList.add('hidden');
        formContainer.classList.remove('hidden');
    } catch (error) {
        loadingIndicator.classList.add('hidden');
        showFeedback(`Failed to load snippet details: ${error.message}`, 'error');
    }
}

/**
 * Submits the updated data using a PUT request.
 */
async function handleFormSubmit(e, id) {
    e.preventDefault();

    const submitBtn = document.getElementById('submitBtn');
    const alertContainer = document.getElementById('alertContainer');

    const titleVal = document.getElementById('snippetTitle').value.trim();
    const codeVal = document.getElementById('snippetCode').value;
    const languageVal = document.getElementById('snippetLanguage').value;
    const styleVal = document.getElementById('snippetStyle').value;
    const linenosVal = document.getElementById('snippetLinenos').checked;

    if (!codeVal.trim()) {
        showFeedback('The Code field cannot be empty.', 'error');
        return;
    }

    // Disable button to prevent multi-submits
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';
    alertContainer.classList.add('hidden');

    const payload = {
        title: titleVal,
        code: codeVal,
        language: languageVal,
        style: styleVal,
        linenos: linenosVal
    };

    try {
        // PUT /snippets/<id>/
        // Why PUT?
        // - PUT is used to update an existing resource by replacing its contents entirely.
        const updated = await updateSnippet(id, payload);

        showFeedback(`Snippet "${updated.title || 'Untitled'}" updated successfully! Redirecting...`, 'success');

        // Redirect back to details page
        setTimeout(() => {
            window.location.href = `snippet-detail.html?id=${id}`;
        }, 1500);

    } catch (error) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Changes';
        showFeedback(`Failed to update snippet: ${error.message}`, 'error');
    }
}

/**
 * Displays status feedback inside the alert banner.
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
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}
