# Testing Guide: End-to-End Lead Capture Flow

This guide provides step-by-step instructions for testing the complete lead capture system from form submission to Calendly redirect.

## Prerequisites

Before testing, ensure:
- [ ] Python 3.9+ is installed
- [ ] Flask API dependencies are installed (`pip install -r api/requirements.txt`)
- [ ] Calendly URL is configured in `camp/script.js` (line 149)
- [ ] API is running on `http://localhost:5000`

## Setup for Testing

### 1. Start the API Server

**On Windows:**
```bash
cd api
run.bat
```

**On macOS/Linux:**
```bash
cd api
chmod +x run.sh
./run.sh
```

**Or manually:**
```bash
cd api
python app.py
```

You should see:
```
Database initialized at: /path/to/api/leads.db
Database initialized successfully
Starting Flask API on http://localhost:5000
```

### 2. Serve the Frontend

**Option A: Python HTTP Server**
```bash
cd camp
python -m http.server 8000
```

**Option B: Node.js HTTP Server**
```bash
cd camp
npx http-server -p 8000
```

**Option C: Open Directly**
Simply open `camp/index.html` in your browser (may have CORS issues)

## Test Cases

### Test 1: API Health Check

Verify the API is running correctly.

**Steps:**
1. Open a browser or use curl
2. Navigate to: `http://localhost:5000/health`

**Expected Result:**
```json
{
  "status": "healthy",
  "message": "API is running"
}
```

**Status:** ✅ Pass / ❌ Fail

---

### Test 2: Spreadsheet Scan Form Submission

Test the "Free Spreadsheet Analysis" form.

**Steps:**
1. Open the campaign page in browser: `http://localhost:8000`
2. Scroll to "Free Spreadsheet Analysis" section (or click link in nav)
3. Fill in the form:
   - Name: `Test User`
   - Email: `test-scan@example.com`
   - Company: `Test Corp` (optional)
4. Click "Schedule Your Analysis Call"
5. Observe the button text change to "Saving..."
6. Wait for redirect to Calendly

**Expected Results:**
- ✅ Form validates required fields (name, email)
- ✅ Button shows "Saving..." during submission
- ✅ Browser redirects to Calendly page
- ✅ No error notifications appear

**Verify in Database:**
```bash
sqlite3 api/leads.db "SELECT * FROM leads WHERE email='test-scan@example.com';"
```

Should show the new lead with `form_type='scan'`

**Status:** ✅ Pass / ❌ Fail

---

### Test 3: Challenge Form Submission

Test the "Spreadsheet to System Challenge" form.

**Steps:**
1. Scroll to "The Spreadsheet to System Challenge" section
2. Fill in the form:
   - Name: `Challenge User`
   - Email: `test-challenge@example.com`
   - Company: `Challenge Corp`
   - Description: `Complex inventory spreadsheet with macros`
3. Click "Schedule Challenge Review"
4. Observe the button behavior
5. Wait for redirect to Calendly

**Expected Results:**
- ✅ Form validates all required fields
- ✅ Button shows "Saving..." during submission
- ✅ Browser redirects to Calendly page
- ✅ No error notifications appear

**Verify in Database:**
```bash
sqlite3 api/leads.db "SELECT * FROM leads WHERE email='test-challenge@example.com';"
```

Should show the new lead with `form_type='challenge'` and the description

**Status:** ✅ Pass / ❌ Fail

---

### Test 4: Form Validation - Missing Required Fields

Test that validation works correctly.

**Steps:**
1. Open the Spreadsheet Scan form
2. Click "Schedule Your Analysis Call" without filling any fields
3. Observe the validation behavior

**Expected Results:**
- ✅ Error notification appears: "Please fill in all required fields"
- ✅ Required fields show red border
- ✅ Form does NOT submit
- ✅ No API call is made
- ✅ Red border disappears when you start typing

**Status:** ✅ Pass / ❌ Fail

---

### Test 5: Form Validation - Invalid Email

Test email validation.

