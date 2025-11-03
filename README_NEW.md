# Spreadsheet Automation Platform - Node.js Edition

An AI-powered system for transforming client spreadsheets into automated solutions with same-day interactive mockup delivery.

## What's New in v2.0

- **Node.js Backend**: Replaced Python Flask with Express.js for better integration with company websites
- **Production Ready**: Complete deployment guides and configuration management
- **Scalable Architecture**: Designed for integration with existing Node.js infrastructure
- **Enhanced Documentation**: Comprehensive guides for integration, deployment, and migration

## System Overview

This platform enables you to:
1. Capture leads through an interactive landing page
2. Conduct discovery calls with clients
3. Generate workflow documentation and interactive mockups
4. Deliver working demonstrations during or immediately after calls
5. Convert leads to paying projects

## Quick Start

### For Development

```bash
# Install dependencies
npm install

# Copy environment template
cp env.example .env

# Edit .env with your configuration
# At minimum, set your Calendly URL

# Initialize database
npm run prepare-db

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the landing page.

### For Production Deployment

See [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md) for complete deployment instructions.

For integrating with your existing company website, see [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md).

## Project Structure

```
spreadsheet-automation/
├── server.js                      # Express server
├── package.json                   # Dependencies
├── env.example                    # Configuration template
│
├── public/                        # Frontend (served statically)
│   ├── index.html                # Landing page
│   ├── styles.css                # Landing page styles
│   ├── script.js                 # Lead capture logic
│   └── mockup/                   # Mockup framework
│       ├── index.html
│       ├── styles.css
│       └── script.js
│
├── scripts/                      # Utility scripts
│   ├── init-db.js               # Initialize database
│   ├── export-leads.js          # Export to CSV
│   └── backup-db.js             # Backup database
│
├── workflow-templates/           # Client documentation templates
│   ├── TEMPLATE_workflow-name.md
│   └── EXAMPLE_manufacturing-inventory.md
│
└── docs/                         # Documentation
    ├── PRODUCTION_DEPLOYMENT.md
    ├── INTEGRATION_GUIDE.md
    └── MIGRATION_CHECKLIST.md
```

## Migration from Python Version

If you're upgrading from the Python Flask version:

1. See [MIGRATION_CHECKLIST.md](MIGRATION_CHECKLIST.md) for step-by-step instructions
2. Run `./migrate-files.sh` to reorganize your files
3. Follow the data migration steps to preserve your existing leads

## API Endpoints

### Public Endpoints

- `GET /` - Landing page
- `GET /mockup` - Mockup framework demo
- `POST /api/leads` - Create new lead
- `GET /health` - Health check

### Admin Endpoints

- `GET /api/leads` - List all leads (add authentication in production)
- `GET /api/leads/:id` - Get specific lead
- `GET /api/stats` - Database statistics

## Configuration

All configuration via environment variables in `.env`:

```env
# Server
NODE_ENV=production
PORT=3000

# Database
DB_PATH=./data/leads.db

# Integration
ALLOWED_ORIGINS=https://yourdomain.com
CALENDLY_URL=https://calendly.com/your-username/consultation

# Optional: Email notifications
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password
```

## Available Scripts

```bash
npm start          # Start production server
npm run dev        # Start with nodemon (auto-reload)
npm run prepare-db # Initialize database
npm run export-leads # Export leads to CSV
npm run backup-db  # Backup database
```

## Features

### Landing Page
- Lead capture forms with validation
- Calendly integration for scheduling
- Responsive design
- No-build-required vanilla JavaScript

### Mockup Framework
- Interactive workflow demonstrations
- Customizable for each client
- Before/after comparisons
- Dashboard previews
- Deploy anywhere static hosting works

### Workflow Templates
- Mermaid diagram support
- ROI calculators
- Implementation planning
- PDF export ready

### API & Database
- SQLite for easy deployment
- RESTful API design
- Input validation
- CORS configuration
- Ready for PostgreSQL/MySQL migration

## Deployment Options

### 1. Integrate with Existing Site
Add routes to your existing Node.js application. Perfect for adding to your company website.

### 2. Standalone Service
Deploy as separate service with reverse proxy. Good for subdomain deployment.

### 3. Subdirectory
Serve from path like `yourdomain.com/automation`. Clean integration option.

### 4. Serverless
Deploy to Vercel/Netlify (requires database changes).

See [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) for detailed instructions on each option.

## Security Considerations

For production deployment:

1. **Environment Variables**: Never commit `.env` files
2. **Database**: Restrict file permissions on `data/leads.db`
3. **CORS**: Limit to your domains only
4. **Rate Limiting**: Implement on API endpoints
5. **HTTPS**: Always use SSL in production
6. **Authentication**: Add to admin endpoints

## Monitoring

### Check Application Health

```bash
curl https://yourdomain.com/health
```

### View Logs

```bash
pm2 logs spreadsheet-automation
```

### Database Statistics

```bash
curl https://yourdomain.com/api/stats
```

## Backup & Recovery

### Automated Backups

Set up with cron (Linux/Mac):

```bash
# Daily backup at 2 AM
0 2 * * * cd /path/to/app && npm run backup-db

