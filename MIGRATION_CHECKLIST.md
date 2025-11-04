# Migration Checklist: Python Flask to Node.js

This checklist ensures smooth transition from the Python Flask API to the Node.js implementation.

## Pre-Migration

### Backup Current System

- [ ] Export all leads from Python API: `sqlite3 api/leads.db ".dump" > backup.sql`
- [ ] Save current `.env` or configuration files
- [ ] Document current Calendly URL and integrations
- [ ] Test current system one final time
- [ ] Note current uptime and statistics

### Environment Preparation

- [ ] Install Node.js 18+ and npm 9+: `node --version && npm --version`
- [ ] Create production server access or cloud account
- [ ] Set up domain/subdomain DNS if needed
- [ ] Prepare SSL certificates (Let's Encrypt)

## File Reorganization

### Create Directory Structure

```bash
# Create required directories
mkdir -p public/mockup
mkdir -p data
mkdir -p scripts
mkdir -p exports
mkdir -p backups
mkdir -p logs
```

### Move Frontend Files

- [ ] Copy camp/index.html → public/index.html
- [ ] Copy camp/styles.css → public/styles.css
- [ ] Copy camp/script.js → public/script.js
- [ ] Copy mockup-framework/ → public/mockup/
- [ ] Verify all files copied correctly

**Quick script:**
```bash
#!/bin/bash
# File: migrate-files.sh

echo "Creating directory structure..."
mkdir -p public/mockup data scripts exports backups logs

echo "Moving landing page files..."
cp camp/index.html public/index.html
cp camp/styles.css public/styles.css
cp camp/script.js public/script.js

echo "Moving mockup framework..."
cp mockup-framework/index.html public/mockup/index.html
cp mockup-framework/styles.css public/mockup/styles.css
cp mockup-framework/script.js public/mockup/script.js
cp mockup-framework/README.md public/mockup/README.md

echo "Files migrated successfully!"
echo "Next: Run 'npm install' and configure .env"
```

Save as `migrate-files.sh`, then run:
```bash
chmod +x migrate-files.sh
./migrate-files.sh
```

### Update Configuration Files

- [ ] Copy `env.example` to `.env`
- [ ] Update `.env` with production values:
  - [ ] NODE_ENV=production
  - [ ] PORT (default 3000)
  - [ ] DB_PATH=./data/leads.db
  - [ ] ALLOWED_ORIGINS (your domain)
  - [ ] CALENDLY_URL (from camp/script.js line 148)

## Data Migration

### Export Data from Python API

If you have existing leads in the Flask API:

```bash
# Navigate to Python API directory
cd api

# Export to CSV
sqlite3 leads.db <<EOF
.headers on
.mode csv
.output ../migration-leads.csv
SELECT * FROM leads;
.quit
EOF

# Or export full database
sqlite3 leads.db ".dump" > ../migration-leads.sql
```

- [ ] Exported leads to CSV or SQL dump
- [ ] Verified export file contains data
- [ ] Backed up original database

### Import Data to Node.js

Create import script `scripts/import-legacy-data.js`:

```javascript
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
require('dotenv').config();

const DB_PATH = process.env.DB_PATH || './data/leads.db';
const CSV_PATH = './migration-leads.csv';

const db = new sqlite3.Database(DB_PATH);

// Ensure table exists
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
`);

