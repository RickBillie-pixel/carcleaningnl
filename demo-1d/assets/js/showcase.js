// demo-1d showcase layer: scroll-choreografie (GSAP), tellers,
// magnetische CTA en parallax. Alles achter reduced-motion guards;
// zonder GSAP of met reduced-motion valt alles terug op statisch.
(function () {
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

  /* ---------- Stats tellers (feedback: cijfers landen bij aankomst) ---------- */
  function countUp(el) {
    var target = el.getAttribute("data-count");
    var prefix = el.getAttribute("data-prefix") || "";
    var suffix = el.getAttribute("data-suffix") || "";
    var isDecimal = target.indexOf(",") !== -1;
    var end = parseFloat(target.replace(",", "."));
    var dur = 1000, t0 = null;
    function frame(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = end * eased;
      el.textContent = prefix + (isDecimal ? val.toFixed(1).replace(".", ",") : Math.round(val)) + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  var stats = document.querySelectorAll("[data-count]");
  if (reduced) {
    stats.forEach(function (el) {
      el.textContent = (el.getAttribute("data-prefix") || "") + el.getAttribute("data-count") + (el.getAttribute("data-suffix") || "");
    });
  } else {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { countUp(e.target); cio.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    stats.forEach(function (el) { cio.observe(el); });
  }

  /* ---------- Magnetische primaire CTA (premium tactiliteit) ---------- */
  if (fine && !reduced) {
    document.querySelectorAll("[data-magnet]").forEach(function (btn) {
      var raf = null, tx = 0, ty = 0, cx = 0, cy = 0;
      function tick() {
        tx += (cx - tx) * 0.18;
        ty += (cy - ty) * 0.18;
        btn.style.transform = "translate(" + tx.toFixed(2) + "px," + ty.toFixed(2) + "px)";
        if (Math.abs(cx - tx) > 0.2 || Math.abs(cy - ty) > 0.2) raf = requestAnimationFrame(tick);
        else raf = null;
      }
      function schedule() { if (!raf) raf = requestAnimationFrame(tick); }
      btn.addEventListener("pointermove", function (ev) {
        var r = btn.getBoundingClientRect();
        cx = (ev.clientX - r.left - r.width / 2) * 0.28;
        cy = (ev.clientY - r.top - r.height / 2) * 0.28;
        schedule();
      });
      btn.addEventListener("pointerleave", function () { cx = 0; cy = 0; schedule(); });
    });
  }

  if (!hasGsap || reduced) return;
  gsap.registerPlugin(ScrollTrigger);

  var mm = gsap.matchMedia();

  /* ---------- Hero-choreografie: titel splijt, auto zoomt (storytelling:
     van poster naar close-up, de overgang de sectie in) ---------- */
  mm.add("(min-width: 1025px)", function () {
    var bg = document.querySelector(".hero__bg");
    var head = document.querySelector(".hero__head");
    if (!bg) return;

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom 30%",
        scrub: 0.6,
      },
    });
    tl.fromTo(bg, { scale: 1.06 }, { scale: 1.0, ease: "none" }, 0)
      .to(head, { yPercent: -18, opacity: 0.35, ease: "none" }, 0);

    return function () { tl.scrollTrigger && tl.scrollTrigger.kill(); tl.kill(); };
  });

  /* ---------- Parallax in de bewijskamer en features ---------- */
  mm.add("(min-width: 701px)", function () {
    var cleanups = [];
    gsap.utils.toArray("[data-parallax]").forEach(function (el) {
      var amount = parseFloat(el.getAttribute("data-parallax")) || 30;
      var tween = gsap.fromTo(el, { y: amount }, {
        y: -amount, ease: "none",
        scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.8 },
      });
      cleanups.push(function () { tween.scrollTrigger && tween.scrollTrigger.kill(); tween.kill(); });
    });
    return function () { cleanups.forEach(function (fn) { fn(); }); };
  });

  /* ---------- Bewijskamer: het licht dimt als je binnenkomt
     (een bewust kleurblok-moment, eenmalig per pagina) ---------- */
  var proof = document.querySelector(".verschil");
  if (proof) {
    gsap.fromTo(proof,
      { "--pv-bg": "#f5f7f9", "--pv-ink": "#002538", "--pv-muted": "#4c6272", "--pv-accent": "#1b87d4" },
      {
        "--pv-bg": "#002538", "--pv-ink": "#ffffff", "--pv-muted": "#9fc0d4", "--pv-accent": "#6cc6ff",
        ease: "none",
        scrollTrigger: { trigger: proof, start: "top 78%", end: "top 26%", scrub: true },
      });
  }
})();

/* ---------- Sticky boekbalk op mobiel (verschijnt na de hero) ---------- */
(function () {
  "use strict";
  var bar = document.getElementById("stickycta");
  var hero = document.querySelector(".hero");
  if (!bar || !hero) return;
  bar.hidden = false;
  bar.setAttribute("data-hidden", "true");
  new IntersectionObserver(function (entries) {
    bar.setAttribute("data-hidden", entries[0].isIntersecting ? "true" : "false");
  }, { threshold: 0.1 }).observe(hero);
})();
