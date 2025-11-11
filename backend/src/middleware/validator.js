/**
 * Zod Validation Middleware
 * 
 * Validates request body, query params, and path params using Zod schemas
 */

import { z } from 'zod';

/**
 * Create validation middleware for request body
 * 
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @returns {Function} Express middleware
 */
export const validateBody = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated; // Replace with validated data
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'validation_error',
          message: 'Invalid request body',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        });
      }
      next(error);
    }
  };
};

/**
 * Create validation middleware for query parameters
 * 
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @returns {Function} Express middleware
 */
export const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      // Validate query parameters without mutating req.query (read-only in Express 5.x)
      schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'validation_error',
          message: 'Invalid query parameters',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        });
      }
      next(error);
    }
  };
};

/**
 * Create validation middleware for URL parameters
 * 
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @returns {Function} Express middleware
 */
export const validateParams = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.params);
      req.params = validated; // Replace with validated data
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'validation_error',
          message: 'Invalid URL parameters',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        });
      }
      next(error);
    }
  };
};

/**
 * Validate request with custom error handler
 * 
 * @param {Object} options - Validation options
 * @param {z.ZodSchema} options.body - Schema for request body
 * @param {z.ZodSchema} options.query - Schema for query params
 * @param {z.ZodSchema} options.params - Schema for URL params
 * @returns {Function} Express middleware
 */
export const validate = ({ body, query, params }) => {
  return (req, res, next) => {
    const errors = [];
    
    // Validate body
    if (body) {
      const bodyResult = body.safeParse(req.body);
      if (!bodyResult.success) {
        errors.push(...bodyResult.error.errors.map(err => ({
          location: 'body',
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        })));
      } else {
        req.body = bodyResult.data;
      }
    }
    
    // Validate query
    if (query) {
      const queryResult = query.safeParse(req.query);
      if (!queryResult.success) {
        errors.push(...queryResult.error.errors.map(err => ({
          location: 'query',
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        })));
      } else {
        req.query = queryResult.data;
      }
    }
    
    // Validate params
    if (params) {
      const paramsResult = params.safeParse(req.params);
      if (!paramsResult.success) {
        errors.push(...paramsResult.error.errors.map(err => ({
          location: 'params',
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        })));
      } else {
        req.params = paramsResult.data;
      }
    }
    
    // If there are errors, return 400
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'Request validation failed',
        details: errors
      });
    }
    
    next();
  };
};

export default {
  validateBody,
  validateQuery,
  validateParams,
  validate
};
