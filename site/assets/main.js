/* THINGBESIDE — interactions (vanilla JS, no dependencies) */
(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const ACCENT_RGB = [249, 9, 24];
  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch {} },
  };

  /* ---------- Split text into words + glyphs ---------- */
  function split(el) {
    let wi = 0;
    const walk = (node, gradient) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(' '); return; }
            const w = document.createElement('span');
            w.className = 'w' + (gradient ? ' grad-text' : '');
            w.style.setProperty('--i', wi++);
            if (gradient) w.textContent = part;
            else [...part].forEach((c) => {
              const ch = document.createElement('span');
              ch.className = 'ch'; ch.textContent = c; w.append(ch);
            });
            frag.append(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') {
          const g = n.classList.contains('grad-text');
          if (g) n.classList.remove('grad-text');
          walk(n, gradient || g);
        }
      });
    };
    walk(el, false);
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    $$('.w', el).forEach((w) => w.setAttribute('aria-hidden', 'true'));
  }

  /* Glyph kinetic: each letter flickers through glyphs, then settles */
  const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=/<>';
  function kinetic(el) {
    if (reduce) return;
    const chars = $$('.ch', el);
    chars.forEach((c) => { c.style.width = c.getBoundingClientRect().width + 'px'; c.style.textAlign = 'center'; });
    chars.forEach((c, i) => {
      const final = c.textContent;
      if (!/\S/.test(final)) return;
      let n = 0;
      setTimeout(() => {
        const id = setInterval(() => {
          if (++n > 7) { clearInterval(id); c.textContent = final; c.classList.remove('glitch'); c.style.width = ''; return; }
          c.textContent = GLYPHS[(Math.random() * GLYPHS.length) | 0];
          c.classList.toggle('glitch', n % 3 === 0);
        }, 45);
      }, i * 28);
    });
  }

  function playIn(el) {
    if (el.classList.contains('is-in')) return;
    el.classList.add('is-in');
    if (el.hasAttribute('data-kinetic')) setTimeout(() => kinetic(el), 1000 + $$('.w', el).length * 70);
  }

  $$('[data-split]').forEach((el) => { split(el); el.classList.add('blur-in'); });

  /* ---------- Reveal on scroll ---------- */
  $$('[data-stagger]').forEach((g) => [...g.children].forEach((c, i) => { c.classList.add('reveal'); c.style.setProperty('--d', i * 90 + 'ms'); }));
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    const t = e.target;
    if (t.classList.contains('blur-in')) playIn(t); else t.classList.add('is-in');
    if (t.hasAttribute('data-count')) countUp(t);
    io.unobserve(t);
  }), { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
  const watch = () => $$('.reveal, .blur-in:not([data-load]), [data-count]').forEach((el) => io.observe(el));

  /* ---------- Count up ---------- */
  function countUp(el) {
    const to = parseFloat(el.dataset.count), pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
    const fmt = (v) => pre + Math.round(v).toLocaleString('en-AU') + suf;
    if (reduce) { el.textContent = fmt(to); return; }
    const t0 = performance.now(), dur = 1600;
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      el.textContent = fmt(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- LED preloader ---------- */
  const FONT = {
    T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
    H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
    I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
    N: ['10001', '10001', '11001', '10101', '10011', '10001', '10001'],
    G: ['01110', '10001', '10000', '10111', '10001', '10001', '01111'],
    B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
    E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
    S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
    D: ['11100', '10010', '10001', '10001', '10001', '10010', '11100'],
  };
  function preloader(done) {
    const wrap = $('.preloader');
    if (!wrap || root.classList.contains('no-preload') || reduce) { wrap && wrap.remove(); done(); return; }
    store.set('tb-loaded', '1');
    const word = 'THINGBESIDE', pad = 2, cols = word.length * 6 - 1 + pad * 2, rows = 7 + pad * 2;
    const grid = [];
    [...word].forEach((ch, ci) => FONT[ch].forEach((r, y) => [...r].forEach((b, x) => {
      if (b === '1') grid.push({ x: pad + ci * 6 + x, y: pad + y, at: 0 });
    })));
    const cv = $('canvas', wrap), ctx = cv.getContext('2d'), dpr = Math.min(2, devicePixelRatio || 1);
    const cell = 16; cv.width = cols * cell * dpr; cv.height = rows * cell * dpr;
    ctx.scale(dpr, dpr);
    const lit = new Set(grid.map((d) => d.x + ',' + d.y));
    grid.forEach((d) => { d.at = 120 + d.x * 22 + Math.random() * 260; });
    const count = $('.preloader__count', wrap), t0 = performance.now(), total = 2300;
    const draw = (now) => {
      const t = now - t0;
      ctx.clearRect(0, 0, cols * cell, rows * cell);
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        if (lit.has(x + ',' + y)) continue;
        ctx.fillStyle = '#151515';
        ctx.beginPath(); ctx.arc(x * cell + cell / 2, y * cell + cell / 2, cell * 0.3, 0, 7); ctx.fill();
      }
      grid.forEach((d) => {
        let a = t < d.at ? 0 : Math.min(1, (t - d.at) / 120);
        if (a > 0 && a < 1 && Math.random() < 0.35) a *= 0.2; // flicker on ignition
        if (t > 1700 && t < 1820) a = 1.25;               // final flash
        const [r, g, b] = ACCENT_RGB;
        const cx = d.x * cell + cell / 2, cy = d.y * cell + cell / 2;
        ctx.fillStyle = '#151515';
        ctx.beginPath(); ctx.arc(cx, cy, cell * 0.3, 0, 7); ctx.fill();
        if (!a) return;
        ctx.shadowColor = `rgba(${r},${g},${b},${0.9 * a})`; ctx.shadowBlur = 14 * a;
        // hot core: accent pushed towards white, like a lit LED
        ctx.fillStyle = `rgba(255,${Math.min(255, g + 110)},${Math.min(255, b + 110)},${Math.min(1, a)})`;
        ctx.beginPath(); ctx.arc(cx, cy, cell * 0.34, 0, 7); ctx.fill();
        ctx.shadowBlur = 0;
      });
      count.textContent = String(Math.min(100, Math.round((t / 1800) * 100))).padStart(3, '0');
      if (t < total) requestAnimationFrame(draw);
      else { wrap.classList.add('done'); setTimeout(() => wrap.remove(), 800); done(); }
    };
    requestAnimationFrame(draw);
  }

  /* ---------- Page enter / leave (blur) ---------- */
  const page = $('.page');
  function enter() {
    page && page.classList.remove('entering');
    $$('[data-load]').forEach((el, i) => setTimeout(() => playIn(el), 120 + i * 180));
    $$('.hero .reveal').forEach((el) => el.classList.add('is-in'));
    watch();
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || !/\.html$|\/$/.test(url.pathname)) return;
    if (url.pathname === location.pathname && url.hash) return; // in-page: smooth scroll only
    if (reduce) return;
    e.preventDefault();
    root.classList.add('leaving');
    setTimeout(() => { location.href = url.href; }, 450);
  });
  addEventListener('pageshow', (e) => { if (e.persisted) root.classList.remove('leaving'); });

  /* ---------- Nav: backdrop once scrolled, hide on scroll down, menu ---------- */
  const nav = $('.nav');
  let lastY = scrollY;
  const onScrollNav = () => {
    const y = scrollY;
    nav.classList.toggle('is-scrolled', y > 40);
    if (!root.classList.contains('menu-open')) {
      if (y > 400 && y > lastY + 4) nav.classList.add('is-hidden');
      else if (y < lastY - 4 || y < 400) nav.classList.remove('is-hidden');
    }
    lastY = y;
  };
  if (nav) { addEventListener('scroll', onScrollNav, { passive: true }); onScrollNav(); }
  const menuBtn = $('.menu-btn');
  const setMenu = (open) => {
    root.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
  };
  menuBtn && menuBtn.addEventListener('click', () => setMenu(!root.classList.contains('menu-open')));
  $$('.mobile-menu a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && root.classList.contains('menu-open')) setMenu(false); });

  /* ---------- Hero parallax ---------- */
  const heroCard = $('.hero__card');
  if (heroCard && fine && !reduce) {
    heroCard.addEventListener('pointermove', (e) => {
      const r = heroCard.getBoundingClientRect();
      heroCard.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5) * -24 + 'px');
      heroCard.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5) * -14 + 'px');
    });
    heroCard.addEventListener('pointerleave', () => { heroCard.style.setProperty('--mx', '0px'); heroCard.style.setProperty('--my', '0px'); });
  }

  /* ---------- Accordions: services (one open, at least one) + FAQ (one or none) ---------- */
  $$('.acc__head').forEach((h) => h.addEventListener('click', () => {
    const item = h.closest('.acc__item');
    if (item.classList.contains('open')) return;
    $$('.acc__item.open', item.parentElement).forEach((o) => { o.classList.remove('open'); $('.acc__head', o).setAttribute('aria-expanded', 'false'); });
    item.classList.add('open'); h.setAttribute('aria-expanded', 'true');
  }));
  $$('.faq__q').forEach((q) => q.addEventListener('click', () => {
    const item = q.closest('.faq__item'), open = !item.classList.contains('open');
    $$('.faq__item.open', item.parentElement).forEach((o) => { o.classList.remove('open'); $('.faq__q', o).setAttribute('aria-expanded', 'false'); });
    item.classList.toggle('open', open);
    q.setAttribute('aria-expanded', String(open));
  }));

  /* ---------- Smooth scrolling (inertial wheel, desktop only) ---------- */
  if (fine && !reduce) {
    let target = scrollY, current = scrollY, running = false;
    const maxY = () => document.documentElement.scrollHeight - innerHeight;
    const step = () => {
      current += (target - current) * 0.1;
      if (Math.abs(target - current) < 0.5) { current = target; running = false; }
      scrollTo({ top: current, behavior: 'instant' });
      if (running) requestAnimationFrame(step);
    };
    const glide = (y) => {
      target = Math.max(0, Math.min(maxY(), y));
      if (!running) { current = scrollY; running = true; requestAnimationFrame(step); }
    };
    addEventListener('wheel', (e) => {
      if (e.ctrlKey || root.classList.contains('menu-open') || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1;
      glide((running ? target : scrollY) + e.deltaY * unit);
    }, { passive: false });
    // keyboard, scrollbar drags and native jumps keep the target in sync
    addEventListener('scroll', () => { if (!running) target = current = scrollY; }, { passive: true });
    // in-page links glide with the same easing
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]:not(.skip)');
      const el = a && a.getAttribute('href').length > 1 && document.querySelector(a.getAttribute('href'));
      if (!el) return;
      e.preventDefault();
      glide(el.getBoundingClientRect().top + scrollY - 100);
    });
  }

  /* ---------- Process timeline: line fills and steps light up on scroll ---------- */
  $$('[data-timeline]').forEach((tl) => {
    const steps = $$('.tl-step', tl), dots = steps.map((s) => $('.tl-dot', s));
    let ticking = false;
    const update = () => {
      ticking = false;
      const top = tl.getBoundingClientRect().top;
      const centre = (d) => { const r = d.getBoundingClientRect(); return r.top + r.height / 2 - top; };
      const first = centre(dots[0]), last = centre(dots[dots.length - 1]);
      const mark = innerHeight * 0.55 - top;            // activation line, 55% down the viewport
      tl.style.setProperty('--tl-h', last - first + 'px');
      tl.style.setProperty('--tl-fill', Math.max(0, Math.min(last - first, mark - first)) + 'px');
      let current = -1;
      dots.forEach((d, i) => { if (centre(d) <= mark) current = i; });
      steps.forEach((s, i) => { s.classList.toggle('is-done', i <= current); s.classList.toggle('is-current', i === current); });
    };
    const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    addEventListener('scroll', req, { passive: true });
    addEventListener('resize', req);
    update();
  });

  /* ---------- Footer wordmark: scale the type to exactly fill the container ---------- */
  const fitMarks = () => $$('.footer__mark').forEach((el) => {
    const span = el.firstElementChild, cs = getComputedStyle(el.parentElement);
    const room = el.parentElement.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    el.style.fontSize = '100px';
    el.style.fontSize = (100 * room / span.getBoundingClientRect().width) * 0.995 + 'px';
  });
  fitMarks();
  addEventListener('resize', fitMarks);
  document.fonts && document.fonts.ready.then(fitMarks);

  /* ---------- Aura cursor: soft glow trail that follows the pointer (canvas 2D, desktop only) ---------- */
  const auraCanvas = $('#fluid');
  if (auraCanvas && fine && !reduce) aura(auraCanvas);
  else if (auraCanvas) auraCanvas.remove();

  function aura(canvas) {
    const ctx = canvas.getContext('2d');
    const N = 26, pts = [], m = { x: 0, y: 0, seen: false };
    let W = 0, H = 0, dpr = 1, t = 0, energy = 0, lastX = 0, lastY = 0;
    const size = () => {
      dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight;
      canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size(); addEventListener('resize', size);
    addEventListener('pointermove', (e) => {
      m.x = e.clientX; m.y = e.clientY;
      if (!m.seen) { m.seen = true; lastX = m.x; lastY = m.y; for (let i = 0; i < N; i++) pts.push({ x: m.x, y: m.y }); }
    }, { passive: true });
    const loop = () => {
      t += 0.012;
      const speed = Math.hypot(m.x - lastX, m.y - lastY); lastX = m.x; lastY = m.y;
      energy += (Math.min(1, speed / 40) - energy) * 0.08;
      // the head follows the pointer; each point eases towards the one before it
      let px = m.x, py = m.y;
      pts.forEach((p, i) => {
        const k = 0.34 - i * 0.008;
        p.x += (px - p.x) * k; p.y += (py - p.y) * k; px = p.x; py = p.y;
      });
      ctx.clearRect(0, 0, W, H);
      if (m.seen) {
        ctx.globalCompositeOperation = 'lighter';
        for (let i = pts.length - 1; i >= 0; i--) {
          const p = pts[i], f = 1 - i / N;
          const r = 26 + 90 * f * (0.6 + 0.4 * energy) + Math.sin(t * 2 + i) * 4;
          const a = (0.1 + 0.22 * f) * (0.6 + 0.4 * energy);
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
          g.addColorStop(0, `rgba(249,9,24,${a})`);
          g.addColorStop(0.45, `rgba(255,70,80,${a * 0.35})`);
          g.addColorStop(1, 'rgba(249,9,24,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 7); ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  /* ---------- Contact form ---------- */
  const form = $('#quote-form');
  if (form) {
    const rules = {
      name: (v) => v.trim().length > 1,
      email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
      job: (v) => !!v,
      message: (v) => v.trim().length > 9,
    };
    const check = (f) => { const ok = rules[f.name](f.value); f.closest('.field').classList.toggle('invalid', !ok); f.setAttribute('aria-invalid', String(!ok)); return ok; };
    $$('input, select, textarea', form).forEach((f) => f.addEventListener('blur', () => rules[f.name] && check(f)));
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fields = $$('input, select, textarea', form).filter((f) => rules[f.name]);
      const ok = fields.map(check).every(Boolean);
      if (!ok) { fields.find((f) => f.getAttribute('aria-invalid') === 'true').focus(); return; }
      const send = $('button[type="submit"]', form);
      send.disabled = true;
      form.classList.remove('sent', 'failed');
      // Formspree takes the fields and answers with JSON, so the page stays where it is.
      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then((r) => { if (!r.ok) throw new Error('Formspree ' + r.status); form.classList.add('sent'); form.reset(); })
        .catch(() => form.classList.add('failed'))
        .finally(() => { send.disabled = false; });
    });
  }

  /* ---------- Footer year ---------- */
  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* ---------- Boot ---------- */
  preloader(() => requestAnimationFrame(enter));
})();
