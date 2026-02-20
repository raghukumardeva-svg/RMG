/**
 * Input Sanitization Utilities
 *
 * Provides functions to sanitize user inputs and prevent XSS attacks.
 * Use these utilities before displaying user-generated content or sending data to the server.
 */

/**
 * Sanitize string input by removing potentially dangerous characters
 * @param input - String to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove inline event handlers
    .substring(0, 1000); // Limit length
}

/**
 * Sanitize HTML by escaping special characters
 * Prevents XSS attacks when displaying user content
 * @param html - HTML string to sanitize
 * @returns Escaped HTML string safe for display
 */
export function escapeHtml(html: string): string {
  if (typeof html !== 'string') {
    return '';
  }

  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

/**
 * Sanitize HTML content for safe rendering
 * Allows only safe HTML tags and attributes
 * @param html - HTML string to sanitize
 * @returns Sanitized HTML safe for dangerouslySetInnerHTML
 */
export function sanitizeHtml(html: string): string {
  if (typeof html !== 'string') {
    return '';
  }

  // Create a temporary div to parse HTML
  const temp = document.createElement('div');
  temp.innerHTML = html;

  // Allowed tags
  const allowedTags = ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'a', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre', 'mark'];
  
  // Allowed attributes per tag
  const allowedAttributes: Record<string, string[]> = {
    a: ['href', 'title', 'target', 'rel'],
    span: ['class'],
    div: ['class'],
    mark: ['class'],
  };

  // Recursively clean nodes
  const clean = (node: Node): Node | null => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node; // Text nodes are safe
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      const tagName = element.tagName.toLowerCase();

      // Remove disallowed tags
      if (!allowedTags.includes(tagName)) {
        // Return text content only
        return document.createTextNode(element.textContent || '');
      }

      // Create clean element
      const cleanElement = document.createElement(tagName);

      // Copy allowed attributes
      const allowed = allowedAttributes[tagName] || [];
      for (const attr of Array.from(element.attributes)) {
        if (allowed.includes(attr.name)) {
          // Additional security checks for href
          if (attr.name === 'href') {
            const href = attr.value;
            // Only allow http, https, and mailto protocols
            if (href.match(/^(https?:|mailto:)/i) && !href.match(/^javascript:/i)) {
              cleanElement.setAttribute(attr.name, attr.value);
            }
          } else {
            cleanElement.setAttribute(attr.name, attr.value);
          }
        }
      }

      // Recursively clean children
      for (const child of Array.from(element.childNodes)) {
        const cleanedChild = clean(child);
        if (cleanedChild) {
          cleanElement.appendChild(cleanedChild);
        }
      }

      return cleanElement;
    }

    return null;
  };

  // Clean all children
  const cleanedDiv = document.createElement('div');
  for (const child of Array.from(temp.childNodes)) {
    const cleanedChild = clean(child);
    if (cleanedChild) {
      cleanedDiv.appendChild(cleanedChild);
    }
  }

  return cleanedDiv.innerHTML;
}

/**
 * Sanitize email address
 * @param email - Email to validate and sanitize
 * @returns Sanitized email or empty string if invalid
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') {
    return '';
  }

  const sanitized = email.trim().toLowerCase();

  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailRegex.test(sanitized) ? sanitized : '';
}

/**
 * Sanitize phone number - remove all non-numeric characters except + at start
 * @param phone - Phone number to sanitize
 * @returns Sanitized phone number
 */
export function sanitizePhone(phone: string): string {
  if (typeof phone !== 'string') {
    return '';
  }

  const cleaned = phone.trim();

  // Allow + at the start, then only digits, spaces, and hyphens
  const sanitized = cleaned.replace(/^(\+)?([0-9\s\-()]*)$/, '$1$2');

  return sanitized.substring(0, 20); // Limit length
}

/**
 * Sanitize URL
 * Only allows http:// and https:// protocols
 * @param url - URL to sanitize
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') {
    return '';
  }

  const trimmed = url.trim();

  // Only allow http and https protocols
  if (!trimmed.match(/^https?:\/\//i)) {
    return '';
  }

  // Remove javascript: and data: protocols
  if (trimmed.match(/^(javascript|data):/i)) {
    return '';
  }

  try {
    const urlObj = new URL(trimmed);
    return urlObj.href;
  } catch {
    return '';
  }
}

/**
 * Sanitize filename
 * Removes path separators and dangerous characters
 * @param filename - Filename to sanitize
 * @returns Safe filename
 */
