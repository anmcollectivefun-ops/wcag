const KEY = 'anm-access-theme-v1';
const TEXT_KEY = 'anm-access-text-size-v1';
const THEMES = new Set(['light','dark','reading']);
const TEXT_SIZES = new Set(['a','aa','aaa']);
const COLORS = { light:'#FFFFFF', dark:'#0B0B0B', reading:'#F5EBD7' };

function storedTheme(){
  try {
    const value = localStorage.getItem(KEY);
    return THEMES.has(value) ? value : 'light';
  } catch { return 'light'; }
}
function storedTextSize(){
  try {
    const value = localStorage.getItem(TEXT_KEY);
    return TEXT_SIZES.has(value) ? value : 'a';
  } catch { return 'a'; }
}
function announcer(){
  return document.querySelector('#announcer,[data-theme-announcer]');
}
function announce(message){
  const shared = announcer();
  if (shared) shared.textContent = message;
}
export function applyTheme(theme, shouldAnnounce=false){
  const next = THEMES.has(theme) ? theme : 'light';
  document.documentElement.dataset.theme = next;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', COLORS[next]);
  document.querySelectorAll('[data-theme-choice]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.themeChoice === next));
  });
  try { localStorage.setItem(KEY, next); } catch {}
  if (shouldAnnounce) {
    const label = next === 'light' ? 'jasny' : next === 'dark' ? 'ciemny' : 'czytanie';
    announce('Włączono motyw ' + label + '.');
  }
}
export function applyTextSize(size, shouldAnnounce=false){
  const next = TEXT_SIZES.has(size) ? size : 'a';
  document.documentElement.dataset.textSize = next;
  document.querySelectorAll('[data-text-size-choice]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.textSizeChoice === next));
  });
  try { localStorage.setItem(TEXT_KEY, next); } catch {}
  if (shouldAnnounce) {
    const percent = next === 'a' ? '100' : next === 'aa' ? '150' : '200';
    announce('Ustawiono rozmiar tekstu ' + next.toUpperCase() + ', ' + percent + ' procent.');
  }
}

applyTheme(storedTheme());
applyTextSize(storedTextSize());

document.addEventListener('DOMContentLoaded', () => {
  applyTheme(document.documentElement.dataset.theme || storedTheme());
  applyTextSize(document.documentElement.dataset.textSize || storedTextSize());

  document.querySelectorAll('[data-theme-choice]').forEach(button => {
    button.addEventListener('click', () => applyTheme(button.dataset.themeChoice, true));
  });
  document.querySelectorAll('[data-text-size-choice]').forEach(button => {
    button.addEventListener('click', () => applyTextSize(button.dataset.textSizeChoice, true));
  });
});

window.addEventListener('storage', event => {
  if (event.key === KEY && THEMES.has(event.newValue)) applyTheme(event.newValue);
  if (event.key === TEXT_KEY && TEXT_SIZES.has(event.newValue)) applyTextSize(event.newValue);
});
