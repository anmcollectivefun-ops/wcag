// Funkcje bez zależności od DOM — używane w laboratorium i testach.
export function contrastRatio(foreground, background) {
  const fg = luminance(foreground);
  const bg = luminance(background);
  return (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
}
export function luminance(hex) {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) throw new TypeError('Oczekiwano koloru w formacie #RRGGBB.');
  const channels = [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16) / 255);
  const linear = channels.map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}
export function contrastResult(foreground, background) {
  const ratio = contrastRatio(foreground, background);
  return { ratio, aaaNormalText: ratio >= 7, aaaLargeText: ratio >= 4.5 };
}
