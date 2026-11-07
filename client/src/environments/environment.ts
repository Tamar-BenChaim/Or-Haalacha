// Shipped to the browser: never put secrets here.
export const environment = {
  production: true,
  apiUrl: 'https://api.orhaalacha.org',
  // Production always talks to the real server.
  useMockApi: false,
  // Stays false until the client approves coupons and the server supports them.
  showCoupon: false,
  // Production shows only real content: no sample boxes, no "[—]" in the details table.
  showContentPlaceholders: false,
};
