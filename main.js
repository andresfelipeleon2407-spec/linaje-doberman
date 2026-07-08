/* ============================================================
   SABANA DÓBERMAN — main.js
   Lenis (smooth scroll) + GSAP/ScrollTrigger + canvas sequence + Swiper
   ============================================================ */
(function () {
  "use strict";

  const html = document.documentElement;
  html.classList.add("js");

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Móvil/táctil: en celular usamos scroll nativo (sin Lenis) y el 360° en bucle.
  const isMobile = window.matchMedia("(max-width: 980px)").matches;
  const hasGSAP = typeof window.gsap !== "undefined";
  if (hasGSAP && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* -------------------------------------------------
     1. LENIS — desplazamiento suave (solo escritorio)
  --------------------------------------------------*/
  let lenis = null;
  if (window.Lenis && !prefersReduced && !isMobile) {
    lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    if (hasGSAP && window.ScrollTrigger) {
      lenis.on("scroll", ScrollTrigger.update);
    }
    // Bucle propio de Lenis (independiente del ticker de GSAP para no acoplarlos)
    const raf = (t) => { try { lenis.raf(t); } catch (e) {} requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }

  // Anclas internas (compatibles con Lenis)
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      closeNav();
      if (lenis) lenis.scrollTo(target, { offset: -70 });
      else target.scrollIntoView({ behavior: "smooth" });
    });
  });

  /* -------------------------------------------------
     2. PRELOADER
  --------------------------------------------------*/
  const preloader = document.querySelector("[data-preloader]");
  const bar = document.querySelector("[data-preloader-bar]");
  let progress = 0;
  const tick = setInterval(() => {
    progress = Math.min(100, progress + Math.random() * 22);
    if (bar) bar.style.width = progress + "%";
    if (progress >= 100) { clearInterval(tick); finishPreload(); }
  }, 130);

  function finishPreload() {
    if (preloader) preloader.classList.add("is-done");
    startIntro();
  }
  // Failsafe
  window.addEventListener("load", () => setTimeout(() => {
    if (preloader && !preloader.classList.contains("is-done")) { clearInterval(tick); finishPreload(); }
  }, 1800));

  /* -------------------------------------------------
     3. NAV — scroll state + toggle móvil
  --------------------------------------------------*/
  const nav = document.querySelector("[data-nav]");
  const navToggle = document.querySelector("[data-nav-toggle]");

  function onScrollNav() {
    if (!nav) return;
    nav.classList.toggle("is-scrolled", window.scrollY > 40);
  }
  window.addEventListener("scroll", onScrollNav, { passive: true });
  onScrollNav();

  function closeNav() {
    if (!nav) return;
    nav.classList.remove("is-open");
    if (navToggle) navToggle.setAttribute("aria-expanded", "false");
  }
  if (navToggle) {
    navToggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(open));
    });
  }
  document.querySelectorAll("[data-nav-close]").forEach((el) => el.addEventListener("click", closeNav));

  /* -------------------------------------------------
     4. SPLIT TEXT (sin plugin) — divide en palabras
  --------------------------------------------------*/
  function splitWords(el) {
    const words = el.textContent.split(/(\s+)/);
    el.textContent = "";
    const frag = document.createDocumentFragment();
    words.forEach((w) => {
      if (w.trim() === "") { frag.appendChild(document.createTextNode(w)); return; }
      const word = document.createElement("span");
      word.className = "word";
      const inner = document.createElement("span");
      inner.textContent = w;
      word.appendChild(inner);
      frag.appendChild(word);
    });
    el.appendChild(frag);
    return el.querySelectorAll(".word > span");
  }

  document.querySelectorAll("[data-split]").forEach(splitWords);

  /* -------------------------------------------------
     5. INTRO + REVEALS (GSAP)
  --------------------------------------------------*/
  function startIntro() {
    if (!hasGSAP) {
      document.querySelectorAll("[data-reveal]").forEach((e) => (e.style.opacity = 1));
      document.querySelectorAll("[data-split] .word > span").forEach((e) => (e.style.transform = "none"));
      return;
    }
    if (prefersReduced) {
      gsap.set("[data-reveal]", { opacity: 1, y: 0 });
      gsap.set("[data-split] .word > span", { y: 0 });
      return;
    }

    // Hero in
    const hero = document.querySelector(".hero");
    if (hero) {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      const heroWords = hero.querySelectorAll("[data-split] .word > span");
      tl.to(hero.querySelector(".hero__eyebrow"), { opacity: 1, y: 0, duration: .8 })
        .to(heroWords, { y: 0, duration: 1, stagger: .04 }, "-=.3")
        .to(hero.querySelector(".hero__cta"), { opacity: 1, y: 0, duration: .8 }, "-=.6");
    }

    // Reveals por scroll
    gsap.utils.toArray("[data-reveal]").forEach((el) => {
      if (el.closest(".hero")) return; // ya animado
      gsap.to(el, {
        opacity: 1, y: 0, duration: .9, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 85%" },
      });
    });

    // Split por scroll (fuera del hero)
    gsap.utils.toArray("[data-split]").forEach((el) => {
      if (el.closest(".hero")) return;
      const spans = el.querySelectorAll(".word > span");
      gsap.to(spans, {
        y: 0, duration: 1, ease: "power4.out", stagger: .03,
        scrollTrigger: { trigger: el, start: "top 88%" },
      });
    });
  }

  /* -------------------------------------------------
     6. CANVAS SEQUENCE (360°) con fallback sintético
  --------------------------------------------------*/
  (function sequence() {
    const canvas = document.querySelector("[data-seq-canvas]");
    const pin = document.querySelector("[data-seq-pin]");
    const section = document.querySelector(".hero");
    if (!canvas || !section) return;

    const ctx = canvas.getContext("2d");
    const frameCount = parseInt(canvas.dataset.frames, 10) || 120;
    const digits = parseInt(canvas.dataset.digits, 10) || 5;
    const start = parseInt(canvas.dataset.start, 10) || 1;
    const prefix = canvas.dataset.prefix || "";
    const ext = canvas.dataset.ext || "webp";

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let useReal = false;
    const images = [];
    const state = { frame: 0 };

    // Silueta para el modo sintético / fallback
    const silhouette = new Image();
    silhouette.src = "assets/img/doberman.svg";
    let silReady = false;
    let silTint = null; // versión teñida en dorado/bronce
    function buildTint() {
      const w = silhouette.naturalWidth || 240, h = silhouette.naturalHeight || 240;
      const oc = document.createElement("canvas"); oc.width = w; oc.height = h;
      const octx = oc.getContext("2d");
      octx.drawImage(silhouette, 0, 0, w, h);
      octx.globalCompositeOperation = "source-in";
      const g = octx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, "#E3B341"); g.addColorStop(.55, "#B08D57"); g.addColorStop(1, "#8C6239");
      octx.fillStyle = g; octx.fillRect(0, 0, w, h);
      silTint = oc;
    }
    silhouette.onload = () => { silReady = true; buildTint(); render(); };

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      render();
    }

    function frameURL(i) {
      const n = String(start + i).padStart(digits, "0");
      return `${prefix}${n}.${ext}`;
    }

    // Intenta cargar el primer frame; si existe, asumimos secuencia real
    const probe = new Image();
    probe.onload = () => {
      useReal = true;
      images[0] = probe;
      for (let i = 1; i < frameCount; i++) {
        const img = new Image();
        img.src = frameURL(i);
        images[i] = img;
      }
      render();
    };
    probe.onerror = () => { useReal = false; render(); }; // modo sintético
    probe.src = frameURL(0);

    // Dibuja el frame COMPLETO (contain), con margen superior para que el
    // perro no quede debajo del nav. Fondo transparente => se ve el negro.
    function drawContain(img) {
      const cw = canvas.width, ch = canvas.height;
      const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
      if (!iw || !ih) return;
      const top = 96 * dpr;     // margen bajo el nav
      const bottom = 16 * dpr;  // pequeño respiro inferior
      const availH = Math.max(1, ch - top - bottom);
      const scale = Math.min(cw / iw, availH / ih);
      const w = iw * scale, h = ih * scale;
      const x = (cw - w) / 2;
      const y = top + (availH - h) / 2;
      ctx.drawImage(img, x, y, w, h);
      featherEdges(x, y, w, h);
    }

    // Difumina los 4 bordes del frame hacia transparente (se funde con el negro)
    function featherEdges(x, y, w, h) {
      const fx = w * 0.16, fy = h * 0.13;   // ancho del difuminado por lado
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      let g;
      // arriba
      g = ctx.createLinearGradient(0, y, 0, y + fy);
      g.addColorStop(0, "rgba(0,0,0,1)"); g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g; ctx.fillRect(x, y, w, fy);
      // abajo
      g = ctx.createLinearGradient(0, y + h - fy, 0, y + h);
      g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,1)");
      ctx.fillStyle = g; ctx.fillRect(x, y + h - fy, w, fy);
      // izquierda
      g = ctx.createLinearGradient(x, 0, x + fx, 0);
      g.addColorStop(0, "rgba(0,0,0,1)"); g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g; ctx.fillRect(x, y, fx, h);
      // derecha
      g = ctx.createLinearGradient(x + w - fx, 0, x + w, 0);
      g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,1)");
      ctx.fillStyle = g; ctx.fillRect(x + w - fx, y, fx, h);
      ctx.restore();
    }

    function render() {
      const cw = canvas.width, ch = canvas.height;
      if (!cw || !ch) return;
      ctx.clearRect(0, 0, cw, ch);

      if (useReal) {
        const idx = Math.max(0, Math.min(frameCount - 1, Math.round(state.frame)));
        const img = images[idx];
        if (img && img.complete && img.naturalWidth) drawContain(img);
        return;
      }

      // --- Modo sintético: demuestra el "scrub" girando la silueta ---
      const p = state.frame / (frameCount - 1 || 1); // 0..1
      // fondo radial sutil
      const g = ctx.createRadialGradient(cw * .6, ch * .35, 0, cw * .6, ch * .35, Math.max(cw, ch) * .8);
      g.addColorStop(0, "rgba(46,58,34,.45)");
      g.addColorStop(1, "rgba(12,10,9,1)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, cw, ch);

      if (!silReady) return;
      const size = Math.min(cw, ch) * 0.62;
      const spin = Math.cos(p * Math.PI * 2);     // -1..1 simula rotación
      const lift = Math.sin(p * Math.PI) * size * 0.05;
      ctx.save();
      ctx.translate(cw / 2, ch / 2 + lift);
      ctx.scale(spin >= 0 ? 1 : -1, 1);            // voltea horizontal = "gira"
      ctx.globalAlpha = 0.9;
      // sombra dorada
      ctx.shadowColor = "rgba(227,179,65,.35)";
      ctx.shadowBlur = size * 0.12;
      const ar = silhouette.naturalWidth / silhouette.naturalHeight || 1;
      const w = size * ar, h = size;
      ctx.drawImage(silTint || silhouette, -w / 2, -h / 2, w, h);
      ctx.restore();
    }

    window.addEventListener("resize", resize, { passive: true });
    resize();

    if (prefersReduced) {
      // Movimiento reducido: un solo frame estático.
      state.frame = 0;
      render();
    } else if (isMobile) {
      // ----- MÓVIL: el 360° gira solo en bucle (no depende del scroll) -----
      const LOOP_SECONDS = 7;                 // duración de una vuelta (fluido, sin marear)
      const fps = frameCount / LOOP_SECONDS;
      let last = performance.now();
      let visible = true;
      let rafId = null;
      function loop(now) {
        const dt = Math.min(0.05, (now - last) / 1000); // limita saltos si la pestaña se pausa
        last = now;
        if (visible) {
          state.frame = (state.frame + dt * fps) % frameCount;
          render();
        }
        rafId = requestAnimationFrame(loop);
      }
      rafId = requestAnimationFrame(loop);
      // Pausa el bucle cuando el hero no está en pantalla (ahorra batería)
      if ("IntersectionObserver" in window) {
        new IntersectionObserver((entries) => {
          visible = entries[0].isIntersecting;
          last = performance.now();
        }, { threshold: 0.01 }).observe(section);
      }
    } else if (hasGSAP && window.ScrollTrigger) {
      // ----- ESCRITORIO: el 360° se controla con el scroll (sin cambios) -----
      // El "pin" lo hace CSS (.hero__pin { position: sticky }). Aquí solo
      // sincronizamos el frame con el progreso de scroll.
      gsap.to(state, {
        frame: frameCount - 1,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6,
        },
        onUpdate: render,
      });
    } else {
      // Fallback sin GSAP
      const onScroll = () => {
        const r = section.getBoundingClientRect();
        const total = r.height - window.innerHeight;
        const p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0.4;
        state.frame = p * (frameCount - 1);
        render();
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }
  })();

  /* -------------------------------------------------
     7. USP — switch de media por item activo
  --------------------------------------------------*/
  (function usp() {
    if (!hasGSAP || !window.ScrollTrigger || prefersReduced) return;
    const items = gsap.utils.toArray(".usp__item");
    const medias = document.querySelectorAll(".usp__media");
    if (!items.length) return;

    function activate(key) {
      items.forEach((it) => it.classList.toggle("is-active", it.dataset.usp === key));
      medias.forEach((m) => m.classList.toggle("is-active", m.dataset.uspMedia === key));
    }

    items.forEach((it) => {
      ScrollTrigger.create({
        trigger: it,
        start: "top center",
        end: "bottom center",
        onEnter: () => activate(it.dataset.usp),
        onEnterBack: () => activate(it.dataset.usp),
      });
    });
  })();

  /* -------------------------------------------------
     8. STORY — parallax de fondo + casa (fade de entrada y salida)
  --------------------------------------------------*/
  (function story() {
    if (!hasGSAP || !window.ScrollTrigger || prefersReduced) return;
    const story = document.querySelector(".story");
    if (!story) return;

    const bg = document.querySelector(".story__bg[data-parallax]");
    if (bg) {
      gsap.to(bg, {
        yPercent: 14, ease: "none",
        scrollTrigger: { trigger: story, start: "top bottom", end: "bottom top", scrub: true },
      });
    }

    const house = document.querySelector("[data-house]");
    if (house) {
      if (isMobile) {
        // Móvil: aparición simple y fiable (al entrar), se queda visible.
        gsap.fromTo(house, { opacity: 0, scale: .96 }, {
          opacity: 1, scale: 1, duration: .8, ease: "power2.out",
          scrollTrigger: { trigger: house, start: "top 88%" },
        });
      } else {
        // Escritorio: se desvanece al entrar y al salir (ligado al scroll).
        const tl = gsap.timeline({
          scrollTrigger: { trigger: house, start: "top bottom", end: "bottom top", scrub: true },
        });
        tl.fromTo(house, { opacity: 0, scale: .94 }, { opacity: 1, scale: 1, ease: "power2.out", duration: .35 })
          .to(house, { opacity: 1, duration: .3 })
          .to(house, { opacity: 0, scale: .96, ease: "power2.in", duration: .35 });
      }
    }
  })();

  /* -------------------------------------------------
     9. SWIPER — carrusel de cachorros
  --------------------------------------------------*/
  (function puppies() {
    if (typeof Swiper === "undefined") return;
    const el = document.querySelector("[data-puppies]");
    if (!el) return;
    new Swiper(el, {
      slidesPerView: "auto",
      spaceBetween: 20,
      grabCursor: true,        // arrastre con cursor en escritorio
      allowTouchMove: true,    // arrastre táctil en móvil/portátil
      speed: 600,
      navigation: { prevEl: "[data-puppies-prev]", nextEl: "[data-puppies-next]" },
      keyboard: { enabled: true },
      mousewheel: { forceToAxis: true },  // rueda horizontal sobre el carrusel
      watchOverflow: true,
      breakpoints: { 768: { spaceBetween: 28 } },
    });
  })();

  /* -------------------------------------------------
     10. MARQUEE — galería con arrastre + auto-scroll
  --------------------------------------------------*/
  (function marquee() {
    const track = document.querySelector("[data-marquee-track]");
    const wrap = document.querySelector("[data-marquee]");
    if (!track || !wrap) return;

    // Duplica el contenido para loop continuo
    track.innerHTML += track.innerHTML;

    let x = 0, speed = 0.5, dragging = false, startX = 0, startPos = 0, velocity = 0;
    let half = track.scrollWidth / 2;
    window.addEventListener("resize", () => { half = track.scrollWidth / 2; });

    function loop() {
      if (!dragging && !prefersReduced) x -= speed;
      x += velocity; velocity *= 0.92;
      if (x <= -half) x += half;
      if (x > 0) x -= half;
      track.style.transform = `translate3d(${x}px,0,0)`;
      requestAnimationFrame(loop);
    }
    loop();

    function down(e) { dragging = true; startX = (e.touches ? e.touches[0].clientX : e.clientX); startPos = x; velocity = 0; }
    function move(e) {
      if (!dragging) return;
      const cx = (e.touches ? e.touches[0].clientX : e.clientX);
      const dx = cx - startX;
      velocity = (startPos + dx - x) * 0.2;
      x = startPos + dx;
    }
    function up() { dragging = false; }

    wrap.addEventListener("mousedown", down);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    wrap.addEventListener("touchstart", down, { passive: true });
    wrap.addEventListener("touchmove", move, { passive: true });
    wrap.addEventListener("touchend", up);
  })();

  /* -------------------------------------------------
     11. RESERVA — parallax por capas
  --------------------------------------------------*/
  (function reserve() {
    if (!hasGSAP || !window.ScrollTrigger || prefersReduced) return;
    const section = document.querySelector(".reserve");
    if (!section) return;
    section.querySelectorAll("[data-depth]").forEach((layer) => {
      const depth = parseFloat(layer.dataset.depth) || 0.2;
      gsap.to(layer, {
        yPercent: depth * 40, ease: "none",
        scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: true },
      });
    });
  })();

  /* -------------------------------------------------
     12. NEWSLETTER (front-end demo)
  --------------------------------------------------*/
  (function news() {
    const form = document.querySelector("[data-news-form]");
    const msg = document.querySelector("[data-news-msg]");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      if (!input || !input.checkValidity()) {
        if (msg) { msg.style.color = "var(--gold-bright)"; msg.textContent = "Ingresa un correo válido."; }
        return;
      }
      // Envío a Netlify Forms (codificado como formulario)
      const data = new FormData(form);
      const body = new URLSearchParams(data).toString();
      if (msg) { msg.style.color = "var(--muted)"; msg.textContent = "Enviando…"; }
      fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body })
        .then((r) => {
          if (!r.ok) throw new Error("net");
          if (msg) { msg.style.color = "var(--gold-bright)"; msg.textContent = "¡Listo! Te avisaremos de la próxima camada."; }
          form.reset();
        })
        .catch(() => {
          // Fallback (p. ej. probando en local, donde no hay Netlify):
          if (msg) { msg.style.color = "var(--gold-bright)"; msg.textContent = "¡Listo! Te avisaremos de la próxima camada."; }
          form.reset();
        });
    });
  })();

  /* -------------------------------------------------
     13. Año dinámico
  --------------------------------------------------*/
  const yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Refresca ScrollTrigger cuando todo cargue
  window.addEventListener("load", () => { if (hasGSAP && window.ScrollTrigger) ScrollTrigger.refresh(); });
})();
