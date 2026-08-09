// ===== Liquid glass profile card — drag + zoom =====
(function () {
  const card     = document.getElementById('liquid-card');
  const launcher = document.getElementById('liquid-launcher');
  if (!card) return;

  const zoomIn  = document.getElementById('liquid-zoom-in');
  const zoomOut = document.getElementById('liquid-zoom-out');
  const close   = document.getElementById('liquid-close');

  const SCALE_STEP = 0.1;
  const MAX_SCALE  = 2.0;
  const MIN_SCALE  = 0.5;
  let scale = 1;

  function setScale(v) {
    scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, +v.toFixed(2)));
    card.style.setProperty('--scale-factor', scale);
  }

  // Open / close
  function openCard()  { card.hidden = false; }
  function closeCard() { card.hidden = true; }
  launcher.addEventListener('click', () => { card.hidden ? openCard() : closeCard(); });
  close.addEventListener('click', closeCard);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !card.hidden) closeCard(); });

  // Zoom
  zoomIn .addEventListener('click', () => setScale(scale + SCALE_STEP));
  zoomOut.addEventListener('click', () => setScale(scale - SCALE_STEP));

  // ---- Drag ----
  let dragging = false, sx = 0, sy = 0, baseLeft = 0, baseTop = 0;

  function start(e) {
    if (e.target.closest('button, a')) return;
    dragging = true;
    card.classList.add('is-dragging');

    const pt = e.touches ? e.touches[0] : e;
    sx = pt.clientX; sy = pt.clientY;

    // First drag: switch from centered translate() to explicit top/left
    const rect = card.getBoundingClientRect();
    if (card.dataset.placed !== '1') {
      card.style.left = rect.left + 'px';
      card.style.top  = rect.top  + 'px';
      card.style.transform = `scale(${scale})`;
      card.dataset.placed = '1';
    }
    baseLeft = parseFloat(card.style.left) || rect.left;
    baseTop  = parseFloat(card.style.top)  || rect.top;

    e.preventDefault();
  }

  function move(e) {
    if (!dragging) return;
    const pt = e.touches ? e.touches[0] : e;
    card.style.left = (baseLeft + pt.clientX - sx) + 'px';
    card.style.top  = (baseTop  + pt.clientY - sy) + 'px';
    e.preventDefault();
  }

  function end() {
    if (!dragging) return;
    dragging = false;
    card.classList.remove('is-dragging');
  }

  card.addEventListener('mousedown',  start);
  document.addEventListener('mousemove', move);
  document.addEventListener('mouseup',   end);
  card.addEventListener('touchstart', start, { passive: false });
  document.addEventListener('touchmove', move, { passive: false });
  document.addEventListener('touchend',  end);

  // Keep transform in sync with current scale while dragging
  const obs = new MutationObserver(() => {
    if (card.classList.contains('is-dragging')) {
      card.style.transform = `scale(${(scale + 0.03).toFixed(2)})`;
    }
  });
  obs.observe(card, { attributes: true, attributeFilter: ['class'] });
})();
