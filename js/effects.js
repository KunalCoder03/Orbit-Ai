// ===== Micro-interactions =====
// 1) Subtle ripple on clickable elements
// 2) Soft spotlight on suggestion cards (follows cursor)

document.addEventListener('DOMContentLoaded', () => {

  // ---- ripple on click ----
  function addRipple(el) {
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    el.style.overflow = 'hidden';
    el.addEventListener('click', (e) => {
      const rect = el.getBoundingClientRect();
      const ripple = document.createElement('span');
      const size = Math.max(rect.width, rect.height) * 1.2;
      ripple.style.position = 'absolute';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top  = (e.clientY - rect.top  - size / 2) + 'px';
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.borderRadius = '50%';
      ripple.style.background = 'rgba(255,255,255,0.10)';
      ripple.style.pointerEvents = 'none';
      ripple.style.animation = 'rippleOut 0.55s ease-out';
      el.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    });
  }

  document.querySelectorAll('.suggestion, .composer button, .nav-item, .ghost-btn')
    .forEach(addRipple);

  // ---- soft spotlight that follows the cursor on suggestion cards ----
  document.querySelectorAll('.suggestion').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.background =
        `radial-gradient(160px circle at ${x}px ${y}px, rgba(255,255,255,0.05), var(--bg-elev-1) 70%)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.background = '';
    });
  });
});
