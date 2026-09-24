import {
  STATUSES, STORAGE_KEY, validateTicket, createTicket,
  sampleTickets, readTickets, writeTickets, changeTicketStatus,
  ticketCounts, filterTickets
} from './tickets.mjs';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const storage = (() => { try { return window.localStorage; } catch { return null; } })();
const initial = readTickets(storage);
let tickets = initial.tickets;
const VIEWS = new Set(['start', 'zgloszenie', 'moje', 'obsluga', 'dostepnosc']);
const dateFormatter = new Intl.DateTimeFormat('pl-PL', { dateStyle: 'medium', timeStyle: 'short' });

if (initial.isNew) writeTickets(storage, tickets);
if (initial.error) announce('Nie udało się odczytać danych. Przywrócono zgłoszenia demonstracyjne.');
if (!storage) announce('Pamięć przeglądarki jest niedostępna. Zmiany nie przetrwają odświeżenia strony.');

function announce(message) {
  const region = $('#announcer');
  if (region) region.textContent = message;
}

function persist() {
  const saved = writeTickets(storage, tickets);
  if (!saved) announce('Uwaga: nie udało się zapisać zmian w przeglądarce. Zmiany mogą zniknąć po odświeżeniu.');
  return saved;
}

function setView(focusHeading) {
  const requested = window.location.hash.slice(1);
  if (requested === 'main-content' || ['name', 'title', 'description', 'category', 'consent'].includes(requested)) return;
  const name = VIEWS.has(requested) ? requested : 'start';
  $$('.view').forEach(view => { view.hidden = view.dataset.page !== name; });
  $$('[data-view-link]').forEach(link => {
    if (link.dataset.viewLink === name) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  document.title = `${$('#heading-' + name).textContent.trim()} — ANM Access`;
  if (name === 'moje') renderTickets();
  if (name === 'obsluga') renderAdmin();
  if (focusHeading) $('#heading-' + name).focus({ preventScroll: true });
}

function el(tag, className, content) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content !== undefined) node.textContent = String(content);
  return node;
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Data nieznana' : dateFormatter.format(date);
}

function renderCounts() {
  const counts = ticketCounts(tickets);
  $('#count-all').textContent = String(counts.all);
  $('#count-open').textContent = String(counts.open);
  $('#count-urgent').textContent = String(counts.urgent);
}

function badge(value, className = '') { return el('span', `pill ${className}`.trim(), value); }

function ticketElement(ticket, admin = false) {
  const item = el('li', 'ticket-card');
  const head = el('div', 'ticket-head');
  const headLeft = el('div');
  headLeft.append(el('div', 'ticket-id', ticket.id), el('h2', '', ticket.title));
  const tags = el('div', 'ticket-tags');
  tags.append(badge(`Status: ${ticket.status}`, ticket.status === 'Zamknięte' ? 'pill-done' : 'pill-open'));
  tags.append(badge(`Priorytet: ${ticket.priority}`, ticket.priority === 'Pilny' ? 'pill-urgent' : ''));
  head.append(headLeft, tags);
  item.append(head, el('p', 'ticket-meta', `${ticket.category} · ${ticket.name} · Utworzono: ${formatDate(ticket.createdAt)}`));
  const details = el('details', 'ticket-details');
  details.append(el('summary', '', 'Opis zgłoszenia'), el('p', '', ticket.description));
  item.append(details);

  if (admin) {
    const form = el('form', 'admin-controls');
    const safeId = ticket.id.replace(/[^A-Za-z0-9_-]/g, '');
    const selectId = `status-${safeId}`;
    const label = el('label', '', `Zmień status zgłoszenia ${ticket.id}`);
    label.htmlFor = selectId;
    const line = el('div', 'control-line');
    const select = el('select');
    select.id = selectId;
    select.name = 'status';
    for (const status of STATUSES) {
      const option = el('option', '', status);
      option.value = status;
      option.selected = status === ticket.status;
      select.append(option);
    }
    const submit = el('button', 'button button-primary', 'Zapisz status');
    submit.type = 'submit';
    line.append(select, submit);
    form.append(label, line);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (ticket.status === select.value) { announce('Status nie został zmieniony.'); return; }
      const nextStatus = select.value;
      tickets = changeTicketStatus(tickets, ticket.id, nextStatus, new Date().toISOString());
      const saved = persist();
      renderAll();
      $(`#${CSS.escape(selectId)}`)?.focus({ preventScroll: true });
      announce(`Zgłoszenie ${ticket.id}: zmieniono status na ${nextStatus}.${saved ? '' : ' Zmiana nie została trwale zapisana.'}`);
    });
    item.append(form);
  }
  return item;
}

function appendList(list, entries, isAdmin) {
  if (!entries.length) {
    list.replaceChildren(el('li', 'empty-state', 'Nie znaleziono zgłoszeń. Zmień filtry lub utwórz nowe zgłoszenie.'));
    return;
  }
  list.replaceChildren(...entries.map(ticket => ticketElement(ticket, isAdmin)));
}

