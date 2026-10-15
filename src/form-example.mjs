export function setupAccessibleExample() {
  const form = document.querySelector('[data-accessible-example]');
  if (!form) return;
  const summary = form.querySelector('[data-form-errors]');
  const list = summary.querySelector('ul');
  const result = form.querySelector('[data-form-result]');
  const fields = ['name', 'email', 'message'].map(name => form.elements.namedItem(name));
  form.noValidate = true;
  form.querySelector('[type="submit"]').disabled = false;
  function errorFor(field) {
    if (!field.value.trim()) return ({ name: 'Wpisz imię, np. Anna.', email: 'Wpisz adres e-mail, np. anna@example.com.', message: 'Napisz, w czym możemy pomóc.' })[field.name];
    if (field.validity.typeMismatch) return 'Sprawdź adres e-mail. Wpisz go w formacie anna@example.com.';
    if (field.validity.tooLong) return 'Skróć tekst do podanej maksymalnej liczby znaków.';
    return '';
  }
  function renderErrors() {
    list.replaceChildren();
    const errors = [];
    for (const field of fields) {
      const message = errorFor(field);
      const error = document.getElementById(field.id + '-error');
      error.textContent = message;
      error.hidden = !message;
      if (message) {
        field.setAttribute('aria-invalid', 'true');
        errors.push(field);
        const li = document.createElement('li'), link = document.createElement('a');
        link.href = '#' + field.id;
        link.textContent = field.labels[0].textContent + ': ' + message;
        link.addEventListener('click', event => { event.preventDefault(); field.focus(); });
        li.append(link); list.append(li);
      } else field.removeAttribute('aria-invalid');
    }
    summary.hidden = errors.length === 0;
    return errors;
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    result.textContent = '';
    const errors = renderErrors();
    if (errors.length) summary.focus();
    else result.textContent = 'Gotowe. Wszystkie wymagane pola są poprawnie wypełnione. To koniec pokazu — wiadomość nie została wysłana, a dane pozostają tylko w tym formularzu.';
  });
  form.addEventListener('input', () => { result.textContent = ''; });
  form.addEventListener('change', () => { result.textContent = ''; });
}
