const express = require('express');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();
const DATA_FILE = path.join(__dirname, '..', 'data', 'submissions.json');

/* ---------------------------------------------------------
   Supabase client — only initialised if credentials exist
--------------------------------------------------------- */
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY &&
    !process.env.SUPABASE_URL.includes('your-project-ref')) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
  console.log('[contact] Supabase client initialised ✓');
} else {
  console.log('[contact] Supabase not configured — submissions saved to disk only.');
}

/* ---------------------------------------------------------
   Helpers
--------------------------------------------------------- */
function isValidEmail(str) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
}

function readSubmissions() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSubmissions(list) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), 'utf8');
}

/* ---------------------------------------------------------
   Save to Supabase
   Table: contact_submissions
   Columns: id, received_at, name, email, phone, company,
            project_type, budget, message
--------------------------------------------------------- */
async function saveToSupabase(entry) {
  if (!supabase) return { saved: false, reason: 'not configured' };

  const { error } = await supabase
    .from('contact_submissions')
    .insert({
      id:           entry.id,
      received_at:  entry.receivedAt,
      name:         entry.name,
      email:        entry.email,
      phone:        entry.phone     || null,
      company:      entry.company   || null,
      project_type: entry.projectType || null,
      budget:       entry.budget    || null,
      message:      entry.message,
    });

  if (error) {
    console.error('[contact] Supabase insert error:', error.message);
    return { saved: false, reason: error.message };
  }

  return { saved: true };
}

/* ---------------------------------------------------------
   Send email if SMTP is configured
--------------------------------------------------------- */
async function sendEmailIfConfigured(entry) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !CONTACT_TO_EMAIL) return false;

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  const lines = [
    'New Wexforge contact form submission',
    `Name:         ${entry.name}`,
    `Email:        ${entry.email}`,
    `Phone:        ${entry.phone || '-'}`,
    `Company:      ${entry.company || '-'}`,
    `Project Type: ${entry.projectType || '-'}`,
    `Budget:       ${entry.budget || '-'}`,
    '',
    'Message:',
    entry.message,
  ].join('\n');

  await transporter.sendMail({
    from: CONTACT_FROM_EMAIL || SMTP_USER,
    to: CONTACT_TO_EMAIL,
    replyTo: entry.email,
    subject: `Wexforge — new lead from ${entry.name}`,
    text: lines,
  });
  return true;
}

/* ---------------------------------------------------------
   POST /api/contact
--------------------------------------------------------- */
router.post('/', async (req, res) => {
  const body = req.body || {};

  // Honeypot spam trap
  if (body.company_website) {
    return res.json({ ok: true });
  }

  const name        = String(body.name        || '').trim();
  const email       = String(body.email       || '').trim();
  const message     = String(body.message     || '').trim();
  const phone       = String(body.phone       || '').trim();
  const company     = String(body.company     || '').trim();
  const projectType = String(body.projectType || '').trim();
  const budget      = String(body.budget      || '').trim();

  const errors = [];
  if (name.length < 2)      errors.push('Please enter a valid name.');
  if (!isValidEmail(email)) errors.push('Please enter a valid email address.');
  if (message.length < 5)   errors.push('Please add a short message.');
  if (phone && !/^[+\d][\d\s-]{6,}$/.test(phone)) errors.push('Please enter a valid phone number.');

  if (errors.length) {
    return res.status(400).json({ error: errors.join(' ') });
  }

  const entry = {
    id:          Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    receivedAt:  new Date().toISOString(),
    name, email, phone, company, projectType, budget, message,
  };

  // 1. Save to local JSON (fallback always runs)
  try {
    const all = readSubmissions();
    all.push(entry);
    writeSubmissions(all);
  } catch (err) {
    console.error('[contact] failed to persist to disk:', err.message);
  }

  // 2. Save to Supabase
  const { saved: dbSaved, reason } = await saveToSupabase(entry);
  if (!dbSaved && supabase) {
    // Supabase was configured but insert failed — log it, don't block the user
    console.warn('[contact] Supabase save skipped:', reason);
  }
  // 3. Send email notification
  let emailed = false;
  try {
    emailed = await sendEmailIfConfigured(entry);
  } catch (err) {
    console.error('[contact] email delivery failed:', err.message);
  }

  console.log(`[contact] submission from ${name} <${email}> — db: ${dbSaved}, emailed: ${emailed}`);
  return res.json({ ok: true, emailed, dbSaved });
});

module.exports = router;
