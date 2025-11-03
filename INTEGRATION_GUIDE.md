# Integration Guide for Existing Company Website

This guide explains how to integrate the Spreadsheet Automation Platform into your existing company website.

## Integration Methods

### Method 1: Full Integration (Recommended)

Integrate as part of your main Node.js application.

**Requirements:**
- Your website runs on Node.js/Express
- You have access to modify server code
- Can add routes and middleware

**Steps:**

1. **Install dependencies in your main project:**
```bash
cd /path/to/your-website
npm install sqlite3 express-validator cors
```

2. **Copy API routes to your server:**

Add to your main `server.js` or create `routes/automation.js`:

```javascript
const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const { body, validationResult } = require('express-validator');

const db = new sqlite3.Database('./data/automation-leads.db');

// Initialize database table
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

// Get all leads
router.get('/api/automation/leads', (req, res) => {
  db.all('SELECT * FROM automation_leads ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch leads' });
    }
    res.json({ success: true, leads: rows });
  });
});

// Create new lead
router.post('/api/automation/leads',
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
      res.json({ 
        success: true, 
        lead_id: this.lastID,
        message: 'Lead captured successfully' 
      });
    });
  }
);

module.exports = router;
```

3. **Mount router in your main server:**
```javascript
const automationRoutes = require('./routes/automation');
app.use('/automation', automationRoutes);
```

4. **Copy frontend files to your public directory:**
```bash
mkdir -p public/automation
cp -r public/* /path/to/your-website/public/automation/
```

5. **Update frontend to use your base path:**

In `public/automation/script.js`, update fetch URL:
```javascript
fetch('/automation/api/leads', {  // Changed from '/api/leads'
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(leadData)
})
```

### Method 2: Standalone Service with Reverse Proxy

Run as separate Node.js service behind your existing web server.

**Requirements:**
- Can run additional Node.js process
- Have Nginx or Apache as reverse proxy
- Can configure proxy rules

**Steps:**

1. **Deploy standalone on different port:**
```bash
# Clone to separate directory
git clone [repo] /var/www/spreadsheet-automation
cd /var/www/spreadsheet-automation
npm install
```

2. **Configure environment:**
```bash
cp env.example .env
# Edit .env
PORT=3001  # Use different port than main site
```

3. **Start with PM2:**
```bash
pm2 start server.js --name automation
```

4. **Configure reverse proxy:**

**Nginx:**
```nginx
# In your existing server block
location /automation {
    proxy_pass http://localhost:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

**Apache:**
```apache
<Location /automation>
    ProxyPass http://localhost:3001
    ProxyPassReverse http://localhost:3001
