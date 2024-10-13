// src/asyncHandler.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Async handler to wrap async route handlers and pass errors to Express error handlers.
 * @param fn - The async route handler function.
 * @returns A new route handler function.
 */
const asyncHandler = (fn: RequestHandler): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncHandler;
