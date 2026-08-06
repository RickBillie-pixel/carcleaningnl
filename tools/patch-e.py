# Ronde E: rustcompositie exact naar de referentie (compact, licht, gebonden)
import io

def patch(path, pairs):
    s = io.open(path, encoding='utf-8').read()
    for old, new in pairs:
        if old not in s:
            print('MISS:', path, '->', old[:70].replace('\n', ' '))
        s = s.replace(old, new)
    io.open(path, 'w', encoding='utf-8').write(s)

# ---------- HTML: band-wrapper om prijsstrook + CTA ----------
patch('demo-1d/index.html', [
    ('''    <div class="hero__prices">''',
     '''    <div class="heroband">
    <div class="hero__prices">'''),
    ('''    <div class="hero__cta">
      <a class="btn btn--red btn--big" data-magnet href="afspraak.html">Plan je afspraak</a>
      <a class="hero__telline" href="tel:+31647421988">Of bel <u>+31 6 47421988</u></a>
    </div>
  </section>''',
     '''    <div class="hero__cta">
      <a class="btn btn--red btn--big" data-magnet href="afspraak.html">Plan je afspraak</a>
      <a class="hero__telline" href="tel:+31647421988">Of bel <u>+31 6 47421988</u></a>
    </div>
    </div>
  </section>'''),
])

# ---------- CSS ----------
patch('demo-1d/assets/style.css', [
    # compacte titel, strak op elkaar zoals de referentie
    ('''  font-size: clamp(3.6rem, 13.5vw, 11.5rem);
  line-height: 0.83;
  text-align: center;''',
     '''  font-size: clamp(3.4rem, 11.4vw, 9.8rem);
  line-height: 0.8;
  text-align: center;'''),
    # ghost terug naar licht (referentie-getrouw); geen donkere vulling
    ('''.hero__line2 {
  color: var(--ghost); position: relative; z-index: 1;
}
@supports ((-webkit-background-clip: text) or (background-clip: text)) {
  .hero__line2 {
    background: url("img/n-hero.webp") 62% 55% / cover no-repeat;
    -webkit-background-clip: text; background-clip: text;
    color: transparent;
    opacity: 0.9;
  }
}''',
     '''.hero__line2 { color: var(--ghost); position: relative; z-index: 1; margin-top: -0.04em; }'''),
    # stage compacter en gebonden
    ('''  min-height: clamp(320px, 40vw, 500px);''',
     '''  min-height: clamp(300px, 34vw, 440px);'''),
    ('''.hero__stage {
  position: relative;
  max-width: 1240px; margin: 0 auto;''',
     '''.hero__stage {
  position: relative;
  max-width: 1360px; margin: 0 auto;'''),
    # auto kleiner, tussen de regels
    ('''  width: clamp(140px, 13vw, 196px);''',
     '''  width: clamp(128px, 11.2vw, 168px);'''),
    # band vol-breed, content gebonden
    ('''/* prijsrijen onder de hero, zoals de referentie */
.hero__prices {
  position: relative; z-index: 3;
  display: grid; grid-template-columns: 1fr 1fr;
  max-width: 1240px; margin: 0 auto;
  border-top: 1px solid var(--hairline);
  background: var(--peach);
}''',
     '''/* prijsband onder de hero, vol-breed zoals de referentie */
.heroband {
  position: relative; z-index: 3;
  background: var(--peach);
  border-top: 1px solid var(--hairline);
}
.hero__prices {
  display: grid; grid-template-columns: 1fr 1fr;
  max-width: 1240px; margin: 0 auto;
}'''),
    ('''.hero__cta {
  position: relative; z-index: 3;
  display: flex; align-items: center; justify-content: center; gap: 1.4rem; flex-wrap: wrap;
  background: var(--peach);
  max-width: 1240px; margin: 0 auto;
  padding: 0 var(--gutter) 1.6rem;
}''',
     '''.hero__cta {
  display: flex; align-items: center; justify-content: center; gap: 1.4rem; flex-wrap: wrap;
  max-width: 1240px; margin: 0 auto;
  padding: 0 var(--gutter) 1.5rem;
}'''),
    # de wide-upscale die het losser maakte: vervangen door bescheiden bounds
    ('''@media (min-width: 1920px) {
  .hero__stage { max-width: 1720px; min-height: 560px; }
  .hero__line1, .hero__line2 { font-size: clamp(11.5rem, 9.4vw, 15.5rem); }
  .hero__car { width: clamp(196px, 11vw, 300px); }
  .hero__prices, .hero__cta { max-width: 1720px; }
}

''',
     '''@media (min-width: 1920px) {
  .hero__stage { max-width: 1440px; min-height: 470px; }
  .hero__line1, .hero__line2 { font-size: 10.4rem; }
  .hero__car { width: 178px; }
}

'''),
    # image-in-type verhuist naar de bewijskamer (licht op donker, gloeit)
    ('''.verschil h2 em { color: var(--pv-accent); }''',
     '''.verschil h2 em { color: var(--pv-accent); }
@supports ((-webkit-background-clip: text) or (background-clip: text)) {
  .verschil h2 em {
    background: url("img/n-coating.webp") center 40% / cover no-repeat;
    -webkit-background-clip: text; background-clip: text;
    color: transparent;
  }
}''',),
])

print('patch E klaar')
