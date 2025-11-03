# Spreadsheet Automation - AI-Powered Same-Day Mockup System

Transform client spreadsheets into automated systems with AI-generated visual demonstrations delivered during discovery calls.

## 🎉 New: Node.js Production-Ready Version (v2.0)

This project has been upgraded with a complete Node.js backend and comprehensive deployment guides for integration with your company website.

**Start here:**
- **Quick Setup (5 min)**: [QUICKSTART.md](QUICKSTART.md)
- **Full Overview**: [README_NEW.md](README_NEW.md)
- **Production Deploy**: [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md)
- **Website Integration**: [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)

## What This Is

A complete system for:
1. **Marketing** - Landing page showcasing AI-powered mockup generation
2. **Discovery** - 30-minute requirements capture call
3. **AI Generation** - Real-time documentation and mockup creation
4. **Demonstration** - Interactive HTML mockups delivered same-call
5. **Training** - Optional: Teach clients your AI development methods

## Quick Navigation

### 🚀 Start Here
- **[ONE_WEEK_MOCKUP_SYSTEM.md](ONE_WEEK_MOCKUP_SYSTEM.md)** - System overview and quick start
- **[WORKFLOW_TO_MOCKUP_GUIDE.md](WORKFLOW_TO_MOCKUP_GUIDE.md)** - Day-by-day process guide

### 📋 Workflow Templates
- **[workflow-templates/](workflow-templates/)** - Document current state and design solutions
  - `TEMPLATE_workflow-name.md` - Copy this for each client
  - `EXAMPLE_manufacturing-inventory.md` - Completed example
  - `README.md` - Usage guide

### 🎨 Mockup Framework
- **[mockup-framework/](mockup-framework/)** - Interactive HTML demonstrations
  - `index.html` - Mockup structure
  - `styles.css` - Visual design
  - `script.js` - Interactive features
  - `README.md` - Customization guide

### 🌐 Landing Page
- **[camp/](camp/)** - Marketing site with lead capture
  - Updated with one-week mockup offering
  - Calendly integration for discovery calls
  - Database for lead tracking

### 🔧 API & Database
- **[api/](api/)** - Lead capture backend
  - Flask REST API
  - SQLite database
  - Calendly redirect

## The Process

```
Landing Page → Discovery Call (60 min) → Same-Day Delivery → Proposal → Sale
    Free       Requirements (30 min)   AI generates (15-30 min)   Pricing
             AI builds while talking    Demo on same call          Close
```

### For Each Client

1. **Part 1 (30 min):** Discovery call - screen share their workflow
2. **Part 2 (15-30 min):** AI agents generate workflow docs + mockup in real-time
3. **Part 3 (15 min):** Demo working mockup, deploy URL, send same day

## What You Deliver

### Workflow Documentation
- Visual workflow map (current vs proposed)
- Pain point analysis with ROI
- Data structure design
- Implementation plan
- PDF deliverable

### Interactive Mockup
- Clickable prototype
- Dashboard previews
- Before/after comparison
- Working demonstrations
- Deployed URL

## File Organization

```
spreadsheet-automation/
├── camp/                          # Landing page
├── api/                           # Lead capture API
├── workflow-templates/            # Documentation templates
├── mockup-framework/              # Mockup templates
├── client-name/                   # Each client gets a folder
│   ├── WORKFLOW.md               # Their workflow doc
│   └── mockup/                   # Their mockup
├── WORKFLOW_TO_MOCKUP_GUIDE.md   # Complete process
└── ONE_WEEK_MOCKUP_SYSTEM.md     # System overview
```

## Setup

### Landing Page & API

```bash
# Install API dependencies
cd api
pip install -r requirements.txt

# Start API server
python app.py

# Open landing page
cd ../camp
open index.html
```

See [SETUP.md](SETUP.md) for complete setup instructions.

### First Client Project

```bash
# Copy templates
cp workflow-templates/TEMPLATE_workflow-name.md client-name/WORKFLOW.md
cp -r mockup-framework/ client-name-mockup/

# After discovery call, customize both
# Deploy mockup to Netlify
# Export workflow doc to PDF
# Deliver!
```

## Documentation

- **[ONE_WEEK_MOCKUP_SYSTEM.md](ONE_WEEK_MOCKUP_SYSTEM.md)** - Complete system overview
- **[WORKFLOW_TO_MOCKUP_GUIDE.md](WORKFLOW_TO_MOCKUP_GUIDE.md)** - Step-by-step process guide
- **[SETUP.md](SETUP.md)** - Technical setup instructions
- **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - API testing procedures
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - API implementation details

## Key Features

### Workflow Templates
- Mermaid diagram integration
- Complete structure for analysis
- Real-world examples
- ROI calculators

### Mockup Framework
- Fully interactive
- Responsive design
- Customizable branding
- No build process required

### Landing Page
- Lead capture forms
- Calendly integration
- Database storage
- Professional design

## Getting Started

1. **Read the overview:**
   ```bash
   cat ONE_WEEK_MOCKUP_SYSTEM.md
   ```

2. **Study the example:**
   ```bash
   cat workflow-templates/EXAMPLE_manufacturing-inventory.md
   ```

3. **Set up landing page:**
   - Configure Calendly URL in `camp/script.js`
   - Deploy API (see [SETUP.md](SETUP.md))
   - Test lead capture flow

4. **Schedule first discovery call:**
   - Follow process in [WORKFLOW_TO_MOCKUP_GUIDE.md](WORKFLOW_TO_MOCKUP_GUIDE.md)
   - Deliver mockup in 7 days
   - Iterate and improve

## Business Model

**Value Proposition:** Watch your solution come to life in real-time

**Offer:** Free interactive mockup delivered same-day (often during call)

**Conversion:** Live demonstration → immediate pricing discussion → project proposal

**Target:** 50%+ conversion rate from mockup to project

**Bonus Revenue Stream:** AI development training for clients ($2,500-$25,000)

## Support

All documentation is self-contained in this repository:

- System questions → `ONE_WEEK_MOCKUP_SYSTEM.md`
- Process questions → `WORKFLOW_TO_MOCKUP_GUIDE.md`
- Template questions → `workflow-templates/README.md`
- Mockup questions → `mockup-framework/README.md`
- Technical questions → `SETUP.md`

## Technology Stack

**Backend:** Node.js 18+, Express.js (upgraded from Python Flask)

**Database:** SQLite 3 (easily upgradable to PostgreSQL)

**Frontend:** HTML, CSS, JavaScript (no frameworks)

**Workflow Docs:** Markdown with Mermaid diagrams

**Process Management:** PM2

**Deployment:** Your company website, VPS, or cloud services

## License

Internal use. Customize for your business.

## Version History

**v2.0** - November 2025 (Current - Production Ready)
- Complete Node.js/Express backend
- Replaces Python Flask API
- Production deployment guides
- Website integration documentation
- Migration tools and scripts
- Automated backup and export scripts
- Comprehensive configuration management
- Security hardening documentation

**v1.0** - November 2025
- Initial system release
- Python Flask API
- Complete workflow templates
- Interactive mockup framework
- Updated landing page
- Process documentation

---

**Next Steps:**
- New users: Read [QUICKSTART.md](QUICKSTART.md) for 5-minute setup
- Production deployment: See [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md)
- Website integration: See [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)
- Complete overview: Read [README_NEW.md](README_NEW.md)

