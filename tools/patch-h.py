# Ronde H: cinematische full-bleed hero (Porsche-referentie) + dealcards
import io

def read(p): return io.open(p, encoding='utf-8').read()
def write(p, s): io.open(p, 'w', encoding='utf-8').write(s)

# ---------- HTML: hero vervangen ----------
p = 'demo-1d/index.html'
s = read(p)
old_hero_start = s.index('  <!-- ============ HERO')
old_hero_end = s.index('  <!-- ============ ONZE BESTE BEHANDELINGEN')
new_hero = '''  <!-- ============ HERO: cinematisch full-bleed ============ -->
  <section class="hero">
    <img class="hero__bg" src="assets/img/n-hero.webp" alt="" fetchpriority="high">
    <div class="hero__scrim" aria-hidden="true"></div>
    <div class="hero__frame">
      <div class="hero__head">
        <h1>Jouw auto, alsof &rsquo;ie<br>uit de showroom komt.</h1>
        <div class="hero__cta">
          <a class="btn btn--red btn--big" data-magnet href="afspraak.html">Plan je afspraak</a>
          <a class="hero__telline" href="tel:+31647421988">Of bel <u>+31 6 47421988</u></a>
        </div>
      </div>
      <p class="hero__sub">Premium detailing, interieur en exterieur.<br>Wij halen je auto op in de regio Eindhoven.</p>
      <div class="hero__deals">
        <a class="dealcard" href="afspraak.html?dienst=interieur">
          <span class="dealcard__label">Interieur</span>
          <span class="dealcard__price">&euro;139</span>
          <span class="dealcard__desc">dieptereiniging, weer als nieuw</span>
          <span class="dealcard__arrow" aria-hidden="true">&#8599;</span>
        </a>
        <a class="dealcard" href="afspraak.html?dienst=compleet">
          <span class="dealcard__label">Compleet</span>
          <span class="dealcard__price">&euro;239</span>
          <span class="dealcard__desc">interieur en exterieur in &eacute;&eacute;n afspraak</span>
          <span class="dealcard__arrow" aria-hidden="true">&#8599;</span>
        </a>
        <a class="dealcard dealcard--ghost" href="#prijzen">
          <span class="dealcard__label">Alle prijzen</span>
          <span class="dealcard__price">12</span>
          <span class="dealcard__desc">behandelingen, vanaf &euro;59</span>
          <span class="dealcard__arrow" aria-hidden="true">&#8599;</span>
        </a>
      </div>
    </div>
  </section>

'''
s = s[:old_hero_start] + new_hero + s[old_hero_end:]
# nav: twee lockups (wit boven foto, navy na scroll)
s = s.replace('<img src="assets/logo-h-navy.svg" alt="CarCleaningNL, interieur en exterieur" class="nav__lockup">',
              '<img src="assets/logo-h-white.svg" alt="CarCleaningNL, interieur en exterieur" class="nav__lockup nav__lockup--light">\n      <img src="assets/logo-h-navy.svg" alt="" aria-hidden="true" class="nav__lockup nav__lockup--dark">')
write(p, s)
print('hero HTML + nav vervangen')

