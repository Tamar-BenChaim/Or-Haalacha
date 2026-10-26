export function createHealthService({ database }) {
  return {
    async getStatus() {
      try {
        await database.ping();
        return { status: 'ok', database: 'ok' };
      } catch {
        return { status: 'error', database: 'unavailable' };
      }
    },
  };
}
