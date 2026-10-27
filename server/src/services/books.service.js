/**
 * Read access to the store's books. Returns only the fields buyers may see:
 * internal fields such as the exact stock or the low-stock threshold stay hidden.
 */
export function createBooksService({ books }) {
  return {
    async listVisible() {
      const documents = await books.findVisible();
      return documents.map(toBookSummary);
    },

    async getVisibleBySlug(slug) {
      const document = await books.findVisibleBySlug(slug);
      return document ? toBookDetails(document) : null;
    },
  };
}

function toBookSummary(book) {
  return {
    id: book._id.toString(),
    slug: book.slug,
    title: book.title,
    volume: book.volume ?? null,
    shortDescription: book.shortDescription,
    priceAgorot: book.priceAgorot,
    inStock: book.stock > 0,
    coverImage: book.coverImage ?? null,
  };
}

function toBookDetails(book) {
  return { ...toBookSummary(book), description: book.description };
}
