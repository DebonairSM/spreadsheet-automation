# Installation Instructions for Company Website Integration

This guide walks you through installing the Spreadsheet Automation Platform on your company website.

## Choose Your Installation Path

### Path A: I Want to Test Locally First (Recommended)
**Time: 5 minutes**
- [Jump to Local Installation](#local-installation)

### Path B: I Want to Integrate with Existing Node.js Website
**Time: 30-60 minutes**
- [Jump to Website Integration](#website-integration)

### Path C: I Want to Deploy as Standalone Service
**Time: 1-2 hours**
- [Jump to Standalone Deployment](#standalone-deployment)

---

## Local Installation

Perfect for testing before deployment.

### Step 1: Prerequisites

Check you have Node.js installed:
```bash
node --version
# Should show v18.0.0 or higher
```

Don't have Node.js? [Download here](https://nodejs.org/)

### Step 2: Install Dependencies

```bash
npm install
```

This installs:
- Express.js (web server)
- SQLite3 (database)
- CORS (cross-origin support)
- Express-validator (input validation)
- Dotenv (configuration)

### Step 3: Configure

```bash
cp env.example .env
```

Edit `.env` with your Calendly URL:
```env
NODE_ENV=development
PORT=3000
CALENDLY_URL=https://calendly.com/YOUR-USERNAME/YOUR-EVENT
```

### Step 4: Set Up Files

**On Linux/Mac:**
```bash
chmod +x migrate-files.sh
./migrate-files.sh
```

**On Windows:**
```bash
mkdir public\mockup
mkdir data scripts exports backups logs
copy camp\index.html public\index.html
copy camp\styles.css public\styles.css
copy camp\script.js public\script.js
copy mockup-framework\*.* public\mockup\
```

### Step 5: Initialize Database

```bash
npm run prepare-db
```

### Step 6: Update Calendly URL in Frontend

Edit `public/script.js` at line 148:
```javascript
const calendlyUrl = 'https://calendly.com/YOUR-USERNAME/YOUR-EVENT';
```

### Step 7: Start Server

```bash
npm run dev
```

### Step 8: Test

Open browser: `http://localhost:3000`

You should see the landing page. Try:
1. Fill out the form
2. Submit (should redirect to Calendly)
3. Visit `http://localhost:3000/mockup` for demo framework

### Step 9: Verify Database

```bash
curl http://localhost:3000/api/leads
```

Should return JSON with your test lead.

**Success!** You're ready for production deployment.

---

## Website Integration

Perfect if you already have a Node.js/Express website.

### Prerequisites

- Your website runs on Node.js/Express
- You have access to server code
- Can modify routes and middleware

### Step 1: Install Dependencies in Your Project

Navigate to your main website directory:
```bash
cd /path/to/your-website
npm install sqlite3 express-validator
```

### Step 2: Copy Backend Routes

Create `routes/automation.js` in your project:

```javascript
const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const { body, validationResult } = require('express-validator');

const db = new sqlite3.Database('./data/automation-leads.db');

// Initialize table
db.run(`
  CREATE TABLE IF NOT EXISTS automation_leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    company TEXT,
    description TEXT,
    form_type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create lead endpoint
router.post('/api/leads',
  [
    body('name').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, company, description, form_type } = req.body;
    const sql = `INSERT INTO automation_leads (name, email, company, description, form_type) 
                 VALUES (?, ?, ?, ?, ?)`;

    db.run(sql, [name, email, company || null, description || null, form_type || 'general'], function(err) {
      if (err) {
        return res.status(500).json({ success: false, error: 'Failed to save lead' });
      }
      res.json({ success: true, lead_id: this.lastID });
    });
  }
);

// Get leads endpoint (add authentication!)
router.get('/api/leads', (req, res) => {
  db.all('SELECT * FROM automation_leads ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch leads' });
    }
    res.json({ success: true, leads: rows });
  });
});

module.exports = router;
```

### Step 3: Mount Routes in Your Server

In your main `server.js` or `app.js`:

```javascript
const automationRoutes = require('./routes/automation');

