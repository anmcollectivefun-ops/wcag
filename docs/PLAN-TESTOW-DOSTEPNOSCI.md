# ANM Access — plan oceny dostępności

Cel: WCAG 2.2 A i AA oraz wszystkie mające zastosowanie kryteria AAA. Pełna zgodność wymaga łącznej oceny właściwych kryteriów, całych stron i ich stanów. Wynik automatu jest częścią tej oceny.

## Kontrole wykonywane w projekcie

`npm run check` sprawdza składnię i testy jednostkowe. Test kontrastu korzysta z rzeczywistych kolorów CSS i sprawdza wszystkie zdefiniowane powierzchnie, a nie kopię dawnej palety.

`npm run audit` wykrywa wszystkie pliki HTML, w tym słownik, dokumenty i artykuły. Bada reguły axe-core A/AA/AAA w trzech motywach przy 1280 i 320 CSS px. Sprawdza szerokość dokumentu oraz obcięcia tekstu. Osobno bada dodatkowy przycisk 200% przy 320 px, ustawienia odstępów z 1.4.12 i menu klawiaturowe. Raport zapisuje w `audit-artifacts/report.json`. Pole `incomplete` wskazuje ocenę wymagającą człowieka; `automatedGreen` nie jest deklaracją zgodności.

Lokalnie można wskazać zainstalowaną przeglądarkę przez `PLAYWRIGHT_EXECUTABLE_PATH`. Standardowy przebieg CI używa Chromium z Playwright.

## Kontrole do pełnego potwierdzenia

| Obszar | Co sprawdzić | Sposób potwierdzenia |
|---|---|---|
| Klawiatura | Wszystkie strony i stany, Tab i Shift+Tab, skip link, menu, FAQ, ustawienia, odnośniki | Testy przeglądarkowe oraz ocena wzrokowa kolejności i widoczności |
| Czytniki ekranu | Nagłówki, grupy ustawień, nazwy linków, stan menu, komunikaty i definicje w słowniku | NVDA + Firefox/Chrome oraz VoiceOver + Safari |
| Zoom | Natywne powiększenie przeglądarki 200% i 400%, osobno od przycisków A/AA/AAA | Zwykła przeglądarka; pomiar szerokości 320 px nie jest samodzielnym dowodem rzeczywistego zoomu |
| Tekst | Dodatkowe powiększenie, odstępy, brak obcięć i zasłonięć | Pomiar geometrii i kontrola wzrokowa |
| Kontrast | Tekst, podpisy, odnośniki, obrys fokusu, ikony i przyciski we wszystkich stanach | Kontrast z rzeczywistych kolorów i ocena obszarów na fotografiach; tekst hero ma osobne tło |
| Cele klikania | Minimum 24 × 24 px dla AA i 44 × 44 px dla AAA, z uwzględnieniem wyjątków | Rzeczywiste pola klikania; odnośniki w zdaniach ocenia się inaczej niż osobne przyciski |
| Język | Znaczenie skrótów i pojęć, prostota podsumowań, kompletność przekazu | Ocena redakcyjna oraz próba z osobami z grupy odbiorców; bez automatycznej deklaracji wieku czytelnika |
| Prezentacja | Warunki 1.4.8: kolory, szerokość wiersza, odstępy, brak justowania i skalowanie | Sprawdzenie wszystkich warunków, także dostępnych sposobów zmiany ustawień |
| Ruch | Redukcja ruchu i brak migania | Ustawienie systemowe, przegląd kodu i obrazu |
| Telefon | Orientacja, dotyk, czytnik mobilny i różne wielkości ekranów | Fizyczne urządzenie z Androidem lub iOS |
| Publikacja | Zgodność wdrożonego kodu z badanym commitem | Potwierdzenie wdrożenia i kontrola publicznej strony |

W obecnej wersji serwis nie ma formularzy ani osadzonych nagrań audio/wideo. Odpowiednie kryteria trzeba ocenić ponownie po dodaniu takich funkcji. Dobrowolny odczyt przez syntezator mowy również wymaga próby odsłuchu w docelowych przeglądarkach.

Dla każdego testu zapisz wersję kodu, datę, środowisko, kryterium, wynik, ograniczenia i retest. Przed publikowaniem stwierdzenia o pełnym AA lub AAA dokończ wszystkie właściwe testy manualne.

Źródła: https://www.w3.org/TR/WCAG22/ i https://www.w3.org/WAI/test-evaluate/.
