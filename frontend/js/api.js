/**
 * api.js
 * 
 * Unified API client for communicating with the Django REST Framework backend.
 * Now updated with Basic Authentication support!
 * 
 * EDUCATIONAL NOTES:
 * - We implement Basic Authentication by adding the 'Authorization' header to our fetches.
 * - Format: "Authorization: Basic <base64(username:password)>"
 * - We save credentials temporarily in sessionStorage (removed when tab is closed)
 *   to avoid making users log in repeatedly.
 * - This file now contains an auto-injecting Login/Logout Widget so that
 *   every page in the frontend gets authentication capabilities instantly!
 */

const BASE_URL = 'http://127.0.0.1:8000';

/**
 * Returns the HTTP Authorization header containing Basic Auth credentials
 * if the user is currently logged in.
 */
function getAuthHeader() {
    const auth = sessionStorage.getItem('api_auth'); // Base64 encoded 'username:password'
    if (auth) {
        return { 'Authorization': `Basic ${auth}` };
    }
    return {};
}

/**
 * Helper to handle response errors.
 */
async function handleResponse(response) {
    if (!response.ok) {
        let errorMessage = `HTTP Error! Status: ${response.status}`;
        try {
            const errData = await response.json();
            if (typeof errData === 'object') {
                errorMessage = Object.entries(errData)
                    .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
                    .join('\n') || errorMessage;
            } else {
                errorMessage = errData;
            }
        } catch (e) {
            if (response.status === 401) {
                errorMessage = 'Unauthorized: Invalid username or password.';
            } else if (response.status === 403) {
                errorMessage = 'Forbidden: You do not have permission to perform this action.';
            }
        }
        throw new Error(errorMessage);
    }
    
    if (response.status === 204) {
        return null;
    }
    
    return await response.json();
}

/**
 * Validates credentials by performing a test request to GET /users/
 * If successful, stores credentials in sessionStorage.
 */
export async function login(username, password) {
    const authString = btoa(`${username}:${password}`); // Convert to Base64
    try {
        const response = await fetch(`${BASE_URL}/users/`, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${authString}`
            }
        });
        
        const data = await handleResponse(response);
        
        // If successful, save credentials in sessionStorage
        sessionStorage.setItem('api_auth', authString);
        sessionStorage.setItem('api_username', username);
        return data;
    } catch (error) {
        console.error('Login failed:', error);
        throw error;
    }
}

/**
 * POST /register/
 * Submits username and password to register a new user in the database.
 * Why POST?
 * - POST is used to submit data to the server to create a new resource (the User record).
 */
export async function registerUser(username, password) {
    try {
        const response = await fetch(`${BASE_URL}/register/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });
        return await handleResponse(response);
    } catch (error) {
        console.error('Registration failed:', error);
        throw error;
    }
}

/**
 * Logs out the user by clearing sessionStorage.
 */
export function logout() {
    sessionStorage.removeItem('api_auth');
    sessionStorage.removeItem('api_username');
}

/**
 * GET /snippets/
 */
export async function getAllSnippets(page = 1) {
    try {
        const response = await fetch(`${BASE_URL}/snippets/?page=${page}`, {
            headers: {
                ...getAuthHeader()
            }
        });
        return await handleResponse(response);
    } catch (error) {
        console.error('Error fetching snippets:', error);
        throw error;
    }
}

/**
 * GET /snippets/<id>/
 */
export async function getSnippet(id) {
    try {
        const response = await fetch(`${BASE_URL}/snippets/${id}/`, {
            headers: {
                ...getAuthHeader()
            }
        });
        return await handleResponse(response);
    } catch (error) {
        console.error(`Error fetching snippet ${id}:`, error);
        throw error;
    }
}

/**
 * POST /snippets/
 */
