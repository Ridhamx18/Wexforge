const express = require('express');
const { SYSTEM_PROMPT } = require('../lib/systemPrompt');

const router = express.Router();

const MAX_MESSAGES = 20;
const MAX_CHARS_PER_MESSAGE = 4000;
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

function sanitizeMessages(raw) {
  if (!Array.isArray(raw)) return null;
  const cleaned = raw
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-MAX_MESSAGES)
    .map(m => ({
      role: m.role,
      content: m.content.slice(0, MAX_CHARS_PER_MESSAGE),
    }));

  // Anthropic requires the message list to start with a "user" message.
  while (cleaned.length && cleaned[0].role !== 'user') cleaned.shift();

  return cleaned.length ? cleaned : null;
}

router.post('/', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.includes('your-real-key-here')) {
    return res.status(503).json({ error: 'AI assistant is not configured on the server yet (missing ANTHROPIC_API_KEY).' });
  }

  const messages = sanitizeMessages(req.body && req.body.messages);
  if (!messages) {
    return res.status(400).json({ error: 'Invalid request: expected a non-empty messages array.' });
  }

  const model = process.env.CLAUDE_MODEL || 'claude-sonnet-5';

  try {
    const upstream = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 900,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    if (!upstream.ok) {
      const errBody = await upstream.json().catch(() => ({}));
      const detail = errBody?.error?.message || `Upstream error (${upstream.status})`;
      console.error('[chat] Anthropic API error:', upstream.status, detail);
      return res.status(502).json({ error: detail });
    }

    const data = await upstream.json();
    const reply = (data.content || [])
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n')
      .trim();

    return res.json({ reply: reply || 'I received an empty response — please try asking again.' });
  } catch (err) {
    console.error('[chat] request failed:', err.message);
    return res.status(500).json({ error: 'Could not reach the AI service. Please try again shortly.' });
  }
});

module.exports = router;
