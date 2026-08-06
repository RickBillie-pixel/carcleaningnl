// CarCleaningNL demo-2 "Acid Werkplaats"
(function () {
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap = typeof window.gsap !== "undefined";
  document.documentElement.classList.add("js");

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

  /* ---------- Price ladder: drag + arrow controls (works with or without GSAP) ---------- */
  (function () {
    var track = document.getElementById("laddertrack");
    if (!track) return;
    var prev = document.getElementById("ladderprev");
    var next = document.getElementById("laddernext");
    function cardStep() {
      var rung = track.querySelector(".rung");
      return rung ? rung.offsetWidth + 20 : 400;
    }
    function updateButtons() {
      if (!prev || !next) return;
      prev.disabled = track.scrollLeft <= 4;
      next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 4;
    }
    if (prev && next) {
      prev.addEventListener("click", function () { track.scrollBy({ left: -cardStep(), behavior: reduced ? "auto" : "smooth" }); });
      next.addEventListener("click", function () { track.scrollBy({ left: cardStep(), behavior: reduced ? "auto" : "smooth" }); });
      track.addEventListener("scroll", updateButtons, { passive: true });
      updateButtons();
    }
    // pointer drag to scroll (desktop mouse)
    var down = false, startX = 0, startScroll = 0, moved = false;
    track.addEventListener("pointerdown", function (ev) {
      if (ev.pointerType !== "mouse") return;
      down = true; moved = false;
      startX = ev.clientX; startScroll = track.scrollLeft;
      track.classList.add("is-dragging");
    });
    window.addEventListener("pointermove", function (ev) {
      if (!down) return;
      var dx = ev.clientX - startX;
      if (Math.abs(dx) > 5) moved = true;
      track.scrollLeft = startScroll - dx;
    });
    window.addEventListener("pointerup", function () {
      down = false;
      track.classList.remove("is-dragging");
    });
    // prevent link clicks after a drag
    track.addEventListener("click", function (ev) {
      if (moved) { ev.preventDefault(); moved = false; }
    }, true);
  })();

  /* ---------- Before/after slider ---------- */
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
      setSplit(((ev.clientX - rect.left) / rect.width) * 100);
    }
    var dragging = false;
    root.addEventListener("pointerdown", function (ev) { dragging = true; root.setPointerCapture(ev.pointerId); fromEvent(ev); });
    root.addEventListener("pointermove", function (ev) { if (dragging) fromEvent(ev); });
    root.addEventListener("pointerup", function () { dragging = false; });
    root.addEventListener("pointercancel", function () { dragging = false; });
    handle.addEventListener("keydown", function (ev) {
      var cur = parseFloat(handle.getAttribute("aria-valuenow")) || 50;
      if (ev.key === "ArrowLeft") { setSplit(cur - 5); ev.preventDefault(); }
      if (ev.key === "ArrowRight") { setSplit(cur + 5); ev.preventDefault(); }
    });

    // One-time affordance nudge on first view; skipped after interaction.
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
          setSplit(50 - Math.sin(p * Math.PI) * 7);
          if (p < 1) requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
      }, { threshold: 0.5 }).observe(root);
    }
  });

  /* ---------- Count-up stats (feedback: numbers land as you arrive) ---------- */
  function countUp(el) {
    var target = el.getAttribute("data-count");
    var prefix = el.getAttribute("data-prefix") || "";
    var suffix = el.getAttribute("data-suffix") || "";
    var isDecimal = target.indexOf(",") !== -1;
    var end = parseFloat(target.replace(",", "."));
    var dur = 1100, t0 = null;
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
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { countUp(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    stats.forEach(function (el) { io.observe(el); });
  }

  if (!hasGsap || reduced) {
    // Static fallback: show hero lines
    document.querySelectorAll(".hero__line").forEach(function (l) { l.style.transform = "none"; });
    document.documentElement.classList.remove("js");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Hero: lines rise on load (storytelling: the reveal) ---------- */
  document.querySelectorAll(".hero__line").forEach(function (line) {
    var span = document.createElement("span");
    span.style.display = "inline-block";
    while (line.firstChild) span.appendChild(line.firstChild);
    line.appendChild(span);
  });
  gsap.set(".hero__line > span", { y: "110%" });
  gsap.to(".hero__line > span", { y: 0, duration: 0.9, ease: "power4.out", stagger: 0.09, delay: 0.1 });
  gsap.from(".hero__sub, .hero__cta", { opacity: 0, y: 18, duration: 0.7, ease: "power2.out", delay: 0.55, stagger: 0.08 });

  /* ---------- Section reveals continue below; ladder is a snap strip ---------- */

  /* ---------- Section reveals (hierarchy: content arrives in order) ---------- */
  gsap.utils.toArray(".section__title, .section__intro, .bewijs__grid > *, .werk__item, .haal__copy > *, .over__inner > *").forEach(function (el) {
    gsap.from(el, {
      opacity: 0, y: 26, duration: 0.7, ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 88%", once: true }
    });
  });
})();
