/**
 * Request Body Validation Middleware
 * Provides validation schemas and middleware for all API endpoints
 */

import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { handleError, ApiError } from '../utils/errorHandler';

/**
 * Middleware to handle validation errors
 */
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : 'unknown',
      message: error.msg,
    }));
    
    const error = new ApiError(
      400,
      'Validation failed',
      'VALIDATION_ERROR'
    );
    
    // Add validation details to response
    res.status(400).json({
      success: false,
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        details: formattedErrors,
      },
    });
    return;
  }
  
  next();
};

/**
 * Common validation rules
 */
export const commonValidations = {
  email: body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),

  password: body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

  employeeId: body('employeeId')
    .trim()
    .matches(/^EMP[0-9]{4}$/)
    .withMessage('Employee ID must match format EMP0000'),

  mongoId: param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),

  name: body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s.'-]+$/)
    .withMessage('Name can only contain letters, spaces, dots, hyphens and apostrophes'),

  phoneNumber: body('phoneNumber')
    .optional()
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage('Phone number must be 10 digits'),

  date: (fieldName: string) => 
    body(fieldName)
      .isISO8601()
      .withMessage(`${fieldName} must be a valid date`),

  positiveNumber: (fieldName: string) =>
    body(fieldName)
      .isFloat({ min: 0 })
      .withMessage(`${fieldName} must be a positive number`),
};

/**
 * Authentication validation schemas
 */
export const authValidation = {
  login: [
    body('email')
      .trim()
      .isEmail()
      .withMessage('Valid email is required')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    handleValidationErrors,
  ],

  register: [
    commonValidations.email,
    commonValidations.password,
    commonValidations.name,
    body('employeeId')
      .trim()
      .notEmpty()
      .withMessage('Employee ID is required'),
    handleValidationErrors,
  ],

  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8, max: 128 })
      .withMessage('New password must be between 8 and 128 characters'),
    handleValidationErrors,
  ],
};

/**
 * Employee validation schemas
 */
export const employeeValidation = {
  create: [
    commonValidations.name,
    commonValidations.email,
    commonValidations.employeeId,
    body('department')
      .trim()
      .notEmpty()
      .withMessage('Department is required'),
    body('designation')
      .trim()
      .notEmpty()
      .withMessage('Designation is required'),
    body('dateOfJoining')
      .isISO8601()
      .withMessage('Valid date of joining is required'),
    body('salary')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Salary must be a positive number'),
    handleValidationErrors,
  ],

  update: [
    commonValidations.mongoId,
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('email')
      .optional()
      .trim()
      .isEmail()
      .withMessage('Valid email is required'),
    body('department')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Department cannot be empty'),
    handleValidationErrors,
  ],

  delete: [
    commonValidations.mongoId,
    handleValidationErrors,
  ],
};

/**
 * Helpdesk ticket validation schemas
 */
