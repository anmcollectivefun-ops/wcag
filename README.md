# ANM Access — działający prototyp dostępnego panelu zgłoszeń

Autorski projekt demonstracyjny ANM Collective, przygotowany jako część portfolio technologicznego i baza do przyszłego audytu dostępności. Nie jest to projekt LifeFlip i nie korzysta z jego kodu.

## Uruchomienie

Wymagany Node.js 20 lub nowszy. **Nie trzeba instalować żadnych paczek.**

```bash
npm run dev
```

Otwórz `http://127.0.0.1:4173`. Testy automatyczne:

```bash
npm run check
```

## Co już działa

- Formularz zgłoszenia z własną walidacją i linkami do błędnych pól.
- Lista zgłoszeń, filtrowanie po statusie i wyszukiwanie.
- Demonstracyjny panel obsługi umożliwiający zmianę statusu.
- Przełącznik wysokiego kontrastu i większej czcionki.
- Skip link, obsługa klawiatury, komunikaty `role="status"`, semantyczne formularze i widoczne focusy.
- Eksport zgłoszeń demo do JSON, reset danych testowych, przykładowe rekordy.
- Dane przechowywane wyłącznie w `localStorage` przeglądarki. Serwer Node udostępnia wyłącznie statyczne pliki.

## Ograniczenia — ważne

**To jest prototyp, nie gotowy panel dla klientów.** Nie ma prawdziwego logowania, uprawnień użytkowników, serwera danych, powiadomień e-mail ani udokumentowanej zgodności WCAG. Widok administratora jest celowo otwarty w demonstracji; nie należy używać go do rzeczywistych zgłoszeń. Nie wpisuj danych osobowych, haseł ani poufnych informacji — dane pozostają w pamięci przeglądarki i mogą być widoczne dla każdej osoby korzystającej z tego samego profilu.

Aby przejść do produkcji: dodać autoryzację serwerową i kontrolę dostępu, bazę danych (np. Supabase), politykę retencji, zabezpieczenie uploadu plików, monitoring, testy end-to-end i niezależny audyt dostępności.

## Portfolio i dostępność

Projekt można pokazać jako **własną realizację demonstracyjną**, nie jako referencję od zewnętrznego klienta ani certyfikowaną aplikację zgodną z WCAG. Plan ręcznych testów i wzór karty realizacji znajdują się w `docs/`.
