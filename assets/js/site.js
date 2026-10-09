/* Translexi Studio — site.js
   Tiga tugas: nav (menu mobile + status gulir), satu momen gerak di hero
   (kata judul menyala berurutan seperti subtitle ber-waktu), dan prefetch
   niat-hover untuk browser tanpa Speculation Rules. Tanpa dependensi. */
(() => {
  'use strict';
  const kurangiGerak = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const body = document.body;

  /* ---- 1. Nav ---- */
  const nav = document.getElementById('nav');
  const menu = document.getElementById('menu');
  const burger = document.getElementById('burger');
  
  const padatkan = () => {
    if (!nav) return;
    // Di beranda nav transparan di atas video dan HARUS memadat saat digulir
    // atau saat menu terbuka. Di halaman lain, status ini hanya menyalakan
    // garis bawah tipis supaya nav terpisah dari isi yang lewat di bawahnya.
    nav.classList.toggle('nav--padat', scrollY > 24 || menu?.classList.contains('buka'));
  };
  let tick = false;
  addEventListener('scroll', () => {
    if (tick) return;
    tick = true;
    requestAnimationFrame(() => { padatkan(); tick = false; });
  }, { passive: true });
  padatkan();

  const setMenu = buka => {
    if (!menu || !burger) return;
    menu.classList.toggle('buka', buka);
    burger.setAttribute('aria-expanded', String(buka));
    body.classList.toggle('menu-buka', buka);
    padatkan();
  };
  burger?.addEventListener('click', () => setMenu(!menu.classList.contains('buka')));
  menu?.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu?.classList.contains('buka')) { setMenu(false); burger.focus(); }
  });
  matchMedia('(min-width: 1081px)').addEventListener('change', e => { if (e.matches) setMenu(false); });

  /* ---- 2. Momen tunggal: kata judul hero menyala berurutan ---- */
  const judul = document.querySelector('.hero__judul[data-waktu]');
  if (judul) {
    const kata = [...judul.querySelectorAll('.kata')];
    if (kurangiGerak) {
      kata.forEach(k => k.classList.add('nyala'));
    } else {
      // Ritme seperti subtitle: jeda lebih panjang sesudah titik.
      let t = 350;
      kata.forEach((k, i) => {
        setTimeout(() => {
          kata.forEach(x => x.classList.remove('garis'));
          k.classList.add('nyala', 'garis');
          if (i === kata.length - 1) setTimeout(() => k.classList.remove('garis'), 900);
        }, t);
        t += /[.!?]$/.test(k.textContent) ? 620 : 240;
      });
    }
  }

  /* Video hero: berhenti bila pengguna meminta gerak dikurangi. */
  const video = document.querySelector('.hero__video');
  if (video && kurangiGerak) { video.removeAttribute('autoplay'); video.pause(); }

  /* ---- 3. Showreel laman video: bab, suara, jeda, cahaya ambien ----
     Tanpa JS video memakai kontrol bawaan dan tidak autoplay. Dengan JS: autoplay
     senyap kecuali pengguna meminta gerak dikurangi atau hemat data. */
  const reel = document.querySelector('[data-reel]');
  const v = reel?.querySelector('video');
  if (v) {
    const seg = [...reel.querySelectorAll('.reel__segmen')];
    const awal = seg.map(s => +s.dataset.t);
    const nama = reel.querySelector('.reel__nama');
    const jeda = reel.querySelector('.reel__jeda');
    const suara = reel.querySelector('.reel__suara');
    const kanvas = reel.querySelector('.reel__cahaya');
    const cx = kanvas.getContext('2d');
    let bab = 0, olehLayar = false, terakhir = 0;
    v.removeAttribute('controls');

    const lukis = () => {
      if (v.readyState < 2) return;
      try { cx.drawImage(v, 0, 0, kanvas.width, kanvas.height); reel.classList.add('reel--hidup'); } catch (e) {}
    };
    const segar = () => {
      const t = v.currentTime, d = v.duration || +reel.dataset.durasi;
      let i = 0;
      while (i + 1 < awal.length && t >= awal[i + 1]) i++;
      seg.forEach((s, k) => {
        const ujung = awal[k + 1] ?? d;
        s.style.setProperty('--isi', k < i ? 1 : k > i ? 0 : Math.min(1, (t - awal[k]) / (ujung - awal[k])));
      });
      if (i !== bab || !nama.dataset.siap) {
        bab = i; nama.dataset.siap = 1;
        nama.textContent = seg[i].getAttribute('aria-label');
        seg.forEach((s, k) => k === i ? s.setAttribute('aria-current', 'true') : s.removeAttribute('aria-current'));
      }
    };
    const putaran = now => {
      segar();
      if (now - terakhir > 140) { lukis(); terakhir = now; }
      if (!v.paused) requestAnimationFrame(putaran);
    };
    const status = () => {
      reel.classList.toggle('reel--diam', v.paused);
      jeda.setAttribute('aria-label', v.paused ? jeda.dataset.putar : jeda.dataset.jeda);
    };
    const mainkan = () => v.play().catch(status);

    v.addEventListener('play', () => { status(); requestAnimationFrame(putaran); });
    v.addEventListener('pause', () => { status(); segar(); });
    v.addEventListener('seeked', () => { segar(); lukis(); });
    v.addEventListener('loadeddata', lukis);
    v.addEventListener('click', () => (v.paused ? mainkan() : v.pause()));
    jeda.addEventListener('click', () => { olehLayar = false; v.paused ? mainkan() : v.pause(); });
    seg.forEach((s, k) => s.addEventListener('click', () => {
      v.currentTime = awal[k] + 0.05; segar(); if (v.paused) mainkan();
    }));
    // Ajakan pertama memutar ulang dari awal dengan suara; sesudahnya tombol ini sakelar biasa.
    suara.addEventListener('click', () => {
      if (!reel.classList.contains('reel--disentuh')) { v.currentTime = 0; reel.classList.add('reel--disentuh'); }
      v.muted = !v.muted;
      if (!v.muted) mainkan();
      reel.classList.toggle('reel--bersuara', !v.muted);
      suara.querySelector('span').textContent = v.muted ? suara.dataset.nyala : suara.dataset.mati;
    });
    // Di luar layar: berhenti (hemat baterai), lanjut sendiri saat kembali.
    new IntersectionObserver(([e]) => {
      if (!e.isIntersecting && !v.paused) { olehLayar = true; v.pause(); }
      else if (e.isIntersecting && olehLayar) { olehLayar = false; mainkan(); }
    }, { threshold: 0.25 }).observe(v);

    status(); segar();
    if (kurangiGerak || navigator.connection?.saveData) { v.addEventListener('loadeddata', lukis, { once: true }); }
    else { v.preload = 'auto'; mainkan(); }
  }

  /* ---- 4. Prefetch niat-hover (fallback tanpa Speculation Rules) ---- */
  if (!(HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules'))) {
    const sudah = new Set();
    const ambil = e => {
      const a = e.target.closest && e.target.closest('a[href^="/"]');
      if (!a || sudah.has(a.href) || /^\/(assets|jupiter|hpi)\//.test(a.getAttribute('href'))) return;
      sudah.add(a.href);
      const l = document.createElement('link');
      l.rel = 'prefetch'; l.href = a.href;
      document.head.appendChild(l);
    };
    addEventListener('pointerover', ambil, { passive: true });
    addEventListener('focusin', ambil);
  }
})();