// Import from CSV
const leads = [];
fs.createReadStream(CSV_PATH)
  .pipe(csv())
  .on('data', (row) => {
    leads.push(row);
  })
  .on('end', () => {
    console.log(`Found ${leads.length} leads to import`);
    
    const stmt = db.prepare(`
      INSERT INTO leads (name, email, company, description, form_type, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    leads.forEach((lead, index) => {
      stmt.run(
        lead.name,
        lead.email,
        lead.company || null,
        lead.description || null,
        lead.form_type || 'general',
        lead.created_at || new Date().toISOString()
      );
      
      if ((index + 1) % 100 === 0) {
        console.log(`Imported ${index + 1} leads...`);
      }
    });
    
    stmt.finalize();
    
    console.log('Import complete!');
    console.log(`Total leads imported: ${leads.length}`);
    
    db.close();
  });
```

- [ ] Created import script
- [ ] Ran: `npm install csv-parser`
- [ ] Ran: `node scripts/import-legacy-data.js`
- [ ] Verified data imported correctly

### Verify Data Integrity

```bash
# Check record count
sqlite3 data/leads.db "SELECT COUNT(*) FROM leads;"

# View recent records
sqlite3 data/leads.db "SELECT * FROM leads ORDER BY created_at DESC LIMIT 5;"

# Check for missing emails
sqlite3 data/leads.db "SELECT COUNT(*) FROM leads WHERE email IS NULL;"
```

- [ ] Record counts match
- [ ] Sample records look correct
- [ ] No data corruption

## Frontend Updates

### Update Calendly URL

In `public/script.js`, line 148:

```javascript
// OLD: Hardcoded URL
const calendlyUrl = 'https://calendly.com/vsol/meeting-with-bandeira';

// NEW: Use from environment or keep if static
const calendlyUrl = 'https://calendly.com/YOUR-USERNAME/YOUR-EVENT';
```

- [ ] Updated Calendly URL to match your account
- [ ] Tested URL opens correctly

### Update API Endpoints

Already configured correctly in `public/script.js` line 135:
```javascript
fetch('/api/leads', { ... })
```

No changes needed if serving from root. If using subdirectory:
```javascript
fetch('/automation/api/leads', { ... })
```

- [ ] Verified API endpoint paths
- [ ] Updated if using subdirectory deployment

### Test Frontend Locally

```bash
# Start development server
npm run dev
```

- [ ] Visited http://localhost:3000
- [ ] Landing page loads correctly
- [ ] Styles applied properly
- [ ] No console errors
- [ ] Form validation works
- [ ] Mock up page accessible at /mockup

## Node.js Setup

### Install Dependencies

```bash
npm install
```

Expected packages:
- express
- cors
- sqlite3
- express-validator
- dotenv

- [ ] All dependencies installed successfully
- [ ] No security vulnerabilities: `npm audit`

### Initialize Database

```bash
npm run prepare-db
```

- [ ] Database created at `./data/leads.db`
- [ ] Table structure correct
- [ ] Indexes created

### Test API Endpoints

```bash
# Health check
curl http://localhost:3000/health

# Create test lead
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","company":"Test Corp","description":"Testing","form_type":"scan"}'

# Get all leads
curl http://localhost:3000/api/leads
```

- [ ] Health check returns healthy status
- [ ] Can create leads via API
- [ ] Can retrieve leads via API
- [ ] Validation errors handled correctly

## Production Deployment

### Server Preparation

- [ ] Server accessible via SSH
- [ ] Node.js 18+ installed on server
- [ ] PM2 installed globally: `npm install -g pm2`
- [ ] Nginx or Apache configured
- [ ] Firewall rules allow HTTP/HTTPS

### Upload Files

```bash
# Using rsync
rsync -avz --exclude node_modules --exclude data --exclude .git \
  ./ user@yourserver.com:/var/www/spreadsheet-automation/

# Or using git
ssh user@yourserver.com
cd /var/www
git clone [your-repo-url] spreadsheet-automation
cd spreadsheet-automation
```

- [ ] Files uploaded to server
- [ ] Correct directory permissions

### Server Configuration

```bash
# On server
cd /var/www/spreadsheet-automation

# Install dependencies
npm install --production

# Copy and configure environment
cp env.example .env
nano .env  # Edit with production values

# Initialize database
npm run prepare-db

# Import legacy data if needed
node scripts/import-legacy-data.js
```

- [ ] Environment configured
- [ ] Database initialized
- [ ] Legacy data imported (if applicable)

### Start Application

```bash
# Start with PM2
pm2 start server.js --name spreadsheet-automation

# Check status
pm2 status

# View logs
pm2 logs spreadsheet-automation

# Enable startup on boot
pm2 startup
pm2 save
```

- [ ] Application started successfully
- [ ] No errors in logs
- [ ] PM2 configured for auto-start

### Configure Reverse Proxy

For Nginx, create `/etc/nginx/sites-available/spreadsheet-automation`:

```nginx
server {
    listen 80;
    server_name automation.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name automation.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/automation.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/automation.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/spreadsheet-automation /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

- [ ] Nginx configuration created
- [ ] Configuration syntax valid
- [ ] Nginx reloaded successfully

### SSL Certificate

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d automation.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

- [ ] SSL certificate generated
- [ ] HTTPS working
- [ ] Auto-renewal configured

## Testing Production

### Functionality Tests

- [ ] Visit production URL in browser
- [ ] Landing page loads correctly
- [ ] All styles and scripts load
- [ ] No mixed content warnings
- [ ] Forms submit successfully
- [ ] Redirects to Calendly work
- [ ] Mockup framework accessible

### API Tests

```bash
# Replace with your domain
DOMAIN="https://automation.yourdomain.com"

# Health check
curl $DOMAIN/health

# Create lead
curl -X POST $DOMAIN/api/leads \
  -H "Content-Type: application/json" \
  -d '{"name":"Production Test","email":"test@example.com","company":"Test","description":"Testing production","form_type":"scan"}'
```

- [ ] API endpoints respond correctly
- [ ] Leads saved to database
- [ ] Calendly redirect works

### Performance Tests

- [ ] Page load time < 2 seconds
- [ ] No JavaScript errors in console
- [ ] Mobile responsive design works
- [ ] Works in Chrome, Firefox, Safari, Edge

## Post-Migration

### Monitoring Setup

```bash
# Check PM2 status
pm2 status

# Monitor logs
pm2 logs spreadsheet-automation --lines 50

# Set up log rotation
pm2 install pm2-logrotate
```

- [ ] Application running stably
- [ ] No errors in logs
- [ ] Log rotation configured

### Backup Configuration

```bash
# Add to crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /var/www/spreadsheet-automation && npm run backup-db

# Add weekly export on Sundays
0 3 * * 0 cd /var/www/spreadsheet-automation && npm run export-leads
```

- [ ] Automated backups configured
- [ ] Manual backup successful: `npm run backup-db`
- [ ] Export working: `npm run export-leads`

### Old System Cleanup

Only after confirming new system works:

- [ ] Keep Python API running for 1 week as backup
- [ ] Monitor for any issues with new system
- [ ] Export final data from old system
- [ ] Archive old system code
- [ ] Stop old Python API
- [ ] Document any custom configurations

## Rollback Plan

If issues arise:

### Immediate Rollback

```bash
# Stop Node.js application
pm2 stop spreadsheet-automation

# Revert Nginx to old configuration
sudo cp /etc/nginx/sites-available/old-config.backup /etc/nginx/sites-available/spreadsheet-automation
sudo systemctl reload nginx

# Restart old Python API
cd /path/to/old/api
python app.py
```

### Data Rollback

```bash
# Restore database backup
cp backups/leads-backup-[date].db data/leads.db

# Restart application
pm2 restart spreadsheet-automation
```

## Verification

### Final Checklist

- [ ] All forms submit successfully
- [ ] Leads are captured in database
- [ ] Calendly redirects work
- [ ] Email notifications work (if configured)
- [ ] SSL certificate valid and auto-renewing
- [ ] Application starts on server reboot
- [ ] Backups running automatically
- [ ] Performance acceptable
- [ ] No errors in production logs
- [ ] Team trained on new system
- [ ] Documentation updated
- [ ] Old system deprecated

## Support Contacts

Document who to contact for:
- Server access: ___________________
- DNS changes: ___________________
- SSL certificates: ___________________
- Database issues: ___________________
- Code updates: ___________________

## Migration Complete! 🎉

Date completed: ___________________
Migrated by: ___________________
Downtime: ___________________
Issues encountered: ___________________

## Next Steps

1. Monitor for 1 week
2. Collect user feedback
3. Optimize performance if needed
4. Add additional features
5. Set up staging environment for future updates


