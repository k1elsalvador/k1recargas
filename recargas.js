/*
 * K1 Recargas — demo de recarga de saldo celular en el kiosco K1 Mini.
 *
 *   Compañía -> número (teclado en pantalla) -> paquete -> pago en efectivo -> procesando -> comprobante
 *
 * Lo único real es el hardware de efectivo (monedas y billetes) a través de kiosk.js.
 * Las compañías telefónicas son ficticias y no existe backend: la "recarga" es un temporizador.
 */
(function () {
  'use strict';

  const CONFIG = {
    currency: 'USD',
    phoneDigits: 8,
    phonePrefixes: ['6', '7'],      // móviles en El Salvador empiezan con 6 o 7
    idleResetMs: 90000,
    payIdleResetMs: 180000,         // más tiempo mientras la persona busca monedas
    autoContinueMs: 1600,           // pausa en "Pago completo" antes de procesar
    successResetMs: 25000,
    demoNumber: '71234567',
  };

  // ---- compañías ficticias ------------------------------------------------------------------
  // amount en USD; desc bilingüe. Cambie libremente nombres, colores y paquetes.
  const CARRIERS = [
    {
      id: 'volcan', name: 'Volcán Móvil', mark: 'V', color: '#ff6b3d', ink: '#2a0d03',
      tag: { es: 'Señal que no se apaga', en: 'Signal that never sleeps' },
      plans: [
        { amount: 1, es: 'Saldo $1', en: '$1 credit' },
        { amount: 2, es: '1 GB · 3 días', en: '1 GB · 3 days' },
        { amount: 3, es: 'Redes ilimitadas · 3 días', en: 'Unlimited social · 3 days' },
        { amount: 5, es: '4 GB + llamadas · 7 días', en: '4 GB + calls · 7 days' },
        { amount: 10, es: '10 GB + llamadas · 15 días', en: '10 GB + calls · 15 days' },
        { amount: 20, es: '25 GB todo incluido · 30 días', en: '25 GB all-in · 30 days' },
      ],
    },
    {
      id: 'brisa', name: 'Brisa Cel', mark: 'B', color: '#2ec4d6', ink: '#03222a',
      tag: { es: 'Liviano como el aire', en: 'Light as air' },
      plans: [
        { amount: 1, es: 'Saldo $1', en: '$1 credit' },
        { amount: 2, es: '800 MB · 2 días', en: '800 MB · 2 days' },
        { amount: 4, es: '3 GB · 5 días', en: '3 GB · 5 days' },
        { amount: 6, es: '6 GB + WhatsApp · 7 días', en: '6 GB + WhatsApp · 7 days' },
        { amount: 12, es: '15 GB · 15 días', en: '15 GB · 15 days' },
        { amount: 25, es: 'Ilimitado · 30 días', en: 'Unlimited · 30 days' },
      ],
    },
    {
      id: 'ceiba', name: 'Ceiba Tel', mark: 'C', color: '#4fd17e', ink: '#062413',
      tag: { es: 'Raíces en todo el país', en: 'Rooted nationwide' },
      plans: [
        { amount: 1, es: 'Saldo $1', en: '$1 credit' },
        { amount: 3, es: '2 GB · 4 días', en: '2 GB · 4 days' },
        { amount: 5, es: '5 GB · 7 días', en: '5 GB · 7 days' },
        { amount: 8, es: '8 GB + minutos · 10 días', en: '8 GB + minutes · 10 days' },
        { amount: 15, es: '20 GB · 30 días', en: '20 GB · 30 days' },
        { amount: 30, es: 'Ilimitado + roaming CA · 30 días', en: 'Unlimited + CA roaming · 30 days' },
      ],
    },
    {
      id: 'nebula', name: 'Nébula', mark: 'N', color: '#a586ff', ink: '#170a3a',
      tag: { es: 'Conexión de otro planeta', en: 'Out-of-this-world coverage' },
      plans: [
        { amount: 1, es: 'Saldo $1', en: '$1 credit' },
        { amount: 2, es: '1.5 GB · 3 días', en: '1.5 GB · 3 days' },
        { amount: 5, es: '5 GB + redes · 7 días', en: '5 GB + social · 7 days' },
        { amount: 7, es: '7 GB + llamadas · 10 días', en: '7 GB + calls · 10 days' },
        { amount: 10, es: '12 GB · 15 días', en: '12 GB · 15 days' },
        { amount: 20, es: '30 GB + streaming · 30 días', en: '30 GB + streaming · 30 days' },
      ],
    },
  ];

  // ---- i18n -------------------------------------------------------------------------------
  const STRINGS = {
    es: {
      homeTitle: 'Recargue su celular', homeSub: 'Elija su compañía telefónica',
      stepCarrier: 'Compañía', stepNumber: 'Número', stepPlan: 'Paquete', stepPay: 'Pago', stepDone: 'Listo',
      numberTitle: 'Ingrese el número a recargar', numberSub: '{n} dígitos, empieza con 6 o 7',
      numberBad: 'El número debe empezar con 6 o 7', numberShort: 'Faltan {n} dígitos', numberShort1: 'Falta 1 dígito',
      clear: 'Borrar', back: 'Atrás', continue: 'Continuar', cancel: 'Cancelar', demoNumber: 'Número demo',
      planTitle: 'Elija su recarga', planSub: 'Para {num}',
      payTitle: 'Inserte su efectivo', due: 'A pagar', inserted: 'Insertado', remaining: 'Falta',
      coins: 'Monedas', bills: 'Billetes',
      noChange: 'Este kiosco no da cambio: el excedente queda como saldo a favor en su comprobante.',
      unknownCash: 'No se reconoció la moneda o billete',
      paid: '¡Pago completo!', hwError: 'No se pudo encender el aceptador de efectivo. Avise al encargado.',
      processing: 'Procesando su recarga…', stepConnect: 'Conectando con {c}', stepValidate: 'Validando número', stepApply: 'Aplicando recarga',
      doneTitle: '¡Recarga exitosa!', doneSub: 'Su saldo se acreditará en unos segundos',
      rCarrier: 'Compañía', rNumber: 'Número', rPlan: 'Paquete', rAmount: 'Monto', rPaid: 'Pagado', rCredit: 'Saldo a favor',
      rAuth: 'Autorización', rDate: 'Fecha',
      done: 'Finalizar',
      footer: 'Solo demostración: compañías ficticias, no se realiza ninguna recarga real.',
      footerMock: 'Modo simulado en navegador: use el panel abajo a la derecha para insertar efectivo.',
      cancelledWithCash: 'Recarga cancelada. En un kiosco real el efectivo insertado ({amt}) se devolvería o quedaría como saldo a favor.',
    },
    en: {
      homeTitle: 'Top up your phone', homeSub: 'Choose your carrier',
      stepCarrier: 'Carrier', stepNumber: 'Number', stepPlan: 'Plan', stepPay: 'Pay', stepDone: 'Done',
      numberTitle: 'Enter the phone number', numberSub: '{n} digits, starting with 6 or 7',
      numberBad: 'The number must start with 6 or 7', numberShort: '{n} digits missing', numberShort1: '1 digit missing',
      clear: 'Clear', back: 'Back', continue: 'Continue', cancel: 'Cancel', demoNumber: 'Demo number',
      planTitle: 'Choose your top-up', planSub: 'For {num}',
      payTitle: 'Insert your cash', due: 'Amount due', inserted: 'Inserted', remaining: 'Remaining',
      coins: 'Coins', bills: 'Bills',
      noChange: 'This kiosk gives no change: any excess is shown as credit on your receipt.',
      unknownCash: 'Coin or bill not recognized',
      paid: 'Payment complete!', hwError: 'The cash acceptor could not be turned on. Please call staff.',
      processing: 'Processing your top-up…', stepConnect: 'Connecting to {c}', stepValidate: 'Validating number', stepApply: 'Applying top-up',
      doneTitle: 'Top-up successful!', doneSub: 'Your balance will be credited in a few seconds',
      rCarrier: 'Carrier', rNumber: 'Number', rPlan: 'Plan', rAmount: 'Amount', rPaid: 'Paid', rCredit: 'Credit in favor',
      rAuth: 'Authorization', rDate: 'Date',
      done: 'Finish',
      footer: 'Demo only: fictional carriers, no real top-up is made.',
      footerMock: 'Browser mock mode: use the panel at the bottom right to insert cash.',
      cancelledWithCash: 'Top-up cancelled. In a real kiosk the inserted cash ({amt}) would be refunded or kept as credit.',
    },
  };
  let lang = 'es';
  function t(key, vars) {
    let s = (STRINGS[lang] && STRINGS[lang][key]) || STRINGS.es[key] || key;
    for (const [k, v] of Object.entries(vars || {})) s = s.replace('{' + k + '}', v);
    return s;
  }

  // ---- helpers ----------------------------------------------------------------------------
  // Todo texto dinámico va por textContent (nunca innerHTML).
  function h(tag, attrs, ...children) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === 'class') el.className = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k.startsWith('--')) el.style.setProperty(k, v);
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (v === true) el.setAttribute(k, '');
      else if (v !== false && v != null) el.setAttribute(k, v);
    }
    for (const c of children.flat()) {
      if (c == null || c === false) continue;
      el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
    }
    return el;
  }
  const locale = () => (lang === 'es' ? 'es-SV' : 'en-US');
  const money = n => new Intl.NumberFormat(locale(), { style: 'currency', currency: CONFIG.currency }).format(n);
  const round2 = n => Math.round(n * 100) / 100;
  const fmtPhone = d => (d.length > 4 ? d.slice(0, 4) + '-' + d.slice(4) : d);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const authCode = () => String(Math.floor(10000000 + Math.random() * 90000000));
  const isOk = r => r && (r.status === 'ok' || r.status === 'success');

  function logo(c, size) {
    return h('div', { class: 'logo' + (size ? ' ' + size : ''), '--c': c.color, '--ink': c.ink }, c.mark);
  }

  // ---- estado y navegación -----------------------------------------------------------------
  const app = document.getElementById('app');
  const progress = document.getElementById('progress');
  let session = null;
  let current = null;      // { name, leave() }
  let idleTimer = null;
  let screenToken = 0;     // cambia en cada pantalla para cortar pasos async viejos

  function newSession() {
    return { carrier: null, number: '', plan: null, inserted: 0, items: [], auth: null, when: null };
  }

  const STEP_OF = { home: 0, number: 1, plan: 2, pay: 3, processing: 3, receipt: 4 };
  function renderProgress(name) {
    const keys = ['stepCarrier', 'stepNumber', 'stepPlan', 'stepPay', 'stepDone'];
    const at = STEP_OF[name] ?? 0;
    progress.textContent = '';
    progress.hidden = name === 'home';
    keys.forEach((k, i) => progress.append(
      h('span', { class: i < at ? 'done' : i === at ? 'now' : '' }, h('b', null, String(i + 1)), t(k))));
  }

  function show(name, ...args) {
    if (current && current.leave) current.leave();
    screenToken++;
    app.textContent = '';
    app.className = 'screen-' + name;
    current = { name };
    renderProgress(name);
    SCREENS[name](...args);
    armIdle();
  }

  function armIdle() {
    clearTimeout(idleTimer);
    if (!current || current.name === 'home' || current.name === 'processing') return;
    const ms = current.name === 'pay' ? CONFIG.payIdleResetMs : CONFIG.idleResetMs;
    idleTimer = setTimeout(() => cancelToHome(), ms);
  }
  ['pointerdown', 'keydown'].forEach(ev => document.addEventListener(ev, armIdle, { passive: true }));

  function goHome(notice) {
    kiosk.allOff();
    session = newSession();
    show('home', typeof notice === 'string' ? notice : null);
  }
  function cancelToHome() {
    const amt = session && session.inserted > 0 && !session.auth ? session.inserted : 0;
    goHome(amt ? t('cancelledWithCash', { amt: money(amt) }) : null);
  }

  // ---- pantallas ----------------------------------------------------------------------------
  const SCREENS = {
    home(notice) {
      app.append(
        ...(notice ? [h('p', { class: 'notice' }, notice)] : []),
        h('h1', null, t('homeTitle')),
        h('p', { class: 'lead' }, t('homeSub')),
        h('div', { class: 'carriers' }, CARRIERS.map(c =>
          h('button', {
            class: 'carrier', '--c': c.color,
            onclick: () => { session = newSession(); session.carrier = c; show('number'); },
          }, logo(c, 'lg'), h('div', { class: 'name' }, c.name), h('div', { class: 'tag' }, c.tag[lang])))),
      );
    },

    number() {
      const c = session.carrier;
      const display = h('div', { class: 'phone' });
      const msg = h('div', { class: 'hint' });
      const cont = h('button', { class: 'btn', onclick: () => valid() && show('plan') }, t('continue'));

      function valid() {
        const d = session.number;
        return d.length === CONFIG.phoneDigits && CONFIG.phonePrefixes.includes(d[0]);
      }
      function render() {
        const d = session.number;
        // Ranura visual para cada dígito, con guion después del cuarto.
        display.textContent = '';
        for (let i = 0; i < CONFIG.phoneDigits; i++) {
          if (i === 4) display.append(h('span', { class: 'dash' }, '-'));
          display.append(h('span', { class: 'slot' + (d[i] ? ' filled' : '') + (i === d.length ? ' cursor' : '') }, d[i] || ''));
        }
        const badPrefix = d.length > 0 && !CONFIG.phonePrefixes.includes(d[0]);
        display.classList.toggle('bad', badPrefix);
        msg.className = 'hint' + (badPrefix ? ' error' : '');
        msg.textContent = badPrefix ? t('numberBad')
          : d.length && d.length < CONFIG.phoneDigits
            ? (CONFIG.phoneDigits - d.length === 1 ? t('numberShort1') : t('numberShort', { n: CONFIG.phoneDigits - d.length })) : '';
        cont.disabled = !valid();
      }
      function press(k) {
        if (k === 'del') session.number = session.number.slice(0, -1);
        else if (k === 'clr') session.number = '';
        else if (session.number.length < CONFIG.phoneDigits) session.number += k;
        render();
      }

      const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clr', '0', 'del'];
      const pad = h('div', { class: 'keypad' }, keys.map(k => h('button', {
        class: 'key' + (k.length > 1 ? ' fn' : ''), onclick: () => press(k),
      }, k === 'del' ? '⌫' : k === 'clr' ? t('clear') : k)));

      app.append(
        h('div', { class: 'with-logo' }, logo(c), h('h2', null, t('numberTitle'))),
        h('p', { class: 'lead' }, t('numberSub', { n: CONFIG.phoneDigits })),
        display, msg, pad,
        h('div', { class: 'row' },
          h('button', { class: 'btn secondary', onclick: () => show('home') }, t('back')),
          cont),
        kiosk.mode === 'mock'
          ? h('button', { class: 'btn ghost small', onclick: () => { session.number = CONFIG.demoNumber; render(); } }, t('demoNumber'))
          : null,
      );
      render();
    },

    plan() {
      const c = session.carrier;
      app.append(
        h('div', { class: 'with-logo' }, logo(c), h('h2', null, t('planTitle'))),
        h('p', { class: 'lead' }, t('planSub', { num: fmtPhone(session.number) })),
        h('div', { class: 'plans', '--c': c.color, '--ink': c.ink }, c.plans.map(p =>
          h('button', { class: 'plan', onclick: () => { session.plan = p; show('pay'); } },
            h('div', { class: 'amt' }, money(p.amount)),
            h('div', { class: 'desc' }, p[lang])))),
        h('div', { class: 'row' },
          h('button', { class: 'btn secondary', onclick: () => show('number') }, t('back')),
          h('button', { class: 'btn secondary', onclick: () => cancelToHome() }, t('cancel'))),
      );
    },

    pay() {
      const c = session.carrier;
      const due = session.plan.amount;
      const insertedEl = h('div', { class: 'big' });
      const remainingEl = h('div', { class: 'big accent' });
      const meter = h('div', { class: 'meter-fill' });
      const chips = h('div', { class: 'chips' });
      const coinHint = h('span', null, '● ' + t('coins'));
      const billHint = h('span', null, '▬ ' + t('bills'));
      const note = h('div', { class: 'hint' });
      const backBtn = h('button', { class: 'btn secondary', onclick: () => show('plan') }, t('back'));
      const cancelBtn = h('button', { class: 'btn secondary', onclick: () => cancelToHome() }, t('cancel'));

      app.append(
        h('div', { class: 'ticket' },
          logo(c),
          h('div', { class: 'ticket-text' },
            h('div', { class: 'tt-main' }, c.name + ' · ' + fmtPhone(session.number)),
            h('div', { class: 'tt-sub' }, session.plan[lang])),
          h('div', { class: 'tt-amt' }, money(due))),
        h('h2', null, t('payTitle')),
        h('div', { class: 'pay-grid' },
          h('div', { class: 'cell' }, h('div', { class: 'label' }, t('inserted')), insertedEl),
          h('div', { class: 'cell' }, h('div', { class: 'label' }, t('remaining')), remainingEl)),
        h('div', { class: 'meter', '--c': c.color }, meter),
        chips,
        h('div', { class: 'hint-row' }, coinHint, billHint),
        h('p', { class: 'small-note' }, t('noChange')),
        note,
        h('div', { class: 'row' }, backBtn, cancelBtn),
      );

      let finished = false;
      function render() {
        const left = Math.max(0, round2(due - session.inserted));
        insertedEl.textContent = money(session.inserted);
        remainingEl.textContent = money(left);
        meter.style.width = Math.min(100, (session.inserted / due) * 100) + '%';
        // Una vez que entró dinero ya no se puede volver a cambiar el paquete.
        backBtn.disabled = session.inserted > 0;
      }
      render();

      const token = screenToken;
      const offCash = kiosk.on('cash', e => {
        if (finished) return;
        if (e.amount == null) { note.className = 'hint error'; note.textContent = t('unknownCash'); return; }
        note.textContent = '';
        session.inserted = round2(session.inserted + e.amount);
        session.items.push(e);
        chips.appendChild(h('span', { class: 'chip ' + e.kind }, money(e.amount)));
        insertedEl.classList.remove('bump'); void insertedEl.offsetWidth; insertedEl.classList.add('bump');
        render();
        if (session.inserted >= due) {
          finished = true;
          kiosk.coins.enable(false);
          kiosk.bills.enable(false);
          cancelBtn.disabled = true;
          note.className = 'hint ok';
          note.textContent = t('paid');
          setTimeout(() => { if (token === screenToken) show('processing'); }, CONFIG.autoContinueMs);
        }
      });
      const offStatus = kiosk.on('status', s => {
        coinHint.className = s.coins ? 'on' : '';
        billHint.className = s.bills ? 'on' : '';
      });
      Promise.all([kiosk.coins.enable(true), kiosk.bills.enable(true)]).then(([a, b]) => {
        if (token !== screenToken) return;
        if (!isOk(a) && !isOk(b)) { note.className = 'hint error'; note.textContent = t('hwError'); }
      });
      current.leave = () => { offCash(); offStatus(); kiosk.coins.enable(false); kiosk.bills.enable(false); };
    },

    async processing() {
      const c = session.carrier;
      const list = h('ul', { class: 'steps' },
        h('li', { 'data-step': 'connect' }, t('stepConnect', { c: c.name })),
        h('li', { 'data-step': 'validate' }, t('stepValidate')),
        h('li', { 'data-step': 'apply' }, t('stepApply')));
      app.append(h('div', { class: 'spinner', '--c': c.color }), h('h2', null, t('processing')), list);
      const token = screenToken;
      for (const key of ['connect', 'validate', 'apply']) {
        await sleep(900 + Math.random() * 700);
        if (token !== screenToken) return;
        list.querySelector('[data-step="' + key + '"]').classList.add('done');
      }
      await sleep(400);
      if (token !== screenToken) return;
      session.auth = authCode();
      session.when = new Date();
      show('receipt');
    },

    receipt() {
      const c = session.carrier;
      const credit = round2(session.inserted - session.plan.amount);
      const line = (k, v, cls) => h('div', { class: 'line' + (cls ? ' ' + cls : '') }, h('span', null, t(k)), h('span', null, v));
      const when = new Intl.DateTimeFormat(locale(), { dateStyle: 'medium', timeStyle: 'short' }).format(session.when);

      app.append(
        h('div', { class: 'big-icon' }, '✓'),
        h('h1', null, t('doneTitle')),
        h('p', { class: 'lead' }, t('doneSub')),
        h('div', { class: 'receipt', '--c': c.color },
          h('div', { class: 'r-head' }, logo(c), h('strong', null, c.name)),
          line('rNumber', fmtPhone(session.number), 'mono'),
          line('rPlan', session.plan[lang]),
          line('rAmount', money(session.plan.amount)),
          line('rPaid', money(session.inserted)),
          credit > 0 ? line('rCredit', money(credit), 'credit') : null,
          line('rAuth', session.auth, 'mono'),
          line('rDate', when)),
        h('button', { class: 'btn', onclick: () => goHome() }, t('done')),
      );
      const timer = setTimeout(goHome, CONFIG.successResetMs);
      current.leave = () => clearTimeout(timer);
    },
  };

  // ---- barra superior, idioma, pie ------------------------------------------------------------
  const dot = document.getElementById('status-dot');
  kiosk.on('status', s => dot.classList.toggle('ok', s.usb && s.k1Alive));
  kiosk.on('reset', () => goHome());
  kiosk.on('camera', e => { if (e.state === 'error') console.warn('camera:', e.message); });

  function renderFooter() {
    document.getElementById('demo-footer').textContent = kiosk.mode === 'mock' ? t('footerMock') : t('footer');
  }
  const langBtn = document.getElementById('lang-toggle');
  langBtn.addEventListener('click', () => {
    lang = lang === 'es' ? 'en' : 'es';
    langBtn.textContent = lang === 'es' ? 'EN' : 'ES';
    document.documentElement.lang = lang;
    renderFooter();
    // Solo se vuelven a dibujar pantallas sin hardware encendido; las demás toman el idioma en la siguiente.
    if (current && ['home', 'number', 'plan', 'receipt'].includes(current.name)) show(current.name);
    else renderProgress(current.name);
  });

  kiosk.ready.then(info => { console.log('kiosk ready', info); renderFooter(); });
  renderFooter();
  goHome();
})();
