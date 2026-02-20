/**
 * File Upload Validation Utilities
 * Provides secure file validation with type checks, size limits, and sanitization
 * 
 * This module provides validation utilities that can be used with any file upload handler.
 * For multer integration, install: npm install multer @types/multer
 */

import { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';

// File interface for validation
export interface FileInfo {
  fieldname?: string;
  originalname: string;
  encoding?: string;
  mimetype: string;
  size: number;
  destination?: string;
  filename?: string;
  path?: string;
  buffer?: Buffer;
}

// Configuration
export const CONFIG = {
  // Maximum file size in bytes (10MB)
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  
  // Maximum number of files per request
  MAX_FILES: 5,
  
  // Allowed MIME types with their extensions
  ALLOWED_TYPES: {
    // Documents
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'application/vnd.ms-powerpoint': ['.ppt'],
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
    'text/plain': ['.txt'],
    'text/csv': ['.csv'],
    
    // Images
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp'],
    'image/svg+xml': ['.svg'],
  } as Record<string, string[]>,
  
  // Blocked extensions (double extension attack prevention)
  BLOCKED_EXTENSIONS: [
    '.exe', '.bat', '.cmd', '.sh', '.ps1', '.vbs', '.js', '.jar',
    '.msi', '.dll', '.com', '.scr', '.hta', '.cpl', '.msc', '.inf',
    '.reg', '.ws', '.wsf', '.wsc', '.wsh', '.psc1', '.scf', '.lnk',
    '.php', '.asp', '.aspx', '.jsp', '.py', '.rb', '.pl', '.cgi'
  ],
  
  // Upload destination
  UPLOAD_DIR: path.join(__dirname, '../../uploads'),
};

/**
 * Validate file type by checking MIME type and extension
 */
export const validateFileType = (file: { mimetype: string; originalname: string }): boolean => {
  const mimeType = file.mimetype.toLowerCase();
  const extension = path.extname(file.originalname).toLowerCase();
  
  // Check if MIME type is allowed
  if (!CONFIG.ALLOWED_TYPES[mimeType]) {
    return false;
  }
  
  // Check if extension matches allowed extensions for this MIME type
  const allowedExtensions = CONFIG.ALLOWED_TYPES[mimeType];
  if (!allowedExtensions.includes(extension)) {
    return false;
  }
  
  // Check for blocked extensions (double extension attack prevention)
  const fileName = file.originalname.toLowerCase();
  for (const blockedExt of CONFIG.BLOCKED_EXTENSIONS) {
    if (fileName.includes(blockedExt)) {
      return false;
    }
  }
  
  return true;
};

/**
 * Validate file size
 */
export const validateFileSize = (size: number): boolean => {
  return size > 0 && size <= CONFIG.MAX_FILE_SIZE;
};

/**
 * Generate secure filename to prevent path traversal attacks
 */
export const generateSecureFilename = (originalName: string): string => {
  const extension = path.extname(originalName).toLowerCase();
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(16).toString('hex');
  return `${timestamp}-${randomString}${extension}`;
};

/**
 * Sanitize filename by removing dangerous characters
 */
export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace dangerous chars with underscore
    .replace(/\.{2,}/g, '.') // Prevent directory traversal
    .replace(/^\./, '_') // Don't start with dot
    .substring(0, 255); // Limit length
};

/**
 * Check filename for security issues
 */
export const isFilenameSecure = (filename: string): boolean => {
  // Check for null bytes
  if (filename.includes('\0')) {
    return false;
  }
  
  // Check for path traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return false;
  }
  
  // Check for hidden files
  if (filename.startsWith('.')) {
    return false;
  }
  
  return true;
};

/**
 * Validate a file object
 */
export const validateFile = (file: FileInfo): { valid: boolean; error?: string } => {
  // Check filename security
  if (!isFilenameSecure(file.originalname)) {
    return { valid: false, error: 'Invalid filename' };
  }
  
  // Check file type
  if (!validateFileType(file)) {
    return { 
      valid: false, 
      error: 'File type not allowed. Allowed types: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV, JPG, PNG, GIF, WEBP, SVG' 
    };
  }
  
  // Check file size
  if (!validateFileSize(file.size)) {
    if (file.size === 0) {
      return { valid: false, error: 'Empty files are not allowed' };
    }
    return { 
      valid: false, 
      error: `File too large. Maximum size is ${CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB` 
    };
  }
  
  return { valid: true };
};

/**
 * Middleware to validate files in request (for use after file upload middleware)
 */
export const validateUploadedFiles = (
  req: Request & { file?: FileInfo; files?: FileInfo[] | Record<string, FileInfo[]> },
  res: Response,
  next: NextFunction
) => {
  // Get files from request
  let filesToValidate: FileInfo[] = [];
  
  if (req.file) {
    filesToValidate = [req.file];
  } else if (req.files) {
    if (Array.isArray(req.files)) {
      filesToValidate = req.files;
    } else {
      // Handle field-based files object
      filesToValidate = Object.values(req.files).flat();
    }
  }
  
  // Check file count
  if (filesToValidate.length > CONFIG.MAX_FILES) {
    return res.status(400).json({
      success: false,
      message: `Too many files. Maximum is ${CONFIG.MAX_FILES} files`,
      code: 'TOO_MANY_FILES'
    });
  }
  
  // Validate each file
  for (const file of filesToValidate) {
    const result = validateFile(file);
    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: result.error,
        code: 'INVALID_FILE'
      });
    }
  }
  
  next();
};

/**
 * Middleware to require at least one file
 */
export const requireFile = (fieldName: string) => {
  return (
    req: Request & { file?: FileInfo; files?: FileInfo[] | Record<string, FileInfo[]> },
    res: Response,
    next: NextFunction
  ) => {
    const hasFile = req.file || (req.files && (
      Array.isArray(req.files) ? req.files.length > 0 : Object.keys(req.files).length > 0
    ));
    
    if (!hasFile) {
      return res.status(400).json({
        success: false,
        message: `File is required in field: ${fieldName}`,
        code: 'FILE_REQUIRED'
      });
    }
    next();
  };
};

/**
 * Error handler middleware for file upload errors
 */
export const handleUploadError = (
  err: Error & { code?: string },
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  // Handle common upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: `File too large. Maximum size is ${CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`,
      code: 'FILE_TOO_LARGE'
    });
  }
  
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      success: false,
      message: `Too many files. Maximum is ${CONFIG.MAX_FILES} files`,
      code: 'TOO_MANY_FILES'
    });
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'Unexpected file field',
      code: 'UNEXPECTED_FILE'
    });
  }
  
  if (err.message.includes('File type not allowed')) {
    return res.status(400).json({
      success: false,
      message: err.message,
      code: 'INVALID_FILE_TYPE'
    });
  }
  
  next(err);
};

/**
 * Get allowed file types for client-side validation
 */
export const getAllowedFileTypes = () => {
  const extensions: string[] = [];
  const mimeTypes: string[] = [];
  
  for (const [mime, exts] of Object.entries(CONFIG.ALLOWED_TYPES)) {
    mimeTypes.push(mime);
    extensions.push(...exts);
  }
  
  return {
    extensions: [...new Set(extensions)],
    mimeTypes: [...new Set(mimeTypes)],
    maxSize: CONFIG.MAX_FILE_SIZE,
    maxFiles: CONFIG.MAX_FILES
  };
};

/**
 * Export configuration for external use
 */
export const uploadConfig = CONFIG;