export async function createSnippet(data) {
    try {
        const response = await fetch(`${BASE_URL}/snippets/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader(),
            },
            body: JSON.stringify(data),
        });
        return await handleResponse(response);
    } catch (error) {
        console.error('Error creating snippet:', error);
        throw error;
    }
}

/**
 * PUT /snippets/<id>/
 */
export async function updateSnippet(id, data) {
    try {
        const response = await fetch(`${BASE_URL}/snippets/${id}/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader(),
            },
            body: JSON.stringify(data),
        });
        return await handleResponse(response);
    } catch (error) {
        console.error(`Error updating snippet ${id}:`, error);
        throw error;
    }
}

/**
 * DELETE /snippets/<id>/
 */
export async function deleteSnippet(id) {
    try {
        const response = await fetch(`${BASE_URL}/snippets/${id}/`, {
            method: 'DELETE',
            headers: {
                ...getAuthHeader()
            }
        });
        return await handleResponse(response);
    } catch (error) {
        console.error(`Error deleting snippet ${id}:`, error);
        throw error;
    }
}

/**
 * GET /users/
 */
export async function getUsers(page = 1) {
    try {
        const response = await fetch(`${BASE_URL}/users/?page=${page}`, {
            headers: {
                ...getAuthHeader()
            }
        });
        return await handleResponse(response);
    } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
    }
}

/**
 * GET /users/<id>/
 */
export async function getUser(id) {
    try {
        const response = await fetch(`${BASE_URL}/users/${id}/`, {
            headers: {
                ...getAuthHeader()
            }
        });
        return await handleResponse(response);
    } catch (error) {
        console.error(`Error fetching user ${id}:`, error);
        throw error;
    }
}

/* ==========================================================================
   DYNAMIC AUTH WIDGET & MODAL INJECTION (Vanilla JS UI Component)
   ========================================================================== */

/**
 * Automatically initializes and renders the Login/Logout Widget inside
 * the navigation bar. Also injects its own CSS styles so that it works
 * instantly on every page without stylesheet edits.
 */
export function initAuthWidget() {
    // 1. Inject widget styles into the document head
    injectAuthWidgetCSS();

    // 2. Find navigation menu container
    const navMenu = document.getElementById('navMenu');
    if (!navMenu) return;

    // Create the container widget
    const authWrapper = document.createElement('div');
    authWrapper.className = 'auth-widget-container';

    const username = sessionStorage.getItem('api_username');

    if (username) {
        // User is logged in
        authWrapper.innerHTML = `
            <span class="auth-username" title="Logged in user">👤 ${escapeHtml(username)}</span>
            <button class="btn-auth-action logout-btn" id="widgetLogoutBtn">Logout</button>
        `;
        navMenu.appendChild(authWrapper);

        // Bind logout listener
        document.getElementById('widgetLogoutBtn').addEventListener('click', () => {
            logout();
            alert('Logged out successfully.');
            window.location.reload();
        });
    } else {
        // User is logged out
        authWrapper.innerHTML = `
            <button class="btn-auth-action login-btn" id="widgetLoginBtn">Sign In</button>
        `;
        navMenu.appendChild(authWrapper);

        // Bind login modal trigger listener
        document.getElementById('widgetLoginBtn').addEventListener('click', () => {
            showLoginModal();
        });
    }
}

/**
 * Renders and appends a modal popup to the DOM.
 */
