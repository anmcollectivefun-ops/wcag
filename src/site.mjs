document.documentElement.classList.add('js');

const iconHref = name => '/assets/icons.svg#' + name;

function setupNavigation() {
  const nav = document.querySelector('.main-nav');
  const list = document.querySelector('.main-nav-list');
  const toggle = document.querySelector('[data-nav-toggle]');
  if (!nav || !list || !toggle) return;

  const close = () => {
    nav.dataset.open = 'false';
    toggle.setAttribute('aria-expanded', 'false');
  };
  const open = () => {
    nav.dataset.open = 'true';
    toggle.setAttribute('aria-expanded', 'true');
  };

  toggle.addEventListener('click', () => {
    nav.dataset.open === 'true' ? close() : open();
  });
  list.querySelectorAll('a').forEach(link => link.addEventListener('click', close));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav.dataset.open === 'true') {
      close();
      toggle.focus();
    }
  });
}

function setupIcons() {
  document.querySelectorAll('[data-icon]').forEach(node => {
    if (node.querySelector('svg')) return;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'icon');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', iconHref(node.dataset.icon));
    svg.appendChild(use);
    node.prepend(svg);
  });
}

function setupMotion() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const targets = [...document.querySelectorAll('[data-reveal]')];
  const gsap = window.gsap;

  if (reduced || !gsap) {
    targets.forEach(el => el.classList.add('is-visible'));
    return;
  }

  document.documentElement.classList.add('motion-ready');

  const hero = targets.filter(el => el.closest('.page-hero'));
  if (hero.length) {
    gsap.fromTo(hero, { autoAlpha: 0, y: 18 }, {
      autoAlpha: 1, y: 0, duration: .65, stagger: .08, ease: 'power2.out'
    });
  }

  const rest = targets.filter(el => !el.closest('.page-hero'));
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      gsap.fromTo(entry.target, { autoAlpha: 0, y: 18 }, {
        autoAlpha: 1, y: 0, duration: .55, ease: 'power2.out',
        onComplete: () => entry.target.classList.add('is-visible')
      });
    });
  }, { threshold: .12 });

  rest.forEach(el => observer.observe(el));

  const scanLine = document.querySelector('.scan-line');
  if (scanLine) {
    gsap.fromTo(scanLine, { yPercent: -120 }, {
      yPercent: 820,
      duration: 4.8,
      repeat: -1,
      ease: 'none',
      repeatDelay: .7
    });
  }
}

function setupAuditVisual() {
  const panel = document.querySelector('[data-audit-visual]');
  if (!panel) return;
  panel.querySelectorAll('[data-progress]').forEach(bar => {
    const value = Number(bar.dataset.progress || 0);
    bar.style.setProperty('--progress', Math.max(0, Math.min(100, value)) + '%');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  setupIcons();
  setupAuditVisual();
  setupMotion();
});
