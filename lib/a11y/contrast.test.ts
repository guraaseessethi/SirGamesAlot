import { describe, expect, it } from 'vitest';
import { contrastRatio } from './contrast';

// Brand tokens from app/globals.css. Keep in sync.
const T = {
  paper: '#ffffff',
  cream: '#fff8e1',
  ink: '#121317',
  gray: '#555b68',
  blue: '#1f3f99',
  yellow: '#f6c431',
  red: '#d0202e',
  green: '#17724a',
  amber: '#9a5b00',
  soft: '#e8e9ee',
};

describe('brand contrast (WCAG AA: 4.5 for text, 3 for large text and UI)', () => {
  const text: [string, string, string][] = [
    ['ink on paper', T.ink, T.paper],
    ['gray on paper', T.gray, T.paper],
    ['gray on cream', T.gray, T.cream],
    ['gray on soft', T.gray, T.soft],
    ['red on paper (kickers, out of stock)', T.red, T.paper],
    ['red on cream', T.red, T.cream],
    ['green on paper (in stock)', T.green, T.paper],
    ['amber on paper (low stock)', T.amber, T.paper],
    ['amber on cream (sample badge)', T.amber, T.cream],
    ['blue on paper (order in, links)', T.blue, T.paper],
    ['white on blue (banner, footer)', T.paper, T.blue],
    ['white on red', T.paper, T.red],
    ['yellow on blue (sign)', T.yellow, T.blue],
    ['yellow on ink (pressed chip)', T.yellow, T.ink],
    ['ink on yellow (buttons, alert)', T.ink, T.yellow],
  ];
  it.each(text)('%s ≥ 4.5', (_name, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('yellow on white would fail, which is why it is never used as text on white', () => {
    expect(contrastRatio(T.yellow, T.paper)).toBeLessThan(3);
  });
  it('yellow on red passes only for large text (the Come in costume heading)', () => {
    const r = contrastRatio(T.yellow, T.red);
    expect(r).toBeGreaterThanOrEqual(3);
    expect(r).toBeLessThan(4.5);
  });
});
