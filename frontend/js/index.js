/**
 * index.js
 * 
 * Page-specific script for index.html.
 * Handles interactive menu toggles and fetches statistics from the API
 * on load to populate the dashboard counters.
 */

// Import the reusable API client functions from api.js.
// Since we are using ES6 modules, we specify the file path relative to this script.
import { getAllSnippets, getUsers, initAuthWidget } from './api.js';

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

    // 2. Fetch and populate dashboard stats
    loadDashboardStats();
});

/**
 * Fetches data from the Django API to update the snippet and user counters.
 */
async function loadDashboardStats() {
    const totalSnippetsEl = document.getElementById('totalSnippets');
    const totalUsersEl = document.getElementById('totalUsers');

    try {
        // Fetch the first page of snippets.
        // Because the Django REST Framework response is paginated, 
        // the payload contains a 'count' field representing the total quantity in the database.
        // This is much faster than downloading all rows.
        const snippetsData = await getAllSnippets(1);
        totalSnippetsEl.textContent = snippetsData.count;
    } catch (error) {
        console.error('Failed to load snippet stats:', error);
        totalSnippetsEl.textContent = 'Error';
        totalSnippetsEl.style.color = '#ef4444'; // Red error text
    }

    try {
        // Fetch the first page of users to read the 'count' field.
        const usersData = await getUsers(1);
        totalUsersEl.textContent = usersData.count;
    } catch (error) {
        console.error('Failed to load user stats:', error);
        totalUsersEl.textContent = 'Error';
        totalUsersEl.style.color = '#ef4444'; // Red error text
    }
}
