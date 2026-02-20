import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// Simple CSRF token implementation
// Store tokens in memory (for production, consider Redis or database)
const csrfTokens = new Map<string, Set<string>>();

// Token expiration time (15 minutes)
const TOKEN_EXPIRY = 15 * 60 * 1000;

interface CSRFRequest extends Request {
  csrfToken: () => string;
  session?: {
    id: string;
  };
}

/**
 * Generate a CSRF token
 */
export function generateCSRFToken(sessionId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  
  if (!csrfTokens.has(sessionId)) {
    csrfTokens.set(sessionId, new Set());
  }
  
  csrfTokens.get(sessionId)!.add(token);
  
  // Clean up expired tokens after 15 minutes
  setTimeout(() => {
    const tokens = csrfTokens.get(sessionId);
    if (tokens) {
      tokens.delete(token);
      if (tokens.size === 0) {
        csrfTokens.delete(sessionId);
      }
    }
  }, TOKEN_EXPIRY);
  
  return token;
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(sessionId: string, token: string): boolean {
  const tokens = csrfTokens.get(sessionId);
  if (!tokens) return false;
  
  const isValid = tokens.has(token);
  
  // Token is single-use, delete after validation
  if (isValid) {
    tokens.delete(token);
  }
  
  return isValid;
}

/**
 * Middleware to generate CSRF token
 */
export function csrfProtection(req: CSRFRequest, res: Response, next: NextFunction): void {
  // Skip CSRF for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    next();
    return;
  }

  // Get session ID from authorization header (JWT token) or create one
  const authHeader = req.headers.authorization;
  const sessionId = authHeader ? authHeader.split(' ')[1] : req.ip || 'anonymous';

  // Validate CSRF token
  const token = req.headers['x-csrf-token'] as string || req.body._csrf;

  if (!token) {
    res.status(403).json({
      success: false,
      message: 'CSRF token missing'
    });
    return;
  }

  if (!validateCSRFToken(sessionId, token)) {
    res.status(403).json({
      success: false,
      message: 'Invalid CSRF token'
    });
    return;
  }

  next();
}

/**
 * Endpoint to get CSRF token
 */
export function getCSRFToken(req: Request, res: Response): void {
  const authHeader = req.headers.authorization;
  const sessionId = authHeader ? authHeader.split(' ')[1] : req.ip || 'anonymous';
  
  const token = generateCSRFToken(sessionId);
  
  res.json({
    success: true,
    csrfToken: token
  });
}
