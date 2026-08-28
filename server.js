require('dotenv').config();

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const chatRoute = require('./routes/chat');
const contactRoute = require('./routes/contact');

const app = express();
const PORT = process.env.PORT || 3000;

/* ---------------------------------------------------------
   Security & performance middleware
--------------------------------------------------------- */
app.disable('x-powered-by');
app.use(helmet({
  // Contact & chat widgets fetch Google Fonts + call same-origin APIs only;
  // CSP is left permissive here so the static site keeps working out of the
  // box. Tighten this for your real production domain before going live.
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(compression());
app.use(express.json({ limit: '200kb' }));

if (process.env.ALLOWED_ORIGIN) {
  app.use(cors({ origin: process.env.ALLOWED_ORIGIN }));
} else {
  // Allow all origins — frontend may be on Vercel, custom domain, or localhost
  app.use(cors({
    origin: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: false,
  }));
}

/* ---------------------------------------------------------
   Rate limiting — protects the AI + contact endpoints from abuse
--------------------------------------------------------- */
const chatLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many messages sent — please wait a few minutes and try again.' },
});

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many submissions from this device — please try again later or email us directly.' },
});

/* ---------------------------------------------------------
   API routes
--------------------------------------------------------- */
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    aiConfigured: !!(process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.includes('your-real-key-here')),
    time: new Date().toISOString(),
  });
});

app.use('/api/chat', chatLimiter, chatRoute);
app.use('/api/contact', contactLimiter, contactRoute);

/* ---------------------------------------------------------
   Static frontend
--------------------------------------------------------- */
app.use(express.static(path.join(__dirname, 'public'), {
  extensions: ['html'],
  maxAge: '1d',
}));

// SPA-style fallback: any unmatched non-API GET request serves index.html
app.get(/^(?!\/api\/).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/* ---------------------------------------------------------
   Error handler (last resort)
--------------------------------------------------------- */
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error('[server] unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`\n  Wexforge server running → http://localhost:${PORT}`);
  console.log(`  AI assistant configured: ${!!(process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.includes('your-real-key-here'))}\n`);
});
