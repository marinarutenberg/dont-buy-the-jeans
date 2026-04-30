(() => {
  const RATE = 0.07;
  const HORIZONS = [1, 5, 10, 30];

  const STRATS = {
    hysa:   { rate: 0.04, caption: 'High-yield savings. Cash, but earning. The floor — and still better than the jeans.' },
    sp500:  { rate: 0.07, caption: 'Boring. Reliable. Beats inflation. Probably what you should pick.' },
    nasdaq: { rate: 0.10, caption: 'Tech-heavy. Bumpier ride. Historically rewards the patient.' },
    growth: { rate: 0.15, caption: 'Concentrated growth bets. Higher highs. Lower lows. Bring antacids.' }
  };
  let currentRate = STRATS.sp500.rate;
  let currentStrat = 'sp500';

  const STRAT_LABELS = {
    hysa:   'HYSA · 4%',
    sp500:  'S&P 500 · 7%',
    nasdaq: 'Nasdaq 100 · 10%',
    growth: 'Growth · 15%'
  };

  const input = document.getElementById('amount');
  const rows = [...document.querySelectorAll('.row[data-years]')];
  const resultsEl = document.getElementById('results');

  // date
  const now = new Date();
  const fmtDate = now.toLocaleDateString('en-US', {
    month: 'short', day: '2-digit', year: 'numeric'
  }).toUpperCase();
  document.getElementById('today').textContent = fmtDate;

  // formatters
  const usdSplit = (n) => {
    if (!isFinite(n)) return { whole: '$—', cents: '' };
    const rounded = Math.round(n * 100) / 100;
    const abs = Math.abs(rounded);
    const whole = Math.trunc(abs);
    const cents = Math.round((abs - whole) * 100).toString().padStart(2, '0');
    return {
      whole: (rounded < 0 ? '-' : '') + '$' + whole.toLocaleString('en-US'),
      cents: '.' + cents
    };
  };

  function parseAmount(raw) {
    if (!raw) return NaN;
    const cleaned = String(raw).replace(/[^0-9.]/g, '');
    if (!cleaned || cleaned === '.') return NaN;
    const n = parseFloat(cleaned);
    return isFinite(n) ? n : NaN;
  }

  function futureValue(p, y) {
    return p * Math.pow(1 + currentRate, y);
  }

  function render(principal) {
    const valid = isFinite(principal) && principal > 0;
    rows.forEach((row) => {
      const y = parseInt(row.dataset.years, 10);
      const fvEl = row.querySelector('[data-fv]');
      const stratEl = row.querySelector('[data-fv-strat]');
      if (stratEl) stratEl.textContent = STRAT_LABELS[currentStrat] || '';
      if (!valid) {
        fvEl.innerHTML = '$—';
        fvEl.classList.add('empty');
        return;
      }
      const fv = futureValue(principal, y);
      const { whole, cents } = usdSplit(fv);
      fvEl.innerHTML = whole + '<span class="cents">' + cents + '</span>';
      fvEl.classList.remove('empty');
    });
    resultsEl.classList.remove('updated');
    void resultsEl.offsetWidth;
    if (valid) resultsEl.classList.add('updated');
  }

  // live comma formatting
  function formatInputValue(el) {
    const raw = el.value;
    const caret = el.selectionStart;
    const before = raw.slice(0, caret).replace(/[^0-9.]/g, '').length;

    let cleaned = raw.replace(/[^0-9.]/g, '');
    const firstDot = cleaned.indexOf('.');
    if (firstDot !== -1) {
      cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '');
      const [ip, dp] = cleaned.split('.');
      cleaned = ip + '.' + (dp || '').slice(0, 2);
    }
    let [intPart, decPart] = cleaned.split('.');
    if (intPart && intPart.length > 1) intPart = intPart.replace(/^0+/, '') || '0';

    let formattedInt = '';
    if (intPart !== undefined && intPart !== '') {
      formattedInt = Number(intPart).toLocaleString('en-US');
    }
    let formatted = formattedInt;
    if (cleaned.includes('.')) formatted += '.' + (decPart || '');
    el.value = formatted;

    let digitsSeen = 0;
    let newCaret = formatted.length;
    for (let i = 0; i < formatted.length; i++) {
      if (/[0-9.]/.test(formatted[i])) digitsSeen++;
      if (digitsSeen >= before) { newCaret = i + 1; break; }
    }
    try { el.setSelectionRange(newCaret, newCaret); } catch (e) {}
  }

  input.addEventListener('input', () => {
    formatInputValue(input);
    const n = parseAmount(input.value);
    render(n);
    updateRhButton(n);
    saveAmount(input.value);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      input.value = '';
      render(NaN);
      updateRhButton(NaN);
      saveAmount('');
      input.focus();
    }
  });

  // persist last amount across popup opens
  function saveAmount(v) {
    try {
      if (chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ lastAmount: v });
      } else {
        localStorage.setItem('dbj_lastAmount', v);
      }
    } catch (e) {}
  }
  function loadAmount(cb) {
    try {
      if (chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['lastAmount'], (r) => cb(r && r.lastAmount || ''));
        return;
      }
    } catch (e) {}
    cb(localStorage.getItem('dbj_lastAmount') || '');
  }

  // shopping-site detection (nudge banner)
  const SHOP_HOSTS = [
    'amazon.', 'zara.', 'asos.', 'nike.', 'uniqlo.', 'hm.com',
    'ebay.', 'etsy.', 'shopify.', 'target.com', 'walmart.',
    'bestbuy.', 'nordstrom.', 'farfetch.', 'ssense.',
    'revolve.', 'aritzia.', 'sephora.', 'shop.'
  ];
  function detectShoppingSite() {
    try {
      if (!chrome || !chrome.tabs) return;
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || !tabs[0] || !tabs[0].url) return;
        try {
          const u = new URL(tabs[0].url);
          const host = u.hostname.replace(/^www\./, '');
          const hit = SHOP_HOSTS.find(h => host.includes(h));
          if (hit) {
            const row = document.getElementById('contextRow');
            document.getElementById('ctxHost').textContent = host;
            row.hidden = false;
          }
        } catch (e) {}
      });
    } catch (e) {}
  }

  // render triggers button state
  function updateRhButton(principal) {
    const btn = document.getElementById('rhBtn');
    const amtLabel = document.getElementById('rhAmt');
    const valid = isFinite(principal) && principal > 0;
    if (!btn) return;
    if (valid) {
      btn.disabled = false;
      const { whole, cents } = usdSplit(principal);
      amtLabel.textContent = whole + cents;
    } else {
      btn.disabled = true;
      amtLabel.textContent = '— enter amount —';
    }
  }

  // Robinhood handoff
  const rhBtn = document.getElementById('rhBtn');
  const rhNote = document.getElementById('rhNote');
  if (rhBtn) {
    rhBtn.addEventListener('click', async () => {
      const n = parseAmount(input.value);
      if (!isFinite(n) || n <= 0) return;
      const str = n.toFixed(2);
      let copied = false;
      try {
        await navigator.clipboard.writeText(str);
        copied = true;
      } catch (e) {}
      try {
        if (chrome && chrome.tabs && chrome.tabs.create) {
          chrome.tabs.create({ url: 'https://robinhood.com/account/transfers' });
        } else {
          window.open('https://robinhood.com/account/transfers', '_blank');
        }
      } catch (e) {
        window.open('https://robinhood.com/account/transfers', '_blank');
      }
      rhBtn.classList.add('sent');
      const label = rhBtn.querySelector('.rh-label');
      if (label) label.textContent = copied ? 'Copied · go paste it' : 'Opened Robinhood';
      if (rhNote) rhNote.textContent = copied
        ? 'Amount copied. Paste into the deposit field. Future you: thank you.'
        : 'Robinhood opened in a new tab. Enter the amount manually.';
      setTimeout(() => {
        rhBtn.classList.remove('sent');
        if (label) label.textContent = 'Send to Robinhood';
        if (rhNote) rhNote.textContent = 'Opens Robinhood in a new tab. Amount copied to clipboard — paste it into the deposit screen.';
      }, 3200);
    });
  }
  // strategy tabs
  const stratTabs = document.querySelectorAll('.strat-tab');
  const stratCaption = document.getElementById('stratCaption');
  function setStrategy(key) {
    if (!STRATS[key]) return;
    currentStrat = key;
    currentRate = STRATS[key].rate;
    stratCaption.textContent = STRATS[key].caption;
    stratTabs.forEach(t => t.classList.toggle('active', t.dataset.strat === key));
    document.body.classList.toggle('strat-hysa', key === 'hysa');
    render(parseAmount(input.value));
  }
  document.addEventListener('click', (e) => {
    const tab = e.target.closest('.strat-tab');
    if (tab && tab.dataset.strat) setStrategy(tab.dataset.strat);
  });

  // init
  function init(saved) {
    if (saved) {
      input.value = saved;
      formatInputValue(input);
      const n = parseAmount(input.value);
      render(n);
      updateRhButton(n);
    } else {
      render(NaN);
      updateRhButton(NaN);
    }
    input.focus();
    input.select();
  }
  loadAmount(init);
  detectShoppingSite();
})();
