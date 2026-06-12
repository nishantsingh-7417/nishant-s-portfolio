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

    // Resume elements
    const resumeStatus = document.getElementById('resume-status');
    const resumeFile = document.getElementById('resume-file');
    const resumeDropZone = document.getElementById('resume-drop-zone');
    const resumeActions = document.getElementById('resume-actions');
    const resumeSelectedName = document.getElementById('resume-selected-name');
    const uploadResumeBtn = document.getElementById('upload-resume-btn');
    const cancelResumeBtn = document.getElementById('cancel-resume-btn');

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
            loadResume();
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
    //  RESUME MANAGEMENT
    // ══════════════════════════════════════
    let selectedResumeFile = null;

    async function loadResume() {
        try {
            const res = await fetch(`${API_BASE}/resume`);
            if (res.status === 404) {
                resumeStatus.innerHTML = `
                    <div class="resume-info">
                        <div class="resume-info-details">
                            <h4>No resume uploaded</h4>
                            <p class="resume-meta">Upload a PDF to let visitors download your resume.</p>
                        </div>
                    </div>`;
                return;
            }
            const data = await res.json();
            const date = new Date(data.uploadedAt).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric',
            });
            const sizeKB = (data.size / 1024).toFixed(1);
            resumeStatus.innerHTML = `
                <div class="resume-info">
                    <div class="resume-info-details">
                        <h4>📄 ${data.originalName}</h4>
                        <p class="resume-meta">Uploaded ${date} · ${sizeKB} KB</p>
                    </div>
                    <div class="resume-info-actions">
                        <a href="/api/resume/download" target="_blank" class="btn btn-primary btn-sm">Preview</a>
                        <button class="btn-delete" id="delete-resume-btn">Delete</button>
                    </div>
                </div>`;

            // Bind delete
            document.getElementById('delete-resume-btn').addEventListener('click', deleteResume);
        } catch (err) {
            resumeStatus.innerHTML = '<p class="loading-text">Failed to check resume.</p>';
        }
    }

    async function uploadResume() {
        if (!selectedResumeFile) return;

        const formData = new FormData();
        formData.append('resume', selectedResumeFile);

        try {
            uploadResumeBtn.textContent = 'Uploading...';
            uploadResumeBtn.disabled = true;

            const res = await fetch(`${API_BASE}/resume`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${authToken}` },
                body: formData,
            });

            const result = await res.json();
            if (!res.ok) {
                showToast(result.error || 'Upload failed.', 'error');
                return;
            }

            showToast('Resume uploaded!');
            resetResumeForm();
            loadResume();
        } catch (err) {
            showToast('Server error.', 'error');
        } finally {
            uploadResumeBtn.textContent = 'Upload';
            uploadResumeBtn.disabled = false;
        }
    }

    async function deleteResume() {
        if (!confirm('Delete the resume?')) return;
        try {
            const res = await fetch(`${API_BASE}/resume`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${authToken}` },
            });
            if (!res.ok) {
                const data = await res.json();
                showToast(data.error || 'Delete failed.', 'error');
                return;
            }
            showToast('Resume deleted.');
            loadResume();
        } catch (err) {
            showToast('Server error.', 'error');
        }
    }

    function resetResumeForm() {
        selectedResumeFile = null;
        resumeFile.value = '';
        resumeActions.style.display = 'none';
        resumeSelectedName.textContent = '';
    }

    // File input change
    resumeFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        selectedResumeFile = file;
        resumeSelectedName.textContent = file.name;
        resumeActions.style.display = 'flex';
    });

    // Drag & drop
    resumeDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        resumeDropZone.classList.add('drag-over');
    });
    resumeDropZone.addEventListener('dragleave', () => {
        resumeDropZone.classList.remove('drag-over');
    });
    resumeDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        resumeDropZone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file && file.type === 'application/pdf') {
            selectedResumeFile = file;
            resumeSelectedName.textContent = file.name;
            resumeActions.style.display = 'flex';
        } else {
            showToast('Only PDF files are allowed.', 'error');
        }
    });

    uploadResumeBtn.addEventListener('click', uploadResume);
    cancelResumeBtn.addEventListener('click', resetResumeForm);

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
                <div class="item-card-actions">
                    <button class="btn-edit" onclick="editSkill(${s.id})">Edit</button>
                    <button class="btn-delete" onclick="deleteSkill(${s.id})">Delete</button>
                </div>
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

    // Edit skill — populate form with existing data
    window.editSkill = function (id) {
        // Find the skill from the rendered cards
        const card = skillsList.querySelector(`[data-id="${id}"]`);
        if (!card) return;

        // Fetch current data from API
        fetch(`${API_BASE}/skills`)
            .then(r => r.json())
            .then(skills => {
                const s = skills.find(sk => sk.id === id);
                if (!s) return;

                document.getElementById('skill-name').value = s.name;
                document.getElementById('skill-icon').value = s.icon;
                document.getElementById('skill-row').value = s.row;
                document.getElementById('skill-angle').value = s.angle;
                document.getElementById('skill-radius').value = s.radius;
                document.getElementById('skill-filter').value = s.filter || '';

                addSkillForm.classList.remove('hidden');
                addSkillForm.setAttribute('data-edit-id', id);
                addSkillForm.querySelector('h3').textContent = 'Edit Skill';
                saveSkillBtn.textContent = 'Update Skill';
            });
    };

    function clearSkillForm() {
        document.getElementById('skill-name').value = '';
        document.getElementById('skill-icon').value = '';
        document.getElementById('skill-row').value = '1';
        document.getElementById('skill-angle').value = '0';
        document.getElementById('skill-radius').value = '200';
        document.getElementById('skill-filter').value = '';
        addSkillForm.removeAttribute('data-edit-id');
        addSkillForm.querySelector('h3').textContent = 'Add New Skill';
        saveSkillBtn.textContent = 'Save Skill';
    }

    // Toggle add form
    toggleAddSkill.addEventListener('click', () => {
        if (!addSkillForm.classList.contains('hidden')) {
            addSkillForm.classList.add('hidden');
            clearSkillForm();
        } else {
            clearSkillForm();
            addSkillForm.classList.remove('hidden');
        }
    });
    cancelSkillBtn.addEventListener('click', () => {
        addSkillForm.classList.add('hidden');
        clearSkillForm();
    });

    // Save skill (create or update)
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

        const editId = addSkillForm.getAttribute('data-edit-id');
        const isEdit = !!editId;
        const url = isEdit ? `${API_BASE}/skills/${editId}` : `${API_BASE}/skills`;
        const method = isEdit ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
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

            showToast(isEdit ? 'Skill updated!' : 'Skill added!');
            addSkillForm.classList.add('hidden');
            clearSkillForm();
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
                <div class="item-card-actions">
                    <button class="btn-edit" onclick="editProject(${p.id})">Edit</button>
                    <button class="btn-delete" onclick="deleteProject(${p.id})">Delete</button>
                </div>
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

    // Edit project — populate form with existing data
    window.editProject = async function (id) {
        try {
            const res = await fetch(`${API_BASE}/projects`);
            const projects = await res.json();
            const p = projects.find(proj => proj.id === id);
            if (!p) return;

            document.getElementById('project-title').value = p.title;
            document.getElementById('project-desc').value = p.description;
            document.getElementById('project-image').value = p.image || '';
            document.getElementById('project-tags').value = (p.tags || []).join(', ');
            document.getElementById('project-github').value = p.github || '';
            document.getElementById('project-demo').value = p.demo || '';

            addProjectForm.classList.remove('hidden');
            addProjectForm.setAttribute('data-edit-id', id);
            addProjectForm.querySelector('h3').textContent = 'Edit Project';
            saveProjectBtn.textContent = 'Update Project';
        } catch (err) {
            showToast('Failed to load project data.', 'error');
        }
    };

    function clearProjectForm() {
        document.getElementById('project-title').value = '';
        document.getElementById('project-desc').value = '';
        document.getElementById('project-image').value = '';
        document.getElementById('project-tags').value = '';
        document.getElementById('project-github').value = '';
        document.getElementById('project-demo').value = '';
        addProjectForm.removeAttribute('data-edit-id');
        addProjectForm.querySelector('h3').textContent = 'Add New Project';
        saveProjectBtn.textContent = 'Save Project';
    }

    // Toggle add form
    toggleAddProject.addEventListener('click', () => {
        if (!addProjectForm.classList.contains('hidden')) {
            addProjectForm.classList.add('hidden');
            clearProjectForm();
        } else {
            clearProjectForm();
            addProjectForm.classList.remove('hidden');
        }
    });
    cancelProjectBtn.addEventListener('click', () => {
        addProjectForm.classList.add('hidden');
        clearProjectForm();
    });

    // Save project (create or update)
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

        const editId = addProjectForm.getAttribute('data-edit-id');
        const isEdit = !!editId;
        const url = isEdit ? `${API_BASE}/projects/${editId}` : `${API_BASE}/projects`;
        const method = isEdit ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
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

            showToast(isEdit ? 'Project updated!' : 'Project added!');
            addProjectForm.classList.add('hidden');
            clearProjectForm();
            loadProjects();
        } catch (err) {
            showToast('Server error.', 'error');
        }
    });

    // ── Init ──
    checkAuth();
})();