**Steps:**
1. Open the Spreadsheet Scan form
2. Fill in:
   - Name: `Test User`
   - Email: `notanemail` (invalid format)
3. Click "Schedule Your Analysis Call"

**Expected Results:**
- ✅ Error notification appears: "Please enter a valid email address"
- ✅ Email field shows red border
- ✅ Form does NOT submit
- ✅ Border disappears when you correct the email

**Status:** ✅ Pass / ❌ Fail

---

### Test 6: Duplicate Submission Handling

Test what happens when the same email submits twice.

**Steps:**
1. Submit a form with email: `duplicate@example.com`
2. Wait for redirect to complete
3. Go back to the campaign page
4. Submit the same form with the same email but different name/company
5. Check database

**Expected Results:**
- ✅ Both submissions succeed (no errors)
- ✅ Database contains only ONE entry for that email+form_type
- ✅ Entry shows the MOST RECENT data (updated info)

**Verify:**
```bash
sqlite3 api/leads.db "SELECT * FROM leads WHERE email='duplicate@example.com';"
```

Should show only 1 row with the latest data

**Status:** ✅ Pass / ❌ Fail

---

### Test 7: API Direct Call (Backend Only)

Test the API directly without the frontend.

**Steps:**
```bash
curl -X POST http://localhost:5000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API Test User",
    "email": "api-test@example.com",
    "company": "API Test Corp",
    "description": "Testing via curl",
    "form_type": "scan"
  }'
```

**Expected Result:**
```json
{
  "success": true,
  "lead_id": 3,
  "message": "Lead captured successfully"
}
```

**Verify:**
```bash
sqlite3 api/leads.db "SELECT * FROM leads WHERE email='api-test@example.com';"
```

**Status:** ✅ Pass / ❌ Fail

---

### Test 8: API Error Handling - Missing Fields

Test API validation.

**Steps:**
```bash
curl -X POST http://localhost:5000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User"
  }'
```

(Missing required email field)

**Expected Result:**
```json
{
  "error": "Missing required fields: name and email are required"
}
```

HTTP status: 400 Bad Request

**Status:** ✅ Pass / ❌ Fail

---

### Test 9: API Error Handling - Invalid Email

Test email validation in API.

**Steps:**
```bash
curl -X POST http://localhost:5000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "notanemail"
  }'
```

**Expected Result:**
```json
{
  "error": "Invalid email format"
}
```

HTTP status: 400 Bad Request

**Status:** ✅ Pass / ❌ Fail

---

### Test 10: Retrieve All Leads

Test the GET endpoint.

**Steps:**
```bash
curl http://localhost:5000/api/leads
```

**Expected Result:**
```json
{
  "success": true,
  "count": 5,
  "leads": [
    {
      "id": 1,
      "name": "Test User",
      "email": "test@example.com",
      "company": "Test Corp",
      "description": "",
      "form_type": "scan",
      "created_at": "2025-11-03 12:34:56"
    }
  ]
}
```

**Status:** ✅ Pass / ❌ Fail

---

### Test 11: Filter Leads by Form Type

Test query parameter filtering.

**Steps:**
```bash
# Get only scan leads
curl http://localhost:5000/api/leads?form_type=scan

# Get only challenge leads
curl http://localhost:5000/api/leads?form_type=challenge
```

**Expected Results:**
- ✅ Each query returns only leads matching the form_type
- ✅ Response includes accurate count
- ✅ Leads are ordered by created_at (most recent first)

**Status:** ✅ Pass / ❌ Fail

---

### Test 12: CORS Configuration

Test that CORS is properly configured.

**Steps:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Submit a form from the campaign page
4. Check for CORS errors in console

**Expected Results:**
- ✅ No CORS errors appear
- ✅ Request completes successfully
- ✅ Redirect to Calendly works

**If CORS errors appear:**
- Check that flask-cors is installed
- Verify CORS configuration in `api/app.py`

**Status:** ✅ Pass / ❌ Fail

---

### Test 13: Network Failure Handling

Test what happens when API is unavailable.

