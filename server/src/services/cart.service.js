import { priceCart } from './cartPricing.js';

export function createCartService({ books, bundles }) {
  return {
    async quote(lines) {
      const bundleSlugs = unique(lines.filter((l) => l.type === 'bundle').map((l) => l.slug));
      const bundleDocuments = bundleSlugs.length
        ? await bundles.findVisibleBySlugs(bundleSlugs)
        : [];

      const bookSlugs = unique([
        ...lines.filter((l) => l.type === 'book').map((l) => l.slug),
        ...bundleDocuments.flatMap((bundle) => bundle.bookSlugs),
      ]);
      const bookDocuments = bookSlugs.length ? await books.findVisibleBySlugs(bookSlugs) : [];

      return priceCart({ lines, books: bookDocuments, bundles: bundleDocuments });
    },
  };
}

const unique = (values) => [...new Set(values)];
