/* ==========================================================================
   HYTTA — cabin browser: tabs, drawn elevations, hotspots, swipe
   ========================================================================== */
(function () {
  'use strict';
  var H = window.HYTTA;
  if (!H || !H.gsap) return;
  var $ = H.$, $$ = H.$$, gsap = H.gsap, RM = H.RM;

  var stage = $('#stage');
  if (!stage) return;
  var tabs = $$('#cabinTabs .tab');
  var panels = $$('.cpanel');
  var svg = $('#stageSvg');
  var hsWrap = $('#hotspots');
  var arch = $('#archImg');
  var cap = $('#stageCap');

  var KEYS = ['take', 'fonn', 'bjork'];
  var DATA = {
    take: {
      name: 'Tåke', cap: 'Fig. 02 — Tåke, front elevation, 1:50',
      label: 'Elevation drawing of Tåke: a small timber cabin with a sedge roof, a glass wall, and a sauna hut beside it.',
      arch: { origin: '72% 38%', scale: 1.5 },
      spots: [
        { x: 39.3, y: 66.7, t: 'Window', d: '2.4 × 3.1 m of fixed glass at the foot of the bed.' },
        { x: 76, y: 70.4, t: 'Sauna hut', d: 'Wood-fired, for two. Twelve steps to the water.' }
      ]
    },
    fonn: {
      name: 'Fonn', cap: 'Fig. 02 — Fonn, front elevation, 1:50',
      label: 'Elevation drawing of Fonn: a mid-sized timber cabin with a wide glass wall and a sauna annex with a chimney.',
      arch: { origin: '14% 72%', scale: 1.75 },
      spots: [
        { x: 31.3, y: 67.1, t: 'Living room', d: 'A window 3.6 m wide, with the stove bench in front of it.' },
        { x: 58.1, y: 69.8, t: 'Sauna annex', d: 'Four seats, and a ramp that runs straight into the fjord.' }
      ]
    },
    bjork: {
      name: 'Bjørk', cap: 'Fig. 02 — Bjørk, front elevation and pier, 1:50',
      label: 'Elevation drawing of Bjørk: a long timber cabin with three glass bays and a private pier ending in a sauna.',
      arch: { origin: '90% 90%', scale: 2 },
      spots: [
        { x: 28, y: 66.2, t: 'Long table', d: 'Three glass bays over a seven-metre table cut from one pine.' },
        { x: 86.3, y: 69.2, t: 'Pier sauna', d: 'A private 14 m pier, with the sauna at the far end.' }
      ]
    }
  };

  var current = 'fonn';

  function buildSpots(key) {
    hsWrap.innerHTML = '';
    DATA[key].spots.forEach(function (s, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'hs' + (s.x > 68 ? ' hs--r' : (s.x < 30 ? ' hs--l' : ''));
      b.style.left = s.x + '%'; b.style.top = s.y + '%';
      var id = 'hs-' + key + '-' + i;
      b.setAttribute('aria-describedby', id);
      b.setAttribute('aria-label', s.t);
      b.innerHTML = '<i></i><span class="hs__tip" id="' + id + '" role="tooltip"><b>' + s.t + '</b>' + s.d + '</span>';
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = b.classList.contains('is-open');
        $$('.hs', hsWrap).forEach(function (o) { o.classList.remove('is-open'); });
        if (!open) b.classList.add('is-open');
        toggleLamp(key, !open ? i : -1);
      });
      b.addEventListener('pointerenter', function () { toggleLamp(key, i); });
      b.addEventListener('pointerleave', function () { toggleLamp(key, -1); });
      b.addEventListener('focus', function () { toggleLamp(key, i); });
      b.addEventListener('blur', function () { toggleLamp(key, -1); });
      hsWrap.appendChild(b);
      if (!RM) gsap.from(b, { scale: 0, opacity: 0, duration: 0.9, delay: 0.9 + i * 0.15, ease: 'power3.out' });
    });
  }
  document.addEventListener('click', function () { $$('.hs.is-open', hsWrap).forEach(function (o) { o.classList.remove('is-open'); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') $$('.hs.is-open', hsWrap).forEach(function (o) { o.classList.remove('is-open'); }); });

  // warm the lit window when its hotspot is active
  function toggleLamp(key, i) {
    var g = svg.querySelector('#g' + key.charAt(0).toUpperCase() + key.slice(1).replace('ø', 'o'));
    if (!g) return;
    var lits = $$('.lit', g);
    lits.forEach(function (l, n) {
      // lit[0] is the main glass, lit[1] the sauna window
      var on = i === n;
      l.style.opacity = on ? (n === 0 ? 0.55 : 0.85) : '';
    });
  }

  var groups = { take: $('#gTake'), fonn: $('#gFonn'), bjork: $('#gBjork') };
  var fills = { take: $('#fTake'), fonn: $('#fFonn'), bjork: $('#fBjork') };
  var refls = { take: $('#rTake'), fonn: $('#rFonn'), bjork: $('#rBjork') };

  function showStage(key, animate) {
    KEYS.forEach(function (k) {
      var g = groups[k], f = fills[k], r = refls[k];
      var lines = $$('.cab__lines path', g);
      gsap.killTweensOf([f, r].concat(lines));
      if (k === key) {
        g.classList.add('is-on');
        if (animate && !RM) {
          gsap.fromTo(f, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 1.5, delay: 0.3, ease: 'power3.out' });
          gsap.fromTo(lines, { strokeDashoffset: 1, opacity: 1 }, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut', stagger: 0.1 });
          gsap.to(lines, { opacity: 0, duration: 0.9, delay: 1.7 });
          gsap.fromTo(r, { opacity: 0 }, { opacity: 1, duration: 1.6, delay: 0.5 });
        } else {
          gsap.set(f, { opacity: 1, y: 0 });
          gsap.set(lines, { opacity: 0 });
          gsap.set(r, { opacity: 1 });
        }
      } else if (g.classList.contains('is-on')) {
        if (animate && !RM) {
          gsap.to([f, r], { opacity: 0, duration: 0.5, ease: 'power2.out', onComplete: function () { g.classList.remove('is-on'); } });
        } else { g.classList.remove('is-on'); gsap.set([f, r], { opacity: 0 }); }
        gsap.set(lines, { opacity: 0 });
      } else {
        gsap.set(r, { opacity: 0 });
      }
    });
  }

  function showArch(key, animate) {
    var a = DATA[key].arch;
    var apply = function () { arch.style.transformOrigin = a.origin; };
    if (animate && !RM) {
      gsap.to(arch, { opacity: 0, scale: a.scale * 1.12, duration: 0.35, ease: 'power2.in', onComplete: function () {
        apply();
        gsap.fromTo(arch, { opacity: 0, scale: a.scale * 1.25 }, { opacity: 1, scale: a.scale, duration: 1.6, ease: 'power3.out' });
      } });
    } else { apply(); gsap.set(arch, { scale: a.scale, opacity: 1 }); }
  }

  function select(key, opts) {
    opts = opts || {};
    var animate = opts.animate !== false && key !== current;
    var first = opts.first;
    tabs.forEach(function (t) {
      var on = t.dataset.cabin === key;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
    });
    panels.forEach(function (p) {
      var on = p.dataset.cabin === key;
      p.hidden = !on;
      if (on && (animate || first) && !RM) {
        var kids = $$(':scope > *', p);
        gsap.fromTo(kids, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1, stagger: 0.07, ease: 'power3.out', delay: first ? 0 : 0.15, clearProps: 'transform,opacity' });
        $$('[data-num]', p).forEach(function (n) { H.countTo(n, parseFloat(n.dataset.num), 1.6, { from: 0, group: n.dataset.format === 'group' }); });
      }
    });
    cap.textContent = DATA[key].cap;
    svg.setAttribute('aria-label', DATA[key].label);
    current = key;
    showStage(key, animate || first);
    showArch(key, animate);
    buildSpots(key);
    if (opts.focus) $('#tab-' + key).focus();
  }

  tabs.forEach(function (t) {
    t.addEventListener('click', function () { select(t.dataset.cabin); });
    t.addEventListener('keydown', function (e) {
      var i = KEYS.indexOf(t.dataset.cabin), n = i;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = (i + 1) % 3;
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = (i + 2) % 3;
      else if (e.key === 'Home') n = 0;
      else if (e.key === 'End') n = 2;
      else return;
      e.preventDefault(); select(KEYS[n], { focus: true });
    });
  });

  // swipe / drag on the drawing
  var sx = null, sy = null;
  stage.addEventListener('pointerdown', function (e) { if (e.target.closest('.hs')) return; sx = e.clientX; sy = e.clientY; });
  window.addEventListener('pointerup', function (e) {
    if (sx == null) return;
    var dx = e.clientX - sx, dy = e.clientY - sy; sx = sy = null;
    if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
    var i = KEYS.indexOf(current);
    select(KEYS[(i + (dx < 0 ? 1 : 2)) % 3]);
  });
  // arrow keys anywhere inside the section, unless typing or on a tab
  $('#cabins').addEventListener('keydown', function (e) {
    if (e.target.closest('#cabinTabs') || /input|textarea|select/i.test(e.target.tagName)) return;
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    var i = KEYS.indexOf(current);
    select(KEYS[(i + (e.key === 'ArrowRight' ? 1 : 2)) % 3]);
  });

  select('fonn', { animate: false, first: false });
  // draw the first cabin in as the section arrives
  if (!RM) {
    var lines = $$('.cab__lines path', groups.fonn);
    gsap.set(fills.fonn, { opacity: 0 }); gsap.set(refls.fonn, { opacity: 0 });
    ScrollTrigger.create({ trigger: stage, start: 'top 75%', once: true, onEnter: function () {
      gsap.fromTo(fills.fonn, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 1.6, delay: 0.4, ease: 'power3.out' });
      gsap.fromTo(lines, { strokeDashoffset: 1, opacity: 1 }, { strokeDashoffset: 0, duration: 1.8, ease: 'power2.inOut', stagger: 0.1 });
      gsap.to(lines, { opacity: 0, duration: 0.9, delay: 1.9 });
      gsap.to(refls.fonn, { opacity: 1, duration: 1.8, delay: 0.7 });
    } });
  }

  H.selectCabin = select;
})();
