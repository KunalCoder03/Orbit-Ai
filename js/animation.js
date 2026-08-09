// ===== Page entrance + time-aware greeting =====

document.addEventListener('DOMContentLoaded', () => {

  // Time-aware greeting
  const greeting = document.getElementById('greeting');
  if (greeting) {
    const hour = new Date().getHours();
    const part =
      hour < 5  ? 'Working late' :
      hour < 12 ? 'Good morning' :
      hour < 17 ? 'Good afternoon' :
      hour < 21 ? 'Good evening' :
                  'Working late';
    greeting.textContent = `${part}, Kunal`;
  }

  // Staggered fade-in for hero section pieces
  const seq = ['.orb-wrap', '.heading', '.suggestions', '.composer'];
  seq.forEach((sel, i) => {
    const el = document.querySelector(sel);
    if (!el) return;
    el.style.opacity = 0;
    el.style.transition = 'opacity 0.5s ease';
    setTimeout(() => { el.style.opacity = 1; }, 80 + i * 90);
  });
});