# Weekly export on Sundays
0 3 * * 0 cd /path/to/app && npm run export-leads
```

### Manual Backup

```bash
npm run backup-db  # Creates timestamped backup in backups/
```

### Export to CSV

```bash
npm run export-leads  # Creates CSV in exports/
```

## Customization

### Branding

Update colors in `public/styles.css` and `public/mockup/styles.css`:

```css
:root {
    --color-primary: #YOUR-COLOR;
    --color-primary-dark: #DARKER-SHADE;
}
```

### Calendly URL

Update in `.env`:
```env
CALENDLY_URL=https://calendly.com/your-username/your-event
```

Then update `public/script.js` line 148 with your URL.

### Forms

Modify form fields in `public/index.html` and update handler in `public/script.js`.

## Scaling

### From SQLite to PostgreSQL

When you need better concurrency:

1. Install: `npm install pg`
2. Update connection in `server.js`
3. Migrate data using export/import scripts
4. Update queries for PostgreSQL syntax

### Multiple Servers

1. Use PostgreSQL or MongoDB
2. Set up load balancer
3. Use Redis for sessions
4. Centralize logging

## Troubleshooting

### Port Already in Use

```bash
# Find process on port 3000
lsof -i :3000
# Kill it
kill -9 [PID]
```

### Database Locked

SQLite doesn't handle high concurrency. Consider PostgreSQL for production.

### CORS Errors

Update ALLOWED_ORIGINS in `.env` to include your domain.

### PM2 Issues

```bash
pm2 delete all
pm2 start server.js --name spreadsheet-automation
```

## Documentation

- [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md) - Complete deployment guide
- [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) - Integration methods and examples
- [MIGRATION_CHECKLIST.md](MIGRATION_CHECKLIST.md) - Upgrade from Python version
- [WORKFLOW_TO_MOCKUP_GUIDE.md](WORKFLOW_TO_MOCKUP_GUIDE.md) - Client process guide
- [ONE_WEEK_MOCKUP_SYSTEM.md](ONE_WEEK_MOCKUP_SYSTEM.md) - System overview

## Technology Stack

- **Backend**: Node.js 18+, Express.js 4.x
- **Database**: SQLite 3 (easily migrate to PostgreSQL)
- **Frontend**: Vanilla HTML/CSS/JavaScript (no frameworks)
- **Process Management**: PM2
- **Reverse Proxy**: Nginx or Apache
- **SSL**: Let's Encrypt via Certbot

## Support

### Getting Help

1. Check documentation in the `docs/` folder
2. Review error logs: `pm2 logs spreadsheet-automation`
3. Test API directly: `curl http://localhost:3000/health`
4. Verify environment variables in `.env`

### Common Issues

- Forms not submitting → Check API endpoint URLs
- Calendly not redirecting → Verify URL in script.js
- Database errors → Run `npm run prepare-db`
- Server won't start → Check port availability

## Roadmap

Future enhancements:
- PostgreSQL support out of the box
- Admin dashboard for lead management
- Email notifications on lead capture
- CRM integrations (Salesforce, HubSpot)
- Analytics dashboard
- Multi-language support
- A/B testing framework

## Contributing

This is a private company tool. For internal updates:

1. Create feature branch
2. Test locally with `npm run dev`
3. Update documentation if needed
4. Deploy to staging first
5. Review and merge

## Version History

### v2.0.0 (Current)
- Complete Node.js rewrite
- Production-ready deployment
- Enhanced documentation
- Integration guides

### v1.0.0
- Initial Python Flask version
- Basic lead capture
- Mockup framework
- Landing page

## License

Internal use only. All rights reserved.

## Contact

For questions about deployment or integration:
- Review documentation in this repository
- Check server logs for errors
- Test API endpoints directly

---

**Ready to Deploy?** Start with [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md) or [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) depending on your needs.

