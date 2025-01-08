import { STATUS } from "./params.js";

class ApiError extends Error {
    constructor(statusCode, message, details = null) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
    }

    static badRequest(message, details = null) {
        return new ApiError(STATUS.badRequest, message, details);
    }

    static unauthorized(message, details = null) {
        return new ApiError(STATUS.unauthorized, message, details);
    }

    static notFound(message, details = null) {
        return new ApiError(STATUS.notFound, message, details);
    }

    static forbidden(message, details = null) {
        return new ApiError(STATUS.forbidden, message, details);
    }

    static conflictError(message, details = null) {
        return new ApiError(STATUS.conflict, message, details);
    }

    static internalError(message, details = null) {
        return new ApiError(STATUS.serverError, message, details);
    }
}

const handleError = (err, res) => {
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            message: err.message,
            details: err.details,
        });
    }

    return res.status(500).json({
        message: 'Internal Server Error',
    });
};

export { ApiError, handleError };
