export function createBundlesController({ bundlesService }) {
  return {
    async list(req, res) {
      res.json({ bundles: await bundlesService.listVisible() });
    },
  };
}
