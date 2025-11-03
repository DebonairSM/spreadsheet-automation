const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const DB_PATH = process.env.DB_PATH || './data/leads.db';
const OUTPUT_DIR = './exports';
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
const OUTPUT_FILE = path.join(OUTPUT_DIR, `leads-export-${timestamp}.csv`);

// Ensure exports directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
});

db.all('SELECT * FROM leads ORDER BY created_at DESC', [], (err, rows) => {
  if (err) {
    console.error('Error fetching leads:', err.message);
    db.close();
    process.exit(1);
  }

  if (rows.length === 0) {
    console.log('No leads found to export');
    db.close();
    return;
  }

  // Generate CSV
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map(row => 
      headers.map(header => {
        const value = row[header] || '';
        // Escape quotes and wrap in quotes if contains comma
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  fs.writeFileSync(OUTPUT_FILE, csvContent);
  console.log(`Successfully exported ${rows.length} leads to ${OUTPUT_FILE}`);

  db.close();
});

