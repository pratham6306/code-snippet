# DRF Snippets - API Client & Learning Project

An educational code-sharing and syntax-highlighting web application. This project consists of a **Django REST Framework (DRF)** backend and a dedicated, standalone **Vanilla HTML5 / CSS3 / JavaScript (ES6)** frontend.

It is designed to demonstrate decoupling in modern web development, showing how a client application communicates with a REST API securely using standard HTTP protocols.

---

## 📂 Project Structure

```
code-snippet/
│
├── tutorial/                      # Django REST Framework Backend
│   ├── manage.py                  # Django Management Script
│   ├── db.sqlite3                 # SQLite Database File
│   ├── tutorial/                  # Main Project Settings & Routing
│   └── snippets/                  # Snippets App (Models, Views, Serializers)
│
├── frontend/                      # Standalone Vanilla Frontend
│   ├── index.html                 # Main Dashboard
│   ├── snippets.html              # Snippets List (CRUD)
│   ├── snippet-detail.html        # Detailed snippet viewer & code editor frame
│   ├── create-snippet.html        # Snippet creation form
│   ├── edit-snippet.html          # Prefilled update form
│   ├── register.html              # User registration page
│   ├── users.html                 # Users Directory
│   ├── user-detail.html           # User profile & owned snippets lookup
│   │
│   ├── css/                       # Vanilla CSS stylesheets
│   │   ├── index.css, snippets.css, detail.css, ...
│   │
│   ├── js/                        # ES6 JavaScript Controllers
│   │   ├── api.js                 # Reusable API fetch wrapper & auth widget
│   │   ├── index.js, snippets.js, detail.js, ...
│   │
│   └── assets/                    # Image & media folder placeholder
│
├── README.md                      # Project setup & documentation
└── myenv/                         # Python Virtual Environment
```

---

## 🚀 Getting Started

To run the application locally, you will need to start both the backend API server and the frontend static file server.

### Step 1: Run the Django Backend

1. Open your terminal in the project root directory.
2. Activate the python virtual environment:
   * **Windows Powershell**:
     ```powershell
     .\myenv\Scripts\Activate.ps1
     ```
   * **Windows CMD**:
     ```cmd
     .\myenv\Scripts\activate.bat
     ```
   * **Unix/macOS**:
     ```bash
     source myenv/bin/activate
     ```
3. Navigate into the `tutorial` directory and start the server:
   ```bash
   cd tutorial
   python manage.py runserver
   ```
   The backend API will run on **[http://127.0.0.1:8000/](http://127.0.0.1:8000/)**.

---

### Step 2: Run the Static Frontend

Since the frontend uses modern ES6 modules (`import`/`export`), it must be served via a web server (browsers restrict ES6 module imports over direct `file://` protocols for security reasons).

1. Open a second terminal window.
2. Start Python's built-in lightweight HTTP server inside the `frontend` folder:
   ```bash
   # From project root directory
   python -m http.server 5000 --directory frontend
   ```
3. Open your browser and go to: **[http://localhost:5000/index.html](http://localhost:5000/index.html)**.

---

## 🔑 Default Accounts

Use any of these pre-configured user credentials to log in, test snippet creation, editing, and deletion ownership:

| Username | Password | Access Type |
| :--- | :--- | :--- |
| `pratham` | `password123` | Developer account |
| `alice` | `password123` | Developer account |
| `bob` | `password123` | Developer account |
| `charlie` | `password123` | Registered account |

---

## 💡 Key Architectural Concepts Demonstrated

### 1. Unified REST Client (`frontend/js/api.js`)
Rather than duplicating AJAX requests on every page, all fetch routines are unified in `api.js` using `async/await` and `try/catch`. It maps functions to clear HTTP verbs:
* `GET` (Safe retrieval of lists and detail cards)
* `POST` (Creation payload sent inside request body)
* `PUT` (Idempotent update replacing resource values entirely)
* `DELETE` (Removes resource from SQLite database)

### 2. HTTP Basic Authentication
* **Sign-in Modal Widget**: Calling `initAuthWidget()` inside `api.js` automatically renders a modular auth state widget (a visual Sign-in card or profile Logout button) in the navigation menu of every HTML page.
* **Header Authorization**: When signed in, credentials are Base64 encoded via `btoa()` and attached to every API request header:
  `Authorization: Basic <base64(username:password)>`
* **Session Cache**: Signed-in states are cached in `sessionStorage` (cleared automatically when closing browser tabs).

### 3. REST Pagination Handling
* The DRF backend returns responses wrapped inside a page envelope:
  `{ "count": 12, "next": "...", "previous": null, "results": [...] }`
* The frontend reads metadata counters to calculate pagination lists, disabling navigation buttons dynamically when at list limits.

### 4. Cross-Origin Resource Sharing (CORS)
To make decoupling function across ports, the backend is configured using `django-cors-headers` inside `tutorial/tutorial/settings.py` by enabling:
* `CORS_ALLOW_ALL_ORIGINS = True`
This instructs the backend to attach headers like `Access-Control-Allow-Origin: *` to responses, permitting the browser to process incoming data safely.
