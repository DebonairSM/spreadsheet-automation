# Production Deployment Guide

This guide covers deploying the Spreadsheet Automation Platform to your company's public website with Node.js integration.

## Project Structure

```
spreadsheet-automation/
├── server.js                      # Node.js/Express server
├── package.json                   # Dependencies and scripts
├── env.example                    # Environment variables template
├── .gitignore                     # Git ignore rules
│
├── public/                        # Static frontend files
│   ├── index.html                # Landing page (from camp/)
│   ├── styles.css                # Landing page styles
│   ├── script.js                 # Landing page interactions
│   │
│   └── mockup/                   # Mockup framework
│       ├── index.html            # Mockup demo page
│       ├── styles.css            # Mockup styles
│       └── script.js             # Mockup interactions
│
├── scripts/                      # Utility scripts
│   ├── init-db.js               # Database initialization
│   ├── export-leads.js          # Export leads to CSV
│   └── backup-db.js             # Database backup
│
├── data/                         # Database storage (gitignored)
│   └── leads.db                 # SQLite database
│
├── exports/                      # CSV exports (gitignored)
├── backups/                      # DB backups (gitignored)
│
├── workflow-templates/           # Documentation templates
│   ├── TEMPLATE_workflow-name.md
│   └── EXAMPLE_manufacturing-inventory.md
│
└── docs/                         # Project documentation
    ├── README.md
    ├── SETUP.md
    └── PRODUCTION_DEPLOYMENT.md (this file)
```

## Pre-Deployment Checklist

### 1. Directory Structure Setup

Move files to proper locations:

```bash
# Create public directory structure
mkdir -p public/mockup

# Move landing page files
cp camp/index.html public/index.html
cp camp/styles.css public/styles.css
cp camp/script.js public/script.js

# Move mockup framework
cp mockup-framework/index.html public/mockup/index.html
cp mockup-framework/styles.css public/mockup/styles.css
cp mockup-framework/script.js public/mockup/script.js

# Create data directory
mkdir -p data
```

### 2. Environment Configuration

Create `.env` file from template:

```bash
cp env.example .env
```

Edit `.env` with your production values:

```env
NODE_ENV=production
PORT=3000
DB_PATH=./data/leads.db
ALLOWED_ORIGINS=https://yourdomain.com
CALENDLY_URL=https://calendly.com/your-username/consultation
```

### 3. Frontend Configuration

Update `public/script.js` to use environment-based Calendly URL:

Find line 148 and update to:
```javascript
const calendlyUrl = window.CALENDLY_URL || 'https://calendly.com/default-url';
```

Then add to `public/index.html` before closing `</head>`:
```html
<script>
  window.CALENDLY_URL = '<%= process.env.CALENDLY_URL %>';
</script>
```

Or keep it simple and manually update the URL in `public/script.js` line 148.

### 4. Install Dependencies

```bash
npm install
```

### 5. Initialize Database

```bash
npm run prepare-db
```

### 6. Test Locally

```bash
npm run dev
```

Visit `http://localhost:3000` to verify everything works.

## Deployment Options

### Option 1: Deploy to Your Existing Node.js Server

If your company website already runs on Node.js:

1. **Copy project to server:**
```bash
scp -r * user@yourserver.com:/var/www/spreadsheet-automation/
```

2. **Install dependencies on server:**
```bash
ssh user@yourserver.com
cd /var/www/spreadsheet-automation
npm install --production
```

3. **Set up environment:**
```bash
cp env.example .env
nano .env  # Edit with production values
```

4. **Initialize database:**
```bash
npm run prepare-db
```

5. **Start with PM2:**
```bash
npm install -g pm2
pm2 start server.js --name "spreadsheet-automation"
pm2 save
pm2 startup
```

6. **Configure reverse proxy** (see Nginx section below)

### Option 2: Deploy as Subdirectory of Existing Site

If your main site is at `https://yourdomain.com`, serve this at `https://yourdomain.com/automation`:

1. **Update server.js** to use base path:
```javascript
const basePath = '/automation';
app.use(basePath, express.static('public'));
app.get(basePath + '/', (req, res) => {...});
app.get(basePath + '/api/leads', (req, res) => {...});
```

2. **Update frontend** `public/script.js`:
```javascript
fetch('/automation/api/leads', {
```

3. **Configure reverse proxy** to route `/automation` to this Node.js app.

### Option 3: Deploy as Microservice

Run as separate service and integrate via iframe or redirect:

1. Deploy to subdomain: `automation.yourdomain.com`
2. Set up SSL certificate
3. Link from main site
4. Use CORS to allow API calls from main domain

### Option 4: Serverless Deployment (Vercel/Netlify)

**Vercel:**
```bash
npm install -g vercel
vercel login
vercel --prod
```

**Netlify:**
1. Build command: `npm install`
2. Publish directory: `public`
3. Use Netlify Functions for API endpoints

Note: SQLite won't work on serverless. Use PostgreSQL or MongoDB instead.

## Nginx Configuration

### Standalone Deployment

```nginx
server {
    listen 80;
    server_name automation.yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name automation.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/automation.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/automation.yourdomain.com/privkey.pem;

    # Proxy to Node.js
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

### Subdirectory Integration

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # Existing configuration...

    # Automation platform
    location /automation {
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

## SSL/TLS Configuration

Using Let's Encrypt with Certbot:

```bash
# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d automation.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

