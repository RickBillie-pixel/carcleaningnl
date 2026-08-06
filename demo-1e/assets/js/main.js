// CarCleaningNL demo-1e
(function () {
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Lenis: vloeiend scrollen ----------
     Lenis stuurt de nátieve scrollpositie aan, dus position:sticky,
     IntersectionObserver en scroll-margin blijven gewoon werken.
     Bij prefers-reduced-motion slaan we het hele ding over. */
  var lenis = null;
  if (!reduced && typeof window.Lenis === "function") {
    lenis = new window.Lenis({
      duration: 1.05,
      // ease-out-expo: snel weg, zacht aankomen. Geen veer, geen bounce.
      easing: function (t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); },
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
      syncTouch: false, // op de telefoon voelt het nátieve scrollen beter
    });
    var raf = function (time) { lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);

    // Ankers via Lenis, met ruimte voor de plakbalk.
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      a.addEventListener("click", function (ev) {
        var target = document.querySelector(id);
        if (!target) return;
        ev.preventDefault();
        var navEl = document.getElementById("nav");
        lenis.scrollTo(target, { offset: navEl ? -(navEl.offsetHeight + 16) : -24 });
        history.pushState(null, "", id);
      });
    });
  }

  /* ---------- Sticky nav hairline (IO sentinel, no scroll listener) ---------- */
  var nav = document.getElementById("nav");
  if (nav) {
    var sentinel = document.createElement("div");
    sentinel.style.cssText = "position:absolute;top:0;height:1px;width:1px;";
    document.body.prepend(sentinel);
    new IntersectionObserver(function (entries) {
      nav.classList.toggle("is-scrolled", !entries[0].isIntersecting);
    }).observe(sentinel);
  }

  /* ---------- Mobile menu ---------- */
  var burger = document.getElementById("burger");
  var menu = document.getElementById("mobilemenu");
  if (burger && menu) {
    burger.addEventListener("click", function () {
      var open = burger.getAttribute("aria-expanded") === "true";
      burger.setAttribute("aria-expanded", String(!open));
      burger.setAttribute("aria-label", open ? "Menu openen" : "Menu sluiten");
      menu.hidden = open;
      document.body.style.overflow = open ? "" : "hidden";
    });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        burger.setAttribute("aria-expanded", "false");
        menu.hidden = true;
        document.body.style.overflow = "";
      });
    });
  }

  /* ---------- WhatsApp-knop pas tonen voorbij de hero ---------- */
  var wa = document.querySelector(".wa");
  var heroEl = document.querySelector(".hero");
  if (wa && heroEl) {
    new IntersectionObserver(function (entries) {
      wa.classList.toggle("is-on", entries[0].intersectionRatio < 0.4);
    }, { threshold: [0, 0.4, 1] }).observe(heroEl);
  } else if (wa) {
    wa.classList.add("is-on");
  }

  /* ---------- Parallax op de herofoto ----------
     De foto staat iets ruimer in zijn frame en schuift een fractie mee met
     het scrollen: genoeg om diepte te geven, te weinig om op te vallen. */
  var frame = document.querySelector(".hero__frame");
  if (frame && !reduced) {
    var photo = frame.querySelector(".hero__photo");
    var parallaxTicking = false;
    var applyParallax = function () {
      parallaxTicking = false;
      var r = frame.getBoundingClientRect();
      if (r.bottom < -200 || r.top > window.innerHeight + 200) return;
      // -1 (frame onder beeld) .. 1 (frame boven beeld)
      var p = (r.top + r.height / 2 - window.innerHeight / 2) / (window.innerHeight / 2 + r.height / 2);
      photo.style.setProperty("--par", (Math.max(-1, Math.min(1, p)) * -3.2).toFixed(2) + "%");
    };
    var queueParallax = function () {
      if (parallaxTicking) return;
      parallaxTicking = true;
      requestAnimationFrame(applyParallax);
    };
    if (lenis) lenis.on("scroll", queueParallax);
    else window.addEventListener("scroll", queueParallax, { passive: true });
    window.addEventListener("resize", queueParallax);
    applyParallax();
  }

  /* ---------- Cijfers tellen op zodra ze in beeld komen ---------- */
  var stats = document.querySelector(".stats");
  if (stats && !reduced) {
    var countUp = function (el) {
      var text = el.textContent;
      var m = text.match(/^(\D*)(\d+(?:[.,]\d+)?)(\D*)$/);
      if (!m) return;
      var prefix = m[1], suffix = m[3];
      var decimals = (m[2].split(/[.,]/)[1] || "").length;
      var sep = m[2].indexOf(",") > -1 ? "," : ".";
      var end = parseFloat(m[2].replace(",", "."));
      var t0 = null, dur = 900;
      var step = function (t) {
        if (!t0) t0 = t;
        var p = Math.min((t - t0) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 4);
        el.textContent = prefix + (end * eased).toFixed(decimals).replace(".", sep) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      el.textContent = prefix + (0).toFixed(decimals).replace(".", sep) + suffix;
      requestAnimationFrame(step);
    };
    new IntersectionObserver(function (entries, obs) {
      if (!entries[0].isIntersecting) return;
      obs.disconnect();
      stats.querySelectorAll("strong").forEach(function (el, i) {
        setTimeout(function () { countUp(el); }, i * 70);
      });
    }, { threshold: 0.4 }).observe(stats);
  }

  /* ---------- Reveal on scroll ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if (reduced) {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Before/after sliders ----------
     The top layer is clipped to --split; its inner image is sized to the
     container width so both photos stay aligned. */
  document.querySelectorAll("[data-ba]").forEach(function (root) {
    var handle = root.querySelector(".ba__handle");
    var topwrap = root.querySelector(".ba__topwrap");
    var topimg = topwrap.querySelector("img");

    function sync() { topimg.style.width = root.clientWidth + "px"; }
    sync();
    new ResizeObserver(sync).observe(root);

    function setSplit(pct) {
      pct = Math.max(4, Math.min(96, pct));
      root.style.setProperty("--split", pct + "%");
      handle.setAttribute("aria-valuenow", Math.round(pct));
    }

    function fromEvent(ev) {
      var rect = root.getBoundingClientRect();
      var x = (ev.touches ? ev.touches[0].clientX : ev.clientX) - rect.left;
      setSplit((x / rect.width) * 100);
    }

    var dragging = false;
    root.addEventListener("pointerdown", function (ev) {
      dragging = true;
      root.setPointerCapture(ev.pointerId);
      fromEvent(ev);
    });
    root.addEventListener("pointermove", function (ev) { if (dragging) fromEvent(ev); });
    root.addEventListener("pointerup", function () { dragging = false; });
    root.addEventListener("pointercancel", function () { dragging = false; });

    handle.addEventListener("keydown", function (ev) {
      var cur = parseFloat(handle.getAttribute("aria-valuenow")) || 50;
      if (ev.key === "ArrowLeft") { setSplit(cur - 5); ev.preventDefault(); }
      if (ev.key === "ArrowRight") { setSplit(cur + 5); ev.preventDefault(); }
    });

    // One-time affordance nudge when the slider first scrolls into view,
    // so visitors see the line can be dragged. Skipped after interaction.
    if (!reduced) {
      var nudged = false;
      var interacted = false;
      root.addEventListener("pointerdown", function () { interacted = true; }, { once: true });
      new IntersectionObserver(function (entries, obs) {
        if (!entries[0].isIntersecting || nudged) return;
        nudged = true;
        obs.disconnect();
        if (interacted) return;
        var t0 = null, dur = 1100;
        function frame(t) {
          if (interacted) { setSplit(50); return; }
          if (!t0) t0 = t;
          var p = Math.min((t - t0) / dur, 1);
          // 50 -> 43 -> 50 with a smooth sine sweep
          setSplit(50 - Math.sin(p * Math.PI) * 7);
          if (p < 1) requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
      }, { threshold: 0.5 }).observe(root);
    }
  });
})();