function renderTickets() {
  const visible = filterTickets(tickets, $('#search-tickets').value, $('#filter-status').value);
  appendList($('#tickets-list'), visible, false);
  $('#result-count').textContent = `Znaleziono zgłoszeń: ${visible.length}.`;
}

function renderAdmin() {
  const sorted = filterTickets(tickets, '', 'Wszystkie');
  appendList($('#admin-list'), sorted, true);
  $('#admin-count').textContent = `Zgłoszenia do obsługi: ${sorted.length}.`;
}

function renderAll() { renderCounts(); renderTickets(); renderAdmin(); }

function clearError(name) {
  const error = $(`#error-${name}`);
  if (error) { error.hidden = true; error.textContent = ''; }
  const field = $(`#${name}`);
  if (field) field.removeAttribute('aria-invalid');
  if (name === 'priority') $$('[name="priority"]').forEach(input => input.removeAttribute('aria-invalid'));
  $('#error-summary').hidden = true;
}

function showErrors(errors) {
  const list = $('#error-list');
  list.replaceChildren();
  for (const [name, message] of Object.entries(errors)) {
    const field = $(`#${name}`);
    const error = $(`#error-${name}`);
    if (error) { error.textContent = message; error.hidden = false; }
    if (field) field.setAttribute('aria-invalid', 'true');
    if (name === 'priority') $$('[name="priority"]').forEach(input => input.setAttribute('aria-invalid', 'true'));
    const li = el('li');
    const link = el('a', '', message);
    link.href = `#${name}`;
    link.addEventListener('click', event => {
      event.preventDefault();
      (field || $('[name="priority"]'))?.focus();
    });
    li.append(link);
    list.append(li);
  }
  $('#submit-success').hidden = true;
  $('#error-summary').hidden = false;
  $('#error-summary').focus();
}

$('#ticket-form').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  const fields = new FormData(form);
  const values = {
    name: String(fields.get('name') || ''), title: String(fields.get('title') || ''),
    category: String(fields.get('category') || ''), description: String(fields.get('description') || ''),
    priority: String(fields.get('priority') || ''), consent: fields.get('consent') === 'on'
  };
  const errors = validateTicket(values);
  if (Object.keys(errors).length) { showErrors(errors); return; }
  if (tickets.length >= 500) { showErrors({ title: 'Limit demonstracji wynosi 500 zgłoszeń. Przywróć dane demo.' }); return; }
  const id = `ANM-${(globalThis.crypto?.randomUUID?.() || String(Date.now())).slice(0, 8).toUpperCase()}`;
  tickets = [createTicket(values, id, new Date().toISOString()), ...tickets];
  const saved = persist();
  form.reset();
  $('#description-count').textContent = '0 / 1200 znaków';
  $$('.field-error').forEach(error => { error.hidden = true; error.textContent = ''; });
  $$('[aria-invalid]').forEach(field => field.removeAttribute('aria-invalid'));
  $('#error-summary').hidden = true;
  const success = $('#submit-success');
  const text = el('p', '', `Zgłoszenie ${id} zostało dodane do demonstracji.${saved ? '' : ' Nie udało się zapisać go trwale w tej przeglądarce.'}`);
  const link = el('a', 'text-link', 'Przejdź do moich zgłoszeń →');
  link.href = '#moje';
  success.replaceChildren(el('strong', '', 'Zgłoszenie zapisane'), text, link);
  success.hidden = false;
  renderAll();
  success.focus();
});

for (const name of ['name', 'title', 'category', 'description', 'consent']) {
  $(`#${name}`).addEventListener('input', () => clearError(name));
  $(`#${name}`).addEventListener('change', () => clearError(name));
}
$$('[name="priority"]').forEach(input => input.addEventListener('change', () => clearError('priority')));
$('#description').addEventListener('input', event => {
  $('#description-count').textContent = `${event.currentTarget.value.length} / 1200 znaków`;
});
$('#filter-form').addEventListener('submit', event => event.preventDefault());
$('#search-tickets').addEventListener('input', renderTickets);
$('#filter-status').addEventListener('change', renderTickets);
$('#export-data').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(tickets, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = el('a');
  link.href = url;
  link.download = 'anm-access-zgloszenia-demo.json';
  document.body.append(link);
  link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  announce('Wyeksportowano demonstracyjne zgłoszenia do pliku JSON.');
});
$('#reset-data').addEventListener('click', () => {
  if (!window.confirm('Czy przywrócić przykładowe zgłoszenia? Wszystkie lokalne zmiany zostaną utracone.')) return;
  tickets = sampleTickets();
  const saved = persist();
  $('#search-tickets').value = '';
  $('#filter-status').value = 'Wszystkie';
  renderAll();
  $('#reset-data').focus();
  announce(saved ? 'Przywrócono przykładowe zgłoszenia.' : 'Przywrócono dane tylko na czas tej sesji; zapis w przeglądarce nie powiódł się.');
});


window.addEventListener('hashchange', () => setView(true));
renderAll(); setView(false);
