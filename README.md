# ANM Access

Serwis ANM Collective o dostępności stron i aplikacji. Cel projektu obejmuje WCAG 2.2 A, AA i właściwe kryteria AAA. Wyniki automatyczne oraz wymagane oceny manualne opisuje [plan testów](docs/PLAN-TESTOW-DOSTEPNOSCI.md).

## Strony

Strona główna, audyt, szkolenia, baza wiedzy i jej artykuły, o nas, kontakt, regulamin, polityka prywatności oraz słownik prostych pojęć. Skrypt audytu znajduje wszystkie pliki HTML bez ręcznej listy podstron.

Wspólne ustawienia obejmują trzy motywy (jasny, ciemny i czytanie), wysoki kontrast, dodatkowe powiększenie treści i odczyt strony na głos. Przyciski A / AA / AAA oznaczają ustawienia wielkości treści 100% / 150% / 200%; nie są potwierdzeniem poziomu zgodności i zachowują kompaktową nawigację. Natywny zoom przeglądarki działa niezależnie.

## Uruchomienie

Node.js 20 lub nowszy:

```bash
npm ci
npm start
```

Serwis działa pod `http://127.0.0.1:4173`. Instalacja przygotowuje lokalne fonty Atkinson Hyperlegible Next i GSAP.

## Testy

```bash
npm run check
npx playwright install chromium
npm run audit
```

Raport automatyczny: `audit-artifacts/report.json`. Obejmuje reguły axe-core A/AA/AAA, trzy motywy, 1280 i 320 CSS px oraz dodatkowe ustawienia tekstu. Pole `incomplete` i plan testów wskazują dalszą ocenę. Pełne AA lub AAA wymaga oceny całych stron i wszystkich właściwych kryteriów; sam wynik bez naruszeń automatycznych nie wystarcza.
