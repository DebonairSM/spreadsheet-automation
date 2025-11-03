# Interactive Mockup Framework

A reusable HTML/CSS/JS framework for quickly creating client demonstration mockups. This framework allows you to showcase proposed automation solutions with interactive workflows, live dashboards, and before/after comparisons.

## What This Is For

After gathering client requirements (screen captures, spreadsheets, interviews), use this framework to deliver a one-week free mockup that demonstrates:

1. **Visual Workflow** - How data flows through the proposed system
2. **Interactive Demo** - Simulated data entry and processing
3. **Dashboard Preview** - What reports and metrics they'll see
4. **ROI Comparison** - Before vs after side-by-side

## Quick Start

1. Copy this entire `mockup-framework` directory
2. Rename it to `client-name-mockup`
3. Edit the customization sections in each file
4. Test locally by opening `index.html`
5. Deploy to Netlify, Vercel, or any static host

## File Structure

```
mockup-framework/
├── index.html      # Main mockup page
├── styles.css      # All styling (fully customizable)
├── script.js       # Interactive features
└── README.md       # This file
```

## Customization Guide

### Step 1: Update Content (index.html)

Replace these placeholders throughout the file:

- `[Client Name]` - Your client's company name
- `[Workflow Name]` - The specific process being automated
- Stats and metrics - Update with client-specific numbers
- Forms and data - Match client's actual fields

Key sections to customize:

**Hero Section (lines 30-65):**
```html
<h2 class="hero-title">Your Spreadsheet, Transformed</h2>
<p class="hero-subtitle">See how your current manual process becomes an automated system</p>
```

**Stats (lines 42-54):**
```html
<div class="stat-value">75%</div>
<div class="stat-label">Time Saved</div>
```

**Workflow Steps (lines 82-135):**
Update the 4 steps to match client's actual workflow.

**Demo Form (lines 141-159):**
Replace with client's actual fields (customer, order, inventory, etc.)

**Dashboard Metrics (lines 295-340):**
Use client's real KPIs and terminology.

**Comparison Lists (lines 426-486):**
List client's actual pain points vs proposed benefits.

**ROI Calculator (lines 495-519):**
Calculate actual time/cost savings based on client data.

### Step 2: Adjust Styling (styles.css)

**Colors (lines 10-17):**
```css
:root {
    --color-primary: #2563eb;        /* Brand color */
    --color-success: #10b981;        /* Success green */
    --color-danger: #ef4444;         /* Error red */
}
```

**Typography:**
Change font sizes, weights, or families as needed.

**Layout:**
Adjust grid columns, spacing, and responsive breakpoints.

### Step 3: Configure Interactions (script.js)

**Demo Data:**
Update the workflow steps to simulate client's actual process.

**Metrics Animation:**
Change the animated values to match client's scale.

**CTA Actions:**
Update button click handlers to use real Calendly links or contact forms.

## Deployment

### Option 1: Netlify (Easiest)

1. Drag and drop the mockup folder to Netlify
2. Get instant URL: `https://random-name.netlify.app`
3. Optional: Add custom domain

### Option 2: Vercel

```bash
cd client-name-mockup
vercel deploy
```

### Option 3: GitHub Pages

1. Push to GitHub repository
2. Enable Pages in Settings
3. Access at `https://yourusername.github.io/repo-name`

### Option 4: Share Locally

```bash
# Python
python -m http.server 8000

# Node.js
npx serve

# PHP
php -S localhost:8000
```

Then share: `http://localhost:8000`

## Customization Examples

### Example 1: Manufacturing Inventory Mockup

**Hero Stats:**
- Total SKUs: 2,847
- Low Stock Items: 23
- Stock Value: $487K

**Workflow Steps:**
1. Scan item → 2. Real-time update → 3. Auto-reorder check → 4. Dashboard refresh

**Dashboard:**
- Stock levels by warehouse
- Reorder alerts
- Movement trends

### Example 2: Service Business Scheduling