// Mount at /automation
app.use('/automation', automationRoutes);
```

### Step 4: Copy Frontend Files

```bash
mkdir -p public/automation
cp -r public/* /path/to/your-website/public/automation/
```

### Step 5: Update Frontend Paths

Edit `public/automation/script.js` line 135:
```javascript
fetch('/automation/api/leads', {  // Add /automation prefix
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(leadData)
})
```

### Step 6: Link from Your Website

Add to your navigation or landing page:
```html
<a href="/automation/">Check Our Automation Platform</a>
```

### Step 7: Test

1. Restart your server
2. Visit `https://yourdomain.com/automation/`
3. Test form submission
4. Verify redirect to Calendly

**Integrated!** The platform is now part of your website.

---

## Standalone Deployment

Perfect for running as a separate service on your server.

### Prerequisites

- Linux/Ubuntu server with SSH access
- Node.js 18+ installed
- Domain or subdomain configured
- Root/sudo access

### Step 1: Upload Files

```bash
# From your local machine
rsync -avz --exclude node_modules --exclude .git \
  ./ user@yourserver.com:/var/www/spreadsheet-automation/
```

Or use git:
```bash
ssh user@yourserver.com
cd /var/www
git clone [your-repo-url] spreadsheet-automation
cd spreadsheet-automation
```

### Step 2: Install Dependencies

```bash
npm install --production
```

### Step 3: Configure Environment

```bash
cp env.example .env
nano .env
```

Set production values:
```env
NODE_ENV=production
PORT=3000
DB_PATH=./data/leads.db
ALLOWED_ORIGINS=https://yourdomain.com
CALENDLY_URL=https://calendly.com/your-username/event
```

### Step 4: Set Up Files

```bash
chmod +x migrate-files.sh
./migrate-files.sh
```

### Step 5: Initialize Database

```bash
npm run prepare-db
```

### Step 6: Install PM2

```bash
npm install -g pm2
```

### Step 7: Start Application

```bash
pm2 start server.js --name spreadsheet-automation
pm2 save
pm2 startup
```

### Step 8: Configure Nginx

Create `/etc/nginx/sites-available/spreadsheet-automation`:

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
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/spreadsheet-automation \
           /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 9: Set Up SSL

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d automation.yourdomain.com
```

### Step 10: Set Up Backups

```bash
crontab -e
```

Add:
```cron
# Daily backup at 2 AM
0 2 * * * cd /var/www/spreadsheet-automation && npm run backup-db

# Weekly export on Sundays
0 3 * * 0 cd /var/www/spreadsheet-automation && npm run export-leads
```

### Step 11: Test

Visit `https://automation.yourdomain.com`

Test:
1. Landing page loads
2. HTTPS works
3. Form submits
4. Redirects to Calendly

**Deployed!** Your platform is live.

---

## Post-Installation

Regardless of installation method:

### Security Checklist

- [ ] `.env` file not in git
- [ ] Database file permissions restricted: `chmod 600 data/leads.db`
- [ ] CORS configured for your domain only
- [ ] HTTPS enabled (production)
- [ ] Admin endpoints protected

### Testing Checklist

- [ ] Landing page loads
- [ ] Styles applied correctly
- [ ] Forms submit successfully
- [ ] Leads saved to database
- [ ] Calendly redirect works
- [ ] Mockup framework accessible
- [ ] Mobile responsive design works

### Monitoring Setup

```bash
# Check application status
pm2 status

# View logs
pm2 logs spreadsheet-automation

# Monitor in real-time
pm2 monit
```

### Backup Verification

```bash
# Manual backup
npm run backup-db

# Verify backup exists
ls -lh backups/

# Export leads
npm run export-leads
ls -lh exports/
```

---

## Troubleshooting

### Port Already in Use

```bash
# Find what's using port 3000
lsof -i :3000

# Kill it
kill -9 [PID]

# Or use different port in .env
PORT=3001
```

### Database Permission Denied

```bash
sudo chown -R $USER:$USER data/
chmod 700 data/
chmod 600 data/leads.db
```

### Nginx Configuration Error

```bash
# Test configuration
sudo nginx -t

# View error details
sudo tail -f /var/log/nginx/error.log
```

### PM2 Not Starting

```bash
# Delete all PM2 processes
pm2 delete all

# Start fresh
pm2 start server.js --name spreadsheet-automation

# Check logs
pm2 logs spreadsheet-automation --lines 50
```

### CORS Errors

Update `ALLOWED_ORIGINS` in `.env`:
```env
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

Restart server:
```bash
pm2 restart spreadsheet-automation
```

### Forms Not Submitting

1. Check browser console for errors
2. Verify API endpoint URL in `public/script.js`
3. Test API directly:
   ```bash
   curl -X POST http://localhost:3000/api/leads \
     -H "Content-Type: application/json" \
     -d '{"name":"Test","email":"test@example.com"}'
   ```

---

## Next Steps

### Customize for Your Company

1. **Update Branding**
   - Edit colors in `public/styles.css`
   - Add your logo
   - Update company name

2. **Configure Analytics**
   - Add Google Analytics to `public/index.html`
   - Track form submissions

3. **Set Up Notifications**
   - Configure email alerts on new leads
   - Connect to CRM

### Learn More

- Full documentation: [README_NEW.md](README_NEW.md)
- Deployment details: [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md)
- Integration methods: [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)
- Migration guide: [MIGRATION_CHECKLIST.md](MIGRATION_CHECKLIST.md)

---

## Getting Help

1. **Review logs**: `pm2 logs spreadsheet-automation`
2. **Check database**: `sqlite3 data/leads.db "SELECT * FROM leads;"`
3. **Test API**: `curl http://localhost:3000/health`
4. **Browser console**: Check for JavaScript errors

## Quick Reference

```bash
# Start server
npm run dev              # Development
pm2 start server.js      # Production

# Database
npm run prepare-db       # Initialize
npm run backup-db        # Backup
npm run export-leads     # Export CSV

# Monitoring
pm2 status              # Check status
pm2 logs               # View logs
pm2 monit              # Real-time monitor

# Testing
curl http://localhost:3000/health
curl http://localhost:3000/api/leads
```

---

**Installation Complete!** Your Spreadsheet Automation Platform is ready to capture leads and deliver mockups.