# ---------- CSS ----------
p = 'demo-1d/assets/style.css'
s = read(p)
start = s.index('/* ---------- Hero ---------- */')
end = s.index('/* ---------- Sections ---------- */')
new_css = '''/* ---------- Hero: cinematisch full-bleed ---------- */
.hero {
  position: relative;
  min-height: calc(100dvh - 72px);
  display: flex;
  overflow: hidden;
  background: var(--navy);
}
.hero__bg {
  position: absolute; inset: 0; width: 100%; height: 100%;
  object-fit: cover; object-position: 68% center;
  will-change: transform;
}
.hero__scrim {
  position: absolute; inset: 0;
  background:
    linear-gradient(to right, rgba(0, 18, 28, 0.74) 0%, rgba(0, 18, 28, 0.32) 46%, rgba(0, 18, 28, 0.06) 70%),
    linear-gradient(to top, rgba(0, 18, 28, 0.85) 4%, rgba(0, 18, 28, 0.22) 32%, rgba(0, 18, 28, 0.16) 100%);
}
.hero__frame {
  position: relative; z-index: 1;
  width: 100%; max-width: 1500px; margin: 0 auto;
  padding: clamp(2rem, 5vh, 4rem) var(--gutter) clamp(1.4rem, 3vh, 2.2rem);
  display: flex; flex-direction: column;
}
.hero__head { max-width: 760px; }
.hero h1 {
  font-variation-settings: "wdth" 92;
  font-weight: 800; text-transform: none;
  font-size: clamp(2.2rem, 4.8vw, 4.5rem);
  line-height: 1.04; letter-spacing: -0.02em;
  color: var(--white);
}
.hero__cta { margin-top: 1.8rem; display: flex; align-items: center; gap: 1.4rem; flex-wrap: wrap; }
.hero__telline { color: rgba(255,255,255,0.85); font-weight: 600; text-decoration: none; }
.hero__telline:hover { color: var(--white); }
.hero__telline u { text-underline-offset: 3px; }
.hero__sub {
  margin-top: auto;
  align-self: flex-end; text-align: right;
  color: rgba(255,255,255,0.92);
  font-size: clamp(1.02rem, 1.3vw, 1.25rem);
  line-height: 1.6;
  padding-bottom: clamp(1.2rem, 3vh, 2rem);
}
.hero__deals {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;
}
.dealcard {
  position: relative;
  display: flex; flex-direction: column; gap: 0.15rem;
  background: var(--white);
  border-radius: var(--r);
  padding: 1.15rem 3.2rem 1.15rem 1.4rem;
  text-decoration: none; color: var(--navy);
  box-shadow: 0 22px 50px -22px rgba(0, 18, 28, 0.55);
  transition: transform 0.25s var(--ease), box-shadow 0.25s var(--ease);
}
@media (hover: hover) and (pointer: fine) {
  .dealcard:hover { transform: translateY(-4px); }
}
.dealcard__label {
  font-variation-settings: "wdth" 80;
  font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em;
  font-size: 0.78rem; color: var(--muted);
}
.dealcard__price {
  font-family: "Archivo", sans-serif;
  font-variation-settings: "wdth" 68;
  font-weight: 900; font-size: clamp(1.9rem, 2.6vw, 2.5rem); line-height: 1;
  color: var(--red);
}
.dealcard__desc { color: var(--muted); font-size: 0.9rem; line-height: 1.4; }
.dealcard__arrow {
  position: absolute; top: 1rem; right: 1rem;
  width: 36px; height: 36px;
  display: grid; place-items: center;
  background: var(--red); color: var(--white);
  border-radius: 50%;
  font-size: 1.05rem;
  transition: background 0.2s var(--ease);
}
.dealcard:hover .dealcard__arrow { background: var(--red-deep); }
.dealcard--ghost {
  background: rgba(255, 255, 255, 0.12); color: var(--white);
  backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.25);
}
.dealcard--ghost .dealcard__label { color: rgba(255,255,255,0.78); }
.dealcard--ghost .dealcard__price { color: var(--white); }
.dealcard--ghost .dealcard__desc { color: rgba(255,255,255,0.78); }

'''
s = s[:start] + new_css + s[end:]

# nav transparant boven de foto, wit na scroll
s = s.replace('''.nav {
  position: sticky; top: 0; z-index: 50;
  background: color-mix(in srgb, var(--white) 90%, transparent);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid transparent;
  transition: border-color 0.3s var(--ease);
}
.nav.is-scrolled { border-bottom-color: var(--hairline); }''',
'''.nav {
  position: sticky; top: 0; z-index: 50;
  background: transparent;
  border-bottom: 1px solid transparent;
  transition: background 0.3s var(--ease), border-color 0.3s var(--ease);
}
.nav.is-scrolled {
  background: color-mix(in srgb, var(--white) 92%, transparent);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom-color: var(--hairline);
}
.nav__lockup--light { display: block; }
.nav__lockup--dark { display: none; }
.nav.is-scrolled .nav__lockup--light { display: none; }
.nav.is-scrolled .nav__lockup--dark { display: block; }
.nav:not(.is-scrolled) .nav__links a { color: rgba(255,255,255,0.85); }
.nav:not(.is-scrolled) .nav__links a:hover { color: #ffffff; }
.nav:not(.is-scrolled) .nav__tel { color: #ffffff; }
.nav:not(.is-scrolled) .nav__burger span { background: #ffffff; }''')

