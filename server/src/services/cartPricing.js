/**
 * Prices a cart from database documents only. The browser supplies nothing but
 * what it wants and how many; prices and stock always come from the database.
 *
 * Stock is shared: a bundle uses one copy of each of its books. Bundles are
 * allocated first, then single books from what remains, so the result is
 * deterministic.
 */
export function priceCart({ lines, books, bundles }) {
  const booksBySlug = new Map(books.map((book) => [book.slug, book]));
  const bundlesBySlug = new Map(bundles.map((bundle) => [bundle.slug, bundle]));
  const remainingStock = new Map(books.map((book) => [book.slug, book.stock]));

  const merged = mergeLines(lines);
  const allocated = new Map();

  for (const line of merged.filter((l) => l.type === 'bundle')) {
    const bundle = bundlesBySlug.get(line.slug);
    if (!bundle) continue;
    const available = Math.min(
      ...bundle.bookSlugs.map((slug) => (booksBySlug.has(slug) ? remainingStock.get(slug) : 0)),
    );
    const quantity = Math.min(line.quantity, available);
    bundle.bookSlugs.forEach((slug) => {
      if (booksBySlug.has(slug)) remainingStock.set(slug, remainingStock.get(slug) - quantity);
    });
    allocated.set(lineKey(line), quantity);
  }

  for (const line of merged.filter((l) => l.type === 'book')) {
    if (!booksBySlug.has(line.slug)) continue;
    const quantity = Math.min(line.quantity, remainingStock.get(line.slug));
    remainingStock.set(line.slug, remainingStock.get(line.slug) - quantity);
    allocated.set(lineKey(line), quantity);
  }

  const items = merged.map((line) => {
    const product =
      line.type === 'book' ? booksBySlug.get(line.slug) : bundlesBySlug.get(line.slug);
    if (!product) {
      return { ...line, requestedQuantity: line.quantity, ...UNAVAILABLE };
    }
    const quantity = allocated.get(lineKey(line));
    return {
      type: line.type,
      slug: line.slug,
      title: product.title,
      unitPriceAgorot: product.priceAgorot,
      requestedQuantity: line.quantity,
      quantity,
      lineTotalAgorot: quantity * product.priceAgorot,
      status: quantity === line.quantity ? 'ok' : quantity === 0 ? 'out_of_stock' : 'limited',
    };
  });

  return {
    items,
    subtotalAgorot: items.reduce((sum, item) => sum + item.lineTotalAgorot, 0),
    allAvailable: items.every((item) => item.status === 'ok'),
  };
}

const UNAVAILABLE = {
  title: null,
  unitPriceAgorot: null,
  quantity: 0,
  lineTotalAgorot: 0,
  status: 'unavailable',
};

const lineKey = (line) => `${line.type}:${line.slug}`;

/** Combines repeated lines for the same product, keeping first-seen order. */
function mergeLines(lines) {
  const merged = new Map();
  for (const { type, slug, quantity } of lines) {
    const key = lineKey({ type, slug });
    const existing = merged.get(key);
    merged.set(key, { type, slug, quantity: (existing?.quantity ?? 0) + quantity });
  }
  return [...merged.values()];
}
