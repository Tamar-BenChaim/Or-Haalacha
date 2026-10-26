export function createHealthController({ healthService }) {
  return {
    get(req, res) {
      res.set('Cache-Control', 'no-store').json(healthService.getStatus());
    },
  };
}