function showLoginModal() {
    // Check if modal already exists
    if (document.getElementById('authLoginModal')) return;

    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'auth-modal-overlay';
    modalOverlay.id = 'authLoginModal';

    modalOverlay.innerHTML = `
        <div class="auth-modal-card">
            <header class="auth-modal-header">
                <h3>Sign In to DRF Backend</h3>
                <button class="auth-modal-close" id="modalCloseBtn">&times;</button>
            </header>
            <form id="authLoginForm" class="auth-modal-form">
                <div class="auth-modal-group">
                    <label for="modalUsername">Username</label>
                    <input type="text" id="modalUsername" placeholder="e.g. pratham" required>
                </div>
                <div class="auth-modal-group">
                    <label for="modalPassword">Password</label>
                    <input type="password" id="modalPassword" placeholder="e.g. password123" required>
                </div>
                <div id="modalErrorMsg" class="auth-modal-error hidden"></div>
                <p class="auth-modal-prompt">Don't have an account? <a href="register.html" id="modalRegisterLink">Register here</a></p>
                <footer class="auth-modal-footer">
                    <button type="button" class="btn-modal btn-modal-sec" id="modalCancelBtn">Cancel</button>
                    <button type="submit" class="btn-modal btn-modal-prim" id="modalSubmitBtn">Sign In</button>
                </footer>
            </form>
        </div>
    `;

    document.body.appendChild(modalOverlay);

    // Focus username input
    document.getElementById('modalUsername').focus();

    // Event listeners
    const closeForm = () => {
        document.body.removeChild(modalOverlay);
    };

    document.getElementById('modalCloseBtn').addEventListener('click', closeForm);
    document.getElementById('modalCancelBtn').addEventListener('click', closeForm);
    
    // Close on overlay click
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeForm();
    });

    // Form Submission
    const loginForm = document.getElementById('authLoginForm');
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const usernameInput = document.getElementById('modalUsername').value.trim();
        const passwordInput = document.getElementById('modalPassword').value;
        const errorMsgEl = document.getElementById('modalErrorMsg');
        const submitBtn = document.getElementById('modalSubmitBtn');

        // Disable submits during query
        submitBtn.disabled = true;
        submitBtn.textContent = 'Verifying...';
        errorMsgEl.classList.add('hidden');

        try {
            // Attempt to login using DRF Basic Auth
            await login(usernameInput, passwordInput);
            
            // Remove modal and reload to refresh views
            closeForm();
            window.location.reload();
        } catch (error) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign In';
            errorMsgEl.textContent = error.message;
            errorMsgEl.classList.remove('hidden');
        }
    });
}

/**
 * Injects self-contained styling for the Auth widget and modal overlay.
 */
