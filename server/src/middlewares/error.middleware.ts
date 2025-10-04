import { ErrorRequestHandler } from 'express';
import { isHttpError } from 'http-errors';

// eslint-disable-next-line no-unused-vars
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
    // only show errors that we wanted to show the user anyway
    if (isHttpError(err)) {
        res.status(err.statusCode).json({
            code: err.statusCode,
            message: err.message,
        });
        return;
    }

    // handle express openapi validator errors
    if (typeof err.status === 'number') {
        if (err.status === 500) {
            console.error(err);
        }
        res.status(err.status).json({
            code: err.status,
            message: err.message,
        });
        return;
    }

    // log full error in case of 500 errors
    console.error(err);

    // default error handler for api endpoints
    res.status(500).json({
        code: 500,
        message: 'Internal Server Error',
    });
};

