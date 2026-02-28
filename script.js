let user = {
    isLoggedIn: true,            // change to false to test logged out
    username: "Admin",
    email: "admin@example.com",
    role: "admin"
};

function updateNavbar() {

    const authSection = document.getElementById("authSection");

    if (user.isLoggedIn) {
        authSection.innerHTML = `
            <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle"
                   href="#"
                   role="button"
                   data-bs-toggle="dropdown">
                   ${user.username}
                </a>

                <ul class="dropdown-menu dropdown-menu-end">
                    <li><a class="dropdown-item" href="#">Profile</a></li>

                    <li class="role-admin">
                        <a class="dropdown-item" href="#">Employees</a>
                    </li>
                    <li class="role-admin">
                        <a class="dropdown-item" href="#">Accounts</a>
                    </li>
                    <li class="role-admin">
                        <a class="dropdown-item" href="#">Departments</a>
                    </li>

                    <li><a class="dropdown-item" href="#">My Requests</a></li>

                    <li><hr class="dropdown-divider"></li>

                    <li>
                        <a class="dropdown-item text-danger"
                           href="#"
                           onclick="logout()">
                           Logout
                        </a>
                    </li>
                </ul>
            </li>
        `;

        if (user.role !== "admin") {
            document.querySelectorAll(".role-admin")
                .forEach(el => el.style.display = "none");
        }

    } else {
        authSection.innerHTML = `
            <li class="nav-item">
                <a class="nav-link" href="#">Login</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#">Register</a>
            </li>
        `;
    }
}

function renderHome() {

    const main = document.getElementById("mainContent");

    if (user.isLoggedIn) {

        main.innerHTML = `
            <h3 class="mb-3">My Profile</h3>

            <div class="card shadow-sm">
                <div class="card-body">

                    <h5 class="card-title">${user.username}</h5>
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p><strong>Role:</strong> ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>

                    <button class="btn btn-outline-primary btn-sm">
                        Edit Profile
                    </button>

                </div>
            </div>
        `;

    } else {

        main.innerHTML = `
            <h1 class="fw-bold">Welcome to Full-Stack App</h1>

            <p class="lead">
                A static prototype before backend integration.
            </p>

            <button class="btn btn-primary mt-3">
                Get Started →
            </button>
        `;
    }
}

function logout() {
    user.isLoggedIn = false;
    renderHome();
    updateNavbar();
}

document.addEventListener("DOMContentLoaded", () => {
    updateNavbar();
    renderHome();
});