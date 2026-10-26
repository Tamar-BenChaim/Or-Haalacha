/**
 * An error whose message is safe to show to API clients.
 * Any other error is reported to clients as a generic internal error.
 */
export class HttpError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
