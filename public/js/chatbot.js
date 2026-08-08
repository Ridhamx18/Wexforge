/* ===========================================================
   WexForge Assistant — built-in knowledge chatbot
   No external AI API. Pure vanilla JS pattern matching over a
   hand-written knowledge base about WexForge, plus small-talk,
   live date/time, and a basic calculator.
   =========================================================== */
(() => {
  'use strict';

  const STORAGE_KEY = 'wexforge_chat_history_v1';

  /* ---------------------------------------------------------
     1. Knowledge base
  --------------------------------------------------------- */
  const SERVICES = {
    'web development': 'Web Development: fast, accessible, hand-coded websites built with HTML5, CSS3 and modern JavaScript that score 95+ on Lighthouse — no bloated frameworks, just clean, performant code.',
    'mobile apps': 'Mobile Apps: progressive web apps (PWAs) and fully responsive experiences optimised to feel great on every screen size, without needing a native app store build.',
    'ui/ux design': 'UI/UX Design: research-driven wireframes, prototypes and pixel-perfect interfaces, designed in Figma with proper design systems — done before a single line of production code is written.',
    'ui ux design': 'UI/UX Design: research-driven wireframes, prototypes and pixel-perfect interfaces, designed in Figma with proper design systems — done before a single line of production code is written.',
    'ai solutions': 'AI Solutions: intelligent chatbots, automation tools, and AI-powered product features — built with Claude, OpenAI and agentic workflows. This very chat widget is a live example of that work.',
    'cloud & devops': 'Cloud & DevOps: deployment pipelines, hosting setup, and cloud infrastructure handled end-to-end on AWS, Vercel or Render, so launches and scaling stay smooth.',
    'cloud devops': 'Cloud & DevOps: deployment pipelines, hosting setup, and cloud infrastructure handled end-to-end on AWS, Vercel or Render, so launches and scaling stay smooth.',
    'e-commerce': 'E-commerce: conversion-first storefronts with a clean product catalogue, cart, and checkout flow — built custom, fast, and secure rather than bolted onto a bloated platform.',
    'ecommerce': 'E-commerce: conversion-first storefronts with a clean product catalogue, cart, and checkout flow — built custom, fast, and secure rather than bolted onto a bloated platform.',
    'e-commerce website': 'An E-commerce Website gives you a full storefront: product catalogue, cart, and a smooth checkout flow, built lean so it loads fast and converts well.',
    'ecommerce website': 'An E-commerce Website gives you a full storefront: product catalogue, cart, and a smooth checkout flow, built lean so it loads fast and converts well.',
    'saas development': 'SaaS Development: custom dashboards, admin panels, and multi-tenant platforms built to scale, using Node.js, REST APIs and a proper database layer.',
    'seo & performance': 'SEO & Performance: technical SEO, Core Web Vitals optimisation, and Lighthouse audits so the right people find your site and it loads fast once they do.',
    'seo and performance': 'SEO & Performance: technical SEO, Core Web Vitals optimisation, and Lighthouse audits so the right people find your site and it loads fast once they do.',
    'maintenance': 'Maintenance: ongoing updates, monitoring, security patches, and support after launch — so the site keeps running smoothly long after go-live.',
    'business website': 'A Business Website is a marketing-focused site that explains what your company does, builds trust, and drives visitors to contact you or buy. Typically includes a home page, about, services, and contact — fully responsive and SEO-ready.',
    'portfolio website': 'A Portfolio Website showcases your work — projects, case studies, or creative pieces — in a clean, gallery-style layout designed to make your best work the hero.',
    'landing page': 'A Landing Page is a single, focused page built around one goal: a product launch, campaign, or lead capture. Fast-loading and conversion-first.',
    'custom web application': 'A Custom Web Application is a tailored tool or platform built around your exact workflow — dashboards, internal tools, booking systems, portals, whatever your business needs.',
    'admin dashboard': 'An Admin Dashboard gives you a clean internal interface for managing data, users, orders, or operations, with clear charts and controls.',
    'website redesign': 'Website Redesign means modernising an existing site — improving design, speed, and usability — without throwing away the parts that already work (like your SEO rankings).',
    'website maintenance': 'Website Maintenance is ongoing care after launch: content updates, bug fixes, security patches, and monitoring, so the site keeps running smoothly.',
    'api integration': 'API Integration connects your site or app to third-party services — payments, CRMs, email tools, or custom backends — only added where a project genuinely needs it.',
    'hosting & deployment': 'Hosting & Deployment covers getting your site live reliably: choosing hosting, setting up deployment, and making sure launches go smoothly.',
    'hosting and deployment': 'Hosting & Deployment covers getting your site live reliably: choosing hosting, setting up deployment, and making sure launches go smoothly.',
  };

  const SERVICES_LIST = [
    'Web Development', 'Mobile Apps', 'UI/UX Design', 'AI Solutions',
    'Cloud & DevOps', 'E-commerce', 'SaaS Development', 'SEO & Performance', 'Maintenance',
  ];

  const WHY_WEXFORGE = [
    { name: 'Founders on every project', desc: 'You work directly with Aakib and Ridham — no account managers, no hand-offs, no dilution of quality.' },
    { name: 'Performance-first code', desc: 'Lean, framework-free frontends that load instantly and score high on every audit.' },
    { name: 'Accessible by default', desc: 'Semantic HTML, keyboard support, and WCAG-friendly patterns on every single build.' },
    { name: 'Clean, maintainable code', desc: 'Organised, commented, modular code your team can actually read and extend.' },
    { name: 'Design with intent', desc: 'Every pixel is considered — designed for clarity, conversion, and delight.' },
    { name: 'Fast, clear communication', desc: 'Replies within hours, regular updates at every step, and on-time delivery.' },
  ];

  const TECH_STACK = ['React', 'Next.js', 'TypeScript', 'Node.js', 'Express', 'MongoDB', 'PostgreSQL', 'Supabase', 'Docker', 'AWS', 'Firebase', 'Tailwind CSS', 'Python', 'AI / LLMs', 'Figma', 'HTML5', 'CSS3'];

  const PROCESS_STEPS = [
    { name: 'Discovery', desc: 'Understanding your goals, audience and what success looks like for the project.' },
    { name: 'Planning', desc: 'Scoping out the pages, features, and a realistic timeline.' },
    { name: 'Design', desc: 'Wireframes and UI design before any production code is written.' },
    { name: 'Development', desc: 'Building clean, semantic, production-ready code.' },
    { name: 'Testing', desc: 'Checking responsiveness, performance and accessibility across devices.' },
    { name: 'Launch', desc: 'Shipping the site to production with a smooth, monitored deployment.' },
    { name: 'Support', desc: 'Staying available for updates and fixes once the site is live.' },
  ];

  const TEAM = {
    aakib: 'Khatri Aakib is Co-Founder & Full Stack Developer at WexForge. He leads architecture, backend logic and integrations. Reach him at aakibkhatri99@gmail.com or +91 99093 78606.',
    ridham: 'Ridham Rajput is Co-Founder & Frontend Developer at WexForge. He leads interface design and front-end craft. Reach him at ridhamrajputx18@gmail.com or +91 78746 76086.',
  };

  const PORTFOLIO_INFO = 'WexForge is a newer studio, so the "Featured Work" section shows concept and demo projects — clearly labelled as such — that demonstrate real process and code quality rather than paid client work yet. The current example is a concept website for SpaceX: a bold, immersive dark-space aesthetic covering mission launches, Starship updates and reusable rocket tech, built with HTML5, CSS3, JavaScript, Node.js and a REST API, scoring 98/100 on Lighthouse.';

  const FAQ = [
    { q: 'how long does a project take', a: 'A marketing site usually takes about 2–4 weeks. Custom web applications vary depending on scope — you\'ll get a clear timeline after the planning stage.' },
    { q: 'do you work with existing brand', a: 'Yes — WexForge can design a brand from scratch or build within your existing brand system. This gets aligned during the discovery stage.' },
    { q: 'what technologies', a: 'WexForge builds with HTML5, CSS3 and modern JavaScript on the front end, adding backend functionality only where a project genuinely needs it (e.g. Node.js, REST APIs).' },
    { q: 'ongoing maintenance', a: 'Yes — Website Maintenance is one of our core services: updates, monitoring and fixes after launch.' },
    { q: 'how to get started', a: 'Book a meeting or send a message through the contact form on this page, and WexForge will reply with next steps — usually within one business day.' },
    { q: 'international clients', a: 'Absolutely. WexForge works with clients globally and communicates asynchronously across time zones — all project management is handled online.' },
  ];

  const BUDGET_INFO = 'WexForge\'s typical budget bands are: Under ₹25,000 for small landing pages, ₹25,000–₹75,000 for standard business or portfolio sites, ₹75,000–₹2,00,000 for e-commerce or larger custom builds, and above ₹2,00,000 for complex web applications or SaaS platforms. Exact pricing depends on scope — the contact form has a budget field so you can share your range.';

  const CONTACT_INFO = 'You can reach WexForge directly:\n• Aakib (Full Stack): aakibkhatri99@gmail.com / +91 99093 78606\n• Ridham (Frontend): ridhamrajputx18@gmail.com / +91 78746 76086\nOr just use the contact form, WhatsApp, or Call Now button in the Contact section below. Typical reply time is one business day.';

  async function callBackendAI(userText, recentHistory) {
    const apiMessages = recentHistory
      .filter(m => m.role === 'user' || m.role === 'bot')
      .slice(-16)
      .map(m => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.text }));
    apiMessages.push({ role: 'user', content: userText });

    const apiBase = window.location.hostname.includes('vercel.app') || window.location.hostname.includes('wexforge.com')
      ? 'https://wexforge.onrender.com'
      : '';
    const res = await fetch(apiBase + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: apiMessages }),
    });

    if (!res.ok) {
      let detail = '';
      try { const errJson = await res.json(); detail = errJson?.error || ''; } catch { /* ignore parse issues */ }
      const err = new Error(detail || `Request failed (${res.status})`);
      err.status = res.status;
      throw err;
    }

    const data = await res.json();
    return (data.reply || '').trim() || 'I received an empty response — please try asking again.';
  }


  /* ---------------------------------------------------------
     2. Intents — ordered by priority (more specific first)
  --------------------------------------------------------- */
  const intents = [
    {
      id: 'service_specific',
      test: (msg) => {
        for (const key of Object.keys(SERVICES)) {
          if (msg.includes(key)) return key;
        }
        // loose singular keyword matches
        const loose = {
          'mobile app': 'mobile apps',
          'progressive web app': 'mobile apps',
          'pwa': 'mobile apps',
          'chatbot': 'ai solutions',
          'ai agent': 'ai solutions',
          'automation': 'ai solutions',
          'devops': 'cloud & devops',
          'cloud': 'cloud & devops',
          'saas': 'saas development',
          'dashboard': 'admin dashboard',
          'landing': 'landing page',
          'portfolio site': 'portfolio website',
          'redesign': 'website redesign',
          'maintenance': 'website maintenance',
          'seo': 'seo & performance',
          'performance': 'seo & performance',
          'api': 'api integration',
          'hosting': 'hosting & deployment',
          'deployment': 'hosting & deployment',
          'ux': 'ui ux design',
          'ui design': 'ui ux design',
        };
        for (const key of Object.keys(loose)) {
          if (msg.includes(key)) return loose[key];
        }
        return null;
      },
      respond: (match) => ({ text: SERVICES[match], chips: ['What\'s the pricing?', 'How long does it take?', 'See all services'] }),
    },
    {
      id: 'services_overview',
      keywords: ['what services', 'services do you offer', 'services you provide', 'what do you offer', 'what can you build', 'list of services', 'all services'],
      respond: () => ({
        text: `WexForge offers 9 core services: ${SERVICES_LIST.join(', ')}. Each one can also be scoped to a specific project shape — Business Website, Portfolio Website, Landing Page, E-commerce Website, Custom Web Application, or Admin Dashboard. Ask me about any one of them for details!`,
        chips: ['Web development', 'AI solutions', 'E-commerce', 'Pricing'],
      }),
    },
    {
      id: 'pricing',
      keywords: ['price', 'pricing', 'cost', 'how much', 'budget', 'quote', 'charges', 'fees', 'rate'],
      respond: () => ({ text: BUDGET_INFO, chips: ['Book a meeting', 'What\'s the process?', 'Contact info'] }),
    },
    {
      id: 'process_step_specific',
      test: (msg) => PROCESS_STEPS.find(s => msg.includes(s.name.toLowerCase())),
      respond: (step) => ({ text: `${step.name}: ${step.desc}`, chips: ['What\'s the next step?', 'Full process', 'How long does it take?'] }),
    },
    {
      id: 'process',
      keywords: ['process', 'how do you work', 'steps do you follow', 'workflow', 'methodology', 'how does it work'],
      respond: () => ({
        text: `WexForge follows the same 7 steps on every project:\n${PROCESS_STEPS.map((s, i) => `${i + 1}. ${s.name}`).join('\n')}\nAsk me about any step for more detail.`,
        chips: ['What is Discovery?', 'How long does it take?', 'Pricing'],
      }),
    },
    {
      id: 'why_wexforge',
      keywords: ['why should i choose', 'why wexforge', 'why work with you', 'what makes you different', 'why pick you', 'why hire you'],
      respond: () => ({
        text: `A few reasons people choose WexForge:\n${WHY_WEXFORGE.map(w => `• ${w.name} — ${w.desc}`).join('\n')}`,
        chips: ['Our services', 'Pricing', 'Contact info'],
      }),
    },
    {
      id: 'timeline',
      keywords: ['how long', 'timeline', 'turnaround', 'when will it be ready', 'delivery time'],
      respond: () => ({ text: FAQ[0].a, chips: ['What\'s the process?', 'Pricing', 'Book a meeting'] }),
    },
    {
      id: 'portfolio',
      keywords: ['portfolio', 'previous work', 'past projects', 'examples', 'case studies', 'show me your work', 'projects you built', 'spacex'],
      respond: () => ({
        text: PORTFOLIO_INFO + ' Scroll to the "Featured Work" section above to see it in full.',
        chips: ['Services', 'Contact info', 'Who are the founders?'],
      }),
    },
    {
      id: 'team_specific',
      test: (msg) => (msg.includes('aakib') ? 'aakib' : (msg.includes('ridham') ? 'ridham' : null)),
      respond: (who) => ({ text: TEAM[who], chips: ['Contact info', 'Who is the other founder?', 'Book a meeting'] }),
    },
    {
      id: 'team',
      keywords: ['founder', 'who made this', 'who built wexforge', 'who runs wexforge', 'team', 'who owns wexforge', 'who are you guys'],
      respond: () => ({
        text: 'WexForge was founded by two developers: Khatri Aakib (Co-Founder & Full Stack Developer) and Ridham Rajput (Co-Founder & Frontend Developer). Every project is built directly by the two of them — no account managers, no hand-offs.',
        chips: ['About Aakib', 'About Ridham', 'Contact info'],
      }),
    },
    {
      id: 'contact',
      keywords: ['contact', 'phone number', 'email', 'reach you', 'get in touch', 'whatsapp', 'call you', 'talk to someone'],
      respond: () => ({ text: CONTACT_INFO, chips: ['Book a meeting', 'Pricing', 'Services'] }),
    },
    {
      id: 'about',
      keywords: ['about wexforge', 'what is wexforge', 'who is wexforge', 'tell me about the company', 'what does wexforge do'],
      respond: () => ({
        text: 'WexForge is a two-person software studio crafting modern, premium websites, web apps and AI solutions for ambitious brands — from first concept to production launch. Founded by two developers who wanted client work to be as considered as a personal project: hand-coded, fast, accessible, and built without unnecessary bloat.',
        chips: ['Services', 'Meet the founders', 'Contact info'],
      }),
    },
    {
      id: 'tech_stack',
      keywords: ['what technology', 'tech stack', 'what do you build with', 'programming language', 'framework do you use', 'do you use react', 'do you use wordpress', 'stack do you use'],
      respond: () => ({
        text: `WexForge works with: ${TECH_STACK.join(', ')}. On lean marketing sites the front end is deliberately hand-coded HTML/CSS/JS rather than a heavy framework or CMS like WordPress — frameworks like React/Next.js come in for genuinely complex apps, dashboards and SaaS products that need them.`,
        chips: ['Custom web app', 'SaaS development', 'Contact info'],
      }),
    },
    {
      id: 'maintenance',
      keywords: ['maintenance', 'support after launch', 'ongoing support', 'update my site'],
      respond: () => ({ text: FAQ[3].a, chips: ['Pricing', 'Contact info'] }),
    },
    {
      id: 'brand',
      keywords: ['existing brand', 'existing design', 'my own logo', 'my own branding'],
      respond: () => ({ text: FAQ[1].a, chips: ['What\'s the process?', 'Pricing'] }),
    },
    {
      id: 'get_started',
      keywords: ['get started', 'start a project', 'hire you', 'work with you', 'book a meeting', 'schedule a call'],
      respond: () => ({
        text: FAQ[4].a + ' Want me to scroll you to the contact form?',
        chips: ['Take me to contact form', 'Contact info', 'Pricing'],
      }),
    },
    {
      id: 'goto_contact',
      keywords: ['take me to contact', 'scroll to contact', 'open contact form'],
      respond: () => {
        setTimeout(() => { document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }); }, 300);
        return { text: 'Scrolling you to the contact form now — see you there!', chips: [] };
      },
    },
    {
      id: 'datetime',
      keywords: ['what time is it', 'current time', 'what\'s the time', 'what date is it', 'today\'s date', 'what day is it', 'what is the date'],
      respond: () => {
        const now = new Date();
        const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const date = now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        return { text: `Right now it's ${time} on ${date} (based on your device's clock).`, chips: ['Services', 'Contact info'] };
      },
    },
    {
      id: 'math',
      test: (msg) => {
        const cleaned = msg.replace(/what('?s| is)|calculate|equals?|=|\?/g, '').trim();
        const pctMatch = cleaned.match(/^(-?\d+(\.\d+)?)\s*%\s*of\s*(-?\d+(\.\d+)?)$/);
        if (pctMatch) return { type: 'pct', a: parseFloat(pctMatch[1]), b: parseFloat(pctMatch[3]) };
        if (/^[\d\s+\-*/().]+$/.test(cleaned) && /[+\-*/]/.test(cleaned) && cleaned.length < 40) {
          return { type: 'expr', expr: cleaned };
        }
        return null;
      },
      respond: (m) => {
        try {
          let result;
          if (m.type === 'pct') result = (m.a / 100) * m.b;
          else result = Function('"use strict";return (' + m.expr + ')')();
          if (typeof result !== 'number' || !isFinite(result)) throw new Error('bad');
          result = Math.round(result * 10000) / 10000;
          return { text: `That works out to ${result}.`, chips: [] };
        } catch {
          return { text: 'Hmm, I couldn\'t compute that one — mind rephrasing it as a simple expression, like "12 * 4"?', chips: [] };
        }
      },
    },
    {
      id: 'greeting',
      keywords: ['hello', 'hi', 'hey', 'yo', 'good morning', 'good afternoon', 'good evening', 'namaste'],
      respond: () => ({
        text: pick(['Hey there! 👋 I\'m the WexForge Assistant. Ask me anything about our services, pricing, process, team, or the site — I know this business inside out.', 'Hi! Great to have you here. What would you like to know about WexForge?']),
        chips: ['Our services', 'Pricing', 'How the process works'],
      }),
    },
    {
      id: 'howareyou',
      keywords: ['how are you', 'how you doing', 'how is it going', 'how are things'],
      respond: () => ({ text: 'Running fast and fully caffeinated on JavaScript ⚡ — how can I help with your project?', chips: ['Our services', 'Pricing'] }),
    },
    {
      id: 'identity',
      keywords: ['are you real', 'are you a bot', 'are you human', 'are you ai', 'who are you', 'what are you', 'are you a person'],
      respond: () => ({
        text: 'I\'m the WexForge Assistant — an AI concierge built specifically for this site, normally powered by Claude through the WexForge backend (with a built-in knowledge fallback if that connection ever drops). I know everything about WexForge\'s services, pricing, process, tech stack, team and portfolio in detail, and for anything outside WexForge I can help like a general AI assistant too.',
        chips: ['What can you do?', 'Our services'],
      }),
    },
    {
      id: 'capabilities',
      keywords: ['what can you do', 'help me with', 'your capabilities', 'what do you know'],
      respond: () => ({
        text: 'I can go deep on WexForge — services, pricing bands, the 7-step process, tech stack, the team, contact details, and the portfolio — and recommend what fits your project. I can also do quick maths and tell you the current date or time. When I\'m running on the full AI backend I can help with pretty much anything else too, not just WexForge.',
        chips: ['Our services', 'Pricing', 'Contact info'],
      }),
    },
    {
      id: 'thanks',
      keywords: ['thank', 'thanks', 'thx', 'appreciate it', 'cheers'],
      respond: () => ({ text: pick(['You\'re welcome! Anything else you\'d like to know?', 'Anytime! Happy to help with anything else about WexForge.']), chips: ['Services', 'Contact info'] }),
    },
    {
      id: 'joke',
      keywords: ['joke', 'make me laugh', 'something funny'],
      respond: () => ({ text: pick([
        'Why do developers prefer dark mode? Because light attracts bugs. 🐛',
        'WexForge\'s favourite HTTP status code is 200 — because everything is OK.',
        'Why did the CSS developer break up with the JS developer? Too many conflicting states.',
      ]), chips: ['Our services', 'Contact info'] }),
    },
    {
      id: 'farewell',
      keywords: ['bye', 'goodbye', 'see you', 'talk later', 'gtg'],
      respond: () => ({ text: 'Thanks for stopping by WexForge! Reach out anytime via the contact form. 👋', chips: [] }),
    },
  ];

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  /* ---------------------------------------------------------
     3. Matching engine
  --------------------------------------------------------- */
  function normalize(str) {
    return str.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9%.\s+\-*/=?]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function matchIntent(rawMsg) {
    const msg = normalize(rawMsg);
    if (!msg) return null;

    for (const intent of intents) {
      if (intent.test) {
        const result = intent.test(msg);
        if (result) return intent.respond(result);
      }
    }

    let best = null, bestScore = 0;
    for (const intent of intents) {
      if (!intent.keywords) continue;
      let score = 0;
      for (const kw of intent.keywords) {
        if (msg.includes(kw)) score += kw.split(' ').length; // reward multi-word phrase matches
      }
      if (score > bestScore) { bestScore = score; best = intent; }
    }
    if (best && bestScore > 0) return best.respond();

    return fallback(msg);
  }

  function fallback() {
    return {
      text: 'I want to give you a precise answer rather than guess — could you rephrase that, or ask about a specific service, pricing, the process, tech stack, or the team? If it\'s something more specific to your project, the fastest way to get a real answer is the contact form below, or emailing Aakib or Ridham directly.',
      chips: ['Our services', 'Contact info', 'Book a meeting'],
    };
  }

  const STARTER_CHIPS = ['Our services', 'Pricing', 'How the process works', 'Contact info'];

  /* ---------------------------------------------------------
     4. UI wiring
  --------------------------------------------------------- */
  const launcher = document.getElementById('chatbot-launcher');
  const panel = document.getElementById('chatbot-panel');
  const messagesEl = document.getElementById('chatbot-messages');
  const chipsEl = document.getElementById('chatbot-chips');
  const form = document.getElementById('chatbot-form');
  const input = document.getElementById('chatbot-input');
  const minimizeBtn = document.getElementById('chatbot-minimize');
  const clearBtn = document.getElementById('chatbot-clear');
  const statusTextEl = document.querySelector('.chatbot-status');
  const disclaimerEl = document.getElementById('chatbot-disclaimer');
  let backendAvailable = true; // optimistic; flips to false after a failed call, retried each new message

  if (!launcher || !panel) return;

  let history = [];
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (Array.isArray(saved)) history = saved;
  } catch { /* ignore corrupt storage */ }

  function saveHistory() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-60))); } catch { /* storage may be unavailable */ }
  }

  function timeStr() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function renderMessage(role, text, time) {
    const wrap = document.createElement('div');
    if (role === 'bot') {
      wrap.className = 'msg-row bot-row';
      wrap.innerHTML = `<div class="mini-avatar">WF</div><div class="msg bot">${escapeHTML(text)}<span class="msg-time">${time}</span></div>`;
    } else {
      wrap.className = 'msg-row';
      wrap.style.alignSelf = 'flex-end';
      wrap.innerHTML = `<div class="msg user">${escapeHTML(text)}<span class="msg-time">${time}</span></div>`;
    }
    messagesEl.appendChild(wrap);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML.replace(/\n/g, '<br>');
  }

  function renderChips(chips) {
    chipsEl.innerHTML = '';
    (chips || []).forEach(label => {
      const btn = document.createElement('button');
      btn.className = 'chip-btn';
      btn.type = 'button';
      btn.textContent = label;
      btn.addEventListener('click', () => sendMessage(label));
      chipsEl.appendChild(btn);
    });
  }

  function showTyping() {
    const el = document.createElement('div');
    el.className = 'typing-indicator';
    el.id = 'typing-indicator';
    el.innerHTML = '<span></span><span></span><span></span>';
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
  function hideTyping() {
    document.getElementById('typing-indicator')?.remove();
  }

  function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    renderMessage('user', trimmed, timeStr());
    history.push({ role: 'user', text: trimmed, time: timeStr() });
    saveHistory();
    input.value = '';
    renderChips([]);
    showTyping();

    const historySnapshot = history.slice(0, -1);

    callBackendAI(trimmed, historySnapshot)
      .then(replyText => {
        hideTyping();
        backendAvailable = true;
        refreshAIStatus();
        renderMessage('bot', replyText, timeStr());
        history.push({ role: 'bot', text: replyText, time: timeStr() });
        saveHistory();
        renderChips([]);
      })
      .catch(() => {
        hideTyping();
        backendAvailable = false;
        refreshAIStatus();
        const result = matchIntent(trimmed);
        const msg = result.text + '\n\n(Note: the AI backend is temporarily unreachable, so I answered from my built-in WexForge knowledge instead.)';
        renderMessage('bot', msg, timeStr());
        history.push({ role: 'bot', text: msg, time: timeStr() });
        saveHistory();
        renderChips(result.chips);
      });
  }

  form && form.addEventListener('submit', (e) => {
    e.preventDefault();
    sendMessage(input.value);
  });

  function openPanel() {
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    launcher.classList.add('open');
    launcher.setAttribute('aria-expanded', 'true');
    setTimeout(() => input && input.focus(), 300);
  }
  function closePanel() {
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    launcher.classList.remove('open');
    launcher.setAttribute('aria-expanded', 'false');
  }

  launcher.addEventListener('click', () => {
    panel.classList.contains('open') ? closePanel() : openPanel();
  });
  minimizeBtn && minimizeBtn.addEventListener('click', closePanel);

  clearBtn && clearBtn.addEventListener('click', () => {
    history = [];
    saveHistory();
    messagesEl.innerHTML = '';
    bootConversation(true);
  });

  /* ---- AI backend status ---- */
  function refreshAIStatus() {
    if (backendAvailable) {
      statusTextEl.classList.add('ai-on');
      statusTextEl.innerHTML = '<span class="status-dot"></span> AI mode &middot; online';
      disclaimerEl.textContent = 'Powered by Claude via the WexForge backend \u00b7 ask about anything, not just WexForge.';
    } else {
      statusTextEl.classList.remove('ai-on');
      statusTextEl.innerHTML = '<span class="status-dot"></span> Built-in mode &middot; backend unreachable';
      disclaimerEl.textContent = 'AI backend unreachable right now \u2014 answering from built-in WexForge knowledge instead.';
    }
  }

  async function checkBackendHealth() {
    try {
      const apiBase = window.location.hostname.includes('vercel.app') || window.location.hostname.includes('wexforge.com')
        ? 'https://wexforge.onrender.com'
        : '';
      const res = await fetch(apiBase + '/api/health');
      backendAvailable = res.ok;
    } catch {
      backendAvailable = false;
    }
    refreshAIStatus();
  }

  function bootConversation(forceGreeting) {
    if (!forceGreeting && history.length) {
      history.forEach(m => renderMessage(m.role, m.text, m.time || timeStr()));
      renderChips([]);
    } else {
      const greeting = 'Hi! 👋 I\'m the WexForge Assistant, running on Claude — ask me anything about WexForge, or literally any other topic. What\'s on your mind?';
      renderMessage('bot', greeting, timeStr());
      history.push({ role: 'bot', text: greeting, time: timeStr() });
      saveHistory();
      renderChips(STARTER_CHIPS);
    }
    checkBackendHealth();
  }

  bootConversation(false);
})();
