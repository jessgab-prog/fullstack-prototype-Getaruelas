//Phase 4
// The key we use to store everything in localStorage
const STORAGE_KEY = 'ipt_demo_v1';


// ── loadFromStorage ──────────────────────────────────
// Runs once on startup. Loads saved data from localStorage into window.db.
// If nothing is saved yet (first visit), seeds the database with default data.
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (raw) {
      // Data exists — parse and use it
      window.db = JSON.parse(raw);
    } else {
      // First visit — no data yet, seed with defaults
      seedDb();
    }
  } catch (e) {
    // JSON.parse failed — data is corrupted, start fresh
    seedDb();
  }
}


// ── seedDb ───────────────────────────────────────────
// Creates the default starting data.
// Called only when localStorage is empty or corrupted.
function seedDb() {
  window.db = {
    accounts: [
      {
        id:        1,
        firstName: 'Admin',
        lastName:  'User',
        email:     'admin@example.com',
        password:  'Password123!',
        role:      'Admin',
        verified:  true        // admin can log in immediately, no verification needed
      }
    ],
    departments: [
      { id: 1, name: 'Engineering', description: 'Software team' },
      { id: 2, name: 'HR',          description: 'Human Resources' }
    ],
    employees: [],
    requests:  []
  };

  saveToStorage();
}


// ── saveToStorage ────────────────────────────────────
// Call this after ANY change to window.db to persist the data.
// Converts the object to a JSON string and saves it.
function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db));
}
let currentUser = null;

// These routes require the user to be logged in
const protectedRoutes = ['#/profile', '#/requests'];

// These routes require the user to be an admin
const adminRoutes = ['#/employees', '#/accounts', '#/departments'];


// ── navigateTo    
// Call this anywhere in the app to change the page.
// Example: navigateTo('#/login')
function navigateTo(hash) {
  window.location.hash = hash;
}


// ── handleRouting 
// This runs every time the URL hash changes.
// It decides which page to show based on the current hash.
function handleRouting() {
  const hash = window.location.hash || '#/';

  // Guard: not logged in trying to visit a protected page
  if (protectedRoutes.includes(hash) && !currentUser) {
    navigateTo('#/login');
    return;
  }

  // Guard: non-admin trying to visit an admin page
  if (adminRoutes.includes(hash) && (!currentUser || currentUser.role !== 'Admin')) {
    showToast('Access denied.', 'danger');
    navigateTo('#/');
    return;
  }

  // Hide every page first
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

  // Map each hash to: [section id, render function]
  // The render function fills in dynamic content when you land on a page
  const map = {
    '#/':             ['home-page',         null],
    '#/register':     ['register-page',     null],
    '#/verify-email': ['verify-email-page', renderVerify],
    '#/login':        ['login-page',        renderLogin],
    '#/profile':      ['profile-page',      renderProfile],
    '#/employees':    ['employees-page',    renderEmployees],
    '#/departments':  ['departments-page',  renderDepts],
    '#/accounts':     ['accounts-page',     renderAccounts],
    '#/requests':     ['requests-page',     renderRequests],
  };

  // Look up the entry, fall back to home if hash is unknown
  const entry = map[hash] || map['#/'];

  // Show the matching section
  const el = document.getElementById(entry[0]);
  if (el) el.classList.add('active');

  // Call the render function if one exists
  if (entry[1]) entry[1]();
}


// ── Event listeners 

// Fire handleRouting every time the hash changes
window.addEventListener('hashchange', handleRouting);

function doRegister() {
  // Grab values from the form
  const first = document.getElementById('reg-first').value.trim();
  const last  = document.getElementById('reg-last').value.trim();
  const email = document.getElementById('reg-email').value.trim().toLowerCase();
  const pw    = document.getElementById('reg-password').value;

  // Validate — all fields must be filled, password min 6 chars
  if (!first || !last || !email || !pw) {
    showToast('All fields are required.', 'danger');
    return;
  }
  if (pw.length < 6) {
    showToast('Password must be at least 6 characters.', 'danger');
    return;
  }

  // Check if email is already taken
  if (window.db.accounts.find(a => a.email === email)) {
    showToast('That email is already registered.', 'danger');
    return;
  }

  // Build the new account object and save it
  const newAccount = {
    id:        Date.now(),   // simple unique ID using timestamp
    firstName: first,
    lastName:  last,
    email:     email,
    password:  pw,
    role:      'User',       // all new registrations are regular users
    verified:  false         // must verify email before logging in
  };

  window.db.accounts.push(newAccount);
  saveToStorage();

  // Store the email so the verify page knows who to verify
  localStorage.setItem('unverified_email', email);

  // Send them to the verify page
  navigateTo('#/verify-email');
}

