/* ============================================================
   Lumber Calculator — app.js
   All logic client-side. Formulas per FORMULAS.md.
   Defaults per OPEN_QUESTIONS: nominal dims, MBF default,
   calculate-and-go (no history), copy-to-clipboard, imperial,
   multi-line Board Feet (Q7), weight/BF Load toggle (Q8).
   ============================================================ */
(function () {
  'use strict';

  /* ---------- helpers ---------- */
  var BIG_BF = 1000000; // > 1,000,000 BF triggers "double-check" warning

  function $(id) { return document.getElementById(id); }

  // Parse an input to a finite, non-negative number; blank/invalid -> null
  function num(el) {
    if (!el) return null;
    var v = el.value;
    if (v === null || v === undefined || String(v).trim() === '') return null;
    var n = parseFloat(v);
    if (!isFinite(n)) return null;
    if (n < 0) return null;
    return n;
  }

  // Format with thousands separators and fixed decimals
  function fmt(n, decimals) {
    if (n === null || n === undefined || !isFinite(n)) return '—';
    return n.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }
  function money(n) {
    if (n === null || !isFinite(n)) return '—';
    return '$' + fmt(n, 2);
  }

  function showWarn(el, msg) {
    if (!el) return;
    if (msg) { el.textContent = msg; el.hidden = false; }
    else { el.textContent = ''; el.hidden = true; }
  }

  /* ---------- toast + clipboard ---------- */
  var toastEl = $('toast');
  var toastTimer = null;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.hidden = true; }, 1800);
  }
  function copyText(text) {
    if (!text || text.indexOf('—') !== -1 && text.trim() === '—') { toast('Nothing to copy'); return; }
    function fallback() {
      try {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus(); ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        toast('Copied');
      } catch (e) { toast('Copy not supported'); }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast('Copied'); }, fallback);
    } else { fallback(); }
  }

  /* ============================================================
     TAB NAVIGATION
     ============================================================ */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var targetId = tab.getAttribute('data-target');
      tabs.forEach(function (t) {
        var on = t === tab;
        t.classList.toggle('active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      document.querySelectorAll('.screen').forEach(function (s) {
        s.hidden = (s.id !== targetId);
      });
      if ($('appMain')) $('appMain').scrollTop = 0;
      window.scrollTo(0, 0);
    });
  });

  /* ============================================================
     1. BOARD FEET — multi-line (Q7 = Yes)
     BF/piece = (T * W * L) / 12 ; line BF = BF/piece * qty
     ============================================================ */
  var bfLines = $('bfLines');
  var bfLineSeq = 0;

  function bfPerPiece(t, w, l) { return (t * w * l) / 12; }

  function makeBFLine() {
    bfLineSeq++;
    var idx = bfLineSeq;
    var wrap = document.createElement('div');
    wrap.className = 'line-item';
    wrap.setAttribute('data-line', String(idx));
    wrap.innerHTML =
      '<div class="line-head">' +
        '<span class="line-name">Item</span>' +
        '<button type="button" class="line-remove" aria-label="Remove item">Remove</button>' +
      '</div>' +
      '<div class="line-dims">' +
        '<div class="ld"><label for="bfT' + idx + '">Thick (in)</label>' +
          '<div class="input-wrap"><input id="bfT' + idx + '" type="number" inputmode="decimal" min="0" step="any" placeholder="2"></div></div>' +
        '<div class="ld"><label for="bfW' + idx + '">Width (in)</label>' +
          '<div class="input-wrap"><input id="bfW' + idx + '" type="number" inputmode="decimal" min="0" step="any" placeholder="4"></div></div>' +
        '<div class="ld"><label for="bfL' + idx + '">Length (ft)</label>' +
          '<div class="input-wrap"><input id="bfL' + idx + '" type="number" inputmode="decimal" min="0" step="any" placeholder="8"></div></div>' +
        '<div class="ld"><label for="bfQ' + idx + '">Qty (pcs)</label>' +
          '<div class="input-wrap"><input id="bfQ' + idx + '" type="number" inputmode="numeric" min="0" step="1" placeholder="10"></div></div>' +
      '</div>' +
      '<div class="line-bf" data-linebf>—</div>';

    bfLines.appendChild(wrap);

    wrap.querySelectorAll('input').forEach(function (inp) {
      inp.addEventListener('input', calcBF);
    });
    wrap.querySelector('.line-remove').addEventListener('click', function () {
      wrap.parentNode.removeChild(wrap);
      relabelBFLines();
      calcBF();
    });
    relabelBFLines();
    return wrap;
  }

  function relabelBFLines() {
    var items = bfLines.querySelectorAll('.line-item');
    items.forEach(function (it, i) {
      it.querySelector('.line-name').textContent = 'Item ' + (i + 1);
      var rm = it.querySelector('.line-remove');
      rm.disabled = (items.length <= 1); // keep at least one line
    });
  }

  function calcBF() {
    var items = bfLines.querySelectorAll('.line-item');
    var total = 0;
    var anyComplete = false;
    var anyPartial = false;
    var parts = []; // for copy text

    items.forEach(function (it) {
      var idx = it.getAttribute('data-line');
      var t = num($('bfT' + idx));
      var w = num($('bfW' + idx));
      var l = num($('bfL' + idx));
      var q = num($('bfQ' + idx));
      var lineEl = it.querySelector('[data-linebf]');

      var hasAny = (t !== null) || (w !== null) || (l !== null) || (q !== null);
      var complete = (t > 0) && (w > 0) && (l > 0) && (q > 0);

      if (complete) {
        var per = bfPerPiece(t, w, l);
        var lineBF = per * q;
        total += lineBF;
        anyComplete = true;
        lineEl.textContent = fmt(lineBF, 2) + ' BF  (' + fmt(per, 2) + ' BF/pc × ' + q + ')';
        parts.push(t + '×' + w + ' × ' + l + 'ft | ' + q + ' pcs = ' + fmt(lineBF, 2) + ' BF');
      } else {
        lineEl.textContent = '—';
        if (hasAny) anyPartial = true;
      }
    });

    var totalEl = $('bfTotal');
    var subEl = $('bfSub');

    if (anyComplete) {
      totalEl.textContent = fmt(total, 2);
      subEl.textContent = (parts.length > 1)
        ? parts.length + ' line items'
        : 'Single item';
      showWarn($('bfWarn'), total > BIG_BF ? 'That is a very large total — double-check your inputs.' : '');
    } else {
      totalEl.textContent = '—';
      subEl.textContent = anyPartial ? 'Fill thickness, width, length and quantity' : 'Enter dimensions to calculate';
      showWarn($('bfWarn'), '');
    }
    // stash copy string
    calcBF._copy = anyComplete
      ? (parts.join('\n') + '\nTOTAL = ' + fmt(total, 2) + ' BF')
      : '';
  }

  $('bfAddLine').addEventListener('click', function () { makeBFLine(); calcBF(); });
  $('bfClear').addEventListener('click', function () {
    bfLines.innerHTML = '';
    makeBFLine();
    calcBF();
  });
  $('bfCopy').addEventListener('click', function () {
    copyText(calcBF._copy || '—');
  });
  makeBFLine(); // start with one line
  calcBF();

  /* ============================================================
     2. PRICING  (MBF default, BF toggle)
     Cost(MBF) = (BF/1000) * rate ; Cost(BF) = BF * rate
     Cost/piece = Cost / qty
     ============================================================ */
  var priceUnit = 'MBF';
  function setPriceUnit(u) {
    priceUnit = u;
    $('priceUnitMBF').classList.toggle('active', u === 'MBF');
    $('priceUnitBF').classList.toggle('active', u === 'BF');
    $('priceUnitMBF').setAttribute('aria-pressed', u === 'MBF');
    $('priceUnitBF').setAttribute('aria-pressed', u === 'BF');
    $('priceRateLabel').textContent = (u === 'MBF') ? 'Price per MBF' : 'Price per BF';
    $('priceRateUnit').textContent = (u === 'MBF') ? '/MBF' : '/BF';
    $('priceRate').placeholder = (u === 'MBF') ? 'e.g. 850' : 'e.g. 0.85';
    calcPrice();
  }
  $('priceUnitMBF').addEventListener('click', function () { setPriceUnit('MBF'); });
  $('priceUnitBF').addEventListener('click', function () { setPriceUnit('BF'); });
  setPriceUnit('MBF'); // initialize active state + aria-pressed on load

  function calcPrice() {
    var bf = num($('priceBF'));
    var rate = num($('priceRate'));
    var qty = num($('priceQty'));
    var mainEl = $('priceTotal'), subEl = $('priceSub');

    if (bf === null || rate === null || bf === 0) {
      mainEl.textContent = '—';
      subEl.textContent = 'Enter board feet and price';
      showWarn($('priceWarn'), '');
      calcPrice._copy = '';
      return;
    }
    var cost = (priceUnit === 'MBF') ? (bf / 1000) * rate : bf * rate;
    mainEl.textContent = money(cost);

    var sub = fmt(bf, 2) + ' BF @ ' + (priceUnit === 'MBF' ? ('$' + fmt(rate, 2) + '/MBF') : ('$' + fmt(rate, 2) + '/BF'));
    if (qty && qty > 0) sub += '\n' + money(cost / qty) + ' per piece';
    subEl.textContent = sub;

    showWarn($('priceWarn'), bf > BIG_BF ? 'That is a very large board-foot value — double-check your inputs.' : '');
    calcPrice._copy = sub.replace('\n', '  •  ') + '  =  ' + money(cost);
  }
  ['priceBF', 'priceRate', 'priceQty'].forEach(function (id) {
    $(id).addEventListener('input', calcPrice);
  });
  $('priceClear').addEventListener('click', function () {
    ['priceBF', 'priceRate', 'priceQty'].forEach(function (id) { $(id).value = ''; });
    calcPrice();
  });
  $('priceCopy').addEventListener('click', function () { copyText(calcPrice._copy || '—'); });

  /* ============================================================
     3. PIECE COUNT
     BF/pc = (T*W*L)/12 ; pieces = CEIL(target / BF/pc)
     actual = pieces * BF/pc ; overage = actual - target
     ============================================================ */
  function calcPcs() {
    var target = num($('pcsTarget'));
    var t = num($('pcsT')), w = num($('pcsW')), l = num($('pcsL'));
    var mainEl = $('pcsPieces'), subEl = $('pcsSub');

    if (target === null || target === 0 || !(t > 0) || !(w > 0) || !(l > 0)) {
      mainEl.textContent = '—';
      subEl.textContent = 'Enter target and dimensions';
      showWarn($('pcsWarn'), '');
      calcPcs._copy = '';
      return;
    }
    var per = bfPerPiece(t, w, l);
    var pieces = Math.ceil(target / per);
    var actual = pieces * per;
    var overage = actual - target;

    mainEl.textContent = fmt(pieces, 0);
    subEl.textContent =
      'Actual: ' + fmt(actual, 2) + ' BF  (' + fmt(per, 2) + ' BF/pc)\n' +
      'Overage: ' + fmt(overage, 2) + ' BF';
    showWarn($('pcsWarn'), actual > BIG_BF ? 'That is a very large total — double-check your inputs.' : '');
    calcPcs._copy = target + ' BF target → ' + fmt(pieces, 0) + ' pcs of ' + t + '×' + w + ' × ' + l +
      'ft = ' + fmt(actual, 2) + ' BF (overage ' + fmt(overage, 2) + ' BF)';
  }
  ['pcsTarget', 'pcsT', 'pcsW', 'pcsL'].forEach(function (id) {
    $(id).addEventListener('input', calcPcs);
  });
  $('pcsClear').addEventListener('click', function () {
    ['pcsTarget', 'pcsT', 'pcsW', 'pcsL'].forEach(function (id) { $(id).value = ''; });
    calcPcs();
  });
  $('pcsCopy').addEventListener('click', function () { copyText(calcPcs._copy || '—'); });

  /* ============================================================
     4. LINEAR ↔ BOARD FEET
     LF→BF: BF = (T*W*LF)/12
     BF→LF: LF = (BF*12)/(T*W)
     ============================================================ */
  var lfDir = 'LF2BF';
  function setLfDir(d) {
    lfDir = d;
    $('lfDirA').classList.toggle('active', d === 'LF2BF');
    $('lfDirB').classList.toggle('active', d === 'BF2LF');
    if (d === 'LF2BF') {
      $('lfValueLabel').textContent = 'Linear Feet';
      $('lfValueUnit').textContent = 'LF';
      $('lfValue').placeholder = 'e.g. 100';
      $('lfOutUnit').textContent = 'BF';
    } else {
      $('lfValueLabel').textContent = 'Board Feet';
      $('lfValueUnit').textContent = 'BF';
      $('lfValue').placeholder = 'e.g. 100';
      $('lfOutUnit').textContent = 'LF';
    }
    calcLf();
  }
  $('lfDirA').addEventListener('click', function () { setLfDir('LF2BF'); });
  $('lfDirB').addEventListener('click', function () { setLfDir('BF2LF'); });

  function calcLf() {
    var val = num($('lfValue'));
    var t = num($('lfT')), w = num($('lfW'));
    var mainEl = $('lfOut'), subEl = $('lfSub');

    if (val === null || val === 0 || !(t > 0) || !(w > 0)) {
      mainEl.textContent = '—';
      subEl.textContent = 'Enter a value and dimensions';
      showWarn($('lfWarn'), '');
      calcLf._copy = '';
      return;
    }
    var out, copy;
    if (lfDir === 'LF2BF') {
      out = (t * w * val) / 12;
      copy = fmt(val, 2) + ' LF of ' + t + '×' + w + ' = ' + fmt(out, 2) + ' BF';
    } else {
      out = (val * 12) / (t * w);
      copy = fmt(val, 2) + ' BF of ' + t + '×' + w + ' = ' + fmt(out, 2) + ' LF';
    }
    mainEl.textContent = fmt(out, 2);
    subEl.textContent = (t + '×' + w + ' dimension');
    showWarn($('lfWarn'), out > BIG_BF ? 'That is a very large value — double-check your inputs.' : '');
    calcLf._copy = copy;
  }
  ['lfValue', 'lfT', 'lfW'].forEach(function (id) {
    $(id).addEventListener('input', calcLf);
  });
  $('lfClear').addEventListener('click', function () {
    ['lfValue', 'lfT', 'lfW'].forEach(function (id) { $(id).value = ''; });
    calcLf();
  });
  $('lfCopy').addEventListener('click', function () { copyText(calcLf._copy || '—'); });

  /* ============================================================
     5. WASTE / OVERAGE
     waste = base * (pct/100) ; adjusted = base + waste
     ============================================================ */
  document.querySelectorAll('[data-waste]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      $('wastePct').value = btn.getAttribute('data-waste');
      document.querySelectorAll('[data-waste]').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      calcWaste();
    });
  });

  function calcWaste() {
    var base = num($('wasteBase'));
    var pct = num($('wastePct'));
    var mainEl = $('wasteTotal'), subEl = $('wasteSub');

    if (base === null || base === 0 || pct === null) {
      mainEl.textContent = '—';
      subEl.textContent = 'Enter a base quantity and waste %';
      showWarn($('wasteWarn'), '');
      calcWaste._copy = '';
      return;
    }
    var waste = base * (pct / 100);
    var adjusted = base + waste;
    mainEl.textContent = fmt(adjusted, 2);
    subEl.textContent =
      'Base: ' + fmt(base, 2) + '  +  Waste: ' + fmt(waste, 2) + ' (' + fmt(pct, 1) + '%)';
    showWarn($('wasteWarn'), adjusted > BIG_BF ? 'That is a very large total — double-check your inputs.' : '');
    calcWaste._copy = fmt(base, 2) + ' + ' + fmt(pct, 1) + '% waste (' + fmt(waste, 2) + ') = ' + fmt(adjusted, 2);
  }
  ['wasteBase', 'wastePct'].forEach(function (id) {
    $(id).addEventListener('input', function () {
      document.querySelectorAll('[data-waste]').forEach(function (b) { b.classList.remove('active'); });
      calcWaste();
    });
  });
  $('wasteClear').addEventListener('click', function () {
    ['wasteBase', 'wastePct'].forEach(function (id) { $(id).value = ''; });
    document.querySelectorAll('[data-waste]').forEach(function (b) { b.classList.remove('active'); });
    calcWaste();
  });
  $('wasteCopy').addEventListener('click', function () { copyText(calcWaste._copy || '—'); });

  /* ============================================================
     6. LOAD ESTIMATOR — weight/BF toggle (Q8)
     Weight: capacity in lb, load weight = BF * lb/BF
             trucks = CEIL(weight / cap); last = weight-((trucks-1)*cap)
     BF:     trucks = CEIL(BF / cap); last = BF-((trucks-1)*cap)
     ============================================================ */
  var loadMode = 'weight';
  function setLoadMode(m) {
    loadMode = m;
    $('loadModeWeight').classList.toggle('active', m === 'weight');
    $('loadModeBF').classList.toggle('active', m === 'bf');
    $('loadWeightFields').hidden = (m !== 'weight');
    $('loadBFFields').hidden = (m !== 'bf');
    calcLoad();
  }
  $('loadModeWeight').addEventListener('click', function () { setLoadMode('weight'); });
  $('loadModeBF').addEventListener('click', function () { setLoadMode('bf'); });

  // truck presets (capacity is freely editable per Q8)
  document.querySelectorAll('[data-truck]').forEach(function (btn) {
    btn.addEventListener('click', function () { $('loadCapW').value = btn.getAttribute('data-truck'); calcLoad(); });
  });
  document.querySelectorAll('[data-truckbf]').forEach(function (btn) {
    btn.addEventListener('click', function () { $('loadCapBF').value = btn.getAttribute('data-truckbf'); calcLoad(); });
  });

  function calcLoad() {
    var mainEl = $('loadTrucks'), subEl = $('loadSub');
    var trucks, last, cap, load, unit, copy;

    if (loadMode === 'weight') {
      cap = num($('loadCapW'));
      var bf = num($('loadBFw'));
      var lpbf = num($('loadLbsPerBF'));
      if (cap === null || cap === 0 || bf === null || bf === 0 || lpbf === null || lpbf === 0) {
        mainEl.textContent = '—';
        subEl.textContent = 'Enter capacity, board feet, and weight per BF';
        showWarn($('loadWarn'), '');
        calcLoad._copy = '';
        return;
      }
      load = bf * lpbf;            // total weight in lb
      unit = 'lb';
      trucks = Math.ceil(load / cap);
      last = load - ((trucks - 1) * cap);
      subEl.textContent =
        'Total weight: ' + fmt(load, 2) + ' lb  (' + fmt(bf, 2) + ' BF × ' + fmt(lpbf, 2) + ' lb/BF)\n' +
        'Last truck: ' + fmt(last, 2) + ' lb  •  Capacity: ' + fmt(cap, 0) + ' lb';
      copy = fmt(bf, 2) + ' BF ≈ ' + fmt(load, 2) + ' lb → ' + fmt(trucks, 0) +
        ' truck(s) @ ' + fmt(cap, 0) + ' lb (last ' + fmt(last, 2) + ' lb)';
    } else {
      cap = num($('loadCapBF'));
      var bfb = num($('loadBFb'));
      if (cap === null || cap === 0 || bfb === null || bfb === 0) {
        mainEl.textContent = '—';
        subEl.textContent = 'Enter capacity and total board feet';
        showWarn($('loadWarn'), '');
        calcLoad._copy = '';
        return;
      }
      load = bfb;
      unit = 'BF';
      trucks = Math.ceil(load / cap);
      last = load - ((trucks - 1) * cap);
      subEl.textContent =
        'Total: ' + fmt(load, 2) + ' BF\n' +
        'Last truck: ' + fmt(last, 2) + ' BF  •  Capacity: ' + fmt(cap, 0) + ' BF';
      copy = fmt(load, 2) + ' BF → ' + fmt(trucks, 0) + ' truck(s) @ ' + fmt(cap, 0) +
        ' BF (last ' + fmt(last, 2) + ' BF)';
    }

    mainEl.textContent = fmt(trucks, 0);
    showWarn($('loadWarn'), (load > BIG_BF) ? 'That is a very large value — double-check your inputs.' : '');
    calcLoad._copy = copy;
  }
  ['loadCapW', 'loadBFw', 'loadLbsPerBF', 'loadCapBF', 'loadBFb'].forEach(function (id) {
    $(id).addEventListener('input', calcLoad);
  });
  $('loadClear').addEventListener('click', function () {
    ['loadCapW', 'loadBFw', 'loadLbsPerBF', 'loadCapBF', 'loadBFb'].forEach(function (id) { $(id).value = ''; });
    calcLoad();
  });
  $('loadCopy').addEventListener('click', function () { copyText(calcLoad._copy || '—'); });
  calcLoad();

  /* ============================================================
     SERVICE WORKER (offline PWA)
     ============================================================ */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('service-worker.js').catch(function () { /* offline reg optional */ });
    });
  }
})();
