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

  // Clean up the unverified email
  localStorage.removeItem('unverified_email');

  // Set the flag BEFORE navigating so renderLogin can read it
  localStorage.setItem('just_verified', 'true');

  showToast('Email verified! You can now log in.', 'success');

  // Navigate once, at the end
  navigateTo('#/login');
}

function renderLogin() {
  document.getElementById('login-error').classList.add('d-none');

  // Show verified banner only if we just came from verification
  const justVerified = localStorage.getItem('just_verified');
  if (justVerified) {
    document.getElementById('login-verified-msg').classList.remove('d-none');
    localStorage.removeItem('just_verified'); // clean up immediately
  } else {
    document.getElementById('login-verified-msg').classList.add('d-none');
  }
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

function renderEmployees() {//Phase 6 [partC
  const tbody = document.getElementById('employees-tbody');
  tbody.innerHTML = '';

  if (!window.db.employees.length) {
    // Show a message if there are no employees yet
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No employees yet.</td></tr>';
  }

  window.db.employees.forEach((e, i) => {
    // Look up the department name using the stored deptId
    const dept = window.db.departments.find(d => d.id === e.deptId);

    tbody.innerHTML += `
      <tr>
        <td>${e.employeeId}</td>
        <td>${e.userEmail}</td>
        <td>${e.position}</td>
        <td>${dept ? dept.name : 'N/A'}</td>
        <td>${e.hireDate}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary me-1" onclick="editEmployee(${i})">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteEmployee(${i})">Delete</button>
        </td>
      </tr>`;
  });

  // Populate the department dropdown with current departments
  populateDeptDropdown();
}

function populateDeptDropdown() {
  const sel = document.getElementById('emp-dept');
  sel.innerHTML = '';

  window.db.departments.forEach(d => {
    sel.innerHTML += `<option value="${d.id}">${d.name}</option>`;
  });
}

function showEmployeeForm() {
  populateDeptDropdown(); // always refresh dropdown before showing
  document.getElementById('employee-form-wrap').classList.remove('d-none');
}

function hideEmployeeForm() {
  document.getElementById('employee-form-wrap').classList.add('d-none');
  document.getElementById('emp-id').value       = '';
  document.getElementById('emp-email').value    = '';
  document.getElementById('emp-position').value = '';
  document.getElementById('emp-hire').value     = '';
  document.getElementById('emp-edit-idx').value = '';
}

function editEmployee(idx) {
  const e = window.db.employees[idx];
  document.getElementById('emp-id').value       = e.employeeId;
  document.getElementById('emp-email').value    = e.userEmail;
  document.getElementById('emp-position').value = e.position;
  document.getElementById('emp-hire').value     = e.hireDate;
  document.getElementById('emp-edit-idx').value = idx;

  // Refresh dropdown then set the correct selected department
  populateDeptDropdown();
  document.getElementById('emp-dept').value = e.deptId;

  showEmployeeForm();
}

function saveEmployee() {
  const empId    = document.getElementById('emp-id').value.trim();
  const email    = document.getElementById('emp-email').value.trim().toLowerCase();
  const position = document.getElementById('emp-position').value.trim();
  const deptId   = parseInt(document.getElementById('emp-dept').value);
  const hireDate = document.getElementById('emp-hire').value;
  const editIdx  = document.getElementById('emp-edit-idx').value;

  // Validate required fields
  if (!empId || !email || !position) {
    showToast('ID, email and position are required.', 'danger');
    return;
  }

  // Make sure the email belongs to an existing account
  const matchingAccount = window.db.accounts.find(a => a.email === email);
  if (!matchingAccount) {
    showToast('No account found for that email. Create an account first.', 'danger');
    return;
  }

  if (editIdx !== '') {
    // EDIT MODE
    const e = window.db.employees[editIdx];
    e.employeeId = empId;
    e.userEmail  = email;
    e.position   = position;
    e.deptId     = deptId;
    e.hireDate   = hireDate;
  } else {
    // ADD MODE
    window.db.employees.push({
      id:         Date.now(),
      employeeId: empId,
      userEmail:  email,
      position:   position,
      deptId:     deptId,   // store the dept ID, not the name
      hireDate:   hireDate
    });
  }

  saveToStorage();
  hideEmployeeForm();
  renderEmployees();
  showToast('Employee saved.', 'success');
}

function deleteEmployee(idx) {
  if (!confirm('Delete this employee record?')) return;

  window.db.employees.splice(idx, 1);
  saveToStorage();
  renderEmployees();
  showToast('Employee deleted.', 'success');
}

function renderDepts() {//Phase 6 partB
  const tbody = document.getElementById('depts-tbody');
  tbody.innerHTML = ''; // clear existing rows first

  window.db.departments.forEach((d, i) => {
    tbody.innerHTML += `
      <tr>
        <td>${d.name}</td>
        <td>${d.description}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary me-1" onclick="editDept(${i})">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteDept(${i})">Delete</button>
        </td>
      </tr>`;
  });
}

function showDeptForm() {
  document.getElementById('dept-form-wrap').classList.remove('d-none');
}

function hideDeptForm() {
  document.getElementById('dept-form-wrap').classList.add('d-none');
  document.getElementById('dept-name').value     = '';
  document.getElementById('dept-desc').value     = '';
  document.getElementById('dept-edit-idx').value = '';
}

function editDept(idx) {
  const d = window.db.departments[idx];
  document.getElementById('dept-name').value     = d.name;
  document.getElementById('dept-desc').value     = d.description;
  document.getElementById('dept-edit-idx').value = idx;
  showDeptForm();
}

function saveDept() {
  const name    = document.getElementById('dept-name').value.trim();
  const desc    = document.getElementById('dept-desc').value.trim();
  const editIdx = document.getElementById('dept-edit-idx').value;

  // Name is required, description is optional
  if (!name) {
    showToast('Department name is required.', 'danger');
    return;
  }

  if (editIdx !== '') {
    // EDIT MODE — update existing department
    window.db.departments[editIdx].name        = name;
    window.db.departments[editIdx].description = desc;
  } else {
    // ADD MODE — create new department
    window.db.departments.push({
      id:          Date.now(),
      name:        name,
      description: desc
    });
  }

  saveToStorage();
  hideDeptForm();
  renderDepts();
  showToast('Department saved.', 'success');
}

function deleteDept(idx) {
  const d = window.db.departments[idx];

  if (!confirm('Delete department "' + d.name + '"?')) return;

  window.db.departments.splice(idx, 1);
  saveToStorage();
  renderDepts();
  showToast('Department deleted.', 'success');
}

function renderAccounts() {//Phase 6 partA
  const tbody = document.getElementById('accounts-tbody');
  tbody.innerHTML = ''; // clear existing rows first

  window.db.accounts.forEach((a, i) => {
    tbody.innerHTML += `
      <tr>
        <td>${a.firstName} ${a.lastName}</td>
        <td>${a.email}</td>
        <td>${a.role}</td>
        <td>${a.verified ? '✅' : '❌'}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary me-1" onclick="editAccount(${i})">Edit</button>
          <button class="btn btn-sm btn-warning me-1" onclick="resetPassword(${i})">Reset Password</button>
          <button class="btn btn-sm btn-danger" onclick="deleteAccount(${i})">Delete</button>
        </td>
      </tr>`;
  });
}

function showAccountForm() {
  document.getElementById('account-form-wrap').classList.remove('d-none');
}

function hideAccountForm() {
  // Hide the form and clear all fields
  document.getElementById('account-form-wrap').classList.add('d-none');
  document.getElementById('acc-first').value    = '';
  document.getElementById('acc-last').value     = '';
  document.getElementById('acc-email').value    = '';
  document.getElementById('acc-password').value = '';
  document.getElementById('acc-role').value     = 'User';
  document.getElementById('acc-verified').checked = false;
  document.getElementById('acc-edit-idx').value = '';
}

function editAccount(idx) {
  // Pre-fill the form with the existing account's data
  const a = window.db.accounts[idx];
  document.getElementById('acc-first').value       = a.firstName;
  document.getElementById('acc-last').value        = a.lastName;
  document.getElementById('acc-email').value       = a.email;
  document.getElementById('acc-role').value        = a.role;
  document.getElementById('acc-verified').checked  = a.verified;
  document.getElementById('acc-edit-idx').value    = idx; // remember which index we're editing
  showAccountForm();
}

function saveAccount() {
  const first    = document.getElementById('acc-first').value.trim();
  const last     = document.getElementById('acc-last').value.trim();
  const email    = document.getElementById('acc-email').value.trim().toLowerCase();
  const pw       = document.getElementById('acc-password').value;
  const role     = document.getElementById('acc-role').value;
  const verified = document.getElementById('acc-verified').checked;
  const editIdx  = document.getElementById('acc-edit-idx').value;

  // Basic validation
  if (!first || !last || !email) {
    showToast('Name and email are required.', 'danger');
    return;
  }

  if (editIdx !== '') {
    // EDIT MODE — update the existing account
    const a = window.db.accounts[editIdx];
    a.firstName = first;
    a.lastName  = last;
    a.email     = email;
    a.role      = role;
    a.verified  = verified;
    if (pw) a.password = pw; // only update password if a new one was typed
  } else {
    // ADD MODE — create a new account
    if (!pw || pw.length < 6) {
      showToast('Password is required and must be at least 6 chars.', 'danger');
      return;
    }
    if (window.db.accounts.find(a => a.email === email)) {
      showToast('That email already exists.', 'danger');
      return;
    }
    window.db.accounts.push({
      id: Date.now(),
      firstName: first,
      lastName:  last,
      email:     email,
      password:  pw,
      role:      role,
      verified:  verified
    });
  }

  saveToStorage();
  hideAccountForm();
  renderAccounts();
  showToast('Account saved.', 'success');
}

function resetPassword(idx) {
  const pw = prompt('Enter new password (min 6 chars):');
  if (!pw || pw.length < 6) {
    showToast('Password must be at least 6 characters.', 'danger');
    return;
  }
  window.db.accounts[idx].password = pw;
  saveToStorage();
  showToast('Password reset successfully.', 'success');
}

function deleteAccount(idx) {
  const a = window.db.accounts[idx];

  // Prevent admin from deleting themselves
  if (currentUser && a.email === currentUser.email) {
    showToast('You cannot delete your own account.', 'danger');
    return;
  }

  if (!confirm('Delete account for ' + a.email + '?')) return;

  window.db.accounts.splice(idx, 1);
  saveToStorage();
  renderAccounts();
  showToast('Account deleted.', 'success');
}

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