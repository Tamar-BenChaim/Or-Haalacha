// Will also report database connectivity once the data layer is added.
export function createHealthService() {
  return {
    getStatus() {
      return { status: 'ok' };
    },
  };
}
