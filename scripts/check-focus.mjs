// Checks the actual keyboard-focus style against solid promotional panel backgrounds.
export async function inspectPanelFocus(page) {
  await page.keyboard.press('Tab');
  return page.evaluate(() => {
    const previous = document.activeElement;
    const position = { x: scrollX, y: scrollY };
    const linear = value => { const c = value / 255; return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; };
    const luminance = color => {
      const channels = color.match(/[\d.]+/g)?.map(Number);
      if (!channels || channels.length < 3 || (channels.length === 4 && channels[3] < 1)) return null;
      return .2126 * linear(channels[0]) + .7152 * linear(channels[1]) + .0722 * linear(channels[2]);
    };
    const panels = '.home-numbers-cta-grid,.article-end,.article-penalties section:last-child';
    const items = [...document.querySelectorAll(panels)].flatMap(panel => [...panel.querySelectorAll('a[href],button:not([disabled])')].map(element => ({ panel, element })));
    const results = [];
    for (const { panel, element } of items) {
      if (!element.getClientRects().length) continue;
      element.focus({ preventScroll: true });
      const style = getComputedStyle(element), background = getComputedStyle(panel).backgroundColor;
      const a = luminance(style.outlineColor), b = luminance(background);
      const ratio = a === null || b === null ? null : (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
      results.push({
        name: (element.getAttribute('aria-label') || element.textContent).trim(),
        outline: style.outlineColor, background, ratio, thickness: parseFloat(style.outlineWidth),
        pass: element.matches(':focus-visible') && style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2 && ratio !== null && ratio >= 3
      });
    }
    if (previous instanceof HTMLElement) previous.focus({ preventScroll: true });
    window.scrollTo(position.x, position.y);
    return results;
  });
}