## Process Management with PM2

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start server.js --name spreadsheet-automation

# View logs
pm2 logs spreadsheet-automation

# Monitor
pm2 monit

# Restart
pm2 restart spreadsheet-automation

# Stop
pm2 stop spreadsheet-automation

# Startup on boot
pm2 startup
pm2 save
```

### PM2 Ecosystem File

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'spreadsheet-automation',
    script: './server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
```

Start with: `pm2 start ecosystem.config.js`

## Database Management

### Backup Strategy

Set up automated backups with cron:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /var/www/spreadsheet-automation && npm run backup-db

# Add weekly export at Sunday 3 AM
0 3 * * 0 cd /var/www/spreadsheet-automation && npm run export-leads
```

### Manual Operations

```bash
# Backup database
npm run backup-db

# Export leads to CSV
npm run export-leads

# Reinitialize database (WARNING: loses data)
npm run prepare-db
```

## Monitoring and Logging

### Application Logs

```bash
# View PM2 logs
pm2 logs spreadsheet-automation

# View last 100 lines
pm2 logs spreadsheet-automation --lines 100

# Follow logs in real-time
pm2 logs spreadsheet-automation --lines 0
```

### Access Logs

Add to server.js:
```javascript
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

// Create logs directory
const logDirectory = path.join(__dirname, 'logs');
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);

// Create access log stream
const accessLogStream = fs.createWriteStream(
  path.join(logDirectory, 'access.log'),
  { flags: 'a' }
);

// Setup logger
app.use(morgan('combined', { stream: accessLogStream }));
```

### Error Tracking

Consider integrating:
- Sentry for error tracking
- LogRocket for session replay
- New Relic for performance monitoring

## Security Hardening

### 1. Environment Variables

Never commit `.env` to git:
```bash
# Already in .gitignore
.env
.env.*
```

### 2. Database Security

```bash
# Restrict database file permissions
chmod 600 data/leads.db
```

### 3. Rate Limiting

Add to server.js:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### 4. Helmet for Security Headers

```bash
npm install helmet
```

Add to server.js:
```javascript
const helmet = require('helmet');
app.use(helmet());
```

### 5. HTTPS Only

In production, redirect all HTTP to HTTPS at Nginx level.

## Performance Optimization

### 1. Enable Compression

```bash
npm install compression
```

```javascript
const compression = require('compression');
app.use(compression());
```

### 2. Static File Caching

Add to Nginx:
```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. Database Optimization

```bash
# Vacuum database periodically
sqlite3 data/leads.db "VACUUM;"

# Analyze for query optimization
sqlite3 data/leads.db "ANALYZE;"
```

## Scaling Considerations

### Horizontal Scaling

If you need to scale beyond one server:

1. **Use PostgreSQL instead of SQLite**
2. **Set up load balancer** (Nginx, HAProxy)
3. **Shared session storage** (Redis)
4. **Centralized logging** (ELK stack)

### Database Migration from SQLite to PostgreSQL

When ready to scale:

1. Install PostgreSQL
2. Export SQLite data: `npm run export-leads`
3. Update connection in server.js to use `pg` package
4. Import data to PostgreSQL
5. Update queries for PostgreSQL syntax

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 [PID]
```

### Database Lock Errors

SQLite doesn't handle high concurrency well:
- Reduce timeout in database config
- Consider PostgreSQL for production
- Implement retry logic

### PM2 Not Starting

```bash
# Check PM2 status
pm2 status

# Check logs for errors
pm2 logs spreadsheet-automation --err

# Delete and recreate
pm2 delete spreadsheet-automation
pm2 start server.js --name spreadsheet-automation
```

### 502 Bad Gateway

- Check if Node.js server is running: `pm2 status`
- Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`
- Verify proxy_pass URL in Nginx config
- Check firewall rules

## Maintenance Tasks

### Weekly

- Check disk space: `df -h`
- Review error logs: `pm2 logs spreadsheet-automation --err`
- Verify backups exist: `ls -lah backups/`

### Monthly

- Update dependencies: `npm update`
- Review and archive old exports
- Analyze lead conversion metrics
- Clean up old backups (keep last 12)

### Quarterly

- Security audit
- Performance testing
- Update Node.js version
- Review and optimize database queries

## Rollback Procedure

If deployment fails:

1. **Stop new version:**
```bash
pm2 stop spreadsheet-automation
```

2. **Restore previous code:**
```bash
git checkout [previous-commit]
```

3. **Restore database backup:**
```bash
cp backups/leads-backup-[date].db data/leads.db
```

4. **Restart:**
```bash
pm2 restart spreadsheet-automation
```

## Support and Documentation

- Server logs: `pm2 logs spreadsheet-automation`
- Database location: `./data/leads.db`
- Exports location: `./exports/`
- Backups location: `./backups/`

## Version Control

Tag releases:
```bash
git tag -a v2.0.0 -m "Production deployment - Node.js version"
git push origin v2.0.0
```

## Next Steps After Deployment

1. Test all forms and API endpoints
2. Verify Calendly integration
3. Set up monitoring alerts
4. Configure backup notifications
5. Train team on admin operations
6. Document any custom configurations
7. Set up staging environment for testing updates

## Cost Considerations

Running costs on typical VPS:
- DigitalOcean Droplet: $6-12/month
- SSL Certificate: Free (Let's Encrypt)
- Domain: ~$12/year
- Backup storage: Included

Or use your existing infrastructure with no additional cost.

