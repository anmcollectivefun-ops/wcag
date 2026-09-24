const KEY = 'anm-access-theme-v1';
const THEMES = new Set(['light','dark','reading']);
const COLORS = { light:'#FFFFFF', dark:'#0B0B0B', reading:'#F5EBD7' };

function storedTheme(){
  try {
    const value = localStorage.getItem(KEY);
    return THEMES.has(value) ? value : 'light';
  } catch { return 'light'; }
}
function announceTheme(theme){
  const label = theme === 'light' ? 'jasny' : theme === 'dark' ? 'ciemny' : 'czytanie';
  const shared = document.querySelector('#announcer,[data-theme-announcer]');
  if (shared) shared.textContent = 'Włączono motyw ' + label + '.';
}
export function applyTheme(theme, announce=false){
  const next = THEMES.has(theme) ? theme : 'light';
  document.documentElement.dataset.theme = next;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', COLORS[next]);
  document.querySelectorAll('[data-theme-choice]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.themeChoice === next));
  });
  try { localStorage.setItem(KEY, next); } catch {}
  if (announce) announceTheme(next);
}
applyTheme(storedTheme());
document.addEventListener('DOMContentLoaded', () => {
  applyTheme(document.documentElement.dataset.theme || storedTheme());
  document.querySelectorAll('[data-theme-choice]').forEach(button => {
    button.addEventListener('click', () => applyTheme(button.dataset.themeChoice, true));
  });
});
window.addEventListener('storage', event => {
  if (event.key === KEY && THEMES.has(event.newValue)) applyTheme(event.newValue);
});
