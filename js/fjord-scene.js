/* ==========================================================================
   HYTTA — the fjord section: scroll → time of day → WebGL + chapters + HUD
   The shader is created lazily, once the section is about a screen away.
   ========================================================================== */
(function () {
  'use strict';
  var H = window.HYTTA;
  if (!H || !H.gsap || !window.FjordGL) return;
  var $ = H.$, $$ = H.$$, gsap = H.gsap, RM = H.RM;

  var section = $('#fjord');
  var stage = $('#fjordStage');
  var canvas = $('#fjordCanvas');
  var fallback = $('#fjordFallback');
  var chapters = $$('.chapter', section);
  var clockEl = $('#hudClock');
  var kpEl = $('#hudKp');
  var barEl = $('#hudBar');
  var hint = $('#hudHint');
  if (!section || !canvas) return;

  var gl = null;       // created on demand
  var raw = 0;         // scroll-derived target, 0..1
  var visible = false; // stage on screen

  // minutes past midnight at each palette stop
  var MINUTES = [400, 550, 780, 1090, 1220, 1430];
  var STOPS = FjordGL.STOPS;
  function clockAt(p) {
    var i = 0;
    while (i < STOPS.length - 2 && p > STOPS[i + 1]) i++;
    var t = Math.min(1, Math.max(0, (p - STOPS[i]) / (STOPS[i + 1] - STOPS[i])));
    var m = MINUTES[i] + (MINUTES[i + 1] - MINUTES[i]) * t;
    var hh = Math.floor(m / 60) % 24, mm = Math.floor(m % 60);
    return (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm;
  }

  var CH = [0, 0.28, 0.54, 0.78];
  var lastCh = -1, lastClock = '', lastTone = '', lastKp = null;

  function paintHud(p, r) {
    var c = 0;
    for (var i = 0; i < CH.length; i++) if (r >= CH[i]) c = i;
    if (c !== lastCh) {
      lastCh = c;
      chapters.forEach(function (el, n) { el.classList.toggle('is-active', n === c); });
    }
    var clk = clockAt(p);
    if (clk !== lastClock) { lastClock = clk; clockEl.textContent = clk; }
    var tn = p > 0.66 ? 'night' : 'day';
    if (tn !== lastTone) { lastTone = tn; section.dataset.tone = tn; if (H.updateTone) H.updateTone(); }
    var kp = p > 0.88;
    if (kp !== lastKp) { lastKp = kp; kpEl.classList.toggle('is-on', kp); }
    barEl.style.transform = 'scaleX(' + p.toFixed(4) + ')';
  }

  function ensureGL() {
    if (gl) return gl;
    gl = new FjordGL(canvas, { seed: 0, snow: 0, scale: 0.85, dprCap: 1.5 });
    if (!gl.ok) { section.classList.add('no-gl'); return gl; }
    if (RM) gl.still(0.9);
    else { gl.still(raw); gl.setTarget(raw); if (visible) gl.start(); }
    return gl;
  }

  // build the context when the stage is within a screen of the viewport
  var near = new IntersectionObserver(function (es) {
    if (!es[0].isIntersecting) return;
    near.disconnect();
    var go = function () { ensureGL(); };
    if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 600 }); else setTimeout(go, 50);
  }, { rootMargin: '60% 0px 60% 0px' });
  near.observe(stage);

  if (RM) {
    // still night scene, chapters laid out in a row (CSS), no pinning
    section.dataset.tone = 'night';
    window.addEventListener('resize', function () { if (gl && gl.ok) gl.still(0.9); });
    return;
  }

  ScrollTrigger.create({
    trigger: section, start: 'top top', end: 'bottom bottom',
    onUpdate: function (self) {
      var s = self.progress;
      raw = Math.min(1, Math.max(0, (s - 0.035) / 0.9));
      if (gl && gl.ok) gl.setTarget(raw);
      hint.classList.toggle('is-gone', s > 0.03);
    }
  });
  paintHud(0, 0);

  // only spend GPU time while the stage is on screen
  var io = new IntersectionObserver(function (entries) {
    visible = entries[0].isIntersecting;
    if (gl && gl.ok) { if (visible) gl.start(); else gl.stop(); }
  }, { threshold: 0 });
  io.observe(stage);

  gsap.ticker.add(function () {
    if (!visible) return;
    var ready = gl && gl.ok;
    var p = ready ? gl.p : raw;
    paintHud(p, raw);
    if (gl && !gl.ok) {
      // no WebGL: dim and tint a still photograph as the day passes
      var night = Math.min(1, Math.max(0, (p - 0.6) / 0.3));
      fallback.style.filter = 'brightness(' + (1.05 - night * 0.6).toFixed(2) + ') saturate(' + (1 - night * 0.2).toFixed(2) + ')';
    }
  });

  document.addEventListener('visibilitychange', function () {
    if (!gl || !gl.ok) return;
    if (document.hidden) gl.stop(); else if (visible) gl.start();
  });
})();
