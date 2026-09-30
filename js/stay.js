/* ==========================================================================
   HYTTA — availability picker (mock), FAQ accordion, newsletter
   ========================================================================== */
(function () {
  'use strict';
  var H = window.HYTTA;
  if (!H) return;
  var $ = H.$, $$ = H.$$, RM = H.RM, gsap = H.gsap;

  /* ---------------------------------------------------------------- FAQ */
  (function faq() {
    var items = $$('.acc__item');
    var refresh = function () { if (window.ScrollTrigger) setTimeout(function () { ScrollTrigger.refresh(); }, 900); };
    items.forEach(function (item) {
      var btn = $('.acc__btn', item);
      btn.addEventListener('click', function () {
        var open = item.classList.contains('is-open');
        items.forEach(function (i) { i.classList.remove('is-open'); $('.acc__btn', i).setAttribute('aria-expanded', 'false'); });
        if (!open) { item.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); }
        refresh();
      });
      btn.addEventListener('keydown', function (e) {
        var i = items.indexOf(item), n = -1;
        if (e.key === 'ArrowDown') n = (i + 1) % items.length;
        else if (e.key === 'ArrowUp') n = (i - 1 + items.length) % items.length;
        else if (e.key === 'Home') n = 0;
        else if (e.key === 'End') n = items.length - 1;
        if (n < 0) return;
        e.preventDefault(); $('.acc__btn', items[n]).focus();
      });
    });
    items[0].classList.add('is-open'); $('.acc__btn', items[0]).setAttribute('aria-expanded', 'true');
    if (!RM && gsap) {
      gsap.from(items, { opacity: 0, y: 30, duration: 1.2, stagger: 0.08, ease: 'power3.out', scrollTrigger: { trigger: '#acc', start: 'top 88%', once: true } });
    }
  })();

  /* --------------------------------------------------------- newsletter */
  (function news() {
    var form = $('#news'), input = $('#nEmail'), msg = $('#nMsg');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = input.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
        input.setAttribute('aria-invalid', 'true');
        msg.className = 'news__msg is-err';
        msg.textContent = 'That email address doesn’t look complete. Please check it and try again.';
        input.focus();
        return;
      }
      input.removeAttribute('aria-invalid');
      msg.className = 'news__msg';
      msg.textContent = 'Thank you. The next letter arrives with the first snow. (Demonstration only: nothing was stored.)';
      input.value = '';
    });
    input.addEventListener('input', function () { if (input.getAttribute('aria-invalid')) { input.removeAttribute('aria-invalid'); msg.textContent = ''; msg.className = 'news__msg'; } });
  })();

  /* ------------------------------------------------------------- picker */
  var picker = $('#picker');
  if (!picker) return;

  var CABINS = { take: { name: 'Tåke', base: 3200, cap: 2 }, fonn: { name: 'Fonn', base: 4600, cap: 4 }, bjork: { name: 'Bjørk', base: 6900, cap: 6 } };
  var KEYS = ['take', 'fonn', 'bjork'];
  // [label, multiplier] by month, January first
  var SEASON = [['Aurora weeks', 1.15], ['Aurora weeks', 1.15], ['Standard', 1.05], ['Quiet', 1], ['Quiet', 1], ['Midsummer', 1.25], ['Midsummer', 1.25], ['Midsummer', 1.2], ['Standard', 1.05], ['Standard', 1.1], ['Quiet', 1], ['Aurora weeks', 1.15]];
  var CLEAN = 650, FERRY = 450, BREAKFAST = 290, MIN_NIGHTS = 2, MAX_MONTHS = 17;
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var DOW = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  var noon = function (d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12); };
  var today = noon(new Date());
  var addDays = function (d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return noon(x); };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var key = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  var fromKey = function (k) { var p = k.split('-'); return new Date(+p[0], +p[1] - 1, +p[2], 12); };
  var dayNum = function (d) { return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000); };
  var diff = function (a, b) { return dayNum(a) - dayNum(b); };
  var fmt = H.fmt;
  var short = function (d) { return DAYS[d.getDay()].slice(0, 3) + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()].slice(0, 3); };

  function hash(n) { n = (n ^ 61) ^ (n >>> 16); n = n + (n << 3); n = n ^ (n >>> 4); n = Math.imul(n, 0x27d4eb2d); n = n ^ (n >>> 15); return n >>> 0; }
  function busy(cabin, d) {
    var n = dayNum(d), c = KEYS.indexOf(cabin) + 1;
    var soon = diff(d, today) < 24 ? 18 : 0;
    var thr = 24 + (SEASON[d.getMonth()][1] - 1) * 90 + soon;
    return hash(Math.floor(n / 3) * 7 + c * 131) % 100 < thr;
  }
  function freeNights(cabin, a, b) { for (var d = a; diff(b, d) > 0; d = addDays(d, 1)) if (busy(cabin, d)) return false; return true; }
  var rate = function (cabin, d) { var s = SEASON[d.getMonth()]; return { label: s[0], price: Math.round(CABINS[cabin].base * s[1] / 50) * 50 }; };

  var state = { cabin: 'fonn', guests: 2, start: null, end: null, hover: null, focus: null, view: new Date(today.getFullYear(), today.getMonth(), 1, 12), ferry: false, breakfast: false };
  var monthsEl = $('#calMonths'), statusEl = $('#calStatus'), prevBtn = $('#calPrev'), nextBtn = $('#calNext');
  var mqTwo = window.matchMedia('(min-width:720px)');
  var lastTotal = 0;

  function selectable(d) {
    if (diff(d, today) < 1) return false;
    if (diff(d, addDays(today, MAX_MONTHS * 31)) > 0) return false;
    if (state.start && !state.end) {
      var n = diff(d, state.start);
      if (n <= 0) return !busy(state.cabin, d);
      if (n < MIN_NIGHTS) return false;
      return freeNights(state.cabin, state.start, d);
    }
    return !busy(state.cabin, d);
  }

  function labelFor(d, sel) {
    var base = DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear() + ', ';
    if (diff(d, today) < 1) return base + 'not available';
    if (state.start && key(d) === key(state.start)) return base + 'selected arrival';
    if (state.end && key(d) === key(state.end)) return base + 'selected departure';
    if (state.start && state.end && diff(d, state.start) > 0 && diff(d, state.end) < 0) return base + 'part of your stay';
    if (!sel) return base + (busy(state.cabin, d) ? 'taken' : 'not available as a departure');
    return base + (state.start && !state.end && diff(d, state.start) > 0 ? 'available as a departure' : 'available');
  }

  function firstSelectableIn(view) {
    for (var i = 0; i < 62; i++) { var d = addDays(view, i); if (selectable(d)) return d; }
    return view;
  }

  function renderCal(keepFocus) {
    monthsEl.innerHTML = '';
    var focusKey = state.focus || (state.start ? key(state.start) : key(firstSelectableIn(state.view)));
    // if the focus day is not in the visible months, use the first selectable day of the view
    var vis = mqTwo.matches ? 2 : 1;
    var f = fromKey(focusKey);
    var idx = (f.getFullYear() - state.view.getFullYear()) * 12 + f.getMonth() - state.view.getMonth();
    if (idx < 0 || idx >= vis) focusKey = key(firstSelectableIn(state.view));
    state.focus = focusKey;

    for (var m = 0; m < 2; m++) {
      var first = new Date(state.view.getFullYear(), state.view.getMonth() + m, 1, 12);
      var box = document.createElement('div'); box.className = 'cal__m' + (m ? ' cal__m--2' : '');
      if (m && !mqTwo.matches) box.style.display = 'none';
      var h = document.createElement('p'); h.className = 'cal__title'; h.id = 'calh' + m; h.textContent = MONTHS[first.getMonth()] + ' ' + first.getFullYear();
      box.appendChild(h);
      var grid = document.createElement('div'); grid.className = 'cal__grid'; grid.setAttribute('role', 'group'); grid.setAttribute('aria-labelledby', 'calh' + m);
      DOW.forEach(function (n) { var s = document.createElement('span'); s.className = 'cal__dow'; s.textContent = n; s.setAttribute('aria-hidden', 'true'); grid.appendChild(s); });
      var off = (first.getDay() + 6) % 7;
      for (var i = 0; i < off; i++) { var e = document.createElement('span'); e.className = 'day is-empty'; e.setAttribute('aria-hidden', 'true'); grid.appendChild(e); }
      var count = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
      for (var n = 1; n <= count; n++) {
        var d = new Date(first.getFullYear(), first.getMonth(), n, 12);
        var k = key(d), sel = selectable(d);
        var b = document.createElement('button'); b.type = 'button'; b.className = 'day'; b.dataset.date = k;
        b.innerHTML = '<span>' + n + '</span>';
        var isPast = diff(d, today) < 1;
        if (isPast) b.classList.add('is-past');
        else if (!sel) { if (busy(state.cabin, d)) b.classList.add('is-busy'); }
        if (diff(d, today) === 0) b.classList.add('is-today');
        if (!sel) b.setAttribute('aria-disabled', 'true');
        if (state.start && k === key(state.start)) { b.classList.add('is-start'); if (state.end) b.classList.add('is-rs'); b.setAttribute('aria-pressed', 'true'); }
        if (state.end && k === key(state.end)) { b.classList.add('is-end', 'is-re'); b.setAttribute('aria-pressed', 'true'); }
        if (state.start && state.end && diff(d, state.start) > 0 && diff(d, state.end) < 0) b.classList.add('is-range');
        b.tabIndex = k === focusKey ? 0 : -1;
        b.setAttribute('aria-label', labelFor(d, sel));
        grid.appendChild(b);
      }
      box.appendChild(grid); monthsEl.appendChild(box);
    }
    var minView = new Date(today.getFullYear(), today.getMonth(), 1, 12);
    prevBtn.disabled = diff(state.view, minView) <= 0;
    nextBtn.disabled = (state.view.getFullYear() - minView.getFullYear()) * 12 + state.view.getMonth() - minView.getMonth() >= MAX_MONTHS - 1;
    if (keepFocus) { var t = $('.day[data-date="' + focusKey + '"]', monthsEl); if (t) t.focus(); }
  }

  function paintPreview() {
    $$('.day', monthsEl).forEach(function (b) { b.classList.remove('is-prev'); });
    if (!state.start || state.end || !state.hover) return;
    $$('.day', monthsEl).forEach(function (b) {
      if (b.classList.contains('is-empty')) return;
      var d = fromKey(b.dataset.date);
      if (diff(d, state.start) > 0 && diff(d, state.hover) <= 0) b.classList.add('is-prev');
    });
  }

  function statusText() {
    if (!state.start) return 'Choose an arrival date';
    if (!state.end) return 'Arriving ' + short(state.start) + '. Now choose a departure, at least two nights on.';
    var n = diff(state.end, state.start);
    return short(state.start) + ' to ' + short(state.end) + ' · ' + n + ' night' + (n > 1 ? 's' : '');
  }

  function renderSummary() {
    var lines = $('#sumLines'), tot = $('#sumTotal'), unit = $('#sumUnit'), hold = $('#holdBtn');
    if (!state.start || !state.end) {
      lines.innerHTML = '<p class="summary__empty">Pick your arrival and departure dates to see the price.</p>';
      tot.textContent = '—'; tot.dataset.cur = 0; lastTotal = 0; unit.hidden = true; hold.disabled = true; hideHold();
      return;
    }
    var nights = diff(state.end, state.start);
    var groups = {}, order = [], sub = 0;
    for (var d = state.start; diff(state.end, d) > 0; d = addDays(d, 1)) {
      var r = rate(state.cabin, d), k = r.label + '|' + r.price;
      if (!groups[k]) { groups[k] = { label: r.label, price: r.price, n: 0 }; order.push(k); }
      groups[k].n++; sub += r.price;
    }
    var html = order.map(function (k) {
      var g = groups[k];
      return '<div class="sl"><span>' + CABINS[state.cabin].name + ', ' + g.n + ' night' + (g.n > 1 ? 's' : '') + '<small>' + g.n + ' × ' + fmt(g.price) + ' NOK · ' + g.label + ' rate</small></span><b>' + fmt(g.n * g.price) + '</b></div>';
    }).join('');
    var total = sub + CLEAN;
    html += '<div class="sl"><span>Cleaning<small>One-off, whatever the length</small></span><b>' + fmt(CLEAN) + '</b></div>';
    if (state.ferry) { total += FERRY * 2; html += '<div class="sl"><span>Quay transfer<small>2 × ' + FERRY + ' NOK, whole party</small></span><b>' + fmt(FERRY * 2) + '</b></div>'; }
    if (state.breakfast) { var bf = BREAKFAST * state.guests * nights; total += bf; html += '<div class="sl"><span>Breakfast baskets<small>' + state.guests + ' guest' + (state.guests > 1 ? 's' : '') + ' × ' + nights + ' morning' + (nights > 1 ? 's' : '') + ' × ' + BREAKFAST + ' NOK</small></span><b>' + fmt(bf) + '</b></div>'; }
    lines.innerHTML = html;
    unit.hidden = false; hold.disabled = false;
    H.countTo(tot, total, 0.9, { from: lastTotal, group: true });
    lastTotal = total;
  }

  function hideHold() { $('#hold').hidden = true; $('#holdDone').hidden = true; }

  function render(keepFocus) {
    statusEl.textContent = statusText();
    renderCal(keepFocus);
    renderSummary();
  }

  function pick(d) {
    hideHold();
    if (!state.start || state.end) { state.start = d; state.end = null; }
    else if (diff(d, state.start) <= 0) { state.start = d; }
    else { state.end = d; }
    state.focus = key(d); state.hover = null;
    render(true);
  }

  /* calendar events */
  monthsEl.addEventListener('click', function (e) {
    var b = e.target.closest('.day'); if (!b || b.classList.contains('is-empty')) return;
    if (b.getAttribute('aria-disabled') === 'true') return;
    pick(fromKey(b.dataset.date));
  });
  monthsEl.addEventListener('pointerover', function (e) {
    var b = e.target.closest('.day'); if (!b || b.classList.contains('is-empty')) return;
    state.hover = b.getAttribute('aria-disabled') === 'true' ? null : fromKey(b.dataset.date); paintPreview();
  });
  monthsEl.addEventListener('pointerleave', function () { state.hover = null; paintPreview(); });
  monthsEl.addEventListener('keydown', function (e) {
    var b = e.target.closest('.day'); if (!b) return;
    var d = fromKey(b.dataset.date), n = null;
    var map = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (map[e.key] != null) n = addDays(d, map[e.key]);
    else if (e.key === 'Home') n = addDays(d, -((d.getDay() + 6) % 7));
    else if (e.key === 'End') n = addDays(d, 6 - ((d.getDay() + 6) % 7));
    else if (e.key === 'PageDown') n = new Date(d.getFullYear(), d.getMonth() + 1, d.getDate(), 12);
    else if (e.key === 'PageUp') n = new Date(d.getFullYear(), d.getMonth() - 1, d.getDate(), 12);
    else return;
    e.preventDefault();
    if (diff(n, today) < 1) n = addDays(today, 1);
    var maxD = addDays(today, MAX_MONTHS * 31 - 1); if (diff(n, maxD) > 0) n = maxD;
    state.focus = key(n);
    var vis = mqTwo.matches ? 2 : 1;
    var idx = (n.getFullYear() - state.view.getFullYear()) * 12 + n.getMonth() - state.view.getMonth();
    if (idx < 0 || idx >= vis) state.view = new Date(n.getFullYear(), n.getMonth() - (idx >= vis && vis === 2 ? 1 : 0), 1, 12);
    renderCal(true);
  });
  prevBtn.addEventListener('click', function () { state.view = new Date(state.view.getFullYear(), state.view.getMonth() - 1, 1, 12); state.focus = null; renderCal(false); });
  nextBtn.addEventListener('click', function () { state.view = new Date(state.view.getFullYear(), state.view.getMonth() + 1, 1, 12); state.focus = null; renderCal(false); });
  mqTwo.addEventListener('change', function () { renderCal(false); });

  /* cabin, guests, extras */
  var radios = $$('input[name="cabin"]', picker);
  var gVal = $('#gVal'), gMinus = $('#gMinus'), gPlus = $('#gPlus'), gMax = $('#gMax');
  function syncGuests() {
    var cap = CABINS[state.cabin].cap;
    state.guests = Math.min(Math.max(1, state.guests), cap);
    gVal.textContent = state.guests;
    gMinus.disabled = state.guests <= 1; gPlus.disabled = state.guests >= cap;
    gMax.textContent = 'up to ' + cap + ' in ' + CABINS[state.cabin].name;
  }
  function setCabin(c, fromRadio) {
    if (!CABINS[c]) return;
    var was = state.cabin;
    state.cabin = c;
    if (!fromRadio) radios.forEach(function (r) { r.checked = r.value === c; });
    syncGuests();
    var note = '';
    if (state.start && state.end && !freeNights(c, state.start, state.end)) {
      state.start = state.end = null; note = 'Those dates are taken in ' + CABINS[c].name + '. Please choose new ones.';
      hideHold();
    }
    state.focus = null;
    render(false);
    if (note) statusEl.textContent = note;
    else if (was !== c) statusEl.textContent = statusText();
  }
  radios.forEach(function (r) { r.addEventListener('change', function () { if (r.checked) setCabin(r.value, true); }); });
  document.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('[data-pick]'); if (a) setCabin(a.dataset.pick); });
  gMinus.addEventListener('click', function () { state.guests--; syncGuests(); renderSummary(); });
  gPlus.addEventListener('click', function () { state.guests++; syncGuests(); renderSummary(); });
  $$('input[name="extra"]', picker).forEach(function (c) {
    c.addEventListener('change', function () { state[c.value] = c.checked; renderSummary(); });
  });

  /* request flow (demonstration) */
  var holdBtn = $('#holdBtn'), hold = $('#hold'), done = $('#holdDone'), err = $('#hErr');
  holdBtn.addEventListener('click', function () {
    hold.hidden = false; done.hidden = true;
    if (!RM && gsap) gsap.from(hold, { opacity: 0, y: 18, duration: 0.9, ease: 'power3.out' });
    $('#hName').focus({ preventScroll: true });
    hold.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' });
  });
  picker.addEventListener('submit', function (e) {
    e.preventDefault();
    if (hold.hidden) return;
    var name = $('#hName'), mail = $('#hEmail');
    name.removeAttribute('aria-invalid'); mail.removeAttribute('aria-invalid'); err.textContent = '';
    if (!name.value.trim()) { name.setAttribute('aria-invalid', 'true'); err.textContent = 'Please tell us your name.'; name.focus(); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail.value.trim())) { mail.setAttribute('aria-invalid', 'true'); err.textContent = 'That email address doesn’t look complete.'; mail.focus(); return; }
    var nights = diff(state.end, state.start);
    hold.hidden = true;
    done.textContent = 'Thank you, ' + name.value.trim().split(' ')[0] + '. ' + CABINS[state.cabin].name + ', ' + short(state.start) + ' to ' + short(state.end) + ' (' + nights + ' nights). This is a demonstration, so nothing was sent. A live version would reply to ' + mail.value.trim() + ' within a day.';
    done.hidden = false;
    done.setAttribute('tabindex', '-1'); done.focus({ preventScroll: true });
  });

  /* default selection: a three-night stay about six weeks out, if it is open */
  (function seed() {
    var s = addDays(today, 38);
    for (var i = 0; i < 120; i++) {
      var a = addDays(s, i), b = addDays(a, 3);
      if (freeNights(state.cabin, a, b)) { state.start = a; state.end = b; break; }
    }
    if (state.start) state.view = new Date(state.start.getFullYear(), state.start.getMonth(), 1, 12);
    state.focus = state.start ? key(state.start) : null;
  })();
  syncGuests();
  render(false);

  if (!RM && gsap) {
    gsap.from('.cr', { opacity: 0, y: 24, duration: 1, stagger: 0.09, ease: 'power3.out', scrollTrigger: { trigger: '.cabin-radios', start: 'top 90%', once: true } });
    gsap.from('.cal__m', { opacity: 0, y: 26, duration: 1.2, stagger: 0.12, ease: 'power3.out', scrollTrigger: { trigger: '#cal', start: 'top 90%', once: true } });
  }
})();
