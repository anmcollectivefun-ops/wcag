import { contrastResult } from './contrast.mjs';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const previews = [$('#preview-before'), $('#preview-after')];
const defaults = {
  company: 'Twoja firma',
  headline: 'Znajdź usługę, której potrzebujesz',
  description: 'Przejrzyj ofertę, wybierz rozwiązanie i skontaktuj się z nami. Wszystkie potrzebne informacje znajdziesz w jednym miejscu.',
  action: 'Wyślij zapytanie'
};
const palettes = {
  light: { foreground: '#101828', background: '#ffffff' },
  dark: { foreground: '#ffffff', background: '#111827' },
  cream: { foreground: '#1b2430', background: '#fff9e8' }
};
const scenarios = {
  contrast: {
    explanation: 'Przy niskim kontraście tekst może zlewać się z tłem, choć dla projektanta wygląda subtelnie.',
    caption: 'Problem: drobny tekst i zbyt słaby kontrast utrudniają przeczytanie oferty.'
  },
  tiny: {
    explanation: 'Drobny i niewyraźny tekst to ilustracja utrudnionej czytelności. Nie odwzorowuje widzenia żadnej konkretnej osoby.',
    caption: 'Problem: informacje są zbyt małe i trudne do odczytania. Rozmycie to uproszczona ilustracja bariery, nie symulacja medyczna.'
  },
  zoom: {
    explanation: 'Po powiększeniu niektóre źle zaprojektowane układy ucinają tekst i przyciski zamiast przenieść treść do kolejnego wiersza.',
    caption: 'Problem: po powiększeniu część nagłówka i przycisku znika poza widocznym obszarem.'
  }
};
function setMessage(message) {
  $('#interaction-message').textContent = message;
}
function updateCopy() {
  const values = {
    company: $('#company').value.trim() || defaults.company,
    headline: $('#headline').value.trim() || defaults.headline,
    description: $('#description').value.trim() || defaults.description,
    action: $('#action-label').value.trim() || defaults.action
  };
  for (const [key, value] of Object.entries(values)) {
    $$('[data-' + key + ']').forEach(node => { node.textContent = value; });
  }
}
$('#example-form').addEventListener('input', updateCopy);
$('#restore-copy').addEventListener('click', () => {
  for (const [key, value] of Object.entries(defaults)) {
    const id = key === 'action' ? '#action-label' : '#' + key;
    $(id).value = value;
  }
  updateCopy();
  setMessage('Przywrócono przykładową ofertę.');
  $('#company').focus();
});

$$('input[name=scenario]').forEach(radio => {
  radio.addEventListener('change', () => {
    if (!radio.checked) return;
    const details = scenarios[radio.value];
    $('#preview-before').dataset.scenario = radio.value;
    $('#scenario-explanation').textContent = details.explanation;
    $('#barrier-caption').textContent = details.caption;
    setMessage('Wybrano barierę: ' + radio.parentElement.textContent.trim() + '. Porównaj obie wersje poniżej.');
  });
});
$$('input[name=text-size]').forEach(radio => {
  radio.addEventListener('change', () => {
    if (!radio.checked) return;
    const percent = Number(radio.value);
    if (![100, 150, 200].includes(percent)) return;
    $('#preview-after').style.setProperty('--demo-scale', String(percent / 100));
    setMessage('Powiększono tekst w poprawionej wersji do ' + percent + '%.');
  });
});

function applyColors() {
  const foreground = $('#foreground').value;
  const background = $('#background').value;
  const result = contrastResult(foreground, background);
  const preview = $('#preview-after');
  preview.style.setProperty('--demo-fg', foreground);
  preview.style.setProperty('--demo-bg', background);
  const status = $('#contrast-status');
  status.classList.toggle('warning', !result.aaaNormalText);
  const ratioText = result.ratio.toFixed(2).replace('.', ',') + ':1';
  if (result.aaaNormalText) {
    status.textContent = 'Kontrast tekstu: ' + ratioText + '. Przekracza próg AAA 7:1 dla zwykłego tekstu w tej próbce. Nie oznacza zgodności całej strony.';
  } else if (result.aaaLargeText) {
    status.textContent = 'Kontrast tekstu: ' + ratioText + '. Za niski dla zwykłego tekstu na poziomie AAA (wymagane 7:1). Dla dużego tekstu próg AAA to 4,5:1.';
  } else {
    status.textContent = 'Kontrast tekstu: ' + ratioText + '. Za niski dla zwykłego i dużego tekstu na poziomie AAA. Wybierz czytelniejszą kombinację.';
  }
}
$('#palette').addEventListener('change', () => {
  const choice = $('#palette').value;
  if (choice !== 'custom') {
    $('#foreground').value = palettes[choice].foreground;
    $('#background').value = palettes[choice].background;
  }
  applyColors();
  setMessage('Zmieniono kolory poprawionej wersji.');
});
['foreground', 'background'].forEach(id => {
  $('#' + id).addEventListener('input', () => {
    $('#palette').value = 'custom';
    applyColors();
  });
});
$('#restore-contrast').addEventListener('click', () => {
  $('#palette').value = 'light';
  $('#foreground').value = palettes.light.foreground;
  $('#background').value = palettes.light.background;
  applyColors();
  setMessage('Przywrócono jasną, kontrastową paletę.');
  $('#palette').focus();
});
$('#readable-spacing').addEventListener('change', () => {
  const enabled = $('#readable-spacing').checked;
  $('#preview-after').classList.toggle('compact-spacing', !enabled);
  setMessage(enabled ? 'Włączono większe odstępy w poprawionej wersji.' : 'Wyłączono większe odstępy w poprawionej wersji.');
});
$('#preview-action').addEventListener('click', () => {
  setMessage('Przycisk w poprawionej próbce działa również z klawiatury. To demonstracja — nie wysyłamy prawdziwego zapytania.');
});
updateCopy();
applyColors();
