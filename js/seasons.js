/* ==========================================================================
   HYTTA — season picker: imagery wipes, copy, numbers, and a generative aurora
   ========================================================================== */
(function () {
  'use strict';
  var H = window.HYTTA;
  if (!H || !H.gsap) return;
  var $ = H.$, $$ = H.$$, gsap = H.gsap, RM = H.RM;

  var section = $('#seasons');
  if (!section) return;
  var tabs = $$('#seasonTabs .toggle__btn');
  var pill = $('#togglePill');
  var body = $('#spanel');
  var imgs = $$('.simg', section);
  var canvas = $('#auroraCanvas');
  var frame = $('#sFrame');

  var ICON = function (n) { return '<svg class="i" aria-hidden="true"><use href="#i-' + n + '"/></svg>'; };
  var KEYS = ['summer', 'autumn', 'winter', 'aurora'];

  var DATA = {
    summer: {
      range: 'May to August', tag: 'May — Aug',
      title: 'Light that doesn’t leave.',
      text: 'In June the sun drops behind the wall at midnight and is back within the hour. Kayaks wait at every jetty, the waterfalls run at full volume, and dinner on the deck can last until eleven without a lamp.',
      cap: 'Fig. 03 — Midnight sun, June. The jetty below Tåke.',
      stats: [['Daylight', 19, ' h'], ['Water', 14, ' °C'], ['Air', 17, ' °C']],
      list: [['kayak', 'Midnight paddles along the shore'], ['droplet', 'Swimming from the sauna steps'], ['trekking', 'Ridge walks to the high lakes'], ['campfire', 'Long dinners on the deck']]
    },
    autumn: {
      range: 'September to October', tag: 'Sep — Oct',
      title: 'Copper, then quiet.',
      text: 'The birches turn in the last week of September and most visitors go home. Mist stays late in the mornings, the stove goes on by four, and the first aurora nights arrive in October.',
      cap: 'Fig. 03 — Birch turning, late September. Fonn among the trees.',
      stats: [['Daylight', 10, ' h'], ['Water', 9, ' °C'], ['Air', 8, ' °C']],
      list: [['tree', 'Mushroom and berry walks'], ['flame', 'Stove-lit afternoons'], ['kayak', 'Dawn paddles through the mist'], ['moon-stars', 'The first aurora nights, from October']]
    },
    winter: {
      range: 'November to March', tag: 'Nov — Mar',
      title: 'Snow to the water’s edge.',
      text: 'Snow reaches the shore and the fjord stays open, black and steaming. Days are short and blue. You spend them between the sauna, the stove and the window, and go out when the light is good.',
      cap: 'Fig. 03 — Blue hour, January. Fonn with the stove lit.',
      stats: [['Daylight', 5, ' h'], ['Water', 4, ' °C'], ['Air', -2, ' °C']],
      list: [['temperature-snow', 'Sauna, then the fjord'], ['snowflake', 'Snowshoe walks from the door'], ['campfire', 'Reading beside the stove'], ['ferry', 'The ferry at blue hour']]
    },
    aurora: {
      range: 'October to March, after dark', tag: 'Oct — Mar, after dark',
      title: 'Not a month. A condition.',
      text: 'You need clear sky, real dark and a little luck. We have the dark. Without Wi-Fi there is nothing to check but the sky, so every cabin has a forecast card, a thermos and a pile of blankets by the door.',
      cap: 'Fig. 03 — Drawn in code, not photographed: the same fjord after dark.',
      stats: [['Dark hours', 18, ' h'], ['Activity needed', 'Kp 3+', ''], ['Best hours', '22–01', '']],
      list: [['moon-stars', 'Watching from the sauna steps'], ['bed', 'Waking under the loft skylight in Bjørk'], ['wifi-off', 'No screens, no glare, only sky'], ['flame', 'A thermos and wool blankets by the door']]
    }
  };

  var current = 'summer';
  var z = 2;
  var aurora = null;
  var auroraVisible = false;

  function placePill() {
    var b = tabs[KEYS.indexOf(current)];
    if (!b) return;
    pill.style.setProperty('--px', b.offsetLeft + 'px');
    pill.style.setProperty('--pw', b.offsetWidth + 'px');
  }

  function ensureAurora() {
    if (aurora || !window.FjordGL) return aurora;
    aurora = new FjordGL(canvas, { fixed: 0.985, seed: 6.3, snow: 1, scale: 0.8, dprCap: 1.25, mouse: false });
    if (!aurora.ok) aurora = { ok: false };
    return aurora;
  }

  function setAuroraActive(on) {
    var a = on ? ensureAurora() : aurora;
    if (!a || !a.ok) return;
    if (on) { a.resize(); a.still(); if (!RM && auroraVisible) a.start(); }
    else { a.stop(); }
  }

  var io = new IntersectionObserver(function (es) {
    auroraVisible = es[0].isIntersecting;
    if (current === 'aurora' && aurora && aurora.ok) { if (auroraVisible && !RM) aurora.start(); else aurora.stop(); }
  }, { threshold: 0.05 });
  io.observe(frame);

  function writeStats(d, animate) {
    d.stats.forEach(function (s, i) {
      var k = i + 1;
      $('#sStat' + k + 'L').textContent = s[0];
      var v = $('#sStat' + k), u = $('#sStat' + k + 'U');
      u.textContent = s[2];
      if (typeof s[1] === 'number') H.countTo(v, s[1], animate ? 1.5 : 0, { from: animate ? 0 : undefined });
      else { v.textContent = s[1]; v.dataset.cur = ''; }
    });
  }
  function writeList(d) {
    $('#sList').innerHTML = d.list.map(function (r) { return '<li>' + ICON(r[0]) + '<span>' + r[1] + '</span></li>'; }).join('');
  }

  function swapCopy(d, animate) {
    var els = [$('#sRange'), $('#sTitle'), $('#sText'), $('.season__stats'), $('.season__on-title'), $('#sList'), $('#sCap')];
    var write = function () {
      $('#sRange').textContent = d.range;
      $('#sTitle').textContent = d.title;
      $('#sText').textContent = d.text;
      $('#sTag').textContent = d.tag;
      $('#sCap').textContent = d.cap;
      writeList(d);
      writeStats(d, animate);
    };
    if (!animate || RM) { write(); return; }
    gsap.to(els, { opacity: 0, y: -12, duration: 0.35, stagger: 0.02, ease: 'power2.in', overwrite: true, onComplete: function () {
      write();
      gsap.fromTo(els, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 1.1, stagger: 0.07, ease: 'power3.out', overwrite: true });
    } });
  }

  function swapImage(key, animate) {
    var isAurora = key === 'aurora';
    var target = isAurora ? null : imgs.filter(function (i) { return i.dataset.season === key; })[0];
    if (isAurora && (!ensureAurora() || !aurora.ok)) {
      // no WebGL: fall back to the winter photograph, graded towards night
      target = imgs.filter(function (i) { return i.dataset.season === 'winter'; })[0];
      target.style.filter = 'brightness(.55) saturate(1.5) hue-rotate(-12deg)';
    } else if (target) target.style.filter = '';

    var dur = animate && !RM ? 1.5 : 0;
    if (target) {
      z++;
      gsap.set(target, { zIndex: z });
      gsap.fromTo(target, { clipPath: 'inset(0% 0% 0% 100%)', scale: 1.16 }, { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: dur, ease: 'power3.inOut', overwrite: true });
      gsap.to(canvas, { opacity: 0, duration: dur ? 0.9 : 0, delay: dur ? 0.8 : 0, onComplete: function () { canvas.style.visibility = 'hidden'; if (aurora && aurora.ok) aurora.stop(); } });
    } else {
      z++;
      canvas.style.visibility = 'visible';
      gsap.set(canvas, { zIndex: z, clipPath: 'inset(0% 0% 0% 100%)' });
      gsap.to(canvas, { opacity: 1, clipPath: 'inset(0% 0% 0% 0%)', duration: dur, ease: 'power3.inOut', overwrite: true });
      setAuroraActive(true);
    }
    // keep the tag above whatever is on top
    gsap.set('.frame__tag', { zIndex: z + 2 });
    gsap.set('.frame__grain', { zIndex: z + 1 });
  }

  function select(key, opts) {
    opts = opts || {};
    var animate = opts.animate !== false && key !== current;
    tabs.forEach(function (t) {
      var on = t.dataset.season === key;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
    });
    body.setAttribute('aria-labelledby', 'stab-' + key);
    section.dataset.season = key;
    current = key;
    placePill();
    swapCopy(DATA[key], animate);
    swapImage(key, animate);
    if (opts.focus) $('#stab-' + key).focus();
  }

  tabs.forEach(function (t) {
    t.addEventListener('click', function () { select(t.dataset.season); });
    t.addEventListener('keydown', function (e) {
      var i = KEYS.indexOf(t.dataset.season), n = i;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % 4;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i + 3) % 4;
      else if (e.key === 'Home') n = 0;
      else if (e.key === 'End') n = 3;
      else return;
      e.preventDefault(); select(KEYS[n], { focus: true });
    });
  });

  // initial state
  imgs.forEach(function (i) { gsap.set(i, { clipPath: i.dataset.season === 'summer' ? 'inset(0% 0% 0% 0%)' : 'inset(0% 0% 0% 100%)', zIndex: i.dataset.season === 'summer' ? 1 : 0 }); });
  canvas.style.visibility = 'hidden';
  select('summer', { animate: false });
  window.addEventListener('resize', function () { placePill(); if (current === 'aurora' && aurora && aurora.ok && RM) aurora.still(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(placePill);

  // the frame arrives with a slow reveal
  if (!RM) {
    gsap.from(frame, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.8, ease: 'power3.inOut', scrollTrigger: { trigger: frame, start: 'top 82%', once: true } });
    gsap.from('.toggle', { opacity: 0, y: 20, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: '.toggle', start: 'top 92%', once: true } });
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden && aurora && aurora.ok) aurora.stop();
    else if (current === 'aurora' && auroraVisible && aurora && aurora.ok && !RM) aurora.start();
  });
})();
