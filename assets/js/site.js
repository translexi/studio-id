/* Translexi Studio — site.js
   Tiga tugas: menu mobile, reveal + count-up, prefetch niat-hover.
   Tanpa dependensi. Semua gerak menghormati prefers-reduced-motion. */
(() => {
  'use strict';
  const kurangiGerak = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- 1. Nav: tinggi, status gulir, menu mobile ---- */
  const nav = document.getElementById('nav');
  const menu = document.getElementById('menu');
  const burger = document.getElementById('burger');
  const heroHal = document.body.classList.contains('hal-hero');

  const setTinggi = () => {
    if (nav) document.documentElement.style.setProperty('--nav-h', nav.offsetHeight + 'px');
  };
  setTinggi();
  addEventListener('resize', setTinggi, { passive: true });

  let tick = false;
  addEventListener('scroll', () => {
    if (tick) return;
    tick = true;
    requestAnimationFrame(() => {
      const gulir = scrollY > 12;
      nav?.classList.toggle('nav--gulir', gulir);
      // Di halaman ber-hero navbar melayang transparan; ia HARUS memadat begitu
      // digulir atau saat menu mobile terbuka, kalau tidak teks putihnya jatuh
      // di atas latar putih.
      if (heroHal) nav?.classList.toggle('nav--padat', gulir || menu?.classList.contains('buka'));
      tick = false;
    });
  }, { passive: true });

  const padatkan = () => {
    if (heroHal) nav?.classList.toggle('nav--padat',
      scrollY > 12 || menu?.classList.contains('buka'));
  };
  burger?.addEventListener('click', () => {
    const buka = menu.classList.toggle('buka');
    burger.setAttribute('aria-expanded', String(buka));
    padatkan();
    setTinggi();
  });
  menu?.addEventListener('click', e => {
    if (e.target.closest('a')) {
      menu.classList.remove('buka');
      burger?.setAttribute('aria-expanded', 'false');
      padatkan();
    }
  });
  addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu?.classList.contains('buka')) {
      menu.classList.remove('buka');
      burger?.setAttribute('aria-expanded', 'false');
      burger?.focus();
    }
  });

  /* ---- 2. Reveal saat masuk viewport + count-up angka ---- */
  const target = document.querySelectorAll('.reveal');
  if (kurangiGerak || !('IntersectionObserver' in window)) {
    target.forEach(el => el.classList.add('tampil'));
    document.querySelectorAll('[data-hitung]').forEach(el => (el.dataset.selesai = '1'));
  } else {
    const pengamat = new IntersectionObserver((entri, obs) => {
      entri.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add('tampil');
        e.target.querySelectorAll?.('[data-hitung]').forEach(hitung);
        if (e.target.matches('[data-hitung]')) hitung(e.target);
        obs.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    target.forEach(el => pengamat.observe(el));
  }

  /* Count-up yang mempertahankan teks asli persis (2009, 400+, 12.000+, 1,500+, 3). */
  function hitung(el) {
    if (el.dataset.selesai) return;
    el.dataset.selesai = '1';
    const teks = el.textContent.trim();
    const cocok = teks.match(/^([^\d]*)([\d.,]+)(.*)$/);
    if (!cocok) return;
    const [, awal, angkaTeks, akhir] = cocok;
    const pemisah = angkaTeks.includes('.') ? '.' : (angkaTeks.includes(',') ? ',' : '');
    const nilai = parseInt(angkaTeks.replace(/[.,]/g, ''), 10);
    if (!Number.isFinite(nilai) || nilai < 10) return;
    // Tahun bukan kuantitas: "2009" yang berhitung dari nol terbaca sebagai angka salah.
    if (!pemisah && nilai >= 1900 && nilai <= 2100 && angkaTeks.length === 4) return;
    const format = n => {
      const s = String(n);
      return pemisah ? s.replace(/\B(?=(\d{3})+(?!\d))/g, pemisah) : s;
    };
    const durasi = 1100, mulai = performance.now();
    const langkah = now => {
      const t = Math.min(1, (now - mulai) / durasi);
      const e = 1 - Math.pow(1 - t, 3);
      el.textContent = awal + format(Math.round(nilai * e)) + akhir;
      if (t < 1) requestAnimationFrame(langkah);
      else el.textContent = teks;
    };
    el.textContent = awal + format(0) + akhir;
    requestAnimationFrame(langkah);
  }

  /* ---- 3. Prefetch berbasis niat hover (fallback jika Speculation Rules absen) ---- */
  const dukungPrerender = HTMLScriptElement.supports?.('speculationrules');
  if (!dukungPrerender) {
    const sudah = new Set();
    const asal = location.origin;
    let timer;
    const prefetch = href => {
      if (sudah.has(href)) return;
      sudah.add(href);
      const l = document.createElement('link');
      l.rel = 'prefetch';
      l.href = href;
      document.head.appendChild(l);
    };
    const niat = e => {
      const a = e.target.closest?.('a[href^="/"]');
      if (!a || a.origin !== asal || a.hasAttribute('download')) return;
      clearTimeout(timer);
      timer = setTimeout(() => prefetch(a.href), 65);
    };
    document.addEventListener('pointerover', niat, { passive: true });
    document.addEventListener('focusin', niat, { passive: true });
    document.addEventListener('pointerout', () => clearTimeout(timer), { passive: true });
  }

  /* ---- 4. Video hero: hemat data & baterai ---- */
  const hero = document.querySelector('.hero__video');
  if (hero) {
    if (kurangiGerak || navigator.connection?.saveData) {
      hero.removeAttribute('autoplay');
      hero.pause();
    } else if ('IntersectionObserver' in window) {
      new IntersectionObserver(en => {
        en.forEach(e => (e.isIntersecting ? hero.play().catch(() => {}) : hero.pause()));
      }, { threshold: 0.15 }).observe(hero);
    }
  }
})();
