/* ==========================================================================
   HYTTA — core: smooth scroll, nav, menu, reveals, counters, cursor, panels
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  var fmt = function (n) { return Math.round(n).toLocaleString('en-GB'); };

  var H = window.HYTTA = { $: $, $$: $$, RM: RM, FINE: FINE, fmt: fmt, lenis: null };

  if (!window.gsap || !window.ScrollTrigger) {
    document.documentElement.classList.add('js-failsafe');
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  H.gsap = gsap;

  /* ---------- smooth scroll (desktop only) -------------------------------- */
  if (!RM && FINE && window.Lenis) {
    var lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95, smoothWheel: true });
    H.lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  H.scrollTo = function (target, opts) {
    opts = opts || {};
    var y = typeof target === 'number' ? target : target.getBoundingClientRect().top + window.scrollY + (opts.offset || 0);
    var dist = Math.abs(y - window.scrollY);
    if (H.lenis) {
      H.lenis.scrollTo(y, { duration: Math.min(2.8, Math.max(1.1, dist / 2200)), easing: function (t) { return 1 - Math.pow(1 - t, 4); }, lock: false });
    } else {
      window.scrollTo({ top: y, behavior: RM ? 'auto' : 'smooth' });
    }
  };

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href');
    if (id.length < 2) return;
    var el = id === '#top' ? document.body : $(id);
    if (!el) return;
    e.preventDefault();
    if (menuOpen) closeMenu(true);
    H.scrollTo(id === '#top' ? 0 : el);
    if (id !== '#top') {
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
      setTimeout(function () { el.focus({ preventScroll: true }); }, 60);
    }
    history.replaceState(null, '', id);
  });

  /* ---------- nav: hide on scroll down, tone by section ------------------- */
  var nav = $('#nav');
  var menu = $('#menu');
  var burger = $('#burger');
  var menuOpen = false;
  var fjord = $('#fjord');
  var dawn = $('.cabins__dawn');
  var toneEls = $$('[data-tone]').filter(function (n) { return n !== nav && n !== fjord; });

  function tone() {
    var band = 44, t = 'day';
    if (fjord) {
      var fr = fjord.getBoundingClientRect();
      if (fr.top <= band && fr.bottom > band) t = fjord.dataset.tone || 'day';
    }
    if (dawn) {
      var dr = dawn.getBoundingClientRect();
      if (dr.top <= band && dr.bottom > band) t = (band - dr.top) / dr.height < 0.5 ? 'night' : 'day';
    }
    toneEls.forEach(function (n) {
      var r = n.getBoundingClientRect();
      if (r.top <= band && r.bottom > band) t = n.dataset.tone;
    });
    if (nav.dataset.tone !== t) nav.dataset.tone = t;
  }

  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: function (self) {
      var y = self.scroll();
      nav.classList.toggle('is-solid', y > 40);
      if (!menuOpen) {
        if (y > 320 && self.direction === 1) nav.classList.add('is-hidden');
        else if (self.direction === -1 || y < 320) nav.classList.remove('is-hidden');
      }
      tone();
    }
  });
  window.addEventListener('resize', tone);
  H.updateTone = tone;

  /* scroll-spy */
  [['#fjord', 'fjord'], ['#cabins', 'cabins'], ['#seasons', 'seasons'], ['#do', 'do'], ['#faq', 'faq']].forEach(function (pair) {
    var el = $(pair[0]); if (!el) return;
    var link = $('.nav__links a[href="' + pair[0] + '"]');
    if (!link) return;
    ScrollTrigger.create({ trigger: el, start: 'top 55%', end: 'bottom 45%', onToggle: function (s) { link.classList.toggle('is-current', s.isActive); } });
  });

  /* ---------- mobile menu -------------------------------------------------- */
  menu.removeAttribute('hidden');
  function focusables() { return [burger].concat($$('a,button', menu)); }
  function openMenu() {
    menuOpen = true;
    menu.classList.add('is-open');
    nav.classList.add('is-menu');
    nav.classList.remove('is-hidden');
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Close menu');
    if (H.lenis) H.lenis.stop();
    document.body.style.overflow = 'hidden';
    setTimeout(function () { var f = $('a', menu); if (f) f.focus(); }, 350);
  }
  function closeMenu(skipFocus) {
    menuOpen = false;
    menu.classList.remove('is-open');
    nav.classList.remove('is-menu');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');
    if (H.lenis) H.lenis.start();
    document.body.style.overflow = '';
    if (!skipFocus) burger.focus();
  }
  burger.addEventListener('click', function () { menuOpen ? closeMenu() : openMenu(); });
  document.addEventListener('keydown', function (e) {
    if (!menuOpen) return;
    if (e.key === 'Escape') { closeMenu(); return; }
    if (e.key === 'Tab') {
      var f = focusables(), first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  window.matchMedia('(min-width:1041px)').addEventListener('change', function (m) { if (m.matches && menuOpen) closeMenu(true); });

  /* ---------- helpers ------------------------------------------------------ */
  function splitWords(el) {
    var walk = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'); w.className = 'w';
            var i = document.createElement('span'); i.textContent = part; w.appendChild(i);
            frag.appendChild(w);
          });
          node.replaceChild(frag, c);
        } else if (c.nodeType === 1) walk(c);
      });
    };
    walk(el);
    return $$('.w > span', el);
  }
  H.splitWords = splitWords;

  H.countTo = function (el, to, dur, opts) {
    opts = opts || {};
    var from = opts.from != null ? opts.from : (parseFloat(el.dataset.cur) || 0);
    var group = opts.group || el.dataset.format === 'group';
    var write = function (v) {
      var n = Math.round(v);
      el.textContent = (n < 0 ? '−' : '') + (group ? Math.abs(n).toLocaleString('en-GB') : Math.abs(n));
      el.dataset.cur = v;
    };
    if (RM || dur === 0) { write(to); return; }
    var o = { v: from };
    gsap.to(o, { v: to, duration: dur || 1.4, ease: 'power3.out', onUpdate: function () { write(o.v); }, overwrite: true });
  };

  /* ---------- hero --------------------------------------------------------- */
  (function hero() {
    var title = $('.hero__title');
    var words = $$('.hero .w > span');
    var clock = $('#heroClock');
    var tick = function () {
      try { clock.textContent = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Oslo' }).format(new Date()); }
      catch (e) { clock.textContent = '--:--'; }
    };
    tick(); setInterval(tick, 30000);

    var run = function () {
      if (RM) { title.classList.add('is-ready'); return; }
      gsap.set(words, { yPercent: 112 });
      title.classList.add('is-ready');
      var tl = gsap.timeline({ defaults: { ease: 'power4.out' }, delay: 0.15 });
      tl.from('.hero__eyebrow', { opacity: 0, y: 14, duration: 1.2 }, 0)
        .to(words, { yPercent: 0, duration: 1.7, stagger: 0.11 }, 0.15)
        .from('.hero__lede', { opacity: 0, y: 20, duration: 1.3 }, 0.9)
        .from('.hero__cta > *', { opacity: 0, y: 20, duration: 1.3, stagger: 0.12 }, 1.05)
        .from('.hero__meta > *', { opacity: 0, y: 12, duration: 1.2, stagger: 0.1 }, 1.4)
        .from('.nav__bar', { opacity: 0, yPercent: -40, duration: 1.3 }, 0.5);
    };
    var go = function () { var done = false; var f = function () { if (!done) { done = true; run(); } }; if (document.fonts && document.fonts.ready) { document.fonts.ready.then(f); setTimeout(f, 900); } else f(); };
    go();

    if (!RM) {
      gsap.to('#heroMedia', { yPercent: 9, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to('.hero__title', { yPercent: -10, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    }
  })();

  /* ---------- statement (words light up with scroll) ---------------------- */
  (function statement() {
    var el = $('#statement');
    if (!el) return;
    var text = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    var spans = text.map(function (w, i) {
      var s = document.createElement('span');
      s.className = 'sw'; s.textContent = w + (i < text.length - 1 ? ' ' : '');
      el.appendChild(s); return s;
    });
    if (RM) return;
    gsap.set(spans, { opacity: 0.54 });
    gsap.to(spans, { opacity: 1, ease: 'none', stagger: 0.12, scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 48%', scrub: 0.6 } });
  })();

  /* ---------- counters ----------------------------------------------------- */
  $$('[data-count]').forEach(function (el) {
    var to = parseFloat(el.dataset.count);
    if (RM) { H.countTo(el, to, 0); return; }
    el.textContent = '0'; el.dataset.cur = 0;
    ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: function () { H.countTo(el, to, 2.2, { from: 0 }); } });
  });

  /* ---------- headline + block reveals ------------------------------------ */
  $$('[data-split]').forEach(function (h) {
    var spans = splitWords(h);
    h.classList.add('is-split');
    if (RM) return;
    gsap.set(spans, { yPercent: 112 });
    ScrollTrigger.create({ trigger: h, start: 'top 88%', once: true, onEnter: function () {
      gsap.to(spans, { yPercent: 0, duration: 1.5, stagger: 0.09, ease: 'power4.out' });
    } });
  });

  $$('[data-reveal]').forEach(function (el) {
    if (RM) return;
    ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: function () {
      gsap.to(el, { opacity: 1, y: 0, duration: 1.4, ease: 'power3.out' });
    } });
  });

  /* ---------- cursor ring + magnetic buttons (desktop) -------------------- */
  if (FINE && !RM) {
    var ring = $('#cursor');
    var qx = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3.out' });
    var qy = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3.out' });
    window.addEventListener('pointermove', function (e) {
      ring.classList.add('is-on'); qx(e.clientX); qy(e.clientY);
    }, { passive: true });
    document.addEventListener('pointerleave', function () { ring.classList.remove('is-on'); });
    document.addEventListener('pointerover', function (e) {
      var t = e.target.closest && e.target.closest('a,button,label.cr,label.check,.day,[data-cursor]');
      ring.classList.toggle('is-link', !!t);
    });

    $$('.magnetic').forEach(function (b) {
      var setXY = function (e) {
        var r = b.getBoundingClientRect();
        b.style.setProperty('--x', ((e.clientX - r.left) / r.width * 100) + '%');
        b.style.setProperty('--y', ((e.clientY - r.top) / r.height * 100) + '%');
      };
      b.addEventListener('pointerenter', setXY);
      b.addEventListener('pointermove', function (e) {
        setXY(e);
        var r = b.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        gsap.to(b, { x: dx * 0.22, y: dy * 0.3, duration: 0.7, ease: 'power3.out', overwrite: 'auto' });
      });
      b.addEventListener('pointerleave', function (e) { setXY(e); gsap.to(b, { x: 0, y: 0, duration: 0.9, ease: 'power3.out', overwrite: 'auto' }); });
    });
  }
  // fill origin on every button, including non-magnetic ones
  $$('.btn:not(.magnetic)').forEach(function (b) {
    b.addEventListener('pointerenter', function (e) {
      var r = b.getBoundingClientRect();
      b.style.setProperty('--x', ((e.clientX - r.left) / r.width * 100) + '%');
      b.style.setProperty('--y', ((e.clientY - r.top) / r.height * 100) + '%');
    });
  });

  /* ---------- things to do: expanding panels ------------------------------ */
  (function panels() {
    var wrap = $('#panels'); if (!wrap) return;
    var items = $$('.dpanel', wrap);
    var mq = window.matchMedia('(max-width:819px)');
    var set = function (i) {
      items.forEach(function (p, n) {
        var on = n === i;
        p.classList.toggle('is-active', on);
        $('.dpanel__btn', p).setAttribute('aria-expanded', on ? 'true' : 'false');
      });
    };
    var mobile = function () { if (mq.matches) items.forEach(function (p) { $('.dpanel__btn', p).setAttribute('aria-expanded', 'true'); }); else set(Math.max(0, items.findIndex(function (p) { return p.classList.contains('is-active'); }))); };
    items.forEach(function (p, i) {
      var b = $('.dpanel__btn', p);
      b.addEventListener('click', function () { if (!mq.matches) set(i); });
      b.addEventListener('focus', function () { if (!mq.matches) set(i); });
      p.addEventListener('pointerenter', function (e) { if (!mq.matches && e.pointerType === 'mouse') set(i); });
    });
    wrap.addEventListener('keydown', function (e) {
      if (mq.matches) return;
      var cur = items.findIndex(function (p) { return p.classList.contains('is-active'); });
      var n = cur;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (cur + 1) % items.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (cur - 1 + items.length) % items.length;
      else return;
      e.preventDefault(); set(n); $('.dpanel__btn', items[n]).focus();
    });
    mq.addEventListener('change', mobile); mobile();
    if (!RM) {
      gsap.from(items, { opacity: 0, y: 50, duration: 1.5, stagger: 0.12, ease: 'power3.out', scrollTrigger: { trigger: wrap, start: 'top 85%', once: true } });
    }
  })();

  /* ---------- guest notes: quote marks drift ------------------------------ */
  if (!RM) {
    $$('.quote__mark').forEach(function (m) {
      gsap.fromTo(m, { yPercent: 20 }, { yPercent: -14, ease: 'none', scrollTrigger: { trigger: m, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  }

  window.__hyttaReady = true;
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