export const helpdeskValidation = {
  createTicket: [
    body('userId')
      .trim()
      .notEmpty()
      .withMessage('User ID is required'),
    body('userName')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('User name must be between 2 and 100 characters'),
      // Note: Removed strict regex to allow Unicode characters (e.g., José, Müller, 日本語)
    body('userEmail')
      .trim()
      .isEmail()
      .withMessage('Valid email is required')
      .normalizeEmail(),
    body('subject')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Subject must be between 5 and 200 characters')
      .escape(), // Prevent XSS
    body('description')
      .trim()
      .isLength({ min: 10, max: 10000 })
      .withMessage('Description must be between 10 and 10000 characters'),
    body('highLevelCategory')
      .trim()
      .notEmpty()
      .withMessage('Category is required')
      .isIn(['IT', 'Facilities', 'Finance'])
      .withMessage('Invalid category'),
    body('subCategory')
      .trim()
      .notEmpty()
      .withMessage('Subcategory is required')
      .isLength({ max: 100 })
      .withMessage('Subcategory must be at most 100 characters'),
    body('urgency')
      .optional()
      .isIn(['low', 'medium', 'high', 'critical'])
      .withMessage('Invalid urgency level'),
    body('requiresApproval')
      .optional()
      .isBoolean()
      .withMessage('requiresApproval must be a boolean'),
    body('attachments')
      .optional()
      .isArray()
      .withMessage('Attachments must be an array')
      .custom((arr) => arr.length <= 10)
      .withMessage('Maximum 10 attachments allowed'),
    handleValidationErrors,
  ],

  updateTicket: [
    commonValidations.mongoId,
    body('status')
      .optional()
      .isIn([
        'open', 'pending', 'in-progress', 'resolved', 'closed', 'cancelled',
        'Pending Level-1 Approval', 'Pending Level-2 Approval', 'Pending Level-3 Approval',
        'Approved', 'Rejected', 'Cancelled', 'Routed', 'In Queue', 'Assigned',
        'In Progress', 'Paused', 'On Hold', 'Work Completed', 'Completed',
        'Completed - Awaiting IT Closure', 'Confirmed', 'Closed', 'Auto-Closed'
      ])
      .withMessage('Invalid status'),
    handleValidationErrors,
  ],

  assignTicket: [
    commonValidations.mongoId,
    body('employeeId')
      .trim()
      .notEmpty()
      .withMessage('Employee ID is required'),
    body('employeeName')
      .trim()
      .notEmpty()
      .withMessage('Employee name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Employee name must be between 2 and 100 characters'),
    body('assignedById')
      .trim()
      .notEmpty()
      .withMessage('Assigned by ID is required'),
    body('assignedByName')
      .trim()
      .notEmpty()
      .withMessage('Assigned by name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Assigned by name must be between 2 and 100 characters'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Notes must be at most 1000 characters'),
    handleValidationErrors,
  ],

  addMessage: [
    commonValidations.mongoId,
    body('sender')
      .isIn(['employee', 'manager', 'specialist', 'itadmin', 'system'])
      .withMessage('Invalid sender type'),
    body('senderName')
      .trim()
      .notEmpty()
      .withMessage('Sender name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Sender name must be between 2 and 100 characters'),
    body('message')
      .trim()
      .isLength({ min: 1, max: 5000 })
      .withMessage('Message must be between 1 and 5000 characters'),
    body('attachments')
      .optional()
      .isArray()
      .withMessage('Attachments must be an array'),
    handleValidationErrors,
  ],

  updateProgress: [
    commonValidations.mongoId,
    body('progressStatus')
      .isIn(['Not Started', 'In Progress', 'On Hold', 'Completed'])
      .withMessage('Invalid progress status'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Notes must be at most 2000 characters'),
    handleValidationErrors,
  ],

  completeWork: [
    commonValidations.mongoId,
    body('resolutionNotes')
      .trim()
      .isLength({ min: 10, max: 5000 })
      .withMessage('Resolution notes must be between 10 and 5000 characters'),
    body('completedBy')
      .trim()
      .notEmpty()
      .withMessage('Completed by is required'),
    handleValidationErrors,
  ],

  confirmCompletion: [
    commonValidations.mongoId,
    body('confirmedBy')
      .trim()
      .notEmpty()
      .withMessage('Confirmed by is required'),
    body('feedback')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Feedback must be at most 2000 characters'),
    handleValidationErrors,
  ],

  pauseTicket: [
    commonValidations.mongoId,
    body('pausedBy')
      .trim()
      .notEmpty()
      .withMessage('Paused by is required'),
    body('reason')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Reason must be at most 1000 characters'),
    handleValidationErrors,
  ],

  resumeTicket: [
    commonValidations.mongoId,
    body('resumedBy')
      .trim()
      .notEmpty()
      .withMessage('Resumed by is required'),
    handleValidationErrors,
  ],

  closeTicket: [
    commonValidations.mongoId,
    body('closedBy')
      .trim()
      .notEmpty()
      .withMessage('Closed by is required'),
    body('closingNotes')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Closing notes must be at most 2000 characters'),
    handleValidationErrors,
  ],
};

/**
 * Leave request validation schemas
 */
export const leaveValidation = {
  create: [
    body('leaveType')
      .isIn(['Casual Leave', 'Paid Leave', 'Paternity Leave', 'Earned Leave', 'Sabbatical Leave', 'Comp Off'])
      .withMessage('Invalid leave type'),
    body('startDate')
      .isISO8601()
      .withMessage('Valid start date is required'),
    body('endDate')
      .isISO8601()
      .withMessage('Valid end date is required')
      .custom((value, { req }) => {
        if (new Date(value) < new Date(req.body.startDate)) {
          throw new Error('End date must be after start date');
        }
        return true;
      }),
    // Accept either 'reason' or 'justification' field
    body('justification')
      .optional()
      .trim()
      .isLength({ min: 10, max: 500 })
      .withMessage('Justification must be between 10 and 500 characters'),
    body('reason')
      .optional()
      .trim()
      .isLength({ min: 10, max: 500 })
      .withMessage('Reason must be between 10 and 500 characters'),
    // Custom validation to ensure at least one of reason or justification is provided
    body().custom((value, { req }) => {
      const reason = req.body.reason?.trim();
      const justification = req.body.justification?.trim();
      if (!reason && !justification) {
        throw new Error('Either reason or justification is required (minimum 10 characters)');
      }
      if ((reason && reason.length < 10) && (!justification || justification.length < 10)) {
        throw new Error('Reason/justification must be at least 10 characters');
      }
      return true;
    }),
    handleValidationErrors,
  ],

  update: [
    commonValidations.mongoId,
    body('status')
      .optional()
      .isIn(['Pending', 'Approved', 'Rejected', 'pending', 'approved', 'rejected', 'cancelled'])
      .withMessage('Invalid status'),
    handleValidationErrors,
  ],
};

/**
 * Attendance validation schemas
 */
export const attendanceValidation = {
  create: [
    body('date')
      .isISO8601()
      .withMessage('Valid date is required'),
    body('checkIn')
      .optional()
      .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .withMessage('Check-in time must be in HH:MM format'),
    body('checkOut')
      .optional()
      .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .withMessage('Check-out time must be in HH:MM format'),
    body('status')
      .isIn(['Present', 'Absent', 'Half Day', 'Leave'])
      .withMessage('Invalid attendance status'),
    handleValidationErrors,
  ],
};

/**
 * Announcement validation schemas
 */
export const announcementValidation = {
  create: [
    body('title')
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Title must be between 1 and 200 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 5000 })
      .withMessage('Description must be at most 5000 characters'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'Low', 'Medium', 'High', 'Critical'])
      .withMessage('Priority must be low, medium, or high'),
    body('imageUrl')
      .optional()
      .custom((value) => {
        // Allow both URLs and base64 data URIs
        if (!value) return true;
        if (value.startsWith('data:image/')) return true; // Base64 image
        if (value.startsWith('http://') || value.startsWith('https://')) return true; // URL
        throw new Error('Image must be a valid URL or base64 data');
      }),
    handleValidationErrors,
  ],

  update: [
    commonValidations.mongoId,
    body('title')
      .optional()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Title must be between 1 and 200 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 5000 })
      .withMessage('Description must be at most 5000 characters'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'Low', 'Medium', 'High', 'Critical'])
      .withMessage('Priority must be low, medium, or high'),
    body('imageUrl')
      .optional()
      .custom((value) => {
        if (!value) return true;
        if (value.startsWith('data:image/')) return true;
        if (value.startsWith('http://') || value.startsWith('https://')) return true;
        throw new Error('Image must be a valid URL or base64 data');
      }),
    handleValidationErrors,
  ],
};