// ── Placeholder render functions 
// These are empty for now. We'll fill them in later phases.
// They need to exist so handleRouting doesn't crash when it calls them.

function renderVerify() { //Phase 3
  // Read the email we stored during registration
  const email = localStorage.getItem('unverified_email') || '';

  // Show it on the page so the user knows where the "email" was sent
  document.getElementById('verify-msg').textContent =
    'A verification link has been sent to ' + email + '.';
}
function doVerify() {
  const email = localStorage.getItem('unverified_email');

  // Find the account and flip verified to true
  const acc = window.db.accounts.find(a => a.email === email);
  if (acc) {
    acc.verified = true;
    saveToStorage();
  }

  // Clean up — we no longer need this stored email
  localStorage.removeItem('unverified_email');

  showToast('Email verified! You can now log in.', 'success');

  // Show the green banner on the login page
  document.getElementById('login-verified-msg').classList.remove('d-none');

  navigateTo('#/login');
}

function renderLogin() {
  // Hide the error message whenever we land on the login page fresh
  document.getElementById('login-error').classList.add('d-none');
}
function doLogin() {
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const pw    = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');

  // Find account where email AND password match AND is verified
  const acc = window.db.accounts.find(
    a => a.email === email && a.password === pw && a.verified === true
  );

  // If nothing found, show error and stop
  if (!acc) {
    errEl.textContent = 'Invalid credentials, or email not verified.';
    errEl.classList.remove('d-none');
    return;
  }

  // Hide any previous error
  errEl.classList.add('d-none');

  // Save a token — in a real app this would be a JWT from the server
  // Here we just store the email to remember who is logged in
  localStorage.setItem('auth_token', email);

  // Update the app state and UI
  setAuthState(true, acc);

  // Send them to their profile
  navigateTo('#/profile');
}
function setAuthState(isAuth, user) {
  currentUser = isAuth ? user : null;

  const body = document.body;

  if (isAuth) {
    // Swap body classes — CSS does the rest automatically
    body.classList.remove('not-authenticated');
    body.classList.add('authenticated');

    // Add is-admin class if user is an admin
    if (user.role === 'Admin') {
      body.classList.add('is-admin');
    } else {
      body.classList.remove('is-admin');
    }

    // Update the navbar dropdown button with the user's real name
    document.getElementById('nav-username').textContent =
      user.firstName + ' ' + user.lastName;

  } else {
    // Logging out — reset everything
    body.classList.remove('authenticated', 'is-admin');
    body.classList.add('not-authenticated');
  }
}
// Placeholder so the navbar Logout link doesn't crash yet
function doLogout() {
  // Remove the stored token
  localStorage.removeItem('auth_token');

  // Reset the UI back to logged-out state
  setAuthState(false);

  showToast('Logged out successfully.', 'info');

  navigateTo('#/');
}

function renderProfile() {//Phase 5
  // Safety check — should never be null here because the
  // router blocks unauthenticated users, but good practice
  if (!currentUser) return;

  // Grab the profile elements and fill them with the current user's data
  document.getElementById('profile-name').textContent =
    currentUser.firstName + ' ' + currentUser.lastName;

  document.getElementById('profile-email').textContent = currentUser.email;

  document.getElementById('profile-role').textContent = currentUser.role;
}
function renderDepts()     { /* Phase 6 */ }
function renderAccounts()  { /* Phase 6 */ }
function renderRequests()  { /* Phase 7 */ }

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  
  // Create the toast element
  const el = document.createElement('div');
  el.className = 'toast-msg ' + type;
  el.textContent = message;

  container.appendChild(el);

  // Auto-remove after 2.5 seconds with a fade
  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 400);
  }, 2500);
}

// ── Init 
// This runs once when the page first loads.
(function init() {
  loadFromStorage(); // Phase 4 — loads window.db from localStorage

  // Check if a token exists from a previous session
  const token = localStorage.getItem('auth_token');
  if (token) {
    // Find the matching account
    const user = window.db.accounts.find(a => a.email === token);
    if (user) {
      // Restore their logged-in state silently
      setAuthState(true, user);
    }
  }

  if (!window.location.hash) navigateTo('#/');
  handleRouting();
})();