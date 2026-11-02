const auditContext = (req) => ({ actor: req.admin.email, requestId: req.id });

export function createAdminBooksController({ adminBooksService }) {
  return {
    async list(req, res) {
      res.json({ books: await adminBooksService.list() });
    },

    async get(req, res) {
      res.json({ book: await adminBooksService.get(req.validated.params.id) });
    },

    async create(req, res) {
      const book = await adminBooksService.create(req.validated.body, auditContext(req));
      res.status(201).json({ book });
    },

    async update(req, res) {
      const { params, body } = req.validated;
      res.json({ book: await adminBooksService.update(params.id, body, auditContext(req)) });
    },

    async reorder(req, res) {
      const books = await adminBooksService.reorder(req.validated.body.ids, auditContext(req));
      res.json({ books });
    },
  };
}
