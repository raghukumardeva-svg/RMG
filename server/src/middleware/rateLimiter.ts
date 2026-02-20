/**
 * Rate Limiting Middleware
 * Prevents abuse by limiting the number of requests from a single IP
 * Uses express-rate-limit's default IP detection which properly handles IPv4 and IPv6
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Custom handler for rate limit exceeded
 */
const rateLimitHandler = (req: Request, res: Response) => {
  res.status(429).json({
    success: false,
    message: 'Too many requests. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: res.getHeader('Retry-After')
  });
};

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 * Note: Uses default IP-based limiting (handles IPv6 correctly)
 */
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: (req) => {
    // Skip rate limiting for health check endpoints
    return req.path === '/health' || req.path === '/api/health';
  }
});

/**
 * Strict rate limiter for authentication endpoints
 * 5 requests per 15 minutes to prevent brute force attacks
 * Uses IP-based limiting (IPv4 and IPv6 compatible)
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many authentication attempts, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});

/**
 * Rate limiter for ticket creation
 * 10 tickets per hour per IP to prevent spam
 */
export const ticketCreationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many tickets created. Maximum 10 tickets per hour allowed.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skipSuccessfulRequests: false // Count even successful requests
});

/**
 * Rate limiter for message/comment posting
 * 30 messages per 10 minutes to prevent spam
 */
export const messageRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 30,
  message: 'Too many messages. Please wait before sending more.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});

/**
 * Rate limiter for file uploads
 * 20 uploads per hour per IP
 */
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: 'Too many file uploads. Maximum 20 uploads per hour allowed.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});

/**
 * Rate limiter for search/query endpoints
 * 100 searches per 10 minutes per IP
 */
export const searchRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100,
  message: 'Too many search requests. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});

/**
 * Strict rate limiter for admin operations
 * 50 requests per 10 minutes per IP
 */
export const adminRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 50,
  message: 'Too many admin operations. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});
