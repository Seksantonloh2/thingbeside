/* THINGBESIDE — interactions (vanilla JS, no dependencies) */
(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch {} },
  };

  /* ---------- One rAF-throttled scroll loop for every scroll-driven effect ---------- */
  const scrollFns = [];
  const onScroll = (fn) => scrollFns.push(fn);
  let ticking = false;
  const runScroll = () => { ticking = false; scrollFns.forEach((f) => f()); };
  const requestScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(runScroll); } };
  addEventListener('scroll', requestScroll, { passive: true });
  addEventListener('resize', requestScroll);

  /* ---------- Split headings into words (inline photos count as words) ---------- */
  function split(el) {
    const label = el.textContent.replace(/\s+/g, ' ').trim();
    let wi = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(' '); return; }
            const w = document.createElement('span');
            w.className = 'w'; w.textContent = part; w.style.setProperty('--i', wi++);
            frag.append(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') {
          if (n.classList.contains('pic')) { n.classList.add('w'); n.style.setProperty('--i', wi++); }
          else walk(n);
        }
      });
    };
    walk(el);
    el.setAttribute('aria-label', label);
    $$('.w', el).forEach((w) => w.setAttribute('aria-hidden', 'true'));
  }
  $$('[data-split]').forEach(split);

  /* ---------- Reveal on scroll ---------- */
  $$('[data-stagger]').forEach((g) => [...g.children].forEach((c, i) => { c.classList.add('reveal'); c.style.setProperty('--d', i * 90 + 'ms'); }));
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('is-in');
    if (e.target.hasAttribute('data-count')) countUp(e.target);
    io.unobserve(e.target);
  }), { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
  const watch = () => $$('.reveal, [data-split]:not([data-load]), [data-count]').forEach((el) => io.observe(el));

  /* ---------- Count up ---------- */
  function countUp(el) {
    const to = parseFloat(el.dataset.count);
    const fmt = (v) => Math.round(v).toLocaleString('en-AU');
    if (reduce) { el.textContent = fmt(to); return; }
    const t0 = performance.now(), dur = 1600;
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      el.textContent = fmt(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- Intro preloader (PreloadPro style): 4 strips, a label and a word ticker, strips peel away ---------- */
  function preloader(done) {
    const wrap = $('.preloader');
    if (!wrap || root.classList.contains('no-preload') || reduce) { wrap && wrap.remove(); done(); return; }
    store.set('tb-loaded', '1');
    wrap.style.visibility = 'visible'; // shown only once the intro starts
    const list = $('.pp__words', wrap), text = $('.pp__text', wrap), strips = $$('.pp__strip', wrap);
    const words = $$('.pp__word', wrap), SHOW = 4000;
    const STEP = SHOW / words.length; // each of the four words gets a turn across the 4 seconds
    document.body.style.overflow = 'hidden'; // scroll is locked during the intro
    let i = 0;
    const show = () => { list.style.transform = `translate3d(0,${-i * 1.2}em,0)`; };
    show();
    const ticker = setInterval(() => {
      if (i < words.length - 1) { i += 1; show(); } else clearInterval(ticker);
    }, STEP);
    setTimeout(() => {
      clearInterval(ticker);
      text.classList.add('is-out');
      strips.forEach((s) => s.classList.add('is-out'));
      done();
      document.body.style.overflow = '';
    }, SHOW);
    setTimeout(() => wrap.remove(), SHOW + 1600);
  }

  /* ---------- Page enter / leave (blur between pages) ---------- */
  const page = $('.page');
  const samePage = (url) => url.pathname.replace(/index\.html$/, '') === location.pathname.replace(/index\.html$/, '');
  function enter() {
    page && page.classList.remove('entering');
    $$('[data-load]').forEach((el, i) => setTimeout(() => el.classList.add('is-in'), 200 + i * 220));
    setTimeout(() => $$('.hero .reveal, .phero .reveal').forEach((el) => el.classList.add('is-in')), 500);
    watch();
    requestScroll();
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || !/\.html$|\/$/.test(url.pathname)) return;
    if (samePage(url) && url.hash) return; // in-page links: smooth scroll only (handled below)
    if (reduce) return;
    e.preventDefault();
    root.classList.add('leaving');
    setTimeout(() => { location.href = url.href; }, 450);
  });
  addEventListener('pageshow', (e) => { if (e.persisted) root.classList.remove('leaving'); });

  /* ---------- Nav: solid bar once scrolled, hides on the way down, menu ---------- */
  const nav = $('.nav');
  let lastY = scrollY;
  if (nav) onScroll(() => {
    const y = scrollY;
    nav.classList.toggle('is-solid', y > 40);
    if (!root.classList.contains('menu-open')) {
      if (y > 600 && y > lastY + 4) nav.classList.add('is-hidden');
      else if (y < lastY - 4 || y < 600) nav.classList.remove('is-hidden');
    }
    lastY = y;
  });
  const menuBtn = $('.menu-btn');
  const setMenu = (open) => {
    root.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) nav.classList.remove('is-hidden');
  };
  menuBtn && menuBtn.addEventListener('click', () => setMenu(!root.classList.contains('menu-open')));
  $$('.mobile-menu a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && root.classList.contains('menu-open')) setMenu(false); });

  /* ---------- Hero: figure + red sun follow the mouse ---------- */
  const heroCard = $('.hero__card');
  if (heroCard && fine && !reduce) {
    heroCard.addEventListener('pointermove', (e) => {
      const r = heroCard.getBoundingClientRect();
      heroCard.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5) * -28 + 'px');
      heroCard.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5) * -14 + 'px');
    });
    heroCard.addEventListener('pointerleave', () => { heroCard.style.setProperty('--mx', '0px'); heroCard.style.setProperty('--my', '0px'); });
  }

  /* ---------- Inline photo that cycles through the projects ---------- */
  $$('.pic--rotate').forEach((p) => {
    const imgs = $$('img', p);
    let i = 0;
    imgs[0] && imgs[0].classList.add('is-on');
    if (reduce || imgs.length < 2) return;
    setInterval(() => { imgs[i].classList.remove('is-on'); i = (i + 1) % imgs.length; imgs[i].classList.add('is-on'); }, 1800);
  });

  /* ---------- Featured work: the name list rolls to whichever card is in the middle ---------- */
  $$('[data-work]').forEach((w) => {
    const items = $$('.work__list li', w), cards = $$('.proj', w);
    const list = $('.work__list', w), wheel = $('.work__wheel', w);
    if (!items.length || !wheel) return;
    let active = -1;
    const set = (i, force) => {
      if (i === active && !force) return;
      active = i;
      items.forEach((li, j) => { li.classList.toggle('is-active', j === i); li.style.setProperty('--dist', Math.abs(j - i)); });
      const li = items[i];
      list.style.transform = `translateY(${wheel.clientHeight / 2 - (li.offsetTop + li.offsetHeight / 2)}px)`;
    };
    onScroll(() => {
      if (!wheel.offsetParent) return; // hidden on small screens
      const mid = innerHeight / 2;
      let best = 0, bestD = Infinity;
      cards.forEach((c, i) => { const r = c.getBoundingClientRect(); const d = Math.abs(r.top + r.height / 2 - mid); if (d < bestD) { bestD = d; best = i; } });
      set(best);
    });
    addEventListener('resize', () => active > -1 && set(active, true));
    items.forEach((li, i) => $('a', li).addEventListener('click', (e) => {
      e.preventDefault();
      const r = cards[i].getBoundingClientRect();
      glide(r.top + scrollY - (innerHeight - r.height) / 2);
    }));
  });

  /* ---------- Project cards: red circle follows the pointer ---------- */
  if (fine) $$('.proj').forEach((p) => {
    const m = $('.proj__media', p);
    const move = (e) => {
      const r = m.getBoundingClientRect();
      m.style.setProperty('--cx', e.clientX - r.left + 'px');
      m.style.setProperty('--cy', e.clientY - r.top + 'px');
    };
    m.addEventListener('pointerenter', move);
    m.addEventListener('pointermove', move);
  });

  /* ---------- Big line drifts sideways as you scroll ---------- */
  if (!reduce) $$('[data-drift]').forEach((t) => {
    const sec = t.parentElement;
    onScroll(() => {
      const r = sec.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const p = clamp((innerHeight - r.top) / (innerHeight + r.height), 0, 1);
      t.style.transform = `translate3d(${-p * Math.max(0, t.scrollWidth - innerWidth * 0.9)}px,0,0)`;
    });
  });

  /* ---------- Process deck: cards fly in and stack, slightly rotated ---------- */
  if (!reduce) $$('[data-deck]').forEach((track) => {
    const cards = $$('.dcard', track), n = cards.length, now = $('[data-deck-now]', track);
    track.classList.add('is-live');
    const ease = (x) => 1 - Math.pow(1 - x, 3);
    onScroll(() => {
      const r = track.getBoundingClientRect();
      if (r.bottom < -100 || r.top > innerHeight + 100) return;
      const p = clamp(-r.top / (r.height - innerHeight), 0, 1);
      const f = Math.min(n - 1, (p / 0.86) * (n - 1)); // all cards land a little before the pin ends
      cards.forEach((c, i) => {
        const rot = parseFloat(c.dataset.rot);
        const t = i === 0 ? 1 : ease(clamp(f - (i - 1), 0, 1));
        const depth = clamp(f - i, 0, 3);
        const y = (1 - t) * innerHeight * 0.95;
        const spin = (1 - t) * (i % 2 ? 16 : -16);
        c.style.transform = `translate3d(0,${y}px,0) rotate(${rot + spin}deg) scale(${1 - depth * 0.035})`;
      });
      if (now) now.textContent = String(Math.min(n, Math.floor(f + 0.5) + 1)).padStart(2, '0');
    });
  });

  /* ---------- Final CTA: letters ride a wave while the line drifts ---------- */
  $$('[data-wave]').forEach((el) => {
    const text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.textContent = '';
    const inner = document.createElement('span');
    inner.className = 'wave__inner'; inner.setAttribute('aria-hidden', 'true');
    [...text].forEach((ch) => {
      const s = document.createElement('span');
      s.className = 'l'; s.textContent = ch === ' ' ? ' ' : ch;
      inner.append(s);
    });
    el.append(inner);
    if (reduce) return;
    const ls = $$('.l', inner);
    onScroll(() => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > innerHeight + 200) return;
      const p = clamp((innerHeight - r.top) / (innerHeight + r.height), 0, 1);
      inner.style.transform = `translate3d(${-p * Math.max(0, inner.offsetWidth - el.clientWidth)}px,0,0)`;
      const ph = p * 12;
      ls.forEach((l, i) => {
        const a = i * 0.5 - ph;
        l.style.transform = `translate3d(0,${(Math.sin(a) * 0.1).toFixed(3)}em,0) rotate(${(Math.cos(a) * 5).toFixed(2)}deg)`;
      });
    });
  });

  /* ---------- FAQ accordion (one open at a time) ---------- */
  $$('.faq__q').forEach((q) => q.addEventListener('click', () => {
    const item = q.closest('.faq__item'), open = !item.classList.contains('open');
    $$('.faq__item.open', item.parentElement).forEach((o) => { o.classList.remove('open'); $('.faq__q', o).setAttribute('aria-expanded', 'false'); });
    item.classList.toggle('open', open);
    q.setAttribute('aria-expanded', String(open));
  }));

  /* ---------- Smooth scrolling (inertial wheel on desktop) + gliding in-page links ---------- */
  let glide = (y) => scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
  if (fine && !reduce) {
    let target = scrollY, current = scrollY, running = false;
    const maxY = () => document.documentElement.scrollHeight - innerHeight;
    const step = () => {
      current += (target - current) * 0.1;
      if (Math.abs(target - current) < 0.5) { current = target; running = false; }
      scrollTo({ top: current, behavior: 'instant' });
      if (running) requestAnimationFrame(step);
    };
    glide = (y) => {
      target = clamp(y, 0, maxY());
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
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href*="#"]:not(.skip)');
    if (!a || e.defaultPrevented) return;
    const url = new URL(a.href, location.href);
    if (!samePage(url) || url.hash.length < 2) return;
    const el = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (!el) return;
    e.preventDefault();
    glide(el.getBoundingClientRect().top + scrollY - 90);
    history.replaceState(null, '', url.hash);
  });

  /* ---------- Footer wordmark: scale the type to exactly fill the panel ---------- */
  const fitMarks = () => $$('.footer__mark').forEach((el) => {
    const span = el.firstElementChild, cs = getComputedStyle(el.parentElement);
    const room = el.parentElement.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    el.style.fontSize = '100px';
    el.style.fontSize = (100 * room / span.getBoundingClientRect().width) * 0.995 + 'px';
  });
  fitMarks();
  addEventListener('resize', fitMarks);
  document.fonts && document.fonts.ready.then(() => { fitMarks(); requestScroll(); });

  /* ---------- Contact form (Formspree, stays on the page) ---------- */
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
      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then((r) => { if (!r.ok) throw new Error('Formspree ' + r.status); form.classList.add('sent'); form.reset(); })
        .catch(() => form.classList.add('failed'))
        .finally(() => { send.disabled = false; });
    });
  }

  /* ---------- Footer year ---------- */
  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* ---------- Hero video: with reduced motion, drop it and keep the poster photo ---------- */
  if (reduce) $$('.hero__video').forEach((v) => v.remove());

  /* ---------- Hero video: crossfade between two copies so the loop restarts without a cut ---------- */
  const heroVids = $$('.hero__video');
  if (heroVids.length === 2 && !reduce) {
    const XF = 1.0; // seconds of overlap before the end
    let active = 0, busy = false;
    heroVids.forEach((v, k) => v.addEventListener('timeupdate', () => {
      if (k !== active || busy || !v.duration || v.duration - v.currentTime > XF) return;
      busy = true;
      const next = heroVids[1 - k];
      next.currentTime = 0;
      next.play().catch(() => {});
      next.classList.add('is-on');
      v.classList.remove('is-on');
      active = 1 - k;
      setTimeout(() => { v.pause(); v.currentTime = 0; busy = false; }, XF * 1000 + 150);
    }));
  }

  /* ---------- Boot ---------- */
  runScroll();
  preloader(() => requestAnimationFrame(enter));
})();
