/**
 * users.js
 * 
 * Page-specific script for users.html.
 * Fetches and displays Django REST Framework users in a grid card layout.
 * Displays user overview stats (such as snippet counts) and provides
 * navigation links to drill down into specific user details.
 */

// Import reusable API helper functions
import { getUsers, initAuthWidget } from './api.js';

let currentPage = 1;

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

    // 3. Pagination Listeners
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                loadUsers(currentPage);
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentPage++;
            loadUsers(currentPage);
        });
    }

    // 4. Initial Load
    loadUsers(currentPage);
});

/**
 * Loads registered users from the backend APIs.
 */
async function loadUsers(page) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const usersGrid = document.getElementById('usersGrid');
    const emptyState = document.getElementById('emptyState');
    const paginationContainer = document.getElementById('paginationContainer');
    const pageIndicator = document.getElementById('pageIndicator');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    // Show loaders, hide contents
    loadingIndicator.classList.remove('hidden');
    usersGrid.classList.add('hidden');
    emptyState.classList.add('hidden');
    paginationContainer.classList.add('hidden');

    try {
        // GET /users/?page=X
        const data = await getUsers(page);
        
        loadingIndicator.classList.add('hidden');

        if (!data.results || data.results.length === 0) {
            emptyState.classList.remove('hidden');
            return;
        }

        // Render card nodes
        renderUsersList(data.results);
        usersGrid.classList.remove('hidden');

        // Manage pagination button state
        pageIndicator.textContent = `Page ${page}`;
        prevBtn.disabled = !data.previous;
        nextBtn.disabled = !data.next;
        paginationContainer.classList.remove('hidden');

    } catch (error) {
        loadingIndicator.classList.add('hidden');
        showError(`Failed to load users: ${error.message}`);
    }
}

/**
 * Renders the users cards grid.
 */
function renderUsersList(users) {
    const grid = document.getElementById('usersGrid');
    grid.innerHTML = ''; // Clear previous entries

    users.forEach(user => {
        const card = document.createElement('div');
        card.className = 'user-card';

        // Calculate quantity of code snippets owned by this user
        // user.snippets contains an array of primary keys (snippet IDs)
        const count = user.snippets ? user.snippets.length : 0;
        const snippetText = count === 1 ? '1 Snippet' : `${count} Snippets`;

        card.innerHTML = `
            <div class="avatar-container" aria-hidden="true">👤</div>
            <h3 class="user-name">${escapeHtml(user.username)}</h3>
            <div class="user-snippets-count">${snippetText}</div>
            <a href="user-detail.html?id=${user.id}" class="btn btn-primary">View Profile &rarr;</a>
        `;

        grid.appendChild(card);
    });
}

/**
 * Displays error alerts.
 */
function showError(message) {
    const alertContainer = document.getElementById('alertContainer');
    const alertMessage = document.getElementById('alertMessage');
    
    if (alertContainer && alertMessage) {
        alertMessage.textContent = message;
        alertContainer.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

/**
 * Helper to escape HTML characters.
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
