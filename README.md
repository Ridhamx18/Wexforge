# Wexforge — Website + Backend

A premium software-studio website for **Wexforge**, with a real Node.js/Express backend powering:

1. **A genuine AI assistant** — the chat widget calls Claude (Anthropic) through your server, so your API key never touches the browser.
2. **A working contact form** — submissions are validated, saved to disk, and optionally emailed to you.
3. The static site itself (HTML/CSS/JS, no frontend framework), served by the same server.

If the backend isn't running (or the AI isn't configured yet), the chat widget automatically falls back to a built-in, Wexforge-specific knowledge assistant — the site never breaks.

---

## 1. Requirements

- [Node.js](https://nodejs.org) v18 or newer (check with `node -v`)
- An [Anthropic API key](https://console.anthropic.com) (for the AI assistant — free tier available, pay-as-you-go after that)

---

## 2. Setup

```bash
# 1. Unzip and enter the project
cd wexforge-project

# 2. Install dependencies
npm install

# 3. Create your environment file
cp .env.example .env

# 4. Edit .env and paste your real Anthropic API key
#    ANTHROPIC_API_KEY=sk-ant-...

# 5. Start the server
npm start
```

Open **http://localhost:3000** — that's the full site, chat widget included.

For development with auto-restart on file changes:
```bash
npm run dev
```

---

## 3. What's inside

```
wexforge-project/
├── server.js              → Express app: security, rate limiting, routes, static hosting
├── routes/
│   ├── chat.js             → POST /api/chat    — secure Claude proxy for the chat widget
│   └── contact.js          → POST /api/contact — validates + stores + (optionally) emails leads
├── lib/
│   └── systemPrompt.js      → The business knowledge given to Claude (edit this to update facts)
├── data/
│   └── submissions.json     → Contact form leads land here (auto-created, gitignored)
├── public/                  → The static frontend (served as-is)
│   ├── index.html
│   ├── css/style.css
│   └── js/main.js, chatbot.js
├── .env.example              → Copy to .env and fill in
└── package.json
```

---

## 4. Configuring the AI assistant

Set in `.env`:

```
ANTHROPIC_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-sonnet-5
```

Model options: `claude-sonnet-5` (recommended balance), `claude-opus-4-8` (most capable, costs more), `claude-haiku-4-5-20251001` (fastest/cheapest).

The assistant answers **any topic**, not just Wexforge questions — general knowledge, coding help, advice, writing, translation, etc. — because the full system prompt (`lib/systemPrompt.js`) tells it to behave as a general assistant while giving it accurate Wexforge facts to draw on. Edit that file any time your services, pricing, or team details change — no code changes needed elsewhere.

**Honest limitation:** Claude does not have live internet access through this integration, so it can't report breaking news or anything more recent than its training data. It's instructed to say so honestly rather than guess. If you later want real-time web results inside the chat, that requires adding a search API (e.g. Anthropic's web search tool or a third-party search API) — ask if you'd like that added.

**Rate limiting:** `/api/chat` is capped at 30 messages per 10 minutes per visitor IP, to control API costs and abuse. Adjust in `server.js` (`chatLimiter`).

---

## 5. Configuring the contact form

Every submission is:
1. Validated (name, valid email, message required; phone checked if provided)
2. Saved to `data/submissions.json` (always — this works with zero configuration)
3. Emailed to you, **only if** you fill in the SMTP section of `.env`:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
CONTACT_TO_EMAIL=aakibkhatri99@gmail.com,ridhamrajputx18@gmail.com
```

For Gmail, you'll need an [App Password](https://myaccount.google.com/apppasswords) (not your normal password) if 2-Step Verification is on. Any standard SMTP provider works (Gmail, Outlook, Zoho, SendGrid SMTP, etc.).

Rate limit: 10 submissions per hour per visitor IP, to block spam floods. A hidden honeypot field also silently drops bot submissions.

---

## 6. Deploying it live

This is a real Node.js server, so it needs a host that **runs Node continuously** — not a static host like GitHub Pages. Good, simple options:

- **Render** (render.com) — free/low-cost, connects to a git repo, auto-detects `npm start`
- **Railway** (railway.app) — similarly simple, generous free tier
- **A VPS** (DigitalOcean, Hetzner, AWS Lightsail) — run with `pm2` or a systemd service for reliability

Steps are broadly the same everywhere:
1. Push this project to a git repository (make sure `.env` is in `.gitignore` — it already is)
2. Connect the repo to your host
3. Set the environment variables (`ANTHROPIC_API_KEY`, etc.) in the host's dashboard/secrets — **never** commit `.env`
4. Set the start command to `npm start`
5. Point your domain's DNS at the host once deployed

Once you have a real domain, also update in `public/index.html`:
- `<link rel="canonical">`, Open Graph/Twitter meta tags
- The Organization schema.org JSON-LD block

...and in `public/sitemap.xml` / `public/robots.txt`, replace `https://www.wexforge.com/` with your actual domain.

---

## 7. Security notes

- Your Anthropic API key lives only in `.env` on the server — it is never sent to the browser. This is the correct, secure way to do this (unlike a pure static site, where any key would be visible in page source).
- `helmet` and `compression` are enabled for basic security headers and smaller payloads. The Content-Security-Policy is left open by default so Google Fonts and the chat widget work out of the box — tighten it once you know your final production domain.
- Rate limiting is enabled on both API routes to control cost and spam exposure. Adjust the numbers in `server.js` to match your expected traffic.

---

## 8. Editing site content

- **Text, sections, layout:** `public/index.html`
- **Styling/design system:** `public/css/style.css`
- **Animations & interactions:** `public/js/main.js`
- **Chat widget behaviour + built-in fallback knowledge:** `public/js/chatbot.js`
- **What the AI assistant knows about the business:** `lib/systemPrompt.js`

No build step, no bundler — edit and refresh.
