const fs = require('fs');
const path = require('path');
require('dotenv').config();

const DB_PATH = process.env.DB_PATH || './data/leads.db';
const BACKUP_DIR = './backups';
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const BACKUP_FILE = path.join(BACKUP_DIR, `leads-backup-${timestamp}.db`);

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Check if database exists
if (!fs.existsSync(DB_PATH)) {
  console.error(`Database not found at: ${DB_PATH}`);
  process.exit(1);
}

// Copy database file
try {
  fs.copyFileSync(DB_PATH, BACKUP_FILE);
  
  const stats = fs.statSync(BACKUP_FILE);
  const fileSizeInBytes = stats.size;
  const fileSizeInKB = (fileSizeInBytes / 1024).toFixed(2);
  
  console.log(`Database backed up successfully!`);
  console.log(`Backup location: ${path.resolve(BACKUP_FILE)}`);
  console.log(`Backup size: ${fileSizeInKB} KB`);
  
  // Clean up old backups (keep only last 10)
  const backups = fs.readdirSync(BACKUP_DIR)
    .filter(file => file.startsWith('leads-backup-'))
    .map(file => ({
      name: file,
      time: fs.statSync(path.join(BACKUP_DIR, file)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);
  
  if (backups.length > 10) {
    const toDelete = backups.slice(10);
    toDelete.forEach(backup => {
      fs.unlinkSync(path.join(BACKUP_DIR, backup.name));
      console.log(`Deleted old backup: ${backup.name}`);
    });
  }
  
} catch (err) {
  console.error('Error creating backup:', err.message);
  process.exit(1);
}