# mobiele hero-regels van de oude compositie vervangen
old_mob = '''  .hero { min-height: calc(100dvh - 72px); }
  .hero__stage { min-height: 0; padding-top: 0.9rem; padding-bottom: 0.6rem; }
  .hero__side { position: static; max-width: none; text-align: left; margin-bottom: 0.4rem; font-size: 0.78rem; }
  .hero__side--right { margin-bottom: 1.1rem; }
  .hero__side br { display: none; }
  .hero__line1, .hero__line2 { font-size: clamp(3.3rem, 17vw, 4.5rem); }
  .hero__car {
    position: relative; left: auto; top: auto;
    transform: rotate(7deg);
    width: min(40vw, 168px);
    max-height: 30vh;
    margin: -0.8rem auto 0.3rem;
  }
  .hero__prices { grid-template-columns: 1fr; }
  .hero__deal + .hero__deal { border-left: none; border-top: 1px solid var(--hairline); }
  .hero__deal { padding: 0.8rem var(--gutter); }
  .hero__dealdesc { display: none; }'''
new_mob = '''  .hero { min-height: calc(100dvh - 72px); }
  .hero__bg { object-position: 62% center; }
  .hero h1 { font-size: clamp(1.9rem, 8.4vw, 2.4rem); }
  .hero__sub { align-self: flex-start; text-align: left; font-size: 0.98rem; padding-bottom: 1rem; }
  .hero__deals { grid-template-columns: 1fr 1fr; gap: 0.7rem; }
  .dealcard { padding: 0.95rem 2.6rem 0.95rem 1.05rem; }
  .dealcard--ghost { grid-column: 1 / -1; flex-direction: row; align-items: baseline; gap: 0.6rem; padding: 0.85rem 2.6rem 0.85rem 1.05rem; }
  .dealcard--ghost .dealcard__price { font-size: 1.3rem; }
  .hero__cta .btn { flex: 1 1 auto; }'''
if old_mob in s:
    s = s.replace(old_mob, new_mob)
else:
    print('MISS: mobiele hero-regels')

# 1920-blok van oude compositie opruimen
old_1920 = '''@media (min-width: 1920px) {
  .hero__stage { max-width: 1680px; }
  .hero__line1, .hero__line2 { font-size: min(13.2rem, 27vh); }
  .hero__car { width: 224px; }
}'''
if old_1920 in s:
    s = s.replace(old_1920, '''@media (min-width: 1920px) {
  .hero__frame { max-width: 1720px; }
}''')
else:
    print('MISS: 1920-blok')

write(p, s)
print('hero CSS vervangen')

# ---------- showcase.js: filmische bg-zoom + head-parallax ----------
p = 'demo-1d/assets/js/showcase.js'
s = read(p)
old_js = '''  mm.add("(min-width: 1025px)", function () {
    var stage = document.querySelector(".hero__stage");
    var car = document.querySelector(".hero__car");
    var l1 = document.querySelector(".hero__line1");
    var l2 = document.querySelector(".hero__line2");
    var sides = gsap.utils.toArray(".hero__side");
    if (!stage || !car) return;

    var tl = gsap.timeline({
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
      .to(sides, { opacity: 0, y: -14, ease: "none" }, 0);

    return function () { tl.scrollTrigger && tl.scrollTrigger.kill(); tl.kill(); };
  });'''
new_js = '''  mm.add("(min-width: 1025px)", function () {
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
  });'''
if old_js in s:
    s = s.replace(old_js, new_js)
else:
    print('MISS: showcase hero-tween')
write(p, s)
print('showcase.js bijgewerkt')
