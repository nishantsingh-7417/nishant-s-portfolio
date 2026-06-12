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

// ══════════════════════════════════════
//  RESUME API
// ══════════════════════════════════════
const multer = require('multer');

const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Configure multer — single PDF, max 10 MB
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => {
        // Always save as resume.<ext> so there's only ever one file
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `resume${ext}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed.'));
        }
    },
});

// GET resume info (public) — returns metadata, not the file
app.get('/api/resume', (req, res) => {
    const data = readData();
    if (!data.resume || !data.resume.filename) {
        return res.status(404).json({ error: 'No resume uploaded yet.' });
    }

    const filePath = path.join(UPLOADS_DIR, data.resume.filename);
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Resume file not found on disk.' });
    }

    res.json({
        filename: data.resume.filename,
        originalName: data.resume.originalName,
        uploadedAt: data.resume.uploadedAt,
        size: data.resume.size,
        downloadUrl: '/api/resume/download',
    });
});

// GET resume download (public) — serves the actual PDF
app.get('/api/resume/download', (req, res) => {
    const data = readData();
    if (!data.resume || !data.resume.filename) {
        return res.status(404).json({ error: 'No resume uploaded yet.' });
    }

    const filePath = path.join(UPLOADS_DIR, data.resume.filename);
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Resume file not found on disk.' });
    }

    // Use the original filename for the download
    const downloadName = data.resume.originalName || data.resume.filename;
    res.download(filePath, downloadName);
});

// POST upload resume (admin only)
app.post('/api/resume', authenticateToken, (req, res) => {
    upload.single('resume')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: 'File too large. Max 10 MB.' });
            }
            return res.status(400).json({ error: err.message });
        }
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded.' });
        }

        // Delete old resume if it exists and has a different filename
        const data = readData();
        if (data.resume && data.resume.filename && data.resume.filename !== req.file.filename) {
            const oldPath = path.join(UPLOADS_DIR, data.resume.filename);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }

        // Save metadata
        data.resume = {
            filename: req.file.filename,
            originalName: req.file.originalname,
            uploadedAt: new Date().toISOString(),
            size: req.file.size,
        };
        writeData(data);

        res.json({
            message: 'Resume uploaded successfully.',
            resume: data.resume,
        });
    });
});

// DELETE resume (admin only)
app.delete('/api/resume', authenticateToken, (req, res) => {
    const data = readData();
    if (!data.resume || !data.resume.filename) {
        return res.status(404).json({ error: 'No resume to delete.' });
    }

    const filePath = path.join(UPLOADS_DIR, data.resume.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    delete data.resume;
    writeData(data);
    res.json({ message: 'Resume deleted.' });
});

// ── Start server ──
app.listen(PORT, () => {
    console.log(`\n  🚀 Portfolio server running at http://localhost:${PORT}`);
    console.log(`  📁 Admin dashboard:  http://localhost:${PORT}/admin.html`);
    console.log(`  📡 API base:         http://localhost:${PORT}/api\n`);
});
