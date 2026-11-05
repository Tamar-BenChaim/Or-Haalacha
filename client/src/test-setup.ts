// Runs before every spec. Each test starts with an empty localStorage, so a cart saved by
// one test (or one spec file) can never leak into another.
beforeEach(() => localStorage.clear());
