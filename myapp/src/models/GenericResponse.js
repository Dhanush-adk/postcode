/**
 * Generic Response Class
 * Base class for all API responses in the application
 * Provides consistent structure and common functionality
 */
class GenericResponse {
    constructor(statusCode = 200, statusMessage = 'OK', data = null, errors = null) {
        this.statusCode = statusCode;
        this.statusMessage = statusMessage;
        this.data = data;
        this.errors = errors;
        this.timestamp = new Date().toISOString();
        this.success = statusCode >= 200 && statusCode < 300;
    }

    /**
     * Set the response data
     * @param {*} data - The data to include in the response
     * @returns {GenericResponse} - Returns this instance for method chaining
     */
    setData(data) {
        this.data = data;
        return this;
    }

    /**
     * Set error information
     * @param {string|Array|Object} errors - Error message(s) or error object(s)
     * @returns {GenericResponse} - Returns this instance for method chaining
     */
    setErrors(errors) {
        this.errors = Array.isArray(errors) ? errors : [errors];
        this.success = false;
        return this;
    }

    /**
     * Set the status code and message
     * @param {number} code - HTTP status code
     * @param {string} message - Status message
     * @returns {GenericResponse} - Returns this instance for method chaining
     */
    setStatus(code, message) {
        this.statusCode = code;
        this.statusMessage = message;
        this.success = code >= 200 && code < 300;
        return this;
    }

    /**
     * Add metadata to the response
     * @param {Object} metadata - Additional metadata
     * @returns {GenericResponse} - Returns this instance for method chaining
     */
    setMetadata(metadata) {
        this.metadata = metadata;
        return this;
    }

    /**
     * Convert the response to a plain object
     * @returns {Object} - Plain object representation of the response
     */
    toObject() {
        const response = {
            statusCode: this.statusCode,
            statusMessage: this.statusMessage,
            success: this.success,
            timestamp: this.timestamp,
            data: this.data,
            errors: this.errors
        };

        if (this.metadata) {
            response.metadata = this.metadata;
        }

        // Remove null/undefined values
        Object.keys(response).forEach(key => {
            if (response[key] === null || response[key] === undefined) {
                delete response[key];
            }
        });

        return response;
    }

    /**
     * Send the response using Express response object
     * @param {Object} res - Express response object
     * @returns {Object} - Express response object
     */
    send(res) {
        return res.status(this.statusCode).json(this.toObject());
    }

    /**
     * Static method to create a success response
     * @param {*} data - Response data
     * @param {string} message - Success message
     * @param {number} statusCode - HTTP status code (default: 200)
     * @returns {GenericResponse} - New GenericResponse instance
     */
    static success(data = null, message = 'Success', statusCode = 200) {
        return new GenericResponse(statusCode, message, data);
    }

    /**
     * Static method to create an error response
     * @param {string|Array|Object} errors - Error message(s) or error object(s)
     * @param {string} message - Error message
     * @param {number} statusCode - HTTP status code (default: 400)
     * @returns {GenericResponse} - New GenericResponse instance
     */
    static error(errors, message = 'Error', statusCode = 400) {
        const response = new GenericResponse(statusCode, message);
        return response.setErrors(errors);
    }

    /**
     * Static method to create a not found response
     * @param {string} message - Not found message
     * @returns {GenericResponse} - New GenericResponse instance
     */
    static notFound(message = 'Resource not found') {
        return new GenericResponse(404, message);
    }

    /**
     * Static method to create an unauthorized response
     * @param {string} message - Unauthorized message
     * @returns {GenericResponse} - New GenericResponse instance
     */
    static unauthorized(message = 'Unauthorized') {
        return new GenericResponse(401, message);
    }

    /**
     * Static method to create a forbidden response
     * @param {string} message - Forbidden message
     * @returns {GenericResponse} - New GenericResponse instance
     */
    static forbidden(message = 'Forbidden') {
        return new GenericResponse(403, message);
    }

    /**
     * Static method to create a server error response
     * @param {string} message - Server error message
     * @returns {GenericResponse} - New GenericResponse instance
     */
    static serverError(message = 'Internal Server Error') {
        return new GenericResponse(500, message);
    }

    /**
     * Static method to create a validation error response
     * @param {Array|Object} validationErrors - Validation error details
     * @returns {GenericResponse} - New GenericResponse instance
     */
    static validationError(validationErrors) {
        const response = new GenericResponse(422, 'Validation Error');
        return response.setErrors(validationErrors);
    }

    /**
     * Static method to create a created response
     * @param {*} data - Created resource data
     * @param {string} message - Success message
     * @returns {GenericResponse} - New GenericResponse instance
     */
    static created(data = null, message = 'Created') {
        return new GenericResponse(201, message, data);
    }

    /**
     * Static method to create a no content response
     * @param {string} message - Success message
     * @returns {GenericResponse} - New GenericResponse instance
     */
    static noContent(message = 'No Content') {
        return new GenericResponse(204, message);
    }
}

export { GenericResponse };
export default GenericResponse;