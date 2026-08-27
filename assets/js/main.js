/* ==========================================================================
   OFFICE PACK — main.js
   Sin dependencias. Vanilla JS.
   ========================================================================== */

/* ---------------------------------------------------------------------------
   ⚠️  CONFIGURACIÓN — COMPLETAR ANTES DE PUBLICAR
   --------------------------------------------------------------------------- */
const CONFIG = {
  // Número de WhatsApp en formato internacional, sin + ni espacios.
  whatsapp: '5491122530413',

  // Email de contacto. Si lo dejás vacío (''), el sitio oculta
  // automáticamente el botón y el dato de "Enviar por email".
  email: '',

  // URL del perfil de LinkedIn. Vacío ('') = el link no se muestra.
  linkedin: '',

  // Mensaje por defecto al abrir WhatsApp desde los botones generales.
  waSaludo: 'Hola Office Pack, quisiera hacer una consulta.'
};
/* ------------------------------------------------------------------------- */

(function () {
  'use strict';

  // Desactiva el failsafe del <head>: el JS cargó bien.
  window.__opReady = true;

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const waLink = (texto) =>
    'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(texto || CONFIG.waSaludo);

  /* ------------------------------------------------------- Año del footer */
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* --------------------------------------------- Links de WhatsApp / redes */
  $$('[data-wa]').forEach((a) => {
    a.href = waLink();
    a.target = '_blank';
    a.rel = 'noopener';
  });

  if (CONFIG.email) {
    const block = $('[data-email-block]');
    const link = $('[data-email-link]');
    if (block && link) {
      block.hidden = false;
      link.href = 'mailto:' + CONFIG.email;
      link.textContent = CONFIG.email;
    }
    const btn = $('[data-send-email]');
    if (btn) btn.hidden = false;
  }

  if (CONFIG.linkedin) {
    const li = $('[data-linkedin]');
    if (li) {
      li.hidden = false;
      li.href = CONFIG.linkedin;
      li.target = '_blank';
      li.rel = 'noopener';
    }
  }

  /* ------------------------------------------------------ Nav: estado sticky */
  const nav = $('#nav');
  const fab = $('.fab');
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('is-stuck', y > 40);
    if (fab) fab.classList.toggle('is-on', y > 600);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ------------------------------------------------------------ Menú móvil */
  const burger = $('#burger');
  const mnav = $('#mobilenav');
  const setMenu = (open) => {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    mnav.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setMenu(mnav.hidden));
  $$('a', mnav).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !mnav.hidden) { setMenu(false); burger.focus(); }
  });

  /* --------------------------------------------- Reveals al hacer scroll */
  const revealables = $$('[data-reveal]');
  if (reduced || !('IntersectionObserver' in window)) {
    revealables.forEach((el) => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    revealables.forEach((el) => io.observe(el));
  }

  /* --------------------------------------------------- Contadores de stats */
  const counters = $$('[data-count]');
  const runCount = (el) => {
    const target = parseInt(el.dataset.count, 10);
    const pad = parseInt(el.dataset.pad || '0', 10);
    const fmt = (n) => String(n).padStart(pad, '0');
    if (reduced) { el.textContent = fmt(target); return; }

    const dur = 1100;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if (counters.length) {
    if (!('IntersectionObserver' in window)) {
      counters.forEach(runCount);
    } else {
      const cio = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) { runCount(en.target); cio.unobserve(en.target); }
        });
      }, { threshold: 0.6 });
      counters.forEach((el) => cio.observe(el));
    }
  }

  /* ------------------------------------------------- Acordeón de unidades */
  const units = $$('.unit');

  const openUnit = (unit, scroll) => {
    units.forEach((u) => {
      const isTarget = u === unit;
      u.classList.toggle('is-open', isTarget);
      $('.unit__head', u).setAttribute('aria-expanded', String(isTarget));
    });
    if (scroll) {
      // Esperamos un frame para que el acordeón empiece a abrir antes de scrollear.
      requestAnimationFrame(() =>
        unit.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
      );
    }
  };

  const closeUnit = (unit) => {
    unit.classList.remove('is-open');
    $('.unit__head', unit).setAttribute('aria-expanded', 'false');
  };

  units.forEach((unit) => {
    $('.unit__head', unit).addEventListener('click', () => {
      unit.classList.contains('is-open') ? closeUnit(unit) : openUnit(unit, false);
    });
  });

  // Primera unidad abierta en desktop (en mobile arranca todo cerrado).
  if (units.length && window.innerWidth >= 900) openUnit(units[0], false);

  // Si la URL trae #impresion, #software, etc., abrimos esa unidad.
  const unitFromHash = () => {
    const id = location.hash.replace('#', '');
    const unit = id && units.find((u) => u.id === id);
    if (unit) openUnit(unit, true);
  };
  unitFromHash();
  window.addEventListener('hashchange', unitFromHash);

  /* ------------------------------- Tiles del hero → color + unidad abierta */
  const hero = $('#hero');
  const glowColor = (varName) => {
    if (hero) hero.style.setProperty('--accent', varName);
  };

  $$('.tile').forEach((tile) => {
    const u = tile.dataset.unit;
    tile.addEventListener('mouseenter', () => glowColor('var(--c-' + u + ')'));
    tile.addEventListener('focus', () => glowColor('var(--c-' + u + ')'));
    tile.addEventListener('click', () => {
      const unit = document.getElementById(tile.dataset.goto);
      if (unit) openUnit(unit, true);
    });
  });
  const pack = $('.pack__grid');
  if (pack) pack.addEventListener('mouseleave', () => glowColor('var(--c-tec)'));

  /* --------------------------------- Link activo en el nav según la sección */
  const navLinks = $$('[data-navlink]');
  const sections = navLinks
    .map((a) => document.getElementById(a.getAttribute('href').slice(1)))
    .filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    const sio = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        navLinks.forEach((a) =>
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id)
        );
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => sio.observe(s));
  }

  /* ---------------------------------------------------------- Formulario */
  const form = $('#contactForm');
  if (!form) return;

  const note = $('#formNote');
  const noteDefault = note.textContent;

  const fields = {
    nombre:  { el: $('#f-nombre'),  err: $('#e-nombre'),  msg: 'Decinos tu nombre.' },
    empresa: { el: $('#f-empresa'), err: $('#e-empresa'), msg: 'Decinos de qué empresa nos escribís.' },
    email:   { el: $('#f-email'),   err: $('#e-email'),   msg: 'Necesitamos un email válido para responderte.' },
    mensaje: { el: $('#f-msg'),     err: $('#e-msg'),     msg: 'Contanos brevemente qué necesitás.' }
  };

  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v.trim());

  const showError = (f, show) => {
    f.el.setAttribute('aria-invalid', String(show));
    f.err.hidden = !show;
    f.err.textContent = show ? f.msg : '';
  };

  Object.values(fields).forEach((f) => {
    f.el.addEventListener('input', () => {
      if (f.el.getAttribute('aria-invalid') === 'true') showError(f, false);
    });
  });

  const validate = () => {
    let ok = true, first = null;
    Object.entries(fields).forEach(([key, f]) => {
      const v = f.el.value.trim();
      const bad = key === 'email' ? !isEmail(v) : v.length < 2;
      showError(f, bad);
      if (bad) { ok = false; if (!first) first = f.el; }
    });
    if (!ok) {
      note.textContent = 'Revisá los campos marcados y volvé a intentar.';
      note.className = 'formcard__note is-err';
      if (first) first.focus();
    }
    return ok;
  };

  const buildMessage = () => {
    const d = new FormData(form);
    const tel = (d.get('telefono') || '').trim();
    return [
      'Consulta desde officepack.com.ar',
      '',
      'Nombre: ' + d.get('nombre'),
      'Empresa: ' + d.get('empresa'),
      'Email: ' + d.get('email'),
      tel ? 'Teléfono: ' + tel : null,
      'Unidad de interés: ' + d.get('unidad'),
      '',
      'Mensaje:',
      d.get('mensaje')
    ].filter((l) => l !== null).join('\n');
  };

  const done = (texto) => {
    note.textContent = texto;
    note.className = 'formcard__note is-ok';
    setTimeout(() => { note.textContent = noteDefault; note.className = 'formcard__note'; }, 8000);
  };

  const submitBtn = $('button[type="submit"]', form);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate()) return;

    if (submitBtn) submitBtn.disabled = true;

    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' }
    })
      .then((res) => {
        if (!res.ok) throw new Error('formspree');
        form.reset();
        done('¡Gracias! Recibimos tu consulta y te respondemos a la brevedad.');
      })
      .catch(() => {
        note.textContent = 'No pudimos enviar el formulario. Escribinos por WhatsApp mientras tanto.';
        note.className = 'formcard__note is-err';
      })
      .finally(() => {
        if (submitBtn) submitBtn.disabled = false;
      });
  });

  const emailBtn = $('[data-send-email]');
  if (emailBtn) {
    emailBtn.addEventListener('click', () => {
      if (!validate()) return;
      const asunto = 'Consulta web — ' + $('#f-unidad').value + ' — ' + $('#f-empresa').value;
      window.location.href =
        'mailto:' + CONFIG.email +
        '?subject=' + encodeURIComponent(asunto) +
        '&body=' + encodeURIComponent(buildMessage());
      done('Abrimos tu cliente de correo con la consulta cargada.');
    });
  }

  /* --------------------- CTA "Cotizar X" → precarga y enfoca el formulario */
  $$('[data-quote]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const unidad = btn.dataset.quote;
      const select = $('#f-unidad');
      const msg = $('#f-msg');

      const match = Array.from(select.options).find((o) => o.text.trim() === unidad);
      if (match) select.value = match.value;
      if (!msg.value.trim()) {
        msg.value = 'Hola, quisiera cotizar servicios de la unidad ' + unidad + '. ';
      }

      $('#contacto').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      setTimeout(() => $('#f-nombre').focus({ preventScroll: true }), reduced ? 0 : 700);
    });
  });
})();
