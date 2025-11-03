# Quick Start Guide

Get the Spreadsheet Automation Platform running in 5 minutes.

## Prerequisites

- Node.js 18+ and npm 9+
- Basic command line knowledge
- Text editor

Check versions:
```bash
node --version  # Should be 18.0.0 or higher
npm --version   # Should be 9.0.0 or higher
```

## Installation (5 minutes)

### Step 1: Install Dependencies (1 min)

```bash
npm install
```

### Step 2: Configure Environment (1 min)

```bash
# Copy template
cp env.example .env
```

Edit `.env` file with your details:
```env
NODE_ENV=development
PORT=3000
DB_PATH=./data/leads.db
CALENDLY_URL=https://calendly.com/YOUR-USERNAME/YOUR-EVENT
```

**Important**: Update the Calendly URL with your actual Calendly link.

### Step 3: Set Up Database (1 min)

```bash
npm run prepare-db
```

This creates the database and tables.

### Step 4: Update Calendly Link in Frontend (1 min)

Edit `public/script.js` line 148:

```javascript
const calendlyUrl = 'https://calendly.com/YOUR-USERNAME/YOUR-EVENT';
```

Replace with your actual Calendly scheduling link.

### Step 5: Start Server (1 min)

```bash
npm run dev
```

You should see:
```
Server running on port 3000
Environment: development
Access at: http://localhost:3000
```

## Test It Works

1. Open browser to `http://localhost:3000`
2. You should see the landing page
3. Scroll down to the form
4. Fill out with test data
5. Click "Schedule Your Analysis Call"
6. You should redirect to Calendly

## Check Database

Verify the lead was saved:

```bash
sqlite3 data/leads.db "SELECT * FROM leads;"
```

Or use the API:
```bash
curl http://localhost:3000/api/leads
```

## View Mockup Framework

Visit: `http://localhost:3000/mockup`

This is the interactive demo framework you'll customize for clients.

## Next Steps

### For Development

You're ready to:
- Customize the landing page in `public/index.html`
- Modify styles in `public/styles.css`
- Update mockup in `public/mockup/`
- Test lead capture flow

### For Production Deployment

See [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md) for:
- Server deployment
- SSL configuration
- PM2 process management
- Nginx setup

### For Website Integration

See [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) for:
- Integrating with existing Node.js site
- Subdirectory deployment
- Reverse proxy configuration

## Common Issues

### Port 3000 Already in Use

Change port in `.env`:
```env
PORT=3001
```

### Database Not Found

Run:
```bash
npm run prepare-db
```

### Cannot Find Module

Run:
```bash
npm install
```

### Calendly Not Redirecting

Check:
1. URL is correct in `public/script.js` line 148
2. URL includes the full path with event name
3. Test URL directly in browser

## File Organization

Before using with clients, organize files:

```bash
# Linux/Mac
./migrate-files.sh

# Windows
mkdir public\mockup
mkdir data scripts exports backups logs
copy camp\* public\
copy mockup-framework\* public\mockup\
```

## Customize for Your Company

### 1. Update Branding

Edit `public/styles.css`:
```css
:root {
    --color-primary: #YOUR-BRAND-COLOR;
}
```

### 2. Update Company Name

Find and replace in:
- `public/index.html`
- `public/mockup/index.html`

### 3. Add Your Logo

Add logo to `public/assets/logo.png` and reference in HTML:
```html
<img src="/assets/logo.png" alt="Company Logo">
```

## Development Workflow

### Making Changes

1. Edit files in `public/` directory
2. Refresh browser to see changes (no restart needed)
3. For server changes, restart: `Ctrl+C` then `npm run dev`

### Testing Forms

1. Fill out form on landing page
2. Check database: `curl http://localhost:3000/api/leads`
3. Verify redirect to Calendly works

### Testing Mockup

1. Visit `http://localhost:3000/mockup`
2. Click through interactive workflow
3. Test all dashboard tabs
4. Verify responsive design (resize browser)

## Utility Commands

```bash
# Export leads to CSV
npm run export-leads

# Backup database
npm run backup-db

# View all leads
curl http://localhost:3000/api/leads

# Check server health
curl http://localhost:3000/health

# View database statistics
curl http://localhost:3000/api/stats
```

## Production Checklist

Before deploying to production:

- [ ] Update Calendly URL in code
- [ ] Change NODE_ENV to "production" in `.env`
- [ ] Configure ALLOWED_ORIGINS for your domain
- [ ] Set up automated backups
- [ ] Configure SSL certificate
- [ ] Set up PM2 for process management
- [ ] Configure reverse proxy (Nginx/Apache)
- [ ] Test all forms and redirects
- [ ] Verify database permissions

## Getting Help

1. **Server Issues**: Check `pm2 logs` or console output
2. **Database Issues**: Verify `data/leads.db` exists and has correct permissions
3. **API Issues**: Test endpoints with curl commands above
4. **Frontend Issues**: Check browser console for JavaScript errors

## Documentation

- [README_NEW.md](README_NEW.md) - Complete overview
- [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md) - Deployment guide
- [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) - Integration methods
- [MIGRATION_CHECKLIST.md](MIGRATION_CHECKLIST.md) - Python to Node.js migration

## What's Next?

1. **Customize**: Update branding and content for your company
2. **Test**: Run through full lead capture flow
3. **Deploy**: Follow production deployment guide
4. **Integrate**: Connect with your company website
5. **Use**: Start capturing leads and delivering mockups!

---

**Need Help?** Check the full documentation or review error logs for specific issues.

