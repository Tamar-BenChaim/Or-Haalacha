import { matchesQuery, normalizeForSearch } from './search';

describe('normalizeForSearch', () => {
  it('removes Hebrew points and cantillation marks', () => {
    expect(normalizeForSearch('הֲלָכוֹת שַׁבָּת')).toBe('הלכות שבת');
  });

  it('removes quote-like characters and extra spaces', () => {
    expect(normalizeForSearch('  ספר   א׳ ')).toBe('ספר א');
    expect(normalizeForSearch('ספר "א"')).toBe('ספר א');
  });

  it('lower-cases Latin letters', () => {
    expect(normalizeForSearch('Book A')).toBe('book a');
  });
});

describe('matchesQuery', () => {
  const book = { title: 'הלכות שבת א׳', topic: 'שבת' };

  it('matches everything when the query is empty', () => {
    expect(matchesQuery(book, '')).toBe(true);
    expect(matchesQuery(book, '   ')).toBe(true);
  });

  it('requires every word to appear', () => {
    expect(matchesQuery(book, 'הלכות שבת')).toBe(true);
    expect(matchesQuery(book, 'הלכות פסח')).toBe(false);
  });

  it('ignores points and quotes in the query', () => {
    expect(matchesQuery(book, 'א')).toBe(true);
    expect(matchesQuery(book, 'שַׁבָּת')).toBe(true);
  });

  it('also searches the topic, and copes with a missing topic', () => {
    expect(matchesQuery({ title: 'ספר', topic: 'ברכות' }, 'ברכות')).toBe(true);
    expect(matchesQuery({ title: 'ספר', topic: null }, 'ברכות')).toBe(false);
    expect(matchesQuery({ title: 'ספר' }, 'ספר')).toBe(true);
  });
});