**Steps:**
1. Stop the API server (Ctrl+C)
2. Try to submit a form on the campaign page
3. Observe error handling

**Expected Results:**
- ✅ Error notification appears: "Something went wrong. Please try again."
- ✅ Submit button returns to original text
- ✅ Submit button is re-enabled
- ✅ Form data is preserved (not cleared)
- ✅ No redirect to Calendly occurs

**Status:** ✅ Pass / ❌ Fail

---

### Test 14: Database Persistence

Test that data persists after API restart.

**Steps:**
1. Submit a test form
2. Verify entry in database
3. Stop the API server
4. Restart the API server
5. Check database again

**Expected Results:**
- ✅ Database file (`api/leads.db`) still exists
- ✅ Previous entries are still present
- ✅ API starts without errors
- ✅ GET /api/leads returns previous entries

**Status:** ✅ Pass / ❌ Fail

---

### Test 15: Performance - Multiple Concurrent Submissions

Test handling of multiple simultaneous form submissions.

**Steps:**
```bash
# Submit 5 leads concurrently
for i in {1..5}; do
  curl -X POST http://localhost:5000/api/leads \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"User $i\",\"email\":\"user$i@example.com\",\"form_type\":\"scan\"}" &
done
wait
```

**Expected Results:**
- ✅ All 5 requests succeed
- ✅ Database contains all 5 entries
- ✅ No database lock errors
- ✅ Each lead has a unique ID

**Verify:**
```bash
sqlite3 api/leads.db "SELECT COUNT(*) FROM leads WHERE email LIKE 'user%@example.com';"
```

Should return: 5

**Status:** ✅ Pass / ❌ Fail

---

## Clean Up Test Data

After testing, clean up the test data:

```bash
sqlite3 api/leads.db "DELETE FROM leads WHERE email LIKE '%example.com';"
```

Or delete the entire database and start fresh:

```bash
rm api/leads.db
python -c "import sys; sys.path.insert(0, 'api'); import database; database.init_db()"
```

## Common Issues and Solutions

### Issue: CORS errors in browser console

**Solution:**
- Ensure flask-cors is installed: `pip install flask-cors`
- Check that CORS is enabled in `api/app.py`
- For development, allow all origins or add specific frontend URL

### Issue: "Connection refused" or "Failed to fetch"

**Solution:**
- Verify API is running on port 5000
- Check if another process is using port 5000
- Ensure firewall isn't blocking the connection

### Issue: Calendly redirect not working

**Solution:**
- Verify Calendly URL is correct in `camp/script.js` line 149
- Test the Calendly URL directly in browser
- Check browser console for JavaScript errors
- Ensure URL is complete with protocol (https://)

### Issue: Database locked

**Solution:**
- SQLite can have issues with concurrent writes
- For testing, this is usually temporary - retry the operation
- For production, consider using PostgreSQL

### Issue: Form validation not working

**Solution:**
- Check browser console for JavaScript errors
- Verify `script.js` is loaded correctly
- Clear browser cache and reload page
- Test in a different browser

## Test Report Template

Copy this template to document your test results:

```
# Lead Capture System Test Report

**Date:** YYYY-MM-DD
**Tester:** Your Name
**Environment:** Development/Staging/Production

## Test Results Summary

- Total Tests: 15
- Passed: __
- Failed: __
- Skipped: __

## Failed Tests

| Test # | Test Name | Reason | Notes |
|--------|-----------|--------|-------|
|        |           |        |       |

## Additional Notes

(Any observations or recommendations)

## Sign-off

[ ] System is ready for production
[ ] Issues need to be addressed before deployment
```

## Automated Testing (Future Enhancement)

Consider adding automated tests using:
- **Frontend:** Playwright or Cypress for form submission tests
- **Backend:** pytest with Flask test client
- **Integration:** Full E2E tests with both frontend and backend

Example pytest test:
```python
def test_create_lead():
    response = client.post('/api/leads', json={
        'name': 'Test User',
        'email': 'test@example.com',
        'form_type': 'scan'
    })
    assert response.status_code == 201
    assert response.json['success'] == True
```

