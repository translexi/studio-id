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

  /* ---- 3. Prefetch niat-hover (fallback tanpa Speculation Rules) ---- */
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