/**
 * Project allocation validation schemas
 */
export const allocationValidation = {
  create: [
    body('employeeId')
      .isMongoId()
      .withMessage('Valid employee ID is required'),
    body('projectId')
      .isMongoId()
      .withMessage('Valid project ID is required'),
    body('allocation')
      .isInt({ min: 0, max: 100 })
      .withMessage('Allocation must be between 0 and 100'),
    body('startDate')
      .isISO8601()
      .withMessage('Valid start date is required'),
    body('endDate')
      .optional()
      .isISO8601()
      .withMessage('Valid end date is required')
      .custom((value, { req }) => {
        if (value && new Date(value) < new Date(req.body.startDate)) {
          throw new Error('End date must be after start date');
        }
        return true;
      }),
    body('billable')
      .optional()
      .isBoolean()
      .withMessage('Billable must be a boolean'),
    handleValidationErrors,
  ],

  update: [
    commonValidations.mongoId,
    body('allocation')
      .optional()
      .isInt({ min: 0, max: 100 })
      .withMessage('Allocation must be between 0 and 100'),
    handleValidationErrors,
  ],
};

/**
 * Payroll validation schemas
 */
export const payrollValidation = {
  create: [
    body('employeeId')
      .isMongoId()
      .withMessage('Valid employee ID is required'),
    body('month')
      .isInt({ min: 1, max: 12 })
      .withMessage('Month must be between 1 and 12'),
    body('year')
      .isInt({ min: 2000, max: 2100 })
      .withMessage('Year must be between 2000 and 2100'),
    body('basicSalary')
      .isFloat({ min: 0 })
      .withMessage('Basic salary must be a positive number'),
    body('allowances')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Allowances must be a positive number'),
    body('deductions')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Deductions must be a positive number'),
    handleValidationErrors,
  ],
};

