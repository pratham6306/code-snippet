/**
 * register.js
 * 
 * Page-specific script for register.html.
 * Handles user input validation, password matching, and registration POST.
 * On success, automatically logs the user in (setting Basic Auth headers)
 * and redirects to the home dashboard.
 */

// Import reusable API helper functions
import { registerUser, login, initAuthWidget } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Auth Widget (Login/Logout buttons) in navbar
    initAuthWidget();

    // 2. Mobile Menu Toggler
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('show');
        });
    }

    // 3. Alert Box Closer
    const alertCloseBtn = document.getElementById('alertClose');
    const alertContainer = document.getElementById('alertContainer');
    if (alertCloseBtn && alertContainer) {
        alertCloseBtn.addEventListener('click', () => {
            alertContainer.classList.add('hidden');
        });
    }

    // 4. Form Submit Listener
    const form = document.getElementById('registerForm');
    if (form) {
        form.addEventListener('submit', handleRegistration);
    }
});

/**
 * Handles the registration form submit event.
 */
async function handleRegistration(e) {
    e.preventDefault();

    const submitBtn = document.getElementById('submitBtn');
    const alertContainer = document.getElementById('alertContainer');

    const usernameVal = document.getElementById('regUsername').value.trim();
    const passwordVal = document.getElementById('regPassword').value;
    const confirmPasswordVal = document.getElementById('regConfirmPassword').value;

    // Client-side validations
    if (passwordVal.length < 6) {
        showFeedback('Password must be at least 6 characters long.', 'error');
        return;
    }

    if (passwordVal !== confirmPasswordVal) {
        showFeedback('Passwords do not match. Please enter the same password in both fields.', 'error');
        return;
    }

    // Disable button to prevent double-submits
    submitBtn.disabled = true;
    submitBtn.textContent = 'Registering...';
    alertContainer.classList.add('hidden');

    try {
        // 1. Call POST /register/ on backend
        await registerUser(usernameVal, passwordVal);

        showFeedback('Registration successful! Logging you in...', 'success');

        // 2. Auto-login on success to set sessionStorage credentials
        await login(usernameVal, passwordVal);

        // 3. Redirect to home dashboard
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);

    } catch (error) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
        showFeedback(`Registration failed: ${error.message}`, 'error');
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
