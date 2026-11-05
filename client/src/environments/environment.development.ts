// Shipped to the browser: never put secrets here.
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  // true: fictional books from the browser (no server needed). false: the real API at apiUrl.
  useMockApi: true,
  // The coupon field of the design mockup. Shown here so it can be reviewed; it does nothing yet.
  showCoupon: true,
};
