export function createAdminBundlesController({ adminBundlesService }) {
  return {
    async list(req, res) {
      res.json({ bundles: await adminBundlesService.list() });
    },

    async update(req, res) {
      const { params, body } = req.validated;
      const bundle = await adminBundlesService.update(params.id, body, {
        actor: req.admin.email,
        requestId: req.id,
      });
      res.json({ bundle });
    },
  };
}
