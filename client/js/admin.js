/* ══════════════════════════════════════
   ADMIN DASHBOARD LOGIC
   ══════════════════════════════════════ */
(function () {
    const API_BASE = window.location.origin + '/api';
    let authToken = localStorage.getItem('portfolio_admin_token') || null;

    // ── DOM Elements ──
    const loginScreen = document.getElementById('login-screen');
    const dashboard = document.getElementById('dashboard');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const logoutBtn = document.getElementById('logout-btn');

    const skillsList = document.getElementById('skills-list');
    const projectsList = document.getElementById('projects-list');

    const toggleAddSkill = document.getElementById('toggle-add-skill');
    const addSkillForm = document.getElementById('add-skill-form');
    const saveSkillBtn = document.getElementById('save-skill-btn');
    const cancelSkillBtn = document.getElementById('cancel-skill-btn');

    const toggleAddProject = document.getElementById('toggle-add-project');
    const addProjectForm = document.getElementById('add-project-form');
    const saveProjectBtn = document.getElementById('save-project-btn');
    const cancelProjectBtn = document.getElementById('cancel-project-btn');

    // ══════════════════════════════════════
    //  TOAST NOTIFICATION
    // ══════════════════════════════════════
    let toastEl = document.createElement('div');
    toastEl.className = 'toast';
    document.body.appendChild(toastEl);

    function showToast(msg, type = 'success') {
        toastEl.textContent = msg;
        toastEl.className = `toast ${type} show`;
        setTimeout(() => {
            toastEl.classList.remove('show');
        }, 3000);
    }

    // ══════════════════════════════════════
    //  AUTH
    // ══════════════════════════════════════
    function checkAuth() {
        if (authToken) {
            loginScreen.classList.add('hidden');
            dashboard.classList.remove('hidden');
            loadSkills();
            loadProjects();
        } else {
            loginScreen.classList.remove('hidden');
            dashboard.classList.add('hidden');
        }
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginError.textContent = '';
        const password = document.getElementById('login-password').value;

        try {
            const res = await fetch(`${API_BASE}/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });
            const data = await res.json();

            if (!res.ok) {
                loginError.textContent = data.error || 'Login failed.';
                return;
            }

            authToken = data.token;
            localStorage.setItem('portfolio_admin_token', authToken);
            checkAuth();
            showToast('Welcome back, Admin!');
        } catch (err) {
            loginError.textContent = 'Server unreachable. Is the backend running?';
        }
    });

    logoutBtn.addEventListener('click', () => {
        authToken = null;
        localStorage.removeItem('portfolio_admin_token');
        checkAuth();
    });

    // ══════════════════════════════════════
    //  SKILLS CRUD
    // ══════════════════════════════════════
    async function loadSkills() {
        try {
            const res = await fetch(`${API_BASE}/skills`);
            const skills = await res.json();
            renderSkills(skills);
        } catch (err) {
            skillsList.innerHTML = '<p class="loading-text">Failed to load skills.</p>';
        }
    }

    function renderSkills(skills) {
        if (!skills.length) {
            skillsList.innerHTML = '<p class="loading-text">No skills yet. Add one!</p>';
            return;
        }

        skillsList.innerHTML = skills
            .map(
                (s) => `
            <div class="item-card" data-id="${s.id}">
                <div class="item-card-icon">
                    <img src="${s.icon}" alt="${s.name}" class="${s.filter || ''}">
                </div>
                <h4>${s.name}</h4>
                <p class="item-meta">Row ${s.row} · ${s.angle}° · ${s.radius}px</p>
                <button class="btn-delete" onclick="deleteSkill(${s.id})">Delete</button>
            </div>
        `
            )
            .join('');
    }

    // Expose to global scope for inline onclick
    window.deleteSkill = async function (id) {
        if (!confirm('Delete this skill?')) return;

        try {
            const res = await fetch(`${API_BASE}/skills/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${authToken}` },
            });

            if (!res.ok) {
                const data = await res.json();
                showToast(data.error || 'Delete failed.', 'error');
                return;
            }

            showToast('Skill deleted.');
            loadSkills();
        } catch (err) {
            showToast('Server error.', 'error');
        }
    };

    // Toggle add form
    toggleAddSkill.addEventListener('click', () => {
        addSkillForm.classList.toggle('hidden');
    });
    cancelSkillBtn.addEventListener('click', () => {
        addSkillForm.classList.add('hidden');
    });

    // Save skill
    saveSkillBtn.addEventListener('click', async () => {
        const name = document.getElementById('skill-name').value.trim();
        const icon = document.getElementById('skill-icon').value.trim();
        const row = parseInt(document.getElementById('skill-row').value);
        const angle = parseInt(document.getElementById('skill-angle').value);
        const radius = parseInt(document.getElementById('skill-radius').value);
        const filter = document.getElementById('skill-filter').value;

        if (!name || !icon) {
            showToast('Name and Icon URL are required.', 'error');
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/skills`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({ name, icon, row, angle, radius, filter }),
            });

            if (!res.ok) {
                const data = await res.json();
                showToast(data.error || 'Save failed.', 'error');
                return;
            }

            showToast('Skill added!');
            addSkillForm.classList.add('hidden');

            // Clear form
            document.getElementById('skill-name').value = '';
            document.getElementById('skill-icon').value = '';
            document.getElementById('skill-row').value = '1';
            document.getElementById('skill-angle').value = '0';
            document.getElementById('skill-radius').value = '200';
            document.getElementById('skill-filter').value = '';

            loadSkills();
        } catch (err) {
            showToast('Server error.', 'error');
        }
    });

    // ══════════════════════════════════════
    //  PROJECTS CRUD
    // ══════════════════════════════════════
    async function loadProjects() {
        try {
            const res = await fetch(`${API_BASE}/projects`);
            const projects = await res.json();
            renderProjects(projects);
        } catch (err) {
            projectsList.innerHTML =
                '<p class="loading-text">Failed to load projects.</p>';
        }
    }

    function renderProjects(projects) {
        if (!projects.length) {
            projectsList.innerHTML =
                '<p class="loading-text">No projects yet. Add one!</p>';
            return;
        }

        projectsList.innerHTML = projects
            .map(
                (p) => `
            <div class="item-card project-item-card" data-id="${p.id}">
                <div class="project-info">
                    <h4>${p.title}</h4>
                    <p class="project-desc">${p.description}</p>
                    <div class="project-tags">
                        ${(p.tags || []).map((t) => `<span>${t}</span>`).join('')}
                    </div>
                    <div class="project-links">
                        ${p.github ? `<a href="${p.github}" target="_blank">GitHub ↗</a>` : ''}
                        ${p.demo ? `<a href="${p.demo}" target="_blank">Live Demo ↗</a>` : ''}
                    </div>
                </div>
                <button class="btn-delete" onclick="deleteProject(${p.id})">Delete</button>
            </div>
        `
            )
            .join('');
    }

    window.deleteProject = async function (id) {
        if (!confirm('Delete this project?')) return;

        try {
            const res = await fetch(`${API_BASE}/projects/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${authToken}` },
            });

            if (!res.ok) {
                const data = await res.json();
                showToast(data.error || 'Delete failed.', 'error');
                return;
            }

            showToast('Project deleted.');
            loadProjects();
        } catch (err) {
            showToast('Server error.', 'error');
        }
    };

    // Toggle add form
    toggleAddProject.addEventListener('click', () => {
        addProjectForm.classList.toggle('hidden');
    });
    cancelProjectBtn.addEventListener('click', () => {
        addProjectForm.classList.add('hidden');
    });

    // Save project
    saveProjectBtn.addEventListener('click', async () => {
        const title = document.getElementById('project-title').value.trim();
        const description = document.getElementById('project-desc').value.trim();
        const image = document.getElementById('project-image').value.trim();
        const tagsRaw = document.getElementById('project-tags').value.trim();
        const github = document.getElementById('project-github').value.trim();
        const demo = document.getElementById('project-demo').value.trim();

        if (!title || !description) {
            showToast('Title and description are required.', 'error');
            return;
        }

        const tags = tagsRaw
            ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean)
            : [];

        try {
            const res = await fetch(`${API_BASE}/projects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({ title, description, image, tags, github, demo }),
            });

            if (!res.ok) {
                const data = await res.json();
                showToast(data.error || 'Save failed.', 'error');
                return;
            }

            showToast('Project added!');
            addProjectForm.classList.add('hidden');

            // Clear form
            document.getElementById('project-title').value = '';
            document.getElementById('project-desc').value = '';
            document.getElementById('project-image').value = '';
            document.getElementById('project-tags').value = '';
            document.getElementById('project-github').value = '';
            document.getElementById('project-demo').value = '';

            loadProjects();
        } catch (err) {
            showToast('Server error.', 'error');
        }
    });

    // ── Init ──
    checkAuth();
})();