**Hero Stats:**
- Hours Saved: 15/week
- Booking Rate: +40%
- No-shows: -65%

**Workflow Steps:**
1. Client books online → 2. Calendar sync → 3. Auto-reminders → 4. Staff notified

**Dashboard:**
- Today's appointments
- Revenue by service
- Staff utilization

### Example 3: Legal Case Management

**Hero Stats:**
- Case Processing: 3x faster
- Documents: Auto-organized
- Billable Hours: +$120K/year

**Workflow Steps:**
1. Intake form → 2. Create case → 3. Assign tasks → 4. Track progress

**Dashboard:**
- Active cases by status
- Upcoming deadlines
- Time tracking by matter

## Interactive Features

### Workflow Demo
- Click through 4-step process
- Shows form → validation → processing → results
- Resets for multiple demonstrations

### Dashboard Tabs
- Executive view (high-level metrics)
- Manager view (team performance)
- User view (personal tasks)

### Before/After Comparison
- Side-by-side current vs proposed
- Visual highlighting of improvements
- ROI calculator

### Responsive Design
- Works on desktop, tablet, mobile
- Touch-friendly for iPad presentations
- Print-friendly for proposals

## Tips for Client Presentations

### Before the Meeting

1. **Customize thoroughly** - Use client's actual terminology, metrics, and workflows
2. **Test all interactions** - Click through every button and tab
3. **Prepare backup** - Have screenshots in case of tech issues
4. **Load on multiple devices** - Test on laptop and tablet

### During Presentation

1. **Start with overview** - Show hero stats and pain points
2. **Demo the workflow** - Click through interactive steps slowly
3. **Show each dashboard** - Executive, manager, user views
4. **Highlight ROI** - Before/after comparison and savings
5. **Answer questions** - Have workflow doc ready for details

### After Meeting

1. **Send link immediately** - Let them explore on their own
2. **Include PDF proposal** - With pricing and timeline
3. **Schedule follow-up** - Within 3-5 days
4. **Track engagement** - Add analytics if deployed

## Adding Analytics

Insert before closing `</body>` tag in `index.html`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=YOUR-ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'YOUR-ID');
</script>
```

Track:
- Page views (did they look at it?)
- Time on page (how engaged?)
- Section clicks (what interested them?)
- Button clicks (ready to move forward?)

## Advanced Customizations

### Add Real Data

Instead of static mockups, connect to your API:

```javascript
// In script.js
async function loadRealData() {
    const response = await fetch('/api/mockup-data/client-id');
    const data = await response.json();
    updateDashboard(data);
}
```

### Video Walkthrough

Record a Loom video walking through the mockup:

```html
<div class="video-container">
    <iframe src="https://www.loom.com/embed/YOUR-VIDEO-ID"></iframe>
</div>
```

### PDF Export

Add print styles for proposal generation:

```css
@media print {
    .nav, .btn { display: none; }
    .section { page-break-inside: avoid; }
}
```

### Multi-Page Mockup

For complex systems, split into multiple pages:
- `index.html` - Overview and workflow
- `dashboard.html` - Full dashboard demo
- `admin.html` - Admin panel mockup

## Troubleshooting

**Animations not working:**
- Check browser console for errors
- Verify script.js is loaded
- Test in different browser

**Layout broken on mobile:**
- Check viewport meta tag
- Test responsive breakpoints
- Adjust grid columns

**Slow performance:**
- Optimize images
- Minimize CSS/JS
- Remove unused code

## Version Control

Track customizations for each client:

```bash
git init
git add .
git commit -m "Initial mockup for [Client Name]"
git tag v1.0-client-name
```

## Support

This framework is designed to be simple and self-contained. All code is in three files with clear comments.

For questions about usage:
- Review the example workflow docs in `../workflow-templates/`
- Check HTML comments for guidance
- Refer to standard HTML/CSS/JS documentation

## License

Internal use only. Customize for client presentations.

