import { HttpError } from '../lib/httpError.js';

export function createBooksController({ booksService }) {
  return {
    async list(req, res) {
      res.json({ books: await booksService.listVisible() });
    },

    async getBySlug(req, res) {
      const book = await booksService.getVisibleBySlug(req.validated.params.slug);
      if (!book) {
        throw new HttpError(404, 'BOOK_NOT_FOUND', 'Book not found');
      }
      res.json({ book });
    },
  };
}
