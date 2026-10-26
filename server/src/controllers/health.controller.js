export function createHealthController({ healthService }) {
  return {
    async get(req, res) {
      const health = await healthService.getStatus();
      res
        .status(health.status === 'ok' ? 200 : 503)
        .set('Cache-Control', 'no-store')
        .json(health);
    },
  };
}
