/**
 * Secure newsletter endpoint for Google Apps Script Web App.
 *
 * Required Script Properties:
 * - TURNSTILE_SECRET_KEY : Cloudflare Turnstile secret key
 * - SHEET_ID             : Google Sheet ID where signups are stored
 * Optional Script Properties:
 * - SHEET_TAB            : Sheet tab name (default: "Subscribers")
 */

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email || "");
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function verifyTurnstile(token) {
  const secret = PropertiesService.getScriptProperties().getProperty("TURNSTILE_SECRET_KEY");
  if (!secret || !token) return false;

  const resp = UrlFetchApp.fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "post",
    payload: {
      secret: secret,
      response: token
    },
    muteHttpExceptions: true
  });

  const data = JSON.parse(resp.getContentText() || "{}");
  return data.success === true;
}

function getSheet() {
  const props = PropertiesService.getScriptProperties();
  const sheetId = props.getProperty("SHEET_ID");
  const tabName = props.getProperty("SHEET_TAB") || "Subscribers";
  if (!sheetId) throw new Error("Missing SHEET_ID script property");

  const ss = SpreadsheetApp.openById(sheetId);
  const sheet = ss.getSheetByName(tabName) || ss.insertSheet(tabName);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["timestamp", "email", "name", "source", "origin", "userAgent"]);
  }
  return sheet;
}

function emailExists(sheet, emailNormalized) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  const values = sheet.getRange(2, 2, lastRow - 1, 1).getValues(); // column B
  return values.some(r => normalizeEmail(r[0]) === emailNormalized);
}

function doPost(e) {
  try {
    const p = (e && e.parameter) ? e.parameter : {};
    const email = (p.email || "").trim();
    const emailNormalized = normalizeEmail(email);
    const name = (p.name || "").trim();
    const source = (p.source || "").trim();
    const origin = (p.origin || "").trim();
    const token = (p.turnstileToken || "").trim();
    const userAgent = (p.userAgent || "").trim();

    if (!verifyTurnstile(token)) {
      return jsonOut({ ok: false, error: "captcha_failed" });
    }

    if (!isValidEmail(email)) {
      return jsonOut({ ok: false, error: "invalid_email" });
    }

    const sheet = getSheet();
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      if (emailExists(sheet, emailNormalized)) {
        // Do not expose subscriber existence to clients.
        return jsonOut({ ok: true, duplicate: true });
      }
      sheet.appendRow([new Date().toISOString(), emailNormalized, name, source, origin, userAgent]);
    } finally {
      lock.releaseLock();
    }

    return jsonOut({ ok: true });
  } catch (err) {
    return jsonOut({ ok: false, error: "server_error", detail: String(err && err.message || err) });
  }
}
