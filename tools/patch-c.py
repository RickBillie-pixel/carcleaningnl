# Ronde C batch-patch voor demo-1d
import io

def patch(path, pairs):
    s = io.open(path, encoding='utf-8').read()
    for old, new in pairs:
        if old not in s:
            print('MISS:', path, '->', old[:60].replace('\n', ' '))
        s = s.replace(old, new)
    io.open(path, 'w', encoding='utf-8').write(s)

# ---------- showcase.js: pin weg -> scrub op natuurlijke scroll ----------
patch('demo-1d/assets/js/showcase.js', [
    ("""    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "+=70%",
        pin: true,
        scrub: 0.6,
        anticipatePin: 1,
      },
    });
    tl.to(l1, { xPercent: -7, ease: "none" }, 0)
      .to(l2, { xPercent: 7, ease: "none" }, 0)
      .to(car, { scale: 1.26, yPercent: -56, rotate: 0, ease: "none" }, 0)
      .to(sides, { opacity: 0, y: -14, ease: "none" }, 0);""",
     """    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom 35%",
        scrub: 0.6,
      },
    });
    tl.to(l1, { xPercent: -6, ease: "none" }, 0)
      .to(l2, { xPercent: 6, ease: "none" }, 0)
      .to(car, { scale: 1.16, yPercent: -30, rotate: 0, ease: "none" }, 0)
      .to(sides, { opacity: 0, y: -14, ease: "none" }, 0);"""),
])

# ---------- index.html ----------
patch('demo-1d/index.html', [
    ('<div><strong data-count="5,0">0,0</strong><span>uit 5,0 beoordeeld</span></div>',
     '<div><strong>5,0</strong><span>uit 5,0 beoordeeld</span></div>'),
    ('<h2 class="reveal">Al 500+ klanten gingen je voor.<br>Binnen 24 uur reactie.</h2>',
     '<h2 class="reveal">Al 500+ klanten gingen je&nbsp;voor.<br>Binnen 24 uur reactie.</h2>'),
    ('      <div class="stats reveal">',
     '      <p class="duo__more reveal"><a class="arrowlink" href="#prijzen">Bekijk alle 12 behandelingen en prijzen</a></p>\n      <div class="stats reveal">'),
    ('<a class="btn btn--red" href="afspraak.html?dienst=polijsten">Polijsten &euro;179</a>',
     '<a class="btn btn--line" href="afspraak.html?dienst=polijsten">Polijsten &euro;179</a>'),
    ('<a class="btn btn--red" href="afspraak.html?dienst=coating">Keramische coating &euro;899</a>',
     '<a class="btn btn--line" href="afspraak.html?dienst=coating">Keramische coating &euro;899</a>'),
    ('<a class="hero__telline" href="tel:+31647421988">Of bel +31 6 47421988</a>',
     '<a class="hero__telline" href="tel:+31647421988">Of bel <u>+31 6 47421988</u></a>'),
    ("""  <section class="feature">
    <div class="container feature__grid feature__grid--rev">
      <figure class="feature__media reveal">
        <img src="assets/img/n-coating.webp" alt="Waterdruppels parelen op keramisch gecoate lak" loading="lazy" data-parallax="22">
      </figure>
      <div class="feature__copy reveal">
        <h2>Jaren <em>beschermd.</em></h2>
        <p>Keramische coating legt een beschermlaag over de lak: extra vuilafstotend, en de auto blijft langer schoon.</p>
        <a class="btn btn--line" href="afspraak.html?dienst=coating">Keramische coating &euro;899</a>
      </div>
    </div>
  </section>""",
     """  <section class="feature feature--bleed">
    <img class="feature__bg" src="assets/img/n-coating.webp" alt="" loading="lazy" data-parallax="26">
    <div class="container">
      <div class="feature__copy reveal">
        <h2>Jaren <em>beschermd.</em></h2>
        <p>Keramische coating legt een beschermlaag over de lak: extra vuilafstotend, en de auto blijft langer schoon.</p>
        <a class="btn btn--line" href="afspraak.html?dienst=coating">Keramische coating &euro;899</a>
      </div>
    </div>
  </section>"""),
])

