import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CATEGORIES, PRIORITIES, STATUSES, STORAGE_KEY, validateTicket, createTicket,
  sampleTickets, readTickets, writeTickets, ticketCounts, changeTicketStatus, filterTickets
} from '../src/tickets.mjs';

const valid = {
  name: 'Klient testowy', title: 'Problem z klawiaturą',
  category: CATEGORIES[0], description: 'Nie można obsłużyć formularza klawiaturą na stronie demonstracyjnej.',
  priority: PRIORITIES[0], consent: true
};

function memoryStorage(initial = {}) {
  const state = new Map(Object.entries(initial));
  return { getItem: key => state.has(key) ? state.get(key) : null, setItem: (key, value) => state.set(key, value), state };
}

test('poprawne dane przechodzą walidację', () => assert.deepEqual(validateTicket(valid), {}));
test('walidacja zwraca błędy pól, w tym brak zgody na dane testowe', () => {
  const errors = validateTicket({ ...valid, name: '', title: 'x', category: '', description: 'krótko', priority: 'nieważny', consent: false });
  assert.deepEqual(Object.keys(errors).sort(), ['category', 'consent', 'description', 'name', 'priority', 'title']);
});
test('zapisane zgłoszenie ma przewidywalny status i daty', () => {
  const t = createTicket(valid, 'TEST-1', '2026-09-23T12:00:00.000Z');
  assert.equal(t.status, 'Nowe'); assert.equal(t.id, 'TEST-1'); assert.equal(t.updatedAt, t.createdAt);
});
test('pusty magazyn zwraca wyłącznie przykładowe dane', () => {
  const result = readTickets(memoryStorage());
  assert.equal(result.isNew, true); assert.equal(result.tickets.length, 2);
  assert.equal(result.tickets.every(t => t.demo === true), true);
});
test('zapis i odczyt nie gubią zmian', () => {
  const storage = memoryStorage();
  const input = [createTicket(valid, 'TEST-2', '2026-09-23T12:00:00.000Z')];
  assert.equal(writeTickets(storage, input), true);
  assert.equal(readTickets(storage).tickets[0].id, 'TEST-2');
});
test('uszkodzony JSON nie wywraca aplikacji', () => {
  const result = readTickets(memoryStorage({ [STORAGE_KEY]: '{broken' }));
  assert.equal(result.error, true); assert.equal(result.tickets.length, 2);
});
test('odrzuca rekordy z niepoprawnym statusem', () => {
  const malicious = { ...sampleTickets()[0], status: 'Zhakowany' };
  assert.equal(readTickets(memoryStorage({ [STORAGE_KEY]: JSON.stringify([malicious]) })).tickets.length, 0);
});
test('status aktualizuje tylko wybrane zgłoszenie', () => {
  const tickets = sampleTickets();
  const changed = changeTicketStatus(tickets, 'DEMO-001', 'Zamknięte', '2026-09-23T14:00:00.000Z');
  assert.equal(changed[0].status, 'Zamknięte'); assert.equal(changed[1].status, 'Nowe');
  assert.equal(tickets[0].status, 'W trakcie');
  assert.throws(() => changeTicketStatus(tickets, 'DEMO-001', 'Obcy', 'x'), TypeError);
});
test('podsumowanie uwzględnia status i priorytet', () => {
  const counts = ticketCounts(sampleTickets());
  assert.deepEqual(counts, { all: 2, open: 2, urgent: 1 });
});
test('filtrowanie działa dla polskich znaków i statusu', () => {
  assert.equal(filterTickets(sampleTickets(), 'klawiaturą', 'Nowe').length, 1);
  assert.equal(filterTickets(sampleTickets(), 'klawiaturą', 'Zamknięte').length, 0);
  assert.equal(STATUSES.length, 4);
});
