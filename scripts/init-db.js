const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const DB_PATH = process.env.DB_PATH || './data/leads.db';
const DB_DIR = path.dirname(DB_PATH);

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
  console.log(`Created directory: ${DB_DIR}`);
}

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to SQLite database');
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      company TEXT,
      description TEXT,
      form_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating table:', err.message);
      process.exit(1);
    }
    console.log('Database initialized successfully');
    console.log('Table "leads" created or already exists');
  });

  // Create indexes for better query performance
  db.run(`CREATE INDEX IF NOT EXISTS idx_email ON leads(email)`, (err) => {
    if (err) {
      console.error('Error creating email index:', err.message);
    } else {
      console.log('Email index created');
    }
  });

  db.run(`CREATE INDEX IF NOT EXISTS idx_created_at ON leads(created_at)`, (err) => {
    if (err) {
      console.error('Error creating created_at index:', err.message);
    } else {
      console.log('Created_at index created');
    }
  });
});

db.close((err) => {
  if (err) {
    console.error('Error closing database:', err.message);
    process.exit(1);
  }
  console.log('Database initialization complete');
  console.log(`Database location: ${path.resolve(DB_PATH)}`);
});


