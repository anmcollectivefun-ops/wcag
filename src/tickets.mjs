// Czysta logika aplikacji demonstracyjnej. Nie zapisuj danych osobowych w demo.
export const STORAGE_KEY = 'anm-access-demo-v1';
export const CATEGORIES = Object.freeze(['Strona internetowa', 'Sklep internetowy', 'Aplikacja webowa', 'Inne']);
export const STATUSES = Object.freeze(['Nowe', 'W trakcie', 'Oczekuje na klienta', 'Zamknięte']);
export const PRIORITIES = Object.freeze(['Standardowy', 'Pilny']);

export function validateTicket(values) {
  const errors = {};
  const name = String(values.name ?? '').trim();
  const title = String(values.title ?? '').trim();
  const description = String(values.description ?? '').trim();
  if (name.length < 2 || name.length > 35) errors.name = 'Wpisz pseudonim od 2 do 35 znaków.';
  if (title.length < 8 || title.length > 90) errors.title = 'Wpisz temat od 8 do 90 znaków.';
  if (!CATEGORIES.includes(values.category)) errors.category = 'Wybierz kategorię zgłoszenia.';
  if (description.length < 20 || description.length > 1200) errors.description = 'Opisz problem w 20–1200 znakach.';
  if (!PRIORITIES.includes(values.priority)) errors.priority = 'Wybierz priorytet.';
  if (values.consent !== true) errors.consent = 'Potwierdź, że używasz wyłącznie danych testowych.';
  return errors;
}

export function createTicket(values, id, createdAt) {
  const errors = validateTicket(values);
  if (Object.keys(errors).length) throw new Error('Niepoprawne zgłoszenie.');
  if (typeof id !== 'string' || !id.trim()) throw new TypeError('ID jest wymagane.');
  return {
    id, name: values.name.trim(), title: values.title.trim(),
    category: values.category, description: values.description.trim(),
    priority: values.priority, status: 'Nowe', createdAt,
    updatedAt: createdAt, demo: false
  };
}

export function isTicket(value) {
  return Boolean(value && typeof value === 'object' &&
    typeof value.id === 'string' && value.id.length > 0 && value.id.length <= 80 &&
    typeof value.name === 'string' && value.name.length <= 35 &&
    typeof value.title === 'string' && value.title.length <= 90 &&
    typeof value.description === 'string' && value.description.length <= 1200 &&
    CATEGORIES.includes(value.category) && STATUSES.includes(value.status) &&
    PRIORITIES.includes(value.priority) &&
    typeof value.createdAt === 'string' && typeof value.updatedAt === 'string');
}

export function sampleTickets() {
  return [
    {
      id: 'DEMO-001', name: 'Klient demo', title: 'Formularz nie pokazuje komunikatu błędu',
      category: 'Strona internetowa', description: 'Przy pustym polu formularz nie wyjaśnia, co należy poprawić. To przykładowe zgłoszenie.',
      priority: 'Standardowy', status: 'W trakcie', createdAt: '2026-09-20T10:00:00.000Z', updatedAt: '2026-09-21T09:00:00.000Z', demo: true
    },
    {
      id: 'DEMO-002', name: 'Użytkownik demo', title: 'Nie mogę przejść do menu klawiaturą',
      category: 'Aplikacja webowa', description: 'Podczas obsługi klawiaturą fokus nie przechodzi na przycisk rozwijający menu. To przykładowe zgłoszenie.',
      priority: 'Pilny', status: 'Nowe', createdAt: '2026-09-22T08:30:00.000Z', updatedAt: '2026-09-22T08:30:00.000Z', demo: true
    }
  ];
}

export function readTickets(storage) {
  try {
    const stored = storage?.getItem(STORAGE_KEY);
    if (stored === null || stored === undefined) return { tickets: sampleTickets(), isNew: true, error: false };
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) throw new Error('Invalid format');
    return { tickets: parsed.filter(isTicket).slice(0, 500), isNew: false, error: false };
  } catch {
    return { tickets: sampleTickets(), isNew: false, error: true };
  }
}

export function writeTickets(storage, tickets) {
  try { storage?.setItem(STORAGE_KEY, JSON.stringify(tickets.slice(0, 500))); return Boolean(storage); }
  catch { return false; }
}

export function changeTicketStatus(tickets, id, status, updatedAt) {
  if (!STATUSES.includes(status)) throw new TypeError('Nieznany status.');
  return tickets.map(ticket => ticket.id === id ? { ...ticket, status, updatedAt } : ticket);
}

export function ticketCounts(tickets) {
  return {
    all: tickets.length,
    open: tickets.filter(ticket => ticket.status !== 'Zamknięte').length,
    urgent: tickets.filter(ticket => ticket.priority === 'Pilny' && ticket.status !== 'Zamknięte').length
  };
}

export function filterTickets(tickets, query, status) {
  const needle = String(query ?? '').trim().toLocaleLowerCase('pl-PL');
  return tickets.filter(ticket =>
    (status === 'Wszystkie' || ticket.status === status) &&
    (!needle || [ticket.id, ticket.name, ticket.title, ticket.category, ticket.description]
      .some(field => field.toLocaleLowerCase('pl-PL').includes(needle)))
  ).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