function injectAuthWidgetCSS() {
    if (document.getElementById('authWidgetStyles')) return;

    const styleEl = document.createElement('style');
    styleEl.id = 'authWidgetStyles';
    styleEl.textContent = `
        /* Navbar Widget styling */
        .auth-widget-container {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-left: 0.5rem;
            padding-left: 0.5rem;
            border-left: 1px solid var(--border-color, #334155);
        }
        .auth-username {
            font-size: 0.9rem;
            font-weight: 600;
            color: var(--text-primary, #f8fafc);
            max-width: 120px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .btn-auth-action {
            padding: 0.4rem 0.8rem;
            font-size: 0.8rem;
            font-weight: 600;
            border-radius: 6px;
            cursor: pointer;
            border: none;
            transition: all 0.3s ease;
        }
        .login-btn {
            background-color: var(--accent-color, #6366f1);
            color: #ffffff;
        }
        .login-btn:hover {
            background-color: var(--accent-hover, #4f46e5);
        }
        .logout-btn {
            background-color: rgba(239, 68, 68, 0.1);
            color: var(--danger-color, #ef4444);
            border: 1px solid rgba(239, 68, 68, 0.3);
        }
        .logout-btn:hover {
            background-color: var(--danger-color, #ef4444);
            color: #ffffff;
        }

        /* Modal Overlay Background */
        .auth-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background-color: rgba(15, 23, 42, 0.85);
            backdrop-filter: blur(8px);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: modalFadeIn 0.3s ease-out;
        }

        /* Modal Box */
        .auth-modal-card {
            background-color: var(--surface-color, #1e293b);
            border: 1px solid var(--border-color, #334155);
            border-radius: 12px;
            width: 90%;
            max-width: 400px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            animation: modalScaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            overflow: hidden;
        }

        .auth-modal-header {
            padding: 1.25rem 1.5rem;
            border-bottom: 1px solid var(--border-color, #334155);
            display: flex;
            justify-content: space-between;
            align-items: center;
            background-color: rgba(15, 23, 42, 0.3);
        }
        .auth-modal-header h3 {
            font-size: 1.1rem;
            font-weight: 700;
            color: var(--text-primary, #f8fafc);
        }
        .auth-modal-close {
            background: none;
            border: none;
            color: var(--text-secondary, #94a3b8);
            font-size: 1.5rem;
            cursor: pointer;
            line-height: 1;
            transition: color 0.3s;
        }
        .auth-modal-close:hover {
            color: var(--text-primary, #f8fafc);
        }

        /* Form Fields */
        .auth-modal-form {
            padding: 1.5rem;
        }
        .auth-modal-group {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            margin-bottom: 1.25rem;
        }
        .auth-modal-group label {
            font-size: 0.85rem;
            font-weight: 600;
            color: var(--text-secondary, #94a3b8);
        }
        .auth-modal-group input {
            background-color: #0b0f19;
            border: 1px solid var(--border-color, #334155);
            border-radius: 6px;
            color: var(--text-primary, #f8fafc);
            padding: 0.6rem 0.8rem;
            font-size: 0.95rem;
            transition: all 0.3s;
        }
        .auth-modal-group input:focus {
            outline: none;
            border-color: var(--accent-color, #6366f1);
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
        }

        /* Error Messages */
        .auth-modal-error {
            background-color: rgba(239, 68, 68, 0.15);
            border: 1px solid var(--danger-color, #ef4444);
            color: #fca5a5;
            padding: 0.75rem 1rem;
            border-radius: 6px;
            font-size: 0.85rem;
            margin-bottom: 1.25rem;
            line-height: 1.4;
            white-space: pre-line;
        }
        .auth-modal-prompt {
            font-size: 0.85rem;
            color: var(--text-secondary, #94a3b8);
            margin-top: 0.5rem;
            text-align: center;
        }
        .auth-modal-prompt a {
            color: var(--accent-color, #6366f1);
            text-decoration: none;
            font-weight: 600;
            transition: color 0.3s;
        }
        .auth-modal-prompt a:hover {
            color: var(--accent-hover, #4f46e5);
            text-decoration: underline;
        }

        /* Footer buttons */
        .auth-modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 0.75rem;
            margin-top: 1.75rem;
            border-top: 1px solid var(--border-color, #334155);
            padding-top: 1.25rem;
        }
        .btn-modal {
            padding: 0.55rem 1.2rem;
            font-size: 0.85rem;
            font-weight: 600;
            border-radius: 6px;
            cursor: pointer;
            border: none;
            transition: all 0.3s;
        }
        .btn-modal-prim {
            background-color: var(--accent-color, #6366f1);
            color: #ffffff;
        }
        .btn-modal-prim:hover {
            background-color: var(--accent-hover, #4f46e5);
        }
        .btn-modal-prim:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        .btn-modal-sec {
            background-color: var(--surface-hover, #334155);
            color: var(--text-primary, #f8fafc);
            border: 1px solid var(--border-color, #334155);
        }
        .btn-modal-sec:hover {
            background-color: rgba(255, 255, 255, 0.1);
        }

        /* Responsive Navbar adjust */
        @media (max-width: 768px) {
            .auth-widget-container {
                border-left: none;
                border-top: 1px solid var(--border-color, #334155);
                margin-left: 0;
                padding-left: 0;
                padding-top: 1rem;
                margin-top: 0.5rem;
                width: 100%;
                justify-content: space-between;
            }
            .auth-username {
                max-width: 200px;
            }
        }

        /* Keyframes */
        @keyframes modalFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes modalScaleUp {
            from { transform: scale(0.9); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
    `;
    document.head.appendChild(styleEl);
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