</Location>
```

5. **Link from your main website:**
```html
<a href="/automation/">Check Our Automation Platform</a>
```

### Method 3: Subdomain Deployment

Deploy on separate subdomain for complete isolation.

**Requirements:**
- Can create subdomain DNS record
- Can configure SSL for subdomain

**Steps:**

1. **Create DNS A record:**
```
automation.yourdomain.com → Your-Server-IP
```

2. **Deploy and configure SSL:**
```bash
sudo certbot --nginx -d automation.yourdomain.com
```

3. **Create Nginx config:**
```nginx
server {
    listen 443 ssl http2;
    server_name automation.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/automation.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/automation.yourdomain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
    }
}
```

4. **Link from main site:**
```html
<a href="https://automation.yourdomain.com">Visit Automation Platform</a>
```

### Method 4: Iframe Embedding

Embed automation forms in your existing pages.

**Best for:** Adding lead capture forms to existing pages

**Steps:**

1. **Deploy standalone** (Method 2 or 3)

2. **Create embed endpoint** in server.js:
```javascript
app.get('/embed/lead-form', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { margin: 0; padding: 20px; font-family: system-ui; }
        /* Minimal styling for embed */
      </style>
    </head>
    <body>
      <form id="leadForm">
        <input type="text" name="name" placeholder="Your Name" required>
        <input type="email" name="email" placeholder="Email" required>
        <button type="submit">Get Started</button>
      </form>
      <script src="/script.js"></script>
    </body>
    </html>
  `);
});
```

3. **Embed in your pages:**
```html
<iframe 
  src="https://automation.yourdomain.com/embed/lead-form" 
  width="100%" 
  height="400" 
  frameborder="0"
  scrolling="no">
</iframe>
```

## Branding Integration

### Matching Your Company Brand

1. **Update colors in CSS files:**

`public/styles.css` and `public/mockup/styles.css`:
```css
:root {
    --color-primary: #YOUR-BRAND-COLOR;
    --color-primary-dark: #DARKER-SHADE;
    --color-accent: #ACCENT-COLOR;
}
```

2. **Add your company logo:**

Replace hero section or add to nav:
```html
<nav class="nav">
    <img src="/assets/logo.png" alt="Company Logo" class="logo">
    <!-- existing nav content -->
</nav>
```

3. **Update fonts to match your site:**
```css
body {
    font-family: 'Your-Font', system-ui, sans-serif;
}
```

4. **Consistent header/footer:**

Copy your main site's header and footer:
```html
<!-- Your existing header -->
<?php include 'header.php'; ?>

<!-- Automation content -->
<div class="automation-content">
  <!-- Platform content here -->
</div>

<!-- Your existing footer -->
<?php include 'footer.php'; ?>
```

### Shared Navigation

Make navigation consistent across your site:

```javascript
// Add to public/script.js
fetch('/api/navigation')
  .then(res => res.json())
  .then(nav => {
    document.querySelector('.nav-menu').innerHTML = nav.menuHTML;
  });
```

## Authentication Integration

### Using Existing User System

If your site has user authentication:

**1. Share session data:**
```javascript
// In your main server
app.use('/automation', (req, res, next) => {
  // Pass user data to automation routes
  res.locals.user = req.session.user;
  next();
});
```

**2. Protect admin routes:**
```javascript
router.get('/api/automation/leads', requireAdmin, (req, res) => {
  // Only authenticated admins can view leads
});
```

**3. Associate leads with users:**
```javascript
// Add user_id to leads table
db.run(`ALTER TABLE automation_leads ADD COLUMN user_id INTEGER`);

// When creating lead
const user_id = req.session?.user?.id || null;
db.run(sql, [name, email, company, description, form_type, user_id], ...);
```

## Database Integration

### Using Existing Database

Instead of separate SQLite database, use your existing database:

**PostgreSQL:**
```javascript
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Create table in your database
CREATE TABLE automation_leads (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  description TEXT,
  form_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

// Update queries
router.post('/api/automation/leads', async (req, res) => {
  const { name, email, company, description, form_type } = req.body;
  
  const result = await pool.query(
    'INSERT INTO automation_leads (name, email, company, description, form_type) VALUES ($1, $2, $3, $4, $5) RETURNING id',
    [name, email, company, description, form_type]
  );
  
  res.json({ success: true, lead_id: result.rows[0].id });
});
```

**MySQL:**
```javascript
const mysql = require('mysql2/promise');
const pool = mysql.createPool(process.env.DATABASE_URL);

// Queries use ? placeholders
const [result] = await pool.query(
  'INSERT INTO automation_leads (name, email, company, description, form_type) VALUES (?, ?, ?, ?, ?)',
  [name, email, company, description, form_type]
);
```

## Analytics Integration

### Google Analytics

Add to `public/index.html` and `public/mockup/index.html`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Custom Event Tracking

```javascript
// Track form submissions
function handleFormSubmit(e) {
  // Existing code...
  
  // Track event
  if (typeof gtag !== 'undefined') {
    gtag('event', 'lead_form_submit', {
      'form_type': formType,
      'page_location': window.location.href
    });
  }
}
```

## Email Integration

### Notify on New Leads

Add email notification when leads are captured:

```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

router.post('/api/automation/leads', async (req, res) => {
  // Save lead (existing code)...
  
  // Send notification
  await transporter.sendMail({
    from: process.env.NOTIFY_EMAIL,
    to: 'sales@yourcompany.com',
    subject: 'New Lead from Automation Platform',
    html: `
      <h2>New Lead Captured</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Company:</strong> ${company}</p>
      <p><strong>Message:</strong> ${description}</p>
    `
  });
});
```

## CRM Integration

### Send Leads to CRM

**Salesforce:**
```javascript
const jsforce = require('jsforce');
const conn = new jsforce.Connection({
  loginUrl: 'https://login.salesforce.com'
});

await conn.login(SF_USERNAME, SF_PASSWORD + SF_TOKEN);

await conn.sobject('Lead').create({
  FirstName: name.split(' ')[0],
  LastName: name.split(' ').slice(1).join(' '),
  Email: email,
  Company: company,
  Description: description
});
```

**HubSpot:**
```javascript
const hubspot = require('@hubspot/api-client');
const hubspotClient = new hubspot.Client({ accessToken: HUBSPOT_TOKEN });

await hubspotClient.crm.contacts.basicApi.create({
  properties: {
    email: email,
    firstname: name.split(' ')[0],
    lastname: name.split(' ').slice(1).join(' '),
    company: company
  }
});
```

## Monitoring Integration

### Use Existing Monitoring

If you use Datadog, New Relic, or similar:

```javascript
const newrelic = require('newrelic');

router.post('/api/automation/leads', (req, res) => {
  newrelic.recordMetric('Custom/Automation/LeadCaptured', 1);
  // Rest of handler...
});
```

## Testing Integration

### Integration Tests

```javascript
const request = require('supertest');
const app = require('../server');

describe('Automation Platform Integration', () => {
  it('should capture lead via API', async () => {
    const res = await request(app)
      .post('/automation/api/leads')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        company: 'Test Corp',
        description: 'Testing integration',
        form_type: 'scan'
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
```

## Rollout Strategy

### Phased Approach

**Phase 1: Soft Launch**
- Deploy to staging subdomain
- Test with internal team
- Verify all integrations work

**Phase 2: Limited Release**
- Add to one page on main site
- Monitor for issues
- Collect feedback

**Phase 3: Full Integration**
- Add to main navigation
- Update all relevant pages
- Full marketing push

## Troubleshooting Common Issues

### CORS Errors

If frontend and backend on different domains:
```javascript
const cors = require('cors');
app.use(cors({
  origin: ['https://yourdomain.com', 'https://www.yourdomain.com'],
  credentials: true
}));
```

### Session Conflicts

Different apps on same domain:
```javascript
app.use(session({
  name: 'automation_session', // Use unique name
  secret: 'different-secret',
  cookie: { path: '/automation' }
}));
```

### Asset Path Issues

When serving from subdirectory:
```html
<!-- Use absolute paths -->
<link rel="stylesheet" href="/automation/styles.css">
<script src="/automation/script.js"></script>
```

## Maintenance

### Updating Platform

```bash
# Backup first
npm run backup-db

# Pull updates
git pull origin main

# Install dependencies
npm install

# Restart
pm2 restart automation
```

### Monitoring Health

Add health check endpoint your monitoring can ping:
```javascript
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

## Support

For integration assistance:
- Review error logs
- Check Nginx/Apache logs
- Verify environment variables
- Test API endpoints directly with curl
- Check database connectivity

