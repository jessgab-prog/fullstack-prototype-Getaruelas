// The currently logged-in user. null means nobody is logged in.
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


// ── Placeholder render functions 
// These are empty for now. We'll fill them in later phases.
// They need to exist so handleRouting doesn't crash when it calls them.

function renderVerify()    { /* Phase 3 */ }
function renderLogin()     { /* Phase 3 */ }
function renderProfile()   { /* Phase 5 */ }
function renderEmployees() { /* Phase 6 */ }
function renderDepts()     { /* Phase 6 */ }
function renderAccounts()  { /* Phase 6 */ }
function renderRequests()  { /* Phase 7 */ }

// Placeholder so the navbar Logout link doesn't crash yet
function doLogout() { /* Phase 3 */ }

// Placeholder toast so the access denied message doesn't crash
function showToast(message, type) {
  alert(type.toUpperCase() + ': ' + message);
}


// ── Init 
// This runs once when the page first loads.
(function init() {
  // If URL has no hash at all, default to home
  if (!window.location.hash) navigateTo('#/');

  // Show the correct page for the current URL
  handleRouting();
})();