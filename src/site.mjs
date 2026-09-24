document.documentElement.classList.add('js');

const iconHref = name => '/assets/icons.svg#' + name;

function announce(message) {
  const live = document.querySelector('[data-theme-announcer]');
  if (live) live.textContent = message;
}

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
  const sequences = [...document.querySelectorAll('[data-reveal-sequence]')];
  const gsap = window.gsap;

  if (reduced || !gsap) {
    targets.forEach(el => el.classList.add('is-visible'));
    return;
  }

  document.documentElement.classList.add('motion-ready');

  const header = document.querySelector('.site-header');
  if (header) {
    gsap.fromTo(header,
      { y: -30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
    );
  }

  const hero = targets.filter(el => el.closest('.page-hero'));
  if (hero.length) {
    gsap.fromTo(hero, { y: 30, opacity: 0 }, {
      y: 0, opacity: 1, duration: 1, stagger: 0.15, ease: 'power3.out', delay: 0.2
    });
  }

  const sequenceItems = new Set(
    sequences.flatMap(group => [...group.querySelectorAll('[data-reveal]')])
  );

  sequences.forEach(group => {
    const items = [...group.querySelectorAll('[data-reveal]')];
    if (!items.length) return;

    gsap.set(items, { y: 40, opacity: 0 });

    const sequenceObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        sequenceObserver.unobserve(entry.target);

        gsap.to(items, {
          y: 0,
          opacity: 1,
          duration: 0.9,
          stagger: 0.15,
          ease: 'back.out(1.2)',
          clearProps: 'willChange,opacity,transform',
          onComplete: () => items.forEach(item => item.classList.add('is-visible'))
        });
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });

    sequenceObserver.observe(group);
  });

  const rest = targets.filter(el =>
    !el.closest('.page-hero') && !sequenceItems.has(el)
  );

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      gsap.fromTo(entry.target, { y: 30, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.8, ease: 'power3.out',
        clearProps: 'willChange,opacity,transform',
        onComplete: () => entry.target.classList.add('is-visible')
      });
    });
  }, { threshold: 0.1 });

  rest.forEach(el => observer.observe(el));
}

function setupAuditVisual() {
  const panel = document.querySelector('[data-audit-visual]');
  if (!panel) return;
  panel.querySelectorAll('[data-progress]').forEach(bar => {
    const value = Number(bar.dataset.progress || 0);
    bar.style.setProperty('--progress', Math.max(0, Math.min(100, value)) + '%');
  });
}

function collectReadableContent() {
  const selector = [
    'main h1','main h2','main h3','main h4',
    'main p','main li','main summary','main figcaption',
    'main a.button','main img[alt]:not([alt=""])'
  ].join(',');
  return [...document.querySelectorAll(selector)]
    .filter(node => {
      if (node.closest('[aria-hidden="true"]')) return false;
      const style = getComputedStyle(node);
      return style.display !== 'none' && style.visibility !== 'hidden';
    })
    .map(node => node.tagName === 'IMG' ? node.getAttribute('alt') : node.textContent.trim().replace(/\s+/g,' '))
    .filter(Boolean);
}

function setupPageReader() {
  const button = document.querySelector('[data-read-page]');
  if (!button) return;

  if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
    button.disabled = true;
    button.setAttribute('aria-label', 'Czytanie strony nie jest obsługiwane przez tę przeglądarkę');
    return;
  }

  const synth = window.speechSynthesis;
  let queue = [];
  let index = 0;
  let reading = false;
  let session = 0;

  const setButtonState = active => {
    reading = active;
    button.setAttribute('aria-pressed', String(active));
    const label = button.querySelector('[data-reader-label]');
    if (label) label.textContent = active ? 'Zatrzymaj czytanie' : 'Przeczytaj stronę';
  };

  const preferredVoice = () => {
    const lang = document.documentElement.lang || 'pl';
    const prefix = lang.toLowerCase().slice(0,2);
    return synth.getVoices().find(voice => voice.lang.toLowerCase().startsWith(prefix)) || null;
  };

  const stop = (message = 'Zatrzymano czytanie strony.') => {
    session += 1;
    synth.cancel();
    queue = [];
    index = 0;
    setButtonState(false);
    announce(message);
  };

  const speakNext = currentSession => {
    if (!reading || currentSession !== session || index >= queue.length) {
      if (currentSession === session && reading) {
        setButtonState(false);
        announce('Zakończono czytanie strony.');
      }
      return;
    }

    const utterance = new SpeechSynthesisUtterance(queue[index++]);
    const langMap = { pl:'pl-PL', en:'en-GB', uk:'uk-UA' };
    utterance.lang = langMap[(document.documentElement.lang || 'pl').slice(0,2)] || document.documentElement.lang || 'pl-PL';
    const voice = preferredVoice();
    if (voice) utterance.voice = voice;
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onend = () => speakNext(currentSession);
    utterance.onerror = () => stop('Czytanie strony zostało przerwane.');
    synth.speak(utterance);
  };

  button.addEventListener('click', () => {
    if (reading) {
      stop();
      return;
    }
    queue = collectReadableContent();
    index = 0;
    if (!queue.length) {
      announce('Na tej stronie nie znaleziono treści do odczytania.');
      return;
    }
    session += 1;
    const currentSession = session;
    synth.cancel();
    setButtonState(true);
    announce('Rozpoczęto czytanie strony.');
    speakNext(currentSession);
  });

  window.addEventListener('beforeunload', () => synth.cancel());
}

document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  setupIcons();
  setupAuditVisual();
  setupPageReader();
  setupMotion();
});
