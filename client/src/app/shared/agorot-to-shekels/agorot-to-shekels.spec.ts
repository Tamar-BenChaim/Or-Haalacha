import { AgorotToShekels } from './agorot-to-shekels';

// Intl adds bidi marks and a no-break space; normalize them before comparing.
const plain = (value: string) =>
  value
    .replace(/\p{Cf}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();

describe('AgorotToShekels', () => {
  const pipe = new AgorotToShekels();

  it('shows whole shekels without decimals', () => {
    expect(plain(pipe.transform(6500))).toBe('65 ₪');
  });

  it('shows agorot when the amount is not whole', () => {
    expect(plain(pipe.transform(6550))).toBe('65.50 ₪');
  });

  it('formats thousands', () => {
    expect(plain(pipe.transform(118000))).toBe('1,180 ₪');
  });

  it('returns an empty string for missing or invalid values', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform(Number.NaN)).toBe('');
    expect(pipe.transform(12.5)).toBe('');
  });
});
