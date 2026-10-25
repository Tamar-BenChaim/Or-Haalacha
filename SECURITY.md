# Security Policy

## Reporting a vulnerability

Please do not open a public issue for security problems.
Email **support@orhaalacha.org** with the details and steps to reproduce.

## Ground rules for contributors

- No secrets in the repository: keys, passwords and connection strings live in environment variables only. `.env` files are never committed.
- Prices, stock and payment amounts are always computed on the server.
- Card details never reach our servers; payment happens on the payment provider's hosted page.
- Every change goes through a pull request with passing checks (secret scan, dependency scan, CodeQL, tests).
