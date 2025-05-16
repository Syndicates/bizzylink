/**
 * Custom error response class
 * @extends Error
 */
class ErrorResponse extends Error {
  /**
   * Create a new ErrorResponse
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {Object} [extras={}] - Additional information to include in response
   */
  constructor(message, statusCode, extras = {}) {
    super(message);
    this.statusCode = statusCode;
    this.extras = extras;
  }
}

module.exports = ErrorResponse;