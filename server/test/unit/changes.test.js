import { describe, expect, it } from 'vitest';
import { changedValues, diffFields } from '../../src/services/changes.js';

describe('diffFields', () => {
  it('returns only fields whose value really changes', () => {
    const current = { title: 'A', priceAgorot: 6500, hidden: false, bookSlugs: ['a', 'b'] };
    const changes = diffFields(current, {
      title: 'A',
      priceAgorot: 7000,
      hidden: false,
      bookSlugs: ['a', 'b'],
    });
    expect(changes).toEqual({ priceAgorot: { from: 6500, to: 7000 } });
  });

  it('compares arrays by content', () => {
    expect(diffFields({ bookSlugs: ['a', 'b'] }, { bookSlugs: ['b', 'a'] })).toEqual({
      bookSlugs: { from: ['a', 'b'], to: ['b', 'a'] },
    });
  });

  it('reports missing current values as null', () => {
    expect(diffFields({}, { volume: 2 })).toEqual({ volume: { from: null, to: 2 } });
  });

  it('extracts the new values', () => {
    expect(changedValues({ priceAgorot: { from: 1, to: 2 } })).toEqual({ priceAgorot: 2 });
  });
});
