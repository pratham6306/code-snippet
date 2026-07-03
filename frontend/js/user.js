/**
 * user.js
 * 
 * Page-specific script for user-detail.html.
 * Extracts the user 'id' query parameter, loads user details,
 * and fetches the titles and metadata of all snippets owned by the user
 * by running client-side parallel API lookups.
 */

// Import reusable API helper functions
import { getUser, getSnippet, initAuthWidget } from './api.js';

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

    // 3. Extract User ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');

    if (!userId) {
        showError('No user ID was provided. Please return to the users list.');
        document.getElementById('loadingIndicator').classList.add('hidden');
        return;
    }

    // Load profile
    loadUserProfile(userId);
});

/**
 * Loads user profile data and resolves related snippet records.
 */
async function loadUserProfile(id) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const profileCard = document.getElementById('profileCard');
    const userSnippetsList = document.getElementById('userSnippetsList');
    const emptySnippetsMsg = document.getElementById('emptySnippetsMsg');
    const snippetsLoader = document.getElementById('snippetsLoader');

    try {
        // GET /users/<id>/
        const user = await getUser(id);

        // Fill user details
        document.getElementById('usernameDisplay').textContent = user.username;
        document.getElementById('userIdDisplay').textContent = user.id;

        // Hide main page loader, show profile layout card
        loadingIndicator.classList.add('hidden');
        profileCard.classList.remove('hidden');

        // Resolve linked snippet records
        const snippetIds = user.snippets || [];

        if (snippetIds.length === 0) {
            emptySnippetsMsg.classList.remove('hidden');
            return;
        }

        // Show inline resolver spinner
        snippetsLoader.classList.remove('hidden');

        /**
         * EDUCATIONAL NOTE (Client-side Data Joining):
         * The user resource from GET /users/<id>/ returns a list of snippet IDs: [1, 4, 12].
         * To display their titles and languages, we make parallel fetch calls for each ID.
         * We use Promise.all to await all fetches concurrently.
         * We attach a .catch() block to each individual fetch so that if one snippet fails 
         * (e.g. deleted or private), it does not crash the entire list.
         */
        const snippetRequests = snippetIds.map(snippetId => 
            getSnippet(snippetId)
                .catch(err => {
                    console.warn(`Failed to resolve snippet ${snippetId}:`, err);
                    return {
                        id: snippetId,
                        title: `Snippet #${snippetId} (Unreachable)`,
                        language: 'unknown',
                        isError: true
                    };
                })
        );

        const resolvedSnippets = await Promise.all(snippetRequests);

        // Hide inline loader
        snippetsLoader.classList.add('hidden');

        // Render snippet link rows
        renderUserSnippets(resolvedSnippets, userSnippetsList);

    } catch (error) {
        loadingIndicator.classList.add('hidden');
        showError(`Failed to load user profile: ${error.message}`);
    }
}

/**
 * Renders lists of resolved snippets.
 */
function renderUserSnippets(snippets, containerEl) {
    containerEl.innerHTML = ''; // Clear container

    snippets.forEach(snippet => {
        const li = document.createElement('li');
        
        // Define if it is a link or disabled block
        const isClickable = !snippet.isError;
        const linkClass = isClickable ? 'snippet-item-link' : 'snippet-item-link disabled-link';
        const linkHref = isClickable ? `snippet-detail.html?id=${snippet.id}` : '#';

        li.innerHTML = `
            <a href="${linkHref}" class="${linkClass}">
                <div class="item-left">
                    <span class="item-title">${escapeHtml(snippet.title)}</span>
                    <span class="item-lang">${escapeHtml(snippet.language)}</span>
                </div>
                <div class="item-arrow">&rarr;</div>
            </a>
        `;

        containerEl.appendChild(li);
    });
}

/**
 * Displays error alert banner.
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
 * Escapes HTML characters.
 */
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
