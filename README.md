# ANM Access

ANM Access to rozwijana przez ANM Collective platforma do audytu dostępności cyfrowej pod kątem WCAG 2.2, w tym kryteriów poziomów A, AA i AAA.

## Publiczne strony

- Strona główna: `/`
- Audyt WCAG: `/audyt.html`
- Szkolenia: `/szkolenia.html`
- Baza wiedzy: `/baza-wiedzy.html`
- O nas: `/o-nas.html`
- Kontakt: `/kontakt.html`

Wszystkie strony korzystają z jednego systemu kolorów, trzech motywów (jasny, ciemny, czytanie), Atkinson Hyperlegible Next oraz globalnego skalowania tekstu A / AA / AAA = 100% / 150% / 200%.

## Uruchomienie

Wymagany Node.js 20 lub nowszy.

```bash
npm install
npm run dev
```

Aplikacja działa domyślnie pod `http://127.0.0.1:4173`.

## Testy

```bash
npm run check
```

Workflow audytu przeglądarkowego sprawdza wszystkie publiczne strony przy 1280 i 320 CSS px, reguły axe-core oraz reflow przy globalnym trybie AAA/200%.

Pełna deklaracja zgodności WCAG 2.2 AAA będzie możliwa dopiero po zakończeniu całej checklisty oraz testów manualnych wymaganych dla odpowiednich kryteriów.
