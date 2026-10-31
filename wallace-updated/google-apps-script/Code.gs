/**
 * Wallace Cartwright & Co Ltd - website enquiry form -> Google Sheets
 *
 * SETUP (one time)
 * 1. Open the Google Sheet that should receive the enquiries.
 * 2. Extensions > Apps Script. Delete any existing code and paste this file in.
 *    (If you already have a standalone script, set SPREADSHEET_ID below instead.)
 * 3. Click Deploy > New deployment > type: Web app
 *      Execute as:      Me
 *      Who has access:  Anyone
 * 4. Authorise when asked, then copy the Web app URL. It ends in /exec
 * 5. Paste that URL into GOOGLE_SCRIPT_URL near the bottom of index.html.
 *
 * After ANY later change to this script: Deploy > Manage deployments > edit >
 * Version: New version > Deploy (the /exec URL stays the same).
 */

var SPREADSHEET_ID = '';          // optional: only needed if the script is NOT bound to the sheet
var SHEET_NAME     = 'Enquiries'; // tab is created automatically if missing
var HEADERS = ['Timestamp', 'Submission ID', 'Full Name', 'Company', 'Email', 'Project Details', 'Page URL'];

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    var p = (e && e.parameter) || {};

    // Honeypot: real visitors never fill this in. Pretend success so bots move on.
    if (p.website) return respond_({ result: 'success' });

    var name    = clean_(p.name, 120);
    var company = clean_(p.company, 160);
    var email   = clean_(p.email, 160);
    var message = clean_(p.message, 5000);
    var id      = clean_(p.submissionId, 80);
    var pageUrl = clean_(p.pageUrl, 500);

    if (name.length < 2 || message.length < 5 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return respond_({ result: 'error', message: 'Missing or invalid fields.' });
    }

    var ss = SPREADSHEET_ID ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    // Duplicate protection (same submission retried / double-clicked)
    if (id) {
      var cache = CacheService.getScriptCache();
      if (cache.get('sub_' + id)) return respond_({ result: 'success', duplicate: true });
      if (sheet.getLastRow() > 1) {
        var found = sheet.getRange(2, 2, sheet.getLastRow() - 1, 1)
                         .createTextFinder(id).matchEntireCell(true).findNext();
        if (found) return respond_({ result: 'success', duplicate: true });
      }
    }

    sheet.appendRow([
      new Date(),
      id,
      safe_(name),
      safe_(company),
      safe_(email),
      safe_(message),
      safe_(pageUrl)
    ]);
    if (id) CacheService.getScriptCache().put('sub_' + id, '1', 21600);

    return respond_({ result: 'success' });
  } catch (err) {
    return respond_({ result: 'error', message: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

// Visiting the /exec URL in a browser should show this, which confirms the deployment works.
function doGet() {
  return respond_({ result: 'ok', message: 'Enquiry endpoint is live. Submit via POST.' });
}

function clean_(v, max) { return String(v == null ? '' : v).trim().slice(0, max); }

// Stops spreadsheet formula injection (values starting with = + - @)
function safe_(v) { return /^[=+\-@]/.test(v) ? "'" + v : v; }

function respond_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
