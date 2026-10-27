import { describe, expect, it } from 'vitest';
import { anonymizeIp } from '../../src/lib/anonymizeIp.js';

describe('anonymizeIp', () => {
  it.each([
    ['203.0.113.57', '203.0.113.0'],
    ['::ffff:203.0.113.57', '203.0.113.0'],
    ['2001:db8:85a3:8d3:1319:8a2e:370:7348', '2001:db8:85a3::'],
    ['2001:0db8::1', '2001:db8:0::'],
    ['::1', '0:0:0::'],
  ])('truncates %s to %s', (ip, expected) => {
    expect(anonymizeIp(ip)).toBe(expected);
  });

  it.each([undefined, null, '', 'not-an-ip'])('returns null for %s', (ip) => {
    expect(anonymizeIp(ip)).toBeNull();
  });
});
