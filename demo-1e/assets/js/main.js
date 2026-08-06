// CarCleaningNL demo-1 "Porselein"
(function () {
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
