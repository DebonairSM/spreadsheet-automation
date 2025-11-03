# Campaign Setup Guide

This guide walks you through setting up the lead capture system with Calendly integration.

## Prerequisites

- Python 3.9 or higher
- A Calendly account with a scheduling link
- A web server or local development environment

## Step 1: Configure Calendly URL

1. Log in to your Calendly account at [calendly.com](https://calendly.com)
2. Create or locate your scheduling event (e.g., "Spreadsheet Consultation")
3. Copy your Calendly scheduling link (format: `https://calendly.com/YOUR-USERNAME/event-name`)
4. Open `camp/script.js` in your editor
5. Find line 149 and replace the placeholder URL:

```javascript
// Before:
const calendlyUrl = 'https://calendly.com/YOUR-USERNAME/spreadsheet-consultation';

// After (example):
const calendlyUrl = 'https://calendly.com/john-doe/spreadsheet-consultation';
```

## Step 2: Install Backend Dependencies

```bash
cd api
pip install -r requirements.txt
```

Or use a virtual environment (recommended):

```bash
cd api
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Step 3: Initialize the Database

The database will be automatically initialized when you first run the API, but you can verify it manually:

```bash
cd api
python -c "import database; database.init_db()"
```

This creates `api/leads.db` with the proper schema.

## Step 4: Start the API Server

### Development Mode

```bash
cd api
python app.py
```

The API will start on `http://localhost:5000`

### Production Mode (with Gunicorn)

```bash
cd api
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## Step 5: Configure Frontend to Connect to API

### Local Development

If running locally, the frontend is already configured to use `/api/leads` which will work if you:

1. Serve the frontend from the same origin as the API, OR
2. Update the fetch URL in `camp/script.js` line 135:

```javascript
// For separate frontend/backend servers during development:
fetch('http://localhost:5000/api/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(leadData)
})
```

### Production

For production, use a reverse proxy (Nginx or similar) to route `/api/*` requests to your Flask backend:

**Nginx Example:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    # Serve static files
    location / {
        root /var/www/campaign;
        try_files $uri $uri/ /index.html;
    }
    
    # Proxy API requests
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Step 6: Test the Integration

### Test 1: Health Check

```bash
curl http://localhost:5000/health
```

Expected output:
```json
{"status": "healthy", "message": "API is running"}
```

### Test 2: Create a Test Lead

```bash
curl -X POST http://localhost:5000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "company": "Test Corp",
    "description": "Testing the system",
    "form_type": "scan"
  }'
```

Expected output:
```json
{"success": true, "lead_id": 1, "message": "Lead captured successfully"}
```

### Test 3: Verify Database Entry

```bash
cd api
sqlite3 leads.db "SELECT * FROM leads;"
```

### Test 4: Test Frontend Form

1. Open `camp/index.html` in a web browser
2. Navigate to the "Free Spreadsheet Analysis" section
3. Fill out the form with test data
4. Click "Schedule Your Analysis Call"
5. Verify:
   - Form shows "Saving..." while submitting
   - You're redirected to Calendly
   - Database contains the new lead entry

### Test 5: View All Leads

```bash
curl http://localhost:5000/api/leads
```

Or in a browser: `http://localhost:5000/api/leads`

## Step 7: Deployment

### Option A: Deploy to a VPS (DigitalOcean, Linode, etc.)

1. Upload files to server
2. Install Python and dependencies
3. Set up Nginx as reverse proxy
4. Use systemd to run Flask as a service
5. Configure SSL with Let's Encrypt

### Option B: Deploy to Heroku

1. Create `Procfile`:
```
web: gunicorn app:app
```

2. Deploy:
```bash
heroku create your-app-name
git add .
git commit -m "Initial deployment"
git push heroku main
```

### Option C: Deploy Frontend to Netlify/Vercel

1. Deploy campaign files (camp/) to Netlify or Vercel
2. Update fetch URL in script.js to point to your deployed API
3. Configure CORS in Flask to allow requests from your frontend domain

## Troubleshooting

### CORS Errors

If you see CORS errors in the browser console:

1. Verify flask-cors is installed: `pip list | grep flask-cors`
2. Check API logs for incoming requests
3. For development, you may need to update CORS configuration in `api/app.py`:

```python
CORS(app, origins=['http://localhost:8000', 'https://yourdomain.com'])
```

### API Not Receiving Requests

1. Check that API is running: `curl http://localhost:5000/health`
2. Check browser network tab for request details
3. Verify the fetch URL in script.js matches your API location
4. Check for typos in the endpoint path

### Database Locked Errors

SQLite can have concurrency issues with multiple simultaneous writes:

1. For low-traffic sites, this is usually not a problem
2. For production with higher traffic, consider PostgreSQL
3. Temporary fix: Add retry logic or increase timeout

### Calendly Not Redirecting

1. Verify the Calendly URL is correct in script.js
2. Check browser console for JavaScript errors
3. Test the Calendly URL directly in browser
4. Ensure the URL includes the full path (e.g., `/event-name`)

## Security Checklist

- [ ] Added api/leads.db to .gitignore
- [ ] Using HTTPS in production
- [ ] Configured CORS to only allow your domain
- [ ] Implemented rate limiting (optional but recommended)
- [ ] Set up database backups
- [ ] Secured API endpoints (consider adding auth for GET requests)
- [ ] Validated and sanitized all user inputs

## Maintenance

### View Database Statistics

```bash
cd api
python -c "import database; print(database.get_stats())"
```

### Backup Database

```bash
sqlite3 api/leads.db ".backup 'backup-$(date +%Y%m%d).db'"
```

### Export Leads to CSV

```bash
sqlite3 -header -csv api/leads.db "SELECT * FROM leads;" > leads.csv
```

### Clear Test Data

```bash
sqlite3 api/leads.db "DELETE FROM leads WHERE email LIKE '%test%';"
```

## Next Steps

1. Set up email notifications when new leads are captured
2. Integrate with a CRM system
3. Add analytics tracking
4. Set up monitoring and alerting
5. Implement automated backups
6. Add A/B testing for form variations

## Support

For issues or questions:
- Check the API logs for errors
- Review browser console for frontend errors
- Refer to Flask documentation: [flask.palletsprojects.com](https://flask.palletsprojects.com)
- Refer to Calendly API docs: [developer.calendly.com](https://developer.calendly.com)

