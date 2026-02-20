# Request Body Validation Guide

## Overview

The RMG Portal implements comprehensive request body validation using `express-validator` to ensure data integrity, prevent invalid input, and improve API security. All data-modifying routes (POST, PUT, PATCH) are protected with validation middleware.

## Table of Contents

1. [Architecture](#architecture)
2. [Available Validators](#available-validators)
3. [Using Existing Validators](#using-existing-validators)
4. [Creating New Validators](#creating-new-validators)
5. [Error Handling](#error-handling)
6. [Testing Validation](#testing-validation)
7. [Best Practices](#best-practices)

---

## Architecture

### Middleware Location
```
server/src/middleware/validation.ts
```

### Global Middleware Applied (in server.ts)
```typescript
app.use(sanitizeInputs);           // Removes dangerous characters (null bytes, control chars)
app.use(validateContentType);      // Ensures POST/PUT/PATCH use application/json
app.use(validateRequestSize(10 * 1024 * 1024));  // Limits request body to 10MB
```

### Route-Specific Validation
Each route file imports specific validators:
```typescript
import { employeeValidation } from '../middleware/validation';

router.post('/', employeeValidation.create, async (req, res) => {
  // Route handler - validation passed
});
```

---

## Available Validators

### 1. Authentication (`authValidation`)

#### `authValidation.login`
**Route:** `POST /api/auth/login`
```typescript
{
  email: string,      // Valid email format
  password: string    // 8-72 chars
}
```

#### `authValidation.register`
**Route:** `POST /api/auth/register`
```typescript
{
  email: string,           // Valid email format
  password: string,        // 8-72 chars
  name: string,            // 1-100 chars
  employeeId: string,      // Pattern: EMP### or E###
  role: string,            // Optional: 'employee' | 'admin' | 'hr' | ...
  department?: string,
  designation?: string
}
```

#### `authValidation.changePassword`
**Route:** `POST /api/auth/change-password`
```typescript
{
  currentPassword: string,   // 8-72 chars
  newPassword: string        // 8-72 chars
}
```

---

### 2. Employees (`employeeValidation`)

#### `employeeValidation.create`
**Route:** `POST /api/employees`
```typescript
{
  employeeId: string,      // Required: EMP### or E###
  name: string,            // Required: 1-100 chars
  email: string,           // Required: Valid email
  phone?: string,          // Optional: 10 digits
  department: string,      // Required
  designation: string,     // Required
  status?: string,         // 'active' | 'inactive'
  dateOfJoining?: string,  // ISO date
  reportingManager?: string,
  skills?: string[],
  avatar?: string
}
```

#### `employeeValidation.update`
**Route:** `PUT /api/employees/:id`
```typescript
{
  // All fields optional for update
  name?: string,
  email?: string,
  phone?: string,
  department?: string,
  designation?: string,
  status?: string,
  // ... other fields
}
```

#### `employeeValidation.delete`
**Route:** `DELETE /api/employees/:id`
- Validates MongoDB ObjectId in route parameter

---

### 3. Helpdesk Tickets (`helpdeskValidation`)

#### `helpdeskValidation.createTicket`
**Routes:** 
- `POST /api/helpdesk`
- `POST /api/helpdesk/workflow`

```typescript
{
  userId: string,              // Required: Employee ID
  userName: string,            // Required: 1-100 chars
  userEmail: string,           // Required: Valid email
  userDepartment?: string,
  highLevelCategory: string,   // Required: 'IT' | 'Finance' | 'Facilities'
  subCategory?: string,
  subject: string,             // Required: 5-200 chars
  description: string,         // Required: 10-2000 chars
  urgency?: string,            // 'low' | 'medium' | 'high' | 'critical'
  status?: string,
  requiresApproval?: boolean,
  attachments?: string[]
}
```

#### `helpdeskValidation.updateTicket`
**Routes:**
- `PUT /api/helpdesk/:id`
- `PATCH /api/helpdesk/:id/status`

```typescript
{
  // All fields optional
  status?: string,
  urgency?: string,
  description?: string,
  cancelledBy?: string
}
```

#### `helpdeskValidation.assignTicket`
**Route:** `POST /api/helpdesk/:id/assign`
```typescript
{
  employeeId: string,        // Required
  employeeName: string,      // Required
  assignedById: string,      // Required
  assignedByName: string,    // Required
  notes?: string
}
```

#### `helpdeskValidation.addMessage`
**Route:** `POST /api/helpdesk/:id/message`
```typescript
{
  sender: string,        // Required: Employee ID
  senderName: string,    // Required
  message: string,       // Required: 1-2000 chars
  attachments?: string[]
}
```

---

### 4. Leaves (`leaveValidation`)

#### `leaveValidation.create`
**Route:** `POST /api/leaves`
```typescript
{
  employeeId: string,       // Required
  employeeName: string,     // Required
  leaveType: string,        // Required: 'Earned Leave' | 'Sabbatical Leave' | 'Comp Off' | ...
  startDate: string,        // Required: ISO date
  endDate: string,          // Required: ISO date (must be >= startDate)
  days: number,             // Required: Positive integer
  reason?: string,
  status?: string,          // 'pending' | 'approved' | 'rejected'
  appliedOn?: string        // ISO date
}
```

#### `leaveValidation.update`
**Route:** `PUT /api/leaves/:id`
```typescript
{
  // Same as create, all optional
  leaveType?: string,
  startDate?: string,
  endDate?: string,
  days?: number,
  status?: string
}
```

---

### 5. Attendance (`attendanceValidation`)

#### `attendanceValidation.create`
**Route:** `POST /api/attendance`
```typescript
{
  employeeId: string,      // Required
  date: string,            // Required: ISO date
  status: string,          // Required: 'present' | 'absent' | 'halfday' | 'wfh'
  checkIn?: string,        // Optional: HH:MM format
  checkOut?: string,       // Optional: HH:MM format
  workHours?: number,      // Optional: Positive number
  location?: string
}
```

---

### 6. Announcements (`announcementValidation`)

#### `announcementValidation.create`
**Route:** `POST /api/announcements`
```typescript
{
  title: string,            // Required: 5-200 chars
  content: string,          // Required: 10-5000 chars
  type?: string,            // 'general' | 'urgent' | 'event' | 'policy'
  priority?: string,        // 'low' | 'medium' | 'high'
  publishedBy?: string,
  publishedOn?: string,     // ISO date
  expiresOn?: string        // ISO date
}
```

#### `announcementValidation.update`
**Route:** `PUT /api/announcements/:id`
```typescript
{
  // Same as create, all optional
}
```

---

### 7. Allocations (`allocationValidation`)

#### `allocationValidation.create`
**Route:** `POST /api/allocations`
```typescript
{
  employeeId: string,       // Required
  employeeName: string,     // Required
  projectId: string,        // Required
  projectName: string,      // Required
  allocation: number,       // Required: 0-100 (percentage)
  startDate: string,        // Required: ISO date
  endDate?: string,         // Optional: ISO date (must be >= startDate)
  billable?: boolean,
  role?: string,
  status?: string           // 'active' | 'inactive' | 'completed'
}
```

#### `allocationValidation.update`
**Route:** `PUT /api/allocations/:id`
```typescript
{
  // Same as create, all optional
  allocation?: number,
  endDate?: string,
  status?: string
}
```

---

### 8. Payroll (`payrollValidation`)

#### `payrollValidation.create`
**Route:** `POST /api/payroll`
```typescript
{
  employeeId: string,          // Required
  employeeName: string,        // Required
  month: string,               // Required: 'January' | 'February' | ...
  year: number,                // Required: 2000-2100
  basicSalary: number,         // Required: Positive
  hra?: number,                // Optional: Positive
  conveyance?: number,         // Optional: Positive
  specialAllowance?: number,   // Optional: Positive
  bonus?: number,              // Optional: Positive
  deductions?: number,         // Optional: Positive
  tax?: number,                // Optional: Positive
  netSalary: number,           // Required: Positive
  paymentStatus?: string,      // 'pending' | 'processed' | 'paid'
  paymentDate?: string         // ISO date
}
```

---

### 9. Query Parameters (`queryValidation`)

#### `queryValidation.pagination`
**Usage:** Any GET route with pagination
```typescript
Query params:
- page?: number (min 1)
- limit?: number (min 1, max 100)
- sortBy?: string
- order?: 'asc' | 'desc'
```

#### `queryValidation.dateRange`
**Usage:** GET routes filtering by date
```typescript
Query params:
- startDate?: string (ISO date)
- endDate?: string (ISO date, must be >= startDate)
```

#### `queryValidation.search`
**Usage:** GET routes with search
```typescript
Query params:
- q?: string (1-200 chars)
```

---

## Using Existing Validators

### Step 1: Import the Validator
```typescript
// In your route file
import { employeeValidation } from '../middleware/validation';
```

### Step 2: Apply to Route
```typescript
router.post('/', employeeValidation.create, async (req: Request, res: Response) => {
  // If we reach here, validation passed
  const employee = new Employee(req.body);
  await employee.save();
  res.status(201).json({ success: true, data: employee });
});
```

### Step 3: Handle Validation Errors (Automatic)
Validation errors are automatically formatted and returned:
```json
{
  "success": false,
  "errors": [
    {
      "field": "email",
      "message": "Must be a valid email address"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

---

## Creating New Validators

### Common Validators Available
```typescript
import { commonValidations } from '../middleware/validation';

commonValidations.email         // Email validation
commonValidations.password      // Password validation (8-72 chars)
commonValidations.employeeId    // Employee ID format (EMP### or E###)
commonValidations.mongoId       // MongoDB ObjectId validation
commonValidations.name          // Name validation (1-100 chars)
commonValidations.phone         // Phone validation (10 digits)
commonValidations.date          // ISO date validation
commonValidations.positiveNumber // Positive number validation
```

### Example: Create New Validator

```typescript
// In server/src/middleware/validation.ts

export const projectValidation = {
  create: [
    // Required fields
    body('projectId')
      .trim()
      .notEmpty().withMessage('Project ID is required')
      .matches(/^PRJ\d{3,}$/).withMessage('Project ID must be in format PRJ###'),
    
    body('name')
      .trim()
      .notEmpty().withMessage('Project name is required')
      .isLength({ min: 3, max: 200 }).withMessage('Name must be 3-200 characters'),
    
    body('client')
      .trim()
      .notEmpty().withMessage('Client name is required')
      .isLength({ max: 200 }).withMessage('Client name cannot exceed 200 characters'),
    
    // Optional fields with validation
    body('startDate')
      .optional()
      .isISO8601().withMessage('Invalid date format'),
    
    body('endDate')
      .optional()
      .isISO8601().withMessage('Invalid date format')
      .custom((value, { req }) => {
        if (req.body.startDate && value < req.body.startDate) {
          throw new Error('End date must be after start date');
        }
        return true;
      }),
    
    body('status')
      .optional()
      .isIn(['active', 'completed', 'on-hold', 'cancelled'])
      .withMessage('Invalid status'),
    
    body('budget')
      .optional()
      .isFloat({ min: 0 }).withMessage('Budget must be a positive number'),
    
    handleValidationErrors
  ],

  update: [
    // All fields optional for updates
    body('name')
      .optional()
      .trim()
      .isLength({ min: 3, max: 200 }).withMessage('Name must be 3-200 characters'),
    
    body('status')
      .optional()
      .isIn(['active', 'completed', 'on-hold', 'cancelled'])
      .withMessage('Invalid status'),
    
    body('endDate')
      .optional()
      .isISO8601().withMessage('Invalid date format'),
    
    handleValidationErrors
  ],

  delete: [
    param('id')
      .isMongoId().withMessage('Invalid project ID'),
    handleValidationErrors
  ]
};
```

### Apply New Validator
```typescript
// In server/src/routes/projects.ts
import { projectValidation } from '../middleware/validation';

router.post('/', projectValidation.create, async (req, res) => {
  // Validation passed
});

router.put('/:id', projectValidation.update, async (req, res) => {
  // Validation passed
});

router.delete('/:id', projectValidation.delete, async (req, res) => {
  // Validation passed
});
```

---

## Error Handling

### Validation Error Response Format
```typescript
{
  success: false,
  errors: [
    {
      field: "email",           // Field name that failed
      message: "Invalid email"  // Human-readable error message
    },
    {
      field: "password",
      message: "Password must be at least 8 characters"
    }
  ]
}
```

### HTTP Status Codes
- **400 Bad Request**: Validation failed
- **201 Created**: POST successful
- **200 OK**: PUT/PATCH successful
- **404 Not Found**: Resource doesn't exist
- **500 Internal Server Error**: Server error

### Frontend Error Handling Example
```typescript
try {
  const response = await fetch('/api/employees', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(employeeData)
  });

  const data = await response.json();

  if (!response.ok) {
    if (data.errors) {
      // Validation errors
      data.errors.forEach((error: { field: string; message: string }) => {
        console.error(`${error.field}: ${error.message}`);
        // Show field-specific error in UI
      });
    }
    return;
  }

  // Success
  console.log('Employee created:', data.data);
} catch (error) {
  console.error('Network error:', error);
}
```

---

## Testing Validation

### Manual Testing with cURL

#### Valid Request
```bash
curl -X POST http://localhost:5000/api/employees \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "EMP001",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "9876543210",
    "department": "Engineering",
    "designation": "Software Engineer"
  }'
```

#### Invalid Request (Missing Required Fields)
```bash
curl -X POST http://localhost:5000/api/employees \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe"
  }'

# Response:
{
  "success": false,
  "errors": [
    { "field": "employeeId", "message": "Employee ID is required" },
    { "field": "email", "message": "Email is required" },
    { "field": "department", "message": "Department is required" },
    { "field": "designation", "message": "Designation is required" }
  ]
}
```

#### Invalid Format
```bash
curl -X POST http://localhost:5000/api/employees \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "INVALID",
    "name": "",
    "email": "not-an-email",
    "phone": "12345",
    "department": "Engineering",
    "designation": "Engineer"
  }'

# Response:
{
  "success": false,
  "errors": [
    { "field": "employeeId", "message": "Invalid employee ID format (use EMP### or E###)" },
    { "field": "name", "message": "Name must be at least 1 character" },
    { "field": "email", "message": "Must be a valid email address" },
    { "field": "phone", "message": "Phone must be 10 digits" }
  ]
}
```

### Testing with Postman

1. **Create Collection**: RMG Portal API
2. **Add Requests**: For each validated endpoint
3. **Test Valid Data**: Should return 200/201 with success
4. **Test Invalid Data**: Should return 400 with errors array
5. **Test Missing Fields**: Should return 400 with specific field errors
6. **Test Edge Cases**: Max length, min length, boundary values

---

## Best Practices

### 1. Always Validate User Input
```typescript
// ❌ BAD - No validation
router.post('/', async (req, res) => {
  const employee = new Employee(req.body); // Accepts anything!
  await employee.save();
});

// ✅ GOOD - Validation middleware
router.post('/', employeeValidation.create, async (req, res) => {
  const employee = new Employee(req.body); // Clean, validated data
  await employee.save();
});
```

### 2. Use Specific Validators
```typescript
// ❌ BAD - Generic string validation
body('status').isString()

// ✅ GOOD - Enum validation
body('status').isIn(['active', 'inactive'])
```

### 3. Validate Data Types
```typescript
// ❌ BAD - No type checking
body('age').exists()

// ✅ GOOD - Type and range validation
body('age')
  .isInt({ min: 18, max: 100 })
  .withMessage('Age must be between 18 and 100')
```

### 4. Sanitize Input
```typescript
// Global sanitization already applied via sanitizeInputs middleware
// For additional sanitization:
body('name')
  .trim()                    // Remove whitespace
  .escape()                  // Escape HTML chars
  .notEmpty()
```

### 5. Custom Validation for Complex Logic
```typescript
body('endDate')
  .custom((value, { req }) => {
    if (req.body.startDate && value < req.body.startDate) {
      throw new Error('End date must be after start date');
    }
    return true;
  })
```

### 6. Validate Route Parameters
```typescript
// Validate MongoDB IDs in routes
router.get('/:id', 
  param('id').isMongoId().withMessage('Invalid ID'),
  handleValidationErrors,
  async (req, res) => {
    // ID is valid
  }
);
```

### 7. Optional vs Required
```typescript
// Required field
body('email')
  .notEmpty().withMessage('Email is required')
  .isEmail().withMessage('Invalid email')

// Optional field
body('phone')
  .optional()
  .matches(/^\d{10}$/).withMessage('Phone must be 10 digits')
```

### 8. Clear Error Messages
```typescript
// ❌ BAD
body('email').isEmail() // Error: "Invalid value"

// ✅ GOOD
body('email')
  .isEmail().withMessage('Must be a valid email address')
```

### 9. Don't Over-Validate
```typescript
// ❌ BAD - Too restrictive
body('name')
  .matches(/^[A-Z][a-z]+ [A-Z][a-z]+$/)
  .withMessage('Must be First Last name')

// ✅ GOOD - Flexible but safe
body('name')
  .trim()
  .isLength({ min: 1, max: 100 })
  .withMessage('Name must be 1-100 characters')
```

### 10. Keep Validation DRY
```typescript
// Reuse common validators
const requiredEmail = body('email')
  .trim()
  .notEmpty().withMessage('Email is required')
  .isEmail().withMessage('Invalid email');

// Use in multiple validators
export const userValidation = {
  create: [requiredEmail, ...otherValidators],
  update: [body('email').optional().isEmail(), ...]
};
```

---

## Security Benefits

### 1. SQL/NoSQL Injection Prevention
- Validates data types before database queries
- Sanitizes input to remove malicious characters

### 2. XSS Prevention
- Global `sanitizeInputs` middleware removes dangerous chars
- Input length limits prevent payload attacks

### 3. Data Integrity
- Ensures required fields are present
- Validates data formats (email, phone, dates)
- Enforces business rules (date ranges, enum values)

### 4. DoS Prevention
- `validateRequestSize` limits payload to 10MB
- Field length limits prevent memory exhaustion

### 5. Type Safety
- Validates data types match expected schema
- Prevents type coercion vulnerabilities

---

## Common Validation Patterns

### Email Validation
```typescript
body('email')
  .trim()
  .notEmpty().withMessage('Email is required')
  .isEmail().withMessage('Invalid email format')
  .normalizeEmail()
```

### Password Validation
```typescript
body('password')
  .isLength({ min: 8, max: 72 })
  .withMessage('Password must be 8-72 characters')
  .matches(/\d/).withMessage('Password must contain a number')
  .matches(/[a-z]/).withMessage('Password must contain lowercase')
  .matches(/[A-Z]/).withMessage('Password must contain uppercase')
```

### Date Range Validation
```typescript
body('startDate')
  .notEmpty().withMessage('Start date is required')
  .isISO8601().withMessage('Invalid date format'),

body('endDate')
  .notEmpty().withMessage('End date is required')
  .isISO8601().withMessage('Invalid date format')
  .custom((value, { req }) => {
    if (value < req.body.startDate) {
      throw new Error('End date must be after start date');
    }
    return true;
  })
```

### Enum Validation
```typescript
body('status')
  .isIn(['pending', 'approved', 'rejected'])
  .withMessage('Status must be pending, approved, or rejected')
```

### Numeric Range
```typescript
body('allocation')
  .isInt({ min: 0, max: 100 })
  .withMessage('Allocation must be 0-100%')
```

---

## Troubleshooting

### Issue: Validation Not Running
**Symptom:** Invalid data gets through
**Solution:**
1. Check middleware order: `router.post('/path', validation, handler)`
2. Ensure `handleValidationErrors` is last in validator array
3. Verify import: `import { validation } from '../middleware/validation'`

### Issue: All Requests Return 400
**Symptom:** Even valid requests fail
**Solution:**
1. Check Content-Type header: Must be `application/json`
2. Verify field names match exactly (case-sensitive)
3. Check date formats are ISO 8601
4. Review console for specific error messages

### Issue: Error Messages Not Descriptive
**Symptom:** Generic "Invalid value" errors
**Solution:**
Add `.withMessage()` to every validator:
```typescript
body('field')
  .notEmpty().withMessage('Field is required')
  .isEmail().withMessage('Must be valid email')
```

### Issue: Optional Fields Failing
**Symptom:** Optional fields cause validation errors when omitted
**Solution:**
Use `.optional()` before other validators:
```typescript
body('phone')
  .optional()  // Must be first
  .matches(/^\d{10}$/)
```

---

## Summary

✅ **Implemented:**
- Global input sanitization (XSS prevention)
- Content-Type validation
- Request size limits (10MB max)
- Comprehensive validators for 8+ modules
- Automatic error formatting
- Common validator library

✅ **Routes Validated:**
- Authentication (login, register, changePassword)
- Employees (create, update, delete)
- Helpdesk (create, update, assign, messages)
- Leaves (create, update with date logic)
- Attendance (create with time validation)
- Announcements (create, update)
- Allocations (create, update with date ranges)
- Payroll (create)
- Profiles (update)

✅ **Security Improvements:**
- Prevents invalid data entry
- Blocks oversized payloads
- Sanitizes all user input
- Enforces business rules
- Provides clear error messages

---

## Next Steps

1. **Add Validation to Specialized Routes:**
   - Projects (POST, PUT, DELETE)
   - IT Specialists (POST, PUT)
   - Holidays (POST, PUT, DELETE)
   - Notifications (POST, PATCH)
   - Approvals (POST with approval logic)
   - Sub-category Config (POST, PUT, DELETE)

2. **Enhance Existing Validators:**
   - Add password strength requirements
   - Implement email uniqueness check
   - Add phone number format by country
   - Cross-field validation (e.g., salary ranges)

3. **Testing:**
   - Create automated test suite with Jest
   - Test all validation scenarios
   - Performance test with large payloads
   - Security penetration testing

4. **Documentation:**
   - Add API documentation (Swagger/OpenAPI)
   - Create Postman collection with test cases
   - Document custom validation examples
   - Add troubleshooting guide

---

**Last Updated:** January 2025  
**Version:** 1.0  
**Author:** RMG Development Team
