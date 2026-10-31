/* ==========================================================================
   OFFICEMERCH — carrusel del hero
   Sin dependencias. Autoplay con pausa (botón, mouse encima, foco de teclado,
   pestaña oculta o "reducir movimiento" del sistema), flechas, puntos y swipe.
   ========================================================================== */
(function () {
  'use strict';

  const root = document.querySelector('[data-carousel]');
  if (!root) return;

  const wrap      = root.querySelector('[data-slides]');
  const slides    = Array.from(root.querySelectorAll('[data-slide]'));
  const dots      = Array.from(root.querySelectorAll('[data-dot]'));
  const btnPrev   = root.querySelector('[data-prev]');
  const btnNext   = root.querySelector('[data-next]');
  const btnToggle = root.querySelector('[data-toggle]');

  const DELAY = 7000; // ms entre diapositivas
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let index = 0;
  let timer = null;
  let userPaused = reduced;   // pausa pedida por la persona (o por su sistema)
  let hovering = false;
  let kbFocus = false;

  const shouldRun = () => !userPaused && !hovering && !kbFocus && !document.hidden;

  function schedule() {
    clearTimeout(timer);
    if (shouldRun()) timer = setTimeout(() => go(index + 1), DELAY);
  }

  function go(n) {
    index = (n + slides.length) % slides.length;
    slides.forEach((s, k) => {
      const on = k === index;
      s.classList.toggle('is-active', on);
      s.setAttribute('aria-hidden', String(!on));
      s.inert = !on;
    });
    dots.forEach((d, k) => d.setAttribute('aria-current', String(k === index)));
    schedule();
  }

  function setPaused(paused) {
    userPaused = paused;
    root.classList.toggle('is-paused', paused);
    btnToggle.setAttribute('aria-pressed', String(paused));
    btnToggle.setAttribute('aria-label', paused ? 'Reanudar rotación automática' : 'Pausar rotación automática');
    // Mientras rota sola no se anuncia cada cambio; al pausar, sí.
    wrap.setAttribute('aria-live', paused ? 'polite' : 'off');
    schedule();
  }

  btnPrev.addEventListener('click', () => go(index - 1));
  btnNext.addEventListener('click', () => go(index + 1));
  btnToggle.addEventListener('click', () => setPaused(!userPaused));
  dots.forEach((d, k) => d.addEventListener('click', () => go(k)));

  root.addEventListener('mouseenter', () => { hovering = true; schedule(); });
  root.addEventListener('mouseleave', () => { hovering = false; schedule(); });

  // Pausa solo con foco de teclado (no al hacer clic con el mouse)
  root.addEventListener('focusin', (e) => {
    kbFocus = e.target.matches(':focus-visible');
    schedule();
  });
  root.addEventListener('focusout', () => {
    setTimeout(() => { kbFocus = root.contains(document.activeElement) && document.activeElement.matches(':focus-visible'); schedule(); }, 0);
  });

  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  { go(index - 1); }
    if (e.key === 'ArrowRight') { go(index + 1); }
  });

  document.addEventListener('visibilitychange', schedule);

  // Swipe en pantallas táctiles
  let x0 = 0, y0 = 0;
  root.addEventListener('touchstart', (e) => {
    x0 = e.changedTouches[0].clientX;
    y0 = e.changedTouches[0].clientY;
  }, { passive: true });
  root.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - x0;
    const dy = e.changedTouches[0].clientY - y0;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(index + (dx < 0 ? 1 : -1));
  }, { passive: true });

  // Los botones de las diapositivas 2 y 3 preseleccionan la categoría del formulario
  document.querySelectorAll('[data-cat]').forEach((a) => {
    a.addEventListener('click', () => {
      const select = document.getElementById('f-unidad');
      const msg = document.getElementById('f-msg');
      if (select) {
        const opt = Array.from(select.options).find((o) => o.text.trim() === a.dataset.cat);
        if (opt) select.value = opt.value;
      }
      if (msg && !msg.value.trim() && a.dataset.msg) msg.value = a.dataset.msg;
    });
  });

  setPaused(userPaused);
  go(0);
})();
