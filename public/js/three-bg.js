/* ===========================================================
   Wexforge — 3D Particle Background
   Pure vanilla Canvas 2D — no external dependencies.
   Renders a depth-layered starfield + floating geometric nodes
   with mouse-reactive parallax and connecting edge lines.
   =========================================================== */
(() => {
  'use strict';

  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  // Skip canvas entirely on mobile — too heavy for phone GPUs
  if (window.innerWidth <= 768) { canvas.style.display = 'none'; return; }
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Config ---- */
  const PARTICLE_COUNT = reducedMotion ? 30 : 90;
  const NODE_COUNT     = reducedMotion ? 8  : 22;
  const CONNECT_DIST   = 180;
  const COLORS         = ['#6366F1', '#8B5CF6', '#06B6D4', '#818CF8', '#A78BFA', '#22D3EE'];

  let W, H, cx, cy;
  let mouse = { x: 0, y: 0 };
  let targetMouse = { x: 0, y: 0 };

  /* ---- Resize ---- */
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    cx = W / 2;
    cy = H / 2;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  /* ---- Mouse tracking ---- */
  window.addEventListener('mousemove', (e) => {
    targetMouse.x = (e.clientX / W - 0.5) * 2;
    targetMouse.y = (e.clientY / H - 0.5) * 2;
  }, { passive: true });

  /* ---- Cursor glow tracker ---- */
  const cursorGlow = document.getElementById('cursor-glow');
  if (cursorGlow) {
    window.addEventListener('mousemove', (e) => {
      cursorGlow.style.left = e.clientX + 'px';
      cursorGlow.style.top  = e.clientY + 'px';
    }, { passive: true });
  }

  /* ---- Utility ---- */
  function rand(min, max) { return min + Math.random() * (max - min); }
  function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
  function pickColor() { return COLORS[randInt(0, COLORS.length - 1)]; }

  /* ---- Particle class (tiny stars / dust) ---- */
  class Particle {
    constructor() { this.reset(true); }
    reset(initial) {
      this.x     = rand(0, W);
      this.y     = initial ? rand(0, H) : (Math.random() > 0.5 ? -4 : H + 4);
      this.z     = rand(0.1, 1);          // depth  0=far 1=near
      this.r     = rand(0.4, 1.6) * this.z;
      this.vx    = rand(-0.12, 0.12) * this.z;
      this.vy    = rand(0.08, 0.35)  * this.z;
      this.color = pickColor();
      this.alpha = rand(0.25, 0.75) * this.z;
      this.pulse = rand(0, Math.PI * 2);
      this.pulseSpeed = rand(0.01, 0.03);
    }
    update(mx, my) {
      this.pulse += this.pulseSpeed;
      this.x += this.vx + mx * 0.4 * this.z;
      this.y += this.vy + my * 0.2 * this.z;
      if (this.y > H + 6 || this.x < -6 || this.x > W + 6) this.reset(false);
    }
    draw() {
      const a = this.alpha * (0.75 + 0.25 * Math.sin(this.pulse));
      ctx.save();
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur  = this.r * 4;
      ctx.fill();
      ctx.restore();
    }
  }

  /* ---- Node class (larger glowing geometry nodes) ---- */
  class Node {
    constructor() { this.init(); }
    init() {
      this.x      = rand(W * 0.05, W * 0.95);
      this.y      = rand(H * 0.05, H * 0.95);
      this.z      = rand(0.3, 1);
      this.r      = rand(2, 5) * this.z;
      this.vx     = rand(-0.06, 0.06) * this.z;
      this.vy     = rand(-0.06, 0.06) * this.z;
      this.color  = pickColor();
      this.alpha  = rand(0.4, 0.9);
      this.pulse  = rand(0, Math.PI * 2);
      this.pulseSpeed = rand(0.008, 0.02);
      this.sides  = Math.random() > 0.5 ? 0 : randInt(3, 6); // 0=circle
    }
    update(mx, my) {
      this.pulse += this.pulseSpeed;
      this.x += this.vx + mx * 0.25 * this.z;
      this.y += this.vy + my * 0.15 * this.z;
      if (this.x < -20 || this.x > W + 20 || this.y < -20 || this.y > H + 20) this.init();
      // soft bounce
      if (this.x < 0)    { this.x = 0;    this.vx *= -1; }
      if (this.x > W)    { this.x = W;    this.vx *= -1; }
      if (this.y < 0)    { this.y = 0;    this.vy *= -1; }
      if (this.y > H)    { this.y = H;    this.vy *= -1; }
    }
    draw() {
      const pulsed = 0.85 + 0.15 * Math.sin(this.pulse);
      const r = this.r * pulsed;
      const a = this.alpha * pulsed;

      ctx.save();
      ctx.globalAlpha = a;
      ctx.strokeStyle = this.color;
      ctx.lineWidth   = 1;
      ctx.shadowColor = this.color;
      ctx.shadowBlur  = r * 6;

      if (this.sides === 0) {
        // glowing circle
        ctx.beginPath();
        ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = a * 0.25;
        ctx.fillStyle = this.color;
        ctx.fill();
      } else {
        // polygon
        ctx.beginPath();
        for (let i = 0; i < this.sides; i++) {
          const angle = (i / this.sides) * Math.PI * 2 - Math.PI / 2 + this.pulse * 0.5;
          const px = this.x + r * Math.cos(angle);
          const py = this.y + r * Math.sin(angle);
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  /* ---- Build scene ---- */
  const particles = Array.from({ length: PARTICLE_COUNT }, () => new Particle());
  const nodes     = Array.from({ length: NODE_COUNT },     () => new Node());

  /* ---- Draw connecting lines between nearby nodes ---- */
  function drawEdges() {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECT_DIST) {
          const t = 1 - dist / CONNECT_DIST;
          ctx.save();
          ctx.globalAlpha = t * 0.22;
          const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
          grad.addColorStop(0, a.color);
          grad.addColorStop(1, b.color);
          ctx.strokeStyle = grad;
          ctx.lineWidth   = t * 1.2;
          ctx.shadowColor = a.color;
          ctx.shadowBlur  = 6;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  }

  /* ---- Main loop ---- */
  let raf;
  function loop() {
    ctx.clearRect(0, 0, W, H);

    // smooth mouse lerp
    mouse.x += (targetMouse.x - mouse.x) * 0.04;
    mouse.y += (targetMouse.y - mouse.y) * 0.04;

    // update & draw particles
    for (const p of particles) {
      p.update(mouse.x, mouse.y);
      p.draw();
    }

    // edges
    drawEdges();

    // update & draw nodes
    for (const n of nodes) {
      n.update(mouse.x, mouse.y);
      n.draw();
    }

    raf = requestAnimationFrame(loop);
  }

  if (!reducedMotion) {
    loop();
  } else {
    // draw once static
    for (const p of particles) p.draw();
    drawEdges();
    for (const n of nodes) n.draw();
  }

  // pause when tab is hidden to save resources
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
    } else if (!reducedMotion) {
      loop();
    }
  });
})();
