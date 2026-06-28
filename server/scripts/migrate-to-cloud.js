const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const DATA_FILE = path.join(__dirname, '..', 'data.json');

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error("❌ ERROR: DATABASE_URL is not set in your .env file.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Required for Neon/Supabase
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log("🚀 Starting database migration...");

    // 1. Create Tables
    console.log("📦 Creating tables...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS skills (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        icon VARCHAR(255) NOT NULL,
        row INTEGER DEFAULT 1,
        angle INTEGER DEFAULT 0,
        radius INTEGER DEFAULT 200,
        filter VARCHAR(255) DEFAULT ''
      );

      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        image VARCHAR(255) DEFAULT '',
        tags TEXT[] DEFAULT '{}',
        github VARCHAR(255) DEFAULT '',
        demo VARCHAR(255) DEFAULT ''
      );

      CREATE TABLE IF NOT EXISTS blogs (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        link VARCHAR(255) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS resume_metadata (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        size INTEGER NOT NULL,
        cloudinary_url VARCHAR(255)
      );
    `);
    console.log("✅ Tables created successfully.");

    // 2. Read existing data
    if (!fs.existsSync(DATA_FILE)) {
      console.log("⚠️ data.json not found, skipping data insertion.");
      return;
    }
    
    const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
    const data = JSON.parse(rawData);

    // 3. Insert Skills
    if (data.skills && data.skills.length > 0) {
      console.log(`📥 Migrating ${data.skills.length} skills...`);
      for (const skill of data.skills) {
        await client.query(
          'INSERT INTO skills (name, icon, row, angle, radius, filter) VALUES ($1, $2, $3, $4, $5, $6)',
          [skill.name, skill.icon, skill.row, skill.angle, skill.radius, skill.filter || '']
        );
      }
    }

    // 4. Insert Projects
    if (data.projects && data.projects.length > 0) {
      console.log(`📥 Migrating ${data.projects.length} projects...`);
      for (const project of data.projects) {
        await client.query(
          'INSERT INTO projects (title, description, image, tags, github, demo) VALUES ($1, $2, $3, $4, $5, $6)',
          [project.title, project.description, project.image || '', project.tags || [], project.github || '', project.demo || '']
        );
      }
    }

    // 5. Insert Blogs
    if (data.blogs && data.blogs.length > 0) {
      console.log(`📥 Migrating ${data.blogs.length} blogs...`);
      for (const blog of data.blogs) {
        await client.query(
          'INSERT INTO blogs (title, description, link) VALUES ($1, $2, $3)',
          [blog.title, blog.description, blog.link]
        );
      }
    }

    // 6. Insert Messages
    if (data.messages && data.messages.length > 0) {
      console.log(`📥 Migrating ${data.messages.length} messages...`);
      for (const message of data.messages) {
        await client.query(
          'INSERT INTO messages (name, email, message, created_at) VALUES ($1, $2, $3, $4)',
          [message.name, message.email, message.message, message.createdAt]
        );
      }
    }

    console.log("🎉 Migration completed successfully!");

  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    client.release();
    pool.end();
  }
}

runMigration();
