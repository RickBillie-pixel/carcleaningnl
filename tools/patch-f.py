# Ronde F: hero = exact het eerste scherm (100dvh-compositie)
import io

def patch(path, pairs):
    s = io.open(path, encoding='utf-8').read()
    for old, new in pairs:
        if old not in s:
            print('MISS:', path, '->', old[:70].replace('\n', ' '))
        s = s.replace(old, new)
    io.open(path, 'w', encoding='utf-8').write(s)

patch('demo-1d/assets/style.css', [
    # hero vult de hele eerste viewport; band onderaan verankerd
    ('''/* ---------- Hero ---------- */
.hero { background: var(--cream); overflow: hidden; padding-top: clamp(1.5rem, 4vh, 3rem); }''',
     '''/* ---------- Hero ---------- */
.hero {
  background: var(--cream); overflow: hidden;
  min-height: calc(100dvh - 72px);
  display: flex; flex-direction: column;
}'''),
    ('''.hero__stage {
  position: relative;
  max-width: 1360px; margin: 0 auto;
  min-height: clamp(300px, 34vw, 440px);
  display: flex; flex-direction: column; justify-content: center;
  padding: 0 var(--gutter);
}''',
     '''.hero__stage {
  position: relative;
  flex: 1;
  width: 100%;
  max-width: 1360px; margin: 0 auto;
  min-height: 0;
  display: flex; flex-direction: column; justify-content: center;
  padding: clamp(0.8rem, 2vh, 1.6rem) var(--gutter) 0;
}'''),
    # typografie ook aan hoogte gebonden zodat alles altijd past
    ('''  font-size: clamp(3.4rem, 11.4vw, 9.8rem);
  line-height: 0.8;
  text-align: center;''',
     '''  font-size: min(clamp(3.4rem, 11.4vw, 9.8rem), 23vh);
  line-height: 0.8;
  text-align: center;'''),
    # auto ook hoogte-begrensd
    ('''  width: clamp(128px, 11.2vw, 168px);
  z-index: 2;''',
     '''  width: clamp(128px, 11.2vw, 168px);
  max-height: 52vh;
  z-index: 2;'''),
    ('''@media (min-width: 1920px) {
  .hero__stage { max-width: 1440px; min-height: 470px; }
  .hero__line1, .hero__line2 { font-size: 10.4rem; }
  .hero__car { width: 178px; }
}''',
     '''@media (min-width: 1920px) {
  .hero__stage { max-width: 1520px; }
  .hero__line1, .hero__line2 { font-size: min(10.8rem, 24vh); }
  .hero__car { width: 182px; }
}'''),
    # band compacter zodat hij binnen de viewport-verdeling blijft
    ('''.hero__deal {
  display: flex; align-items: baseline; justify-content: center; gap: 1rem; flex-wrap: wrap;
  padding: 1.3rem var(--gutter);''',
     '''.hero__deal {
  display: flex; align-items: baseline; justify-content: center; gap: 1rem; flex-wrap: wrap;
  padding: 1.05rem var(--gutter);'''),
    ('''.hero__cta {
  display: flex; align-items: center; justify-content: center; gap: 1.4rem; flex-wrap: wrap;
  max-width: 1240px; margin: 0 auto;
  padding: 0 var(--gutter) 1.5rem;
}''',
     '''.hero__cta {
  display: flex; align-items: center; justify-content: center; gap: 1.4rem; flex-wrap: wrap;
  max-width: 1240px; margin: 0 auto;
  padding: 0 var(--gutter) 1.2rem;
}'''),
    # zijlabels binnen de nieuwe stage-padding
    ('''  position: absolute; top: clamp(1.2rem, 3.5vw, 3rem); z-index: 3;''',
     '''  position: absolute; top: clamp(1rem, 2.6vh, 2.2rem); z-index: 3;'''),
    # mobiel: zelfde principe, compacte verdeling
    ('''  .hero__stage { min-height: 0; padding-top: 1.2rem; padding-bottom: 1rem; }''',
     '''  .hero { min-height: calc(100dvh - 72px); }
  .hero__stage { min-height: 0; padding-top: 0.9rem; padding-bottom: 0.6rem; }'''),
    ('''  .hero__car {
    position: relative; left: auto; top: auto;
    transform: rotate(7deg);
    width: min(38vw, 165px);
    margin: -1.1rem auto 0.6rem;
  }''',
     '''  .hero__car {
    position: relative; left: auto; top: auto;
    transform: rotate(7deg);
    width: min(36vw, 150px);
    max-height: 34vh;
    margin: -0.9rem auto 0.4rem;
  }'''),
])

print('patch F klaar')