export function sanitizeFilename(filename: string): string {
  if (typeof filename !== 'string') {
    return '';
  }

  return filename
    .trim()
    .replace(/[/\\?%*:|"<>]/g, '') // Remove path separators and dangerous chars
    .replace(/\.\./g, '') // Remove parent directory references
    .substring(0, 255); // Limit length
}

/**
 * Sanitize number input
 * @param input - Input to convert to number
 * @param min - Minimum allowed value (optional)
 * @param max - Maximum allowed value (optional)
 * @returns Sanitized number or NaN if invalid
 */
export function sanitizeNumber(
  input: string | number,
  min?: number,
  max?: number
): number {
  const num = typeof input === 'string' ? parseFloat(input) : input;

  if (isNaN(num)) {
    return NaN;
  }

  if (min !== undefined && num < min) {
    return min;
  }

  if (max !== undefined && num > max) {
    return max;
  }

  return num;
}

/**
 * Sanitize date string
 * @param dateString - Date string to sanitize
 * @returns ISO date string or empty string if invalid
 */
export function sanitizeDate(dateString: string): string {
  if (typeof dateString !== 'string') {
    return '';
  }

  try {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      return '';
    }

    return date.toISOString();
  } catch {
    return '';
  }
}

/**
 * Sanitize object by recursively sanitizing string values
 * @param obj - Object to sanitize
 * @returns Sanitized object
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = {} as T;

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];

      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value) as T[Extract<keyof T, string>];
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sanitized[key] = sanitizeObject(value as Record<string, unknown>) as T[Extract<keyof T, string>];
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item =>
          typeof item === 'string' ? sanitizeString(item) :
          typeof item === 'object' && item !== null ? sanitizeObject(item) :
          item
        ) as T[Extract<keyof T, string>];
      } else {
        sanitized[key] = value as T[Extract<keyof T, string>];
      }
    }
  }

  return sanitized;
}

/**
 * Validate and sanitize form data
 * @param formData - Form data to validate
 * @param schema - Validation schema
 * @returns Validation result with sanitized data or errors
 */
export interface ValidationSchema {
  [key: string]: {
    type: 'string' | 'email' | 'phone' | 'url' | 'number' | 'date';
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: RegExp;
    custom?: (value: unknown) => boolean;
  };
}

export interface ValidationResult<T> {
  isValid: boolean;
  data: Partial<T>;
  errors: Record<string, string>;
}

export function validateAndSanitize<T extends Record<string, unknown>>(
  formData: T,
  schema: ValidationSchema
): ValidationResult<T> {
  const sanitized: Partial<T> = {};
  const errors: Record<string, string> = {};
  let isValid = true;

  for (const key in schema) {
    const field = schema[key];
    const value = formData[key];

    // Check required fields
    if (field.required && (value === undefined || value === null || value === '')) {
      errors[key] = `${key} is required`;
      isValid = false;
      continue;
    }

    // Skip validation if field is not required and empty
    if (!field.required && (value === undefined || value === null || value === '')) {
      continue;
    }

    // Type-specific validation and sanitization
    switch (field.type) {
      case 'string':
        if (typeof value === 'string') {
          const sanitizedValue = sanitizeString(value);
          if (field.min && sanitizedValue.length < field.min) {
            errors[key] = `${key} must be at least ${field.min} characters`;
            isValid = false;
          } else if (field.max && sanitizedValue.length > field.max) {
            errors[key] = `${key} must be at most ${field.max} characters`;
            isValid = false;
          } else if (field.pattern && !field.pattern.test(sanitizedValue)) {
            errors[key] = `${key} format is invalid`;
            isValid = false;
          } else {
            sanitized[key as keyof T] = sanitizedValue as T[keyof T];
          }
        } else {
          errors[key] = `${key} must be a string`;
          isValid = false;
        }
        break;

      case 'email':
        if (typeof value === 'string') {
          const sanitizedEmail = sanitizeEmail(value);
          if (!sanitizedEmail) {
            errors[key] = `${key} must be a valid email`;
            isValid = false;
          } else {
            sanitized[key as keyof T] = sanitizedEmail as T[keyof T];
          }
        } else {
          errors[key] = `${key} must be an email`;
          isValid = false;
        }
        break;

      case 'phone':
        if (typeof value === 'string') {
          const sanitizedPhone = sanitizePhone(value);
          sanitized[key as keyof T] = sanitizedPhone as T[keyof T];
        } else {
          errors[key] = `${key} must be a phone number`;
          isValid = false;
        }
        break;

      case 'url':
        if (typeof value === 'string') {
          const sanitizedUrl = sanitizeUrl(value);
          if (!sanitizedUrl) {
            errors[key] = `${key} must be a valid URL`;
            isValid = false;
          } else {
            sanitized[key as keyof T] = sanitizedUrl as T[keyof T];
          }
        } else {
          errors[key] = `${key} must be a URL`;
          isValid = false;
        }
        break;

      case 'number':
        const num = sanitizeNumber(value as string | number, field.min, field.max);
        if (isNaN(num)) {
          errors[key] = `${key} must be a number`;
          isValid = false;
        } else {
          sanitized[key as keyof T] = num as T[keyof T];
        }
        break;

      case 'date':
        if (typeof value === 'string') {
          const sanitizedDate = sanitizeDate(value);
          if (!sanitizedDate) {
            errors[key] = `${key} must be a valid date`;
            isValid = false;
          } else {
            sanitized[key as keyof T] = sanitizedDate as T[keyof T];
          }
        } else {
          errors[key] = `${key} must be a date`;
          isValid = false;
        }
        break;
    }

    // Custom validation
    if (field.custom && value !== undefined && value !== null) {
      if (!field.custom(value)) {
        errors[key] = `${key} validation failed`;
        isValid = false;
      }
    }
  }

  return { isValid, data: sanitized, errors };
}

/**
 * Example usage:
 *
 * const userInput = "<script>alert('xss')</script>Hello";
 * const safe = sanitizeString(userInput); // "Hello"
 *
 * const email = "  USER@EXAMPLE.COM  ";
 * const cleanEmail = sanitizeEmail(email); // "user@example.com"
 *
 * const formData = {
 *   name: "John<script>",
 *   email: "john@example.com",
 *   age: "30"
 * };
 *
 * const schema: ValidationSchema = {
 *   name: { type: 'string', required: true, min: 2, max: 50 },
 *   email: { type: 'email', required: true },
 *   age: { type: 'number', min: 0, max: 150 }
 * };
 *
 * const result = validateAndSanitize(formData, schema);
 * if (result.isValid) {
 *   // Use result.data
 * } else {
 *   // Show result.errors
 * }
 */
