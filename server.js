const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || './data/leads.db';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files - serve public directory
app.use(express.static('public'));

// Initialize database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initDatabase();
  }
});

// Create tables if they don't exist
function initDatabase() {
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
    } else {
      console.log('Database initialized successfully');
    }
  });
}

// API Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', message: 'API is running' });
});

// Get all leads (add authentication in production)
app.get('/api/leads', (req, res) => {
  db.all('SELECT * FROM leads ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      console.error('Error fetching leads:', err.message);
      return res.status(500).json({ error: 'Failed to fetch leads' });
    }
    res.json({ success: true, leads: rows });
  });
});

// Create new lead
app.post('/api/leads',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('company').optional().trim(),
    body('description').optional().trim(),
    body('form_type').optional().trim()
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, company, description, form_type } = req.body;

    const sql = `INSERT INTO leads (name, email, company, description, form_type) VALUES (?, ?, ?, ?, ?)`;
    const params = [name, email, company || null, description || null, form_type || 'general'];

    db.run(sql, params, function(err) {
      if (err) {
        console.error('Error inserting lead:', err.message);
        return res.status(500).json({ success: false, error: 'Failed to save lead' });
      }
      res.json({ 
        success: true, 
        lead_id: this.lastID,
        message: 'Lead captured successfully' 
      });
    });
  }
);

// Get lead by ID
app.get('/api/leads/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM leads WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Error fetching lead:', err.message);
      return res.status(500).json({ error: 'Failed to fetch lead' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    res.json({ success: true, lead: row });
  });
});

// Get database statistics
app.get('/api/stats', (req, res) => {
  const stats = {};
  
  db.get('SELECT COUNT(*) as total FROM leads', [], (err, row) => {
    if (err) {
      console.error('Error fetching stats:', err.message);
      return res.status(500).json({ error: 'Failed to fetch statistics' });
    }
    
    stats.total_leads = row.total;
    
    db.all('SELECT form_type, COUNT(*) as count FROM leads GROUP BY form_type', [], (err, rows) => {
      if (err) {
        console.error('Error fetching form type stats:', err.message);
        return res.status(500).json({ error: 'Failed to fetch statistics' });
      }
      
      stats.by_form_type = rows;
      res.json({ success: true, stats });
    });
  });
});

// Serve landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve mockup framework page
app.get('/mockup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'mockup', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Access at: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});

module.exports = app;


