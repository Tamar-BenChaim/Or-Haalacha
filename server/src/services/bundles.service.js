/** Read access to bundles such as the full set, with what buyers need to compare prices. */
export function createBundlesService({ books, bundles }) {
  return {
    async listVisible() {
      const bundleDocuments = await bundles.findVisible();
      const bookSlugs = [...new Set(bundleDocuments.flatMap((bundle) => bundle.bookSlugs))];
      const bookDocuments = bookSlugs.length ? await books.findVisibleBySlugs(bookSlugs) : [];
      const booksBySlug = new Map(bookDocuments.map((book) => [book.slug, book]));

      return bundleDocuments.map((bundle) => toBundle(bundle, booksBySlug));
    },
  };
}

function toBundle(bundle, booksBySlug) {
  const includedBooks = bundle.bookSlugs.map((slug) => booksBySlug.get(slug));
  const allBooksVisible = includedBooks.every(Boolean);

  return {
    id: bundle._id.toString(),
    slug: bundle.slug,
    title: bundle.title,
    description: bundle.description,
    priceAgorot: bundle.priceAgorot,
    separatePriceAgorot: allBooksVisible
      ? includedBooks.reduce((sum, book) => sum + book.priceAgorot, 0)
      : null,
    inStock: allBooksVisible && includedBooks.every((book) => book.stock > 0),
    books: includedBooks
      .filter(Boolean)
      .map((book) => ({ slug: book.slug, title: book.title, volume: book.volume ?? null })),
  };
}
