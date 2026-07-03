/**
 * snippets.js
 * 
 * Page-specific script for snippets.html.
 * Fetches and displays code snippets from the Django backend in a card layout.
 * Supports pagination, highlight views (in a new tab), edit page navigation, 
 * and confirmation-protected snippet deletions.
 */

// Import API communication functions.
import { getAllSnippets, deleteSnippet, initAuthWidget } from './api.js';

// State tracker for pagination
let currentPage = 1;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Auth Widget (Login/Logout buttons) in navbar
    initAuthWidget();

    // 1. Mobile Navigation Menu Toggle
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('show');
        });
    }

    // 2. Alert Container Close Event
    const alertCloseBtn = document.getElementById('alertClose');
    const alertContainer = document.getElementById('alertContainer');
    if (alertCloseBtn && alertContainer) {
        alertCloseBtn.addEventListener('click', () => {
            alertContainer.classList.add('hidden');
        });
    }

    // 3. Pagination Button Listeners
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                loadSnippets(currentPage);
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentPage++;
            loadSnippets(currentPage);
        });
    }

    // 4. Initial snippets load
    loadSnippets(currentPage);
});

/**
 * Loads code snippets for the given page, manages UI loader and state.
 */
async function loadSnippets(page) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const snippetsGrid = document.getElementById('snippetsGrid');
    const emptyState = document.getElementById('emptyState');
    const paginationContainer = document.getElementById('paginationContainer');
    const pageIndicator = document.getElementById('pageIndicator');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    // Show spinner, hide content while fetching
    loadingIndicator.classList.remove('hidden');
    snippetsGrid.classList.add('hidden');
    emptyState.classList.add('hidden');
    paginationContainer.classList.add('hidden');

    try {
        // GET /snippets/?page=X
        const data = await getAllSnippets(page);
        
        // Hide loader
        loadingIndicator.classList.add('hidden');

        // Check if we got any snippets back
        if (!data.results || data.results.length === 0) {
            emptyState.classList.remove('hidden');
            return;
        }

        // Render the snippets
        renderSnippetsList(data.results);
        snippetsGrid.classList.remove('hidden');

        // Manage pagination controls
        pageIndicator.textContent = `Page ${page}`;
        
        // If data.previous is null, we are on the first page, so disable previous button
        prevBtn.disabled = !data.previous;
        
        // If data.next is null, we are on the last page, so disable next button
        nextBtn.disabled = !data.next;

        paginationContainer.classList.remove('hidden');
    } catch (error) {
        loadingIndicator.classList.add('hidden');
        showAlert(`Failed to load snippets: ${error.message}`, 'error');
    }
}

/**
 * Iterates through the results list and populates the grid container.
 */
function renderSnippetsList(snippets) {
    const grid = document.getElementById('snippetsGrid');
    grid.innerHTML = ''; // Clear previous items

    snippets.forEach(snippet => {
        const card = document.createElement('article');
        card.className = 'snippet-card';

        // Format metadata values for user view
        const linenosText = snippet.linenos ? 'Lines: Enabled' : 'Lines: Disabled';
        const ownerName = snippet.owner || 'anonymous';
        const titleText = snippet.title || 'Untitled Snippet';

        card.innerHTML = `
            <div class="snippet-header">
                <h3 class="snippet-title" title="${escapeHtml(titleText)}">${escapeHtml(titleText)}</h3>
                <div class="snippet-meta">
                    <span class="badge badge-lang" title="Programming Language">${escapeHtml(snippet.language)}</span>
                    <span class="badge badge-style" title="Pygments Style">${escapeHtml(snippet.style)}</span>
                    <span class="badge badge-linenos" title="Line numbers setting">${linenosText}</span>
                </div>
                <div class="snippet-owner">
                    <span class="owner-icon">&#128100;</span> Owner: <strong>${escapeHtml(ownerName)}</strong>
                </div>
            </div>
            
            <div class="snippet-actions">
                <a href="snippet-detail.html?id=${snippet.id}" class="btn btn-secondary" title="View full details of this snippet">View Details</a>
                <a href="edit-snippet.html?id=${snippet.id}" class="btn btn-edit" title="Edit snippet contents">Edit</a>
                <button class="btn btn-highlight highlight-btn" data-id="${snippet.id}" title="Open syntax highlighted code in new tab">Highlight</button>
                <button class="btn btn-delete delete-btn" data-id="${snippet.id}" data-title="${escapeHtml(titleText)}" title="Delete this snippet">Delete</button>
            </div>
        `;

        grid.appendChild(card);
    });

    // Attach click listeners to Highlight and Delete buttons
    // Using event delegation or direct selectors on rendered cards
    grid.querySelectorAll('.highlight-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            // GET /snippets/<id>/highlight/ opens pygments highlighted HTML in a new tab
            const highlightUrl = `http://127.0.0.1:8000/snippets/${id}/highlight/`;
            window.open(highlightUrl, '_blank');
        });
    });

    grid.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            const title = e.target.getAttribute('data-title');
            confirmAndDeleteSnippet(id, title);
        });
    });
}

/**
 * Handles confirmation and deletion of a snippet.
 */
async function confirmAndDeleteSnippet(id, title) {
    const isConfirmed = confirm(`Are you sure you want to delete the snippet "${title}"? This cannot be undone.`);
    
    if (!isConfirmed) return;

    try {
        // DELETE /snippets/<id>/
        // Why DELETE?
        // - It indicates to the REST server that the resource identified by the ID should be removed.
        await deleteSnippet(id);
        
        showAlert(`Snippet "${title}" successfully deleted.`, 'success');
        
        // Refresh the current page to update the card grid
        loadSnippets(currentPage);
    } catch (error) {
        showAlert(`Failed to delete snippet: ${error.message}`, 'error');
    }
}

/**
 * Displays a global status banner alert.
 */
function showAlert(message, type = 'error') {
    const alertContainer = document.getElementById('alertContainer');
    const alertMessage = document.getElementById('alertMessage');
    
    if (alertContainer && alertMessage) {
        alertMessage.textContent = message;
        alertContainer.className = 'alert-container'; // Reset classes
        
        if (type === 'success') {
            alertContainer.classList.add('success');
        }
        
        alertContainer.classList.remove('hidden');
        
        // Auto scroll to top to see alert
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

/**
 * Simple helper to escape HTML characters and prevent XSS injections.
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
