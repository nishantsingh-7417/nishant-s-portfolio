const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
  // ssl: { rejectUnauthorized: false } // Only needed for remote DBs
});

// ── Middleware ──
app.use(cors());
app.use(express.json());

// Serve the client folder as static files
app.use(express.static(path.join(__dirname, '..', 'client')));
// Serve uploads folder as static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

// Verify token validity (used by admin dashboard on page load)
app.get('/api/admin/verify', authenticateToken, (req, res) => {
    res.json({ valid: true, role: req.admin.role });
});

// ══════════════════════════════════════
//  SKILLS API
// ══════════════════════════════════════

// GET all skills (public)
app.get('/api/skills', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM skills ORDER BY id ASC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST add a new skill (admin only)
app.post('/api/skills', authenticateToken, async (req, res) => {
    const { name, icon, row, angle, radius, filter } = req.body;

    if (!name || !icon) {
        return res.status(400).json({ error: 'Name and icon URL are required.' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO skills (name, icon, row, angle, radius, filter) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [name, icon, row || 1, angle || 0, radius || 200, filter || '']
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT update a skill (admin only)
app.put('/api/skills/:id', authenticateToken, async (req, res) => {
    const id = parseInt(req.params.id);
    const { name, icon, row, angle, radius, filter } = req.body;

    try {
        const result = await pool.query(
            'UPDATE skills SET name = COALESCE($1, name), icon = COALESCE($2, icon), row = COALESCE($3, row), angle = COALESCE($4, angle), radius = COALESCE($5, radius), filter = COALESCE($6, filter) WHERE id = $7 RETURNING *',
            [name, icon, row, angle, radius, filter, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Skill not found.' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE remove a skill (admin only)
app.delete('/api/skills/:id', authenticateToken, async (req, res) => {
    const id = parseInt(req.params.id);

    try {
        const result = await pool.query('DELETE FROM skills WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Skill not found.' });
        }
        res.json({ message: 'Skill deleted.', skill: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ══════════════════════════════════════
//  PROJECTS API
// ══════════════════════════════════════

// GET all projects (public)
app.get('/api/projects', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM projects ORDER BY id ASC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST add a new project (admin only)
app.post('/api/projects', authenticateToken, async (req, res) => {
    const { title, description, image, tags, github, demo } = req.body;

    if (!title || !description) {
        return res.status(400).json({ error: 'Title and description are required.' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO projects (title, description, image, tags, github, demo) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [title, description, image || '', tags || [], github || '', demo || '']
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT update a project (admin only)
app.put('/api/projects/:id', authenticateToken, async (req, res) => {
    const id = parseInt(req.params.id);
    const { title, description, image, tags, github, demo } = req.body;

    try {
        const result = await pool.query(
            'UPDATE projects SET title = COALESCE($1, title), description = COALESCE($2, description), image = COALESCE($3, image), tags = COALESCE($4, tags), github = COALESCE($5, github), demo = COALESCE($6, demo) WHERE id = $7 RETURNING *',
            [title, description, image, tags, github, demo, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found.' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE remove a project (admin only)
app.delete('/api/projects/:id', authenticateToken, async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const result = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found.' });
        }
        res.json({ message: 'Project deleted.', project: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ══════════════════════════════════════
//  RESUME API (Local files for now)
// ══════════════════════════════════════
const multer = require('multer');

const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Configure multer — single PDF, max 10 MB
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => {
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
app.get('/api/resume', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM resume_metadata ORDER BY id DESC LIMIT 1');
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No resume uploaded yet.' });
        }

        const data = result.rows[0];
        // Ensure file exists
        const filePath = path.join(UPLOADS_DIR, data.filename);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Resume file not found on disk.' });
        }

        res.json({
            filename: data.filename,
            originalName: data.original_name,
            uploadedAt: data.uploaded_at,
            size: data.size,
            downloadUrl: '/api/resume/download',
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET resume download (public) — serves the actual PDF
app.get('/api/resume/download', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM resume_metadata ORDER BY id DESC LIMIT 1');
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No resume uploaded yet.' });
        }
        
        const data = result.rows[0];
        const filePath = path.join(UPLOADS_DIR, data.filename);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Resume file not found on disk.' });
        }

        const downloadName = data.original_name || data.filename;
        res.download(filePath, downloadName);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST upload resume (admin only)
app.post('/api/resume', authenticateToken, (req, res) => {
    upload.single('resume')(req, res, async (err) => {
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

        try {
            // Delete old resume metadata
            await pool.query('DELETE FROM resume_metadata');
            
            // Insert new metadata
            const result = await pool.query(
                'INSERT INTO resume_metadata (filename, original_name, size) VALUES ($1, $2, $3) RETURNING *',
                [req.file.filename, req.file.originalname, req.file.size]
            );

            res.json({
                message: 'Resume uploaded successfully.',
                resume: {
                    filename: result.rows[0].filename,
                    originalName: result.rows[0].original_name,
                    uploadedAt: result.rows[0].uploaded_at,
                    size: result.rows[0].size
                }
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
});

// DELETE resume (admin only)
app.delete('/api/resume', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM resume_metadata RETURNING *');
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No resume to delete.' });
        }
        
        const data = result.rows[0];
        const filePath = path.join(UPLOADS_DIR, data.filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        res.json({ message: 'Resume deleted.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ══════════════════════════════════════
//  IMAGE UPLOAD API (Local files for now)
// ══════════════════════════════════════
const uploadImageConfig = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, UPLOADS_DIR),
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname).toLowerCase();
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, `img-${uniqueSuffix}${ext}`);
        }
    }),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed.'));
        }
    }
});

app.post('/api/upload', authenticateToken, (req, res) => {
    uploadImageConfig.single('image')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ error: err.message });
        } else if (err) {
            return res.status(400).json({ error: err.message });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded.' });
        }
        res.json({ url: `/uploads/${req.file.filename}` });
    });
});

// ══════════════════════════════════════
//  BLOGS API 
// ══════════════════════════════════════

// GET all blogs (public)
app.get('/api/blogs', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM blogs ORDER BY id ASC');
        res.json({ posts: result.rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST add a new blog (admin only)
app.post('/api/blogs', authenticateToken, async (req, res) => {
    const { title, description, link } = req.body;

    if (!title || !description || !link) {
        return res.status(400).json({ error: 'Title, description, and link are required.' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO blogs (title, description, link) VALUES ($1, $2, $3) RETURNING *',
            [title, description, link]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT update a blog (admin only)
app.put('/api/blogs/:id', authenticateToken, async (req, res) => {
    const id = parseInt(req.params.id);
    const { title, description, link } = req.body;

    try {
        const result = await pool.query(
            'UPDATE blogs SET title = COALESCE($1, title), description = COALESCE($2, description), link = COALESCE($3, link) WHERE id = $4 RETURNING *',
            [title, description, link, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Blog not found.' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE remove a blog (admin only)
app.delete('/api/blogs/:id', authenticateToken, async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const result = await pool.query('DELETE FROM blogs WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Blog not found.' });
        }
        res.json({ message: 'Blog deleted.', blog: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ══════════════════════════════════════
//  MESSAGES API (Contact Form)
// ══════════════════════════════════════

// GET all messages (admin only)
app.get('/api/messages', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM messages ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST add a new message (public)
app.post('/api/messages', async (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Name, email, and message are required.' });
    }

    try {
        await pool.query(
            'INSERT INTO messages (name, email, message) VALUES ($1, $2, $3)',
            [name, email, message]
        );
        res.status(201).json({ message: 'Message sent successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE remove a message (admin only)
app.delete('/api/messages/:id', authenticateToken, async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const result = await pool.query('DELETE FROM messages WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Message not found.' });
        }
        res.json({ message: 'Message deleted.', deleted: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ── Start server ──
app.listen(PORT, () => {
    console.log(`\n  🚀 Portfolio server running at http://localhost:${PORT}`);
    console.log(`  📁 Admin dashboard:  http://localhost:${PORT}/admin.html`);
    console.log(`  📡 API base:         http://localhost:${PORT}/api\n`);
});
