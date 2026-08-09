// ===== Orbit — the signature visual =====
// Muted technical-instrument look with futuristic thinking animation:
//  - pulse-wave rings expanding outward when thinking
//  - rotating scanning arc (radar sweep)
//  - segmented dashed rings
//  - single accent dot only when active
// API: Orb.setState('idle' | 'listening' | 'thinking' | 'speaking')

const Orb = (function () {
  const canvas = document.getElementById('orb-canvas');
  const ctx = canvas.getContext('2d');
  const statusEl = document.getElementById('orb-status');

  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const SIZE = 260;
  canvas.width  = SIZE * DPR;
  canvas.height = SIZE * DPR;
  ctx.scale(DPR, DPR);

  const cx = SIZE / 2;
  let t = 0;
  let state = 'idle';

  const C = {
    line:    '#e8eaed',
    lineDim: 'rgba(232, 234, 237, ALPHA)',
    accent:  '#7c9cff',
    core:    '#e8eaed'
  };

  const STATES = {
    idle:      { speed: 0.004,  coreR: 46, accent: false, label: 'Ready' },
    listening: { speed: 0.012,  coreR: 50, accent: true,  label: 'Listening' },
    thinking:  { speed: 0.020,  coreR: 52, accent: true,  label: 'Thinking' },
    speaking:  { speed: 0.015,  coreR: 50, accent: true,  label: 'Speaking' }
  };

  // Persistent pulse rings (for thinking animation)
  const pulses = [
    { offset: 0,    speed: 0.6 },
    { offset: 0.33, speed: 0.6 },
    { offset: 0.66, speed: 0.6 }
  ];

  function setState(next) {
    if (!STATES[next]) return;
    state = next;
    statusEl.textContent = STATES[next].label;
    statusEl.style.color = STATES[next].accent ? C.accent : 'var(--text-muted)';
  }

  // ---------- helpers ----------
  function drawCircle(r, alpha, lw, opts = {}) {
    ctx.strokeStyle = `rgba(232, 234, 237, ${alpha})`;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.arc(cx, cx, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawDashedCircle(r, alpha, lw, dashLen, gapLen) {
    ctx.strokeStyle = `rgba(232, 234, 237, ${alpha})`;
    ctx.lineWidth = lw;
    ctx.setLineDash([dashLen, gapLen]);
    ctx.beginPath();
    ctx.arc(cx, cx, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawTiltedRing(rotSpeed, tilt, radius, alpha, lw, dashLen, gapLen) {
    ctx.save();
    ctx.translate(cx, cx);
    ctx.rotate(tilt);
    ctx.rotate(t * rotSpeed);
    ctx.strokeStyle = `rgba(232, 234, 237, ${alpha})`;
    ctx.lineWidth = lw;
    if (dashLen) ctx.setLineDash([dashLen, gapLen]);
    ctx.beginPath();
    ctx.ellipse(0, 0, radius, radius * 0.32, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawScanningArc(radius, sweepDeg, alpha, lw) {
    const start = (t * 1.8) % (Math.PI * 2);
    const sweep = (sweepDeg * Math.PI) / 180;
    const grad = ctx.createConicGradient
      ? ctx.createConicGradient(start, cx, cx)
      : null;

    ctx.save();
    if (grad) {
      grad.addColorStop(0,    'rgba(124,156,255,0)');
      grad.addColorStop(0.08, `rgba(124,156,255,${alpha})`);
      grad.addColorStop(0.18, 'rgba(124,156,255,0)');
      grad.addColorStop(1,    'rgba(124,156,255,0)');
      ctx.strokeStyle = grad;
    } else {
      ctx.strokeStyle = `rgba(124,156,255,${alpha})`;
    }
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cx, radius, start, start + sweep);
    ctx.stroke();
    ctx.restore();
  }

  function drawTickRing(radius, count, alpha, lw, length) {
    ctx.save();
    ctx.translate(cx, cx);
    ctx.rotate(t * 0.05);
    ctx.strokeStyle = `rgba(232, 234, 237, ${alpha})`;
    ctx.lineWidth = lw;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const x1 = Math.cos(a) * (radius - length / 2);
      const y1 = Math.sin(a) * (radius - length / 2);
      const x2 = Math.cos(a) * (radius + length / 2);
      const y2 = Math.sin(a) * (radius + length / 2);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ---------- main draw ----------
  function draw() {
    const cfg = STATES[state];
    t += cfg.speed;
    ctx.clearRect(0, 0, SIZE, SIZE);

    // Pulse-wave rings (always subtle, intensify when thinking)
    if (state !== 'idle') {
      const pulseAlphaMax = state === 'thinking' ? 0.45 : 0.25;
      const pulseSpeed    = state === 'thinking' ? 0.9   : 0.6;
      const maxR          = cfg.coreR + 70;

      pulses.forEach((p) => {
        const phase = ((t * pulseSpeed + p.offset) % 1);
        const r = cfg.coreR + phase * (maxR - cfg.coreR);
        const a = pulseAlphaMax * (1 - phase);
        ctx.strokeStyle = `rgba(124, 156, 255, ${a})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(cx, cx, r, 0, Math.PI * 2);
        ctx.stroke();
      });
    }

    // Concentric guide rings
    drawCircle(cfg.coreR + 18, 0.10, 0.6);
    drawCircle(cfg.coreR + 32, 0.07, 0.5);

    // Dashed segmented ring
    drawDashedCircle(cfg.coreR + 48, 0.10, 0.6, 3, 4);

    // Tilted orbit rings
    drawTiltedRing(0.6, -0.5, cfg.coreR + 26, 0.20, 0.7);
    drawTiltedRing(-0.4, 0.4, cfg.coreR + 42, 0.14, 0.6, 2, 3);

    // Scanning radar arc (active states only)
    if (state !== 'idle') {
      const sweep = state === 'thinking' ? 60 : 40;
      const alpha = state === 'thinking' ? 0.55 : 0.4;
      drawScanningArc(cfg.coreR + 60, sweep, alpha, 1.6);
    }

    // Tick marks (technical instrument feel)
    drawTickRing(cfg.coreR + 48, 12, 0.30, 0.8, 4);

    // Core
    ctx.fillStyle = C.core;
    ctx.beginPath();
    ctx.arc(cx, cx, cfg.coreR * 0.42, 0, Math.PI * 2);
    ctx.fill();

    // Inner core ring
    ctx.strokeStyle = `rgba(232, 234, 237, ${cfg.accent ? 0.55 : 0.30})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cx, cfg.coreR * 0.42 + 5, 0, Math.PI * 2);
    ctx.stroke();

    // Accent dot orbiting core (active states)
    if (cfg.accent) {
      const a = t * 3;
      const dx = Math.cos(a) * (cfg.coreR * 0.42 + 5);
      const dy = Math.sin(a) * (cfg.coreR * 0.42 + 5);
      ctx.fillStyle = C.accent;
      ctx.beginPath();
      ctx.arc(cx + dx, cx + dy, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  draw();
  return { setState };
})();