/**
 * Query parameter validation
 */
export const queryValidation = {
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    handleValidationErrors,
  ],

  dateRange: [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be valid'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be valid'),
    handleValidationErrors,
  ],

  search: [
    query('q')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Search query must be between 1 and 100 characters'),
    handleValidationErrors,
  ],
};

/**
 * Sanitization middleware
 * Removes potentially dangerous characters from all string inputs
 */
export const sanitizeInputs = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const sanitizeValue = (value: unknown): unknown => {
    if (typeof value === 'string') {
      // Remove null bytes and control characters
      // eslint-disable-next-line no-control-regex
      return value.replace(/\x00/g, '').replace(/[\x00-\x1F\x7F]/g, '');
    }
    if (Array.isArray(value)) {
      return value.map(sanitizeValue);
    }
    if (value && typeof value === 'object') {
      const sanitized: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = sanitizeValue(val);
      }
      return sanitized;
    }
    return value;
  };

  if (req.body) {
    req.body = sanitizeValue(req.body);
  }
  if (req.query) {
    req.query = sanitizeValue(req.query) as typeof req.query;
  }
  if (req.params) {
    req.params = sanitizeValue(req.params) as typeof req.params;
  }

  next();
};

/**
 * Content-Type validation middleware
 * Ensures request has proper Content-Type header for POST/PUT/PATCH with body
 */
export const validateContentType = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const methods = ['POST', 'PUT', 'PATCH'];
  
  if (methods.includes(req.method)) {
    const contentType = req.get('Content-Type');
    const contentLength = req.get('Content-Length');
    
    // Only require Content-Type if there's actual content
    const hasContent = contentLength && parseInt(contentLength, 10) > 0;
    const hasBody = req.body && Object.keys(req.body).length > 0;
    
    // If there's content but no JSON content type, reject
    if ((hasContent || hasBody) && (!contentType || !contentType.includes('application/json'))) {
      const error = new ApiError(
        415,
        'Content-Type must be application/json',
        'INVALID_CONTENT_TYPE'
      );
      return handleError(res, error, 'Invalid Content-Type header');
    }
  }
  
  next();
};

/**
 * Request size validation
 * Prevents oversized payloads
 */
export const validateRequestSize = (maxSize: number) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = req.get('Content-Length');
    
    if (contentLength && parseInt(contentLength) > maxSize) {
      const error = new ApiError(
        413,
        `Request body too large. Maximum size is ${maxSize / 1024 / 1024}MB`,
        'PAYLOAD_TOO_LARGE'
      );
      return handleError(res, error, 'Request body size exceeded');
    }
    
    next();
  };
};