# ---------- style.css ----------
patch('demo-1d/assets/style.css', [
    ('.ba__topwrap img { width: auto; height: 100%; max-width: none; }',
     '.ba__topwrap img { height: 100%; max-width: none; object-fit: cover; object-position: center; }'),
    ('.verschil__inner { max-width: 1240px; margin: 0 auto; }',
     '.verschil__inner { max-width: 1120px; margin: 0 auto; }'),
    ('  width: clamp(150px, 15.5vw, 220px);',
     '  width: clamp(140px, 13vw, 196px);'),
    ('  position: absolute; top: clamp(0.5rem, 3vw, 2.4rem); z-index: 3;',
     '  position: absolute; top: clamp(1.2rem, 3.5vw, 3rem); z-index: 3;'),
    ('  color: var(--muted); line-height: 1.5;',
     '  color: #3d5260; line-height: 1.5;'),
    ('background: url("img/n-coating.webp") center 38% / cover no-repeat;',
     'background: url("img/n-hero.webp") 62% 55% / cover no-repeat;'),
    (""".hero__deal {
  display: flex; align-items: baseline; gap: 1rem; flex-wrap: wrap;""",
     """.hero__deal {
  display: flex; align-items: baseline; justify-content: center; gap: 1rem; flex-wrap: wrap;"""),
    ('/* ---------- Reveal ---------- */',
     """@media (min-width: 1920px) {
  .hero__stage { max-width: 1720px; min-height: 560px; }
  .hero__line1, .hero__line2 { font-size: clamp(11.5rem, 9.4vw, 15.5rem); }
  .hero__car { width: clamp(196px, 11vw, 300px); }
  .hero__prices, .hero__cta { max-width: 1720px; }
}

/* ---------- Reveal ---------- */"""),
    ("""  background: var(--red); color: var(--white);
  border-radius: var(--r);
  padding: 1.3rem 1rem;
  box-shadow: 0 16px 36px -16px rgba(27, 135, 212, 0.6);""",
     """  background: var(--navy); color: var(--white);
  border-radius: var(--r);
  padding: 1.3rem 1rem;"""),
    ('.exp__stats span { font-size: 0.85rem; color: #cfe7f7; }',
     '.exp__stats span { font-size: 0.85rem; color: #9fc0d4; }'),
    ('.feature--tint { background: var(--cream); }',
     """.feature--tint { background: var(--cream); }
.feature--bleed {
  position: relative; overflow: hidden;
  background: var(--navy); color: var(--white);
}
.feature--bleed .feature__bg {
  position: absolute; inset: 0; width: 100%; height: 100%;
  object-fit: cover; opacity: 0.5;
}
.feature--bleed .container { position: relative; }
.feature--bleed h2 { color: var(--white); }
.feature--bleed h2 em { color: #6cc6ff; }
.feature--bleed .feature__copy p { color: #c6dcea; }
.feature--bleed .btn--line { color: var(--white); border-color: rgba(255,255,255,0.6); }
.feature--bleed .btn--line:hover { background: var(--white); color: var(--navy); }"""),
    (""".stats {
  margin-top: 3.4rem;""",
     """.duo__more { text-align: center; margin-top: 1.8rem; }
.stats {
  margin-top: 3rem;"""),
    ("""  .hero__car {
    position: relative; left: auto; top: auto;
    transform: rotate(7deg);
    width: min(44vw, 190px);
    margin: -2.2rem auto 0.6rem;
  }""",
     """  .hero__car {
    position: relative; left: auto; top: auto;
    transform: rotate(7deg);
    width: min(38vw, 165px);
    margin: -1.1rem auto 0.6rem;
  }"""),
    ("""@media (max-width: 700px) {
  .btn--nav { padding: 0.55rem 0.9rem; font-size: 0.78rem; }""",
     """@media (max-width: 700px) {
  main { padding-bottom: 76px; }
  .btn--nav { padding: 0.55rem 0.9rem; font-size: 0.78rem; }"""),
    ('.nav__lockup { height: 40px; width: auto; }',
     '.nav__lockup { height: 42px; width: auto; }'),
])

print('patch C klaar')
