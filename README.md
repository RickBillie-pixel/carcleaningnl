# CarCleaningNL — demo-ontwerpen

Statische ontwerpvoorstellen voor CarCleaningNL (auto detailing, Helmond, regio
Eindhoven). Geen build-stap, geen framework: elke demo is losse HTML, CSS en een
klein beetje vanilla JS.

**`demo-1e` is de versie die verder is uitgewerkt en die gehost wordt.** De andere
demo-mappen zijn eerdere richtingen en blijven staan als referentie.

## demo-1e

Nagebouwd naar `inspiration/image1.png`, met de echte branding en content van
CarCleaningNL.

- **Display**: Antonio 700 — gekozen op basis van gemeten glyphverhoudingen uit de
  referentie (D/kaphoogte 0.44, I/kap 0.16, tracking −0.022em).
- **Tekst**: Urbanist — geometrisch, enkelverdiepings-a, woordbreedtes binnen 2%
  van de referentie.
- Beide self-hosted als variabele woff2, latin-subset, samen 53 kB.
- Kleur: navy `#002538` als inkt, azuur in de accentrol. De interactieve tint is
  `#1476bb`, een fractie dieper dan de gesamplede `#1b87d4`, zodat witte tekst
  erop 4.8:1 haalt.
- De maatvoering staat in verhoudingen van de contentbreedte, zodat de compositie
  van 360 tot 2560 px hetzelfde leest. De hoogte van de hero schaalt mee met het
  scherm, zodat het complete blok op een laptop binnen beeld valt.

Elke prijs linkt naar `afspraak.html?dienst=…`; het formulier daar selecteert de
dienst voor en stuurt de aanvraag via WhatsApp.

## Draaien

```bash
node tools/serve.mjs          # http://localhost:8123
```

## Screenshots en controles

```bash
cd tools && npm install       # playwright + sharp
node shots.mjs <ronde> demo-1e   # 390x844@3, 1440x900, 2560x1440
node ovf.mjs   demo-1e index     # horizontale overloop per viewport
node a11y.mjs  demo-1e           # contrast, raakvlakken, kopvolgorde
node sbs.mjs   <ronde>           # zij-aan-zij met inspiration/image1.png
```

Screenshotuitvoer komt in `<demo>/screens/` en staat niet in git; die is met
`shots.mjs` opnieuw te maken.

## Hosten

```bash
firebase deploy --only hosting   # serveert demo-1e op de root
```

## Sleutels

De scripts in `tools/kie-*.mjs` (beeldgeneratie) verwachten `KIE_KEY` in de
omgeving. Er staan geen sleutels in deze repository.
