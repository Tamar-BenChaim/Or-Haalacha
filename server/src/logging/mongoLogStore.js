/** Log store backed by the request_logs collection (see decision 0007). */
export function createMongoLogStore({ requestLogs }) {
  return {
    saveRequestLog: (entry) => requestLogs.insert(entry),
  };
}
