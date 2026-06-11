require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// ── Middleware ──
app.use(cors());
app.use(express.json());

// Serve the client folder as static files
app.use(express.static(path.join(__dirname, '..', 'client')));

// ══════════════════════════════════════
//  DATA HELPERS (JSON file as database)
// ══════════════════════════════════════
function readData() {
    try {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(raw);
    } catch (err) {
        console.error('Error reading data.json:', err.message);
        return { skills: [], projects: [] };
    }
}

function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// ══════════════════════════════════════
//  AUTH MIDDLEWARE
// ══════════════════════════════════════
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.admin = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid or expired token.' });
    }
}

// ══════════════════════════════════════
//  ADMIN LOGIN
// ══════════════════════════════════════
app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ error: 'Password is required.' });
    }

    if (password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Incorrect password.' });
    }

    // Generate JWT valid for 24 hours
    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, {
        expiresIn: '24h',
    });

    res.json({ message: 'Login successful.', token });
});

// ══════════════════════════════════════
//  SKILLS API
// ══════════════════════════════════════

// GET all skills (public)
app.get('/api/skills', (req, res) => {
    const data = readData();
    res.json(data.skills);
});

// POST add a new skill (admin only)
app.post('/api/skills', authenticateToken, (req, res) => {
    const { name, icon, row, angle, radius, filter } = req.body;

    if (!name || !icon) {
        return res.status(400).json({ error: 'Name and icon URL are required.' });
    }

    const data = readData();
    const maxId = data.skills.reduce((max, s) => Math.max(max, s.id), 0);

    const newSkill = {
        id: maxId + 1,
        name,
        icon,
        row: row || 1,
        angle: angle || 0,
        radius: radius || 200,
        filter: filter || '',
    };

    data.skills.push(newSkill);
    writeData(data);
    res.status(201).json(newSkill);
});

// PUT update a skill (admin only)
app.put('/api/skills/:id', authenticateToken, (req, res) => {
    const id = parseInt(req.params.id);
    const data = readData();
    const index = data.skills.findIndex((s) => s.id === id);

    if (index === -1) {
        return res.status(404).json({ error: 'Skill not found.' });
    }

    const { name, icon, row, angle, radius, filter } = req.body;
    if (name !== undefined) data.skills[index].name = name;
    if (icon !== undefined) data.skills[index].icon = icon;
    if (row !== undefined) data.skills[index].row = row;
    if (angle !== undefined) data.skills[index].angle = angle;
    if (radius !== undefined) data.skills[index].radius = radius;
    if (filter !== undefined) data.skills[index].filter = filter;

    writeData(data);
    res.json(data.skills[index]);
});

// DELETE remove a skill (admin only)
app.delete('/api/skills/:id', authenticateToken, (req, res) => {
    const id = parseInt(req.params.id);
    const data = readData();
    const index = data.skills.findIndex((s) => s.id === id);

    if (index === -1) {
        return res.status(404).json({ error: 'Skill not found.' });
    }

    const removed = data.skills.splice(index, 1);
    writeData(data);
    res.json({ message: 'Skill deleted.', skill: removed[0] });
});

// ══════════════════════════════════════
//  PROJECTS API
// ══════════════════════════════════════

// GET all projects (public)
app.get('/api/projects', (req, res) => {
    const data = readData();
    res.json(data.projects);
});

// POST add a new project (admin only)
app.post('/api/projects', authenticateToken, (req, res) => {
    const { title, description, image, tags, github, demo } = req.body;

    if (!title || !description) {
        return res
            .status(400)
            .json({ error: 'Title and description are required.' });
    }

    const data = readData();
    const maxId = data.projects.reduce((max, p) => Math.max(max, p.id), 0);

    const newProject = {
        id: maxId + 1,
        title,
        description,
        image: image || '',
        tags: tags || [],
        github: github || '',
        demo: demo || '',
    };

    data.projects.push(newProject);
    writeData(data);
    res.status(201).json(newProject);
});

// PUT update a project (admin only)
app.put('/api/projects/:id', authenticateToken, (req, res) => {
    const id = parseInt(req.params.id);
    const data = readData();
    const index = data.projects.findIndex((p) => p.id === id);

    if (index === -1) {
        return res.status(404).json({ error: 'Project not found.' });
    }

    const { title, description, image, tags, github, demo } = req.body;
    if (title !== undefined) data.projects[index].title = title;
    if (description !== undefined) data.projects[index].description = description;
    if (image !== undefined) data.projects[index].image = image;
    if (tags !== undefined) data.projects[index].tags = tags;
    if (github !== undefined) data.projects[index].github = github;
    if (demo !== undefined) data.projects[index].demo = demo;

    writeData(data);
    res.json(data.projects[index]);
});

// DELETE remove a project (admin only)
app.delete('/api/projects/:id', authenticateToken, (req, res) => {
    const id = parseInt(req.params.id);
    const data = readData();
    const index = data.projects.findIndex((p) => p.id === id);

    if (index === -1) {
        return res.status(404).json({ error: 'Project not found.' });
    }

    const removed = data.projects.splice(index, 1);
    writeData(data);
    res.json({ message: 'Project deleted.', project: removed[0] });
});

// ── Start server ──
app.listen(PORT, () => {
    console.log(`\n  🚀 Portfolio server running at http://localhost:${PORT}`);
    console.log(`  📁 Admin dashboard:  http://localhost:${PORT}/admin.html`);
    console.log(`  📡 API base:         http://localhost:${PORT}/api\n`);
});
