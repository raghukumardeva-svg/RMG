import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../config/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// Extend Express Request type to include user
export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
        employeeId: string;
    };
}

/**
 * Middleware to authenticate JWT token
 * Validates the token and attaches user info to request
 */
export const authenticateToken = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.startsWith('Bearer ')
            ? authHeader.substring(7)
            : null;

        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
            return;
        }

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET) as {
            id: string;
            email: string;
            role: string;
            employeeId: string;
        };

        // Attach user info to request
        (req as AuthRequest).user = decoded;

        next();
    } catch (error: any) {
        logger.error('Token authentication error:', error);

        if (error.name === 'TokenExpiredError') {
            res.status(401).json({
                success: false,
                message: 'Token has expired. Please login again.'
            });
            return;
        }

        if (error.name === 'JsonWebTokenError') {
            res.status(401).json({
                success: false,
                message: 'Invalid token. Please login again.'
            });
            return;
        }

        res.status(500).json({
            success: false,
            message: 'Failed to authenticate token.'
        });
    }
};

/**
 * Middleware to authorize specific roles
 * Must be used after authenticateToken middleware
 */
export const authorizeRoles = (...allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const user = (req as AuthRequest).user;

        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required.'
            });
            return;
        }

        // Normalize role comparison (case-insensitive)
        const userRole = user.role?.toLowerCase();
        const normalizedAllowedRoles = allowedRoles.map(role => role.toLowerCase());

        if (!normalizedAllowedRoles.includes(userRole)) {
            logger.warn(`Unauthorized access attempt by ${user.email} with role ${user.role}`);
            res.status(403).json({
                success: false,
                message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
            });
            return;
        }

        next();
    };
};

/**
 * Optional authentication middleware
 * Attaches user if token is present, but doesn't fail if missing
 */
export const optionalAuth = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.startsWith('Bearer ')
            ? authHeader.substring(7)
            : null;

        if (token) {
            const decoded = jwt.verify(token, JWT_SECRET) as {
                id: string;
                email: string;
                role: string;
                employeeId: string;
            };

            (req as AuthRequest).user = decoded;
        }

        next();
    } catch (error) {
        // Log error but continue - auth is optional
        logger.debug('Optional auth failed, continuing without user context');
        next();
    }
};
