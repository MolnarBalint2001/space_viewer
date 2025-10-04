// src/utils/errors.ts
import createError from "http-errors";

export const BadRequest = createError.BadRequest;
export const Unauthorized = createError.Unauthorized;
export const Forbidden = createError.Forbidden;
export const NotFound = createError.NotFound;
export const Conflict = createError.Conflict;
export const InternalServerError = createError.InternalServerError;