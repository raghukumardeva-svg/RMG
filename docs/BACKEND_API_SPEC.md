# Backend API Specification - RMG Portal

This document describes the backend API endpoints that the RMG Portal frontend expects. Implement these endpoints in your backend service to work with the updated frontend.

---

## Base URL
```
http://localhost:3001/api
```
Set via environment variable: `VITE_API_URL`

---

## Authentication Endpoints

### 1. Login
**POST** `/auth/login`

Authenticate user with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "user_123",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "role": "EMPLOYEE",
    "department": "Engineering",
    "employeeId": "EMP001"
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "optional_refresh_token"
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid credentials
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

**Security Requirements:**
- Hash passwords using bcrypt (min 10 rounds)
- Implement rate limiting (e.g., 5 attempts per 15 minutes)
- Use secure token generation (JWT recommended)
- Set appropriate token expiration (e.g., 24 hours)

---

### 2. Logout
**POST** `/auth/logout`

Logout current user and invalidate token.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

---

### 3. Refresh Token
**POST** `/auth/refresh`

Refresh authentication token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

**Response (200 OK):**
```json
{
  "token": "new_jwt_token_here"
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid refresh token

---

### 4. Verify Token
**GET** `/auth/verify`

Verify current token and return user data.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "id": "user_123",
  "name": "John Doe",
  "email": "john.doe@example.com",
  "role": "EMPLOYEE",
  "department": "Engineering",
  "employeeId": "EMP001"
}
```

---

### 5. Forgot Password
**POST** `/auth/forgot-password`

Request password reset email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "message": "Password reset email sent"
}
```

---

### 6. Reset Password
**POST** `/auth/reset-password`

Reset password using token from email.

**Request Body:**
```json
{
  "token": "reset_token_from_email",
  "newPassword": "newSecurePassword123"
}
```

**Response (200 OK):**
```json
{
  "message": "Password reset successfully"
}
```

---

### 7. Change Password
**POST** `/auth/change-password`

Change password for authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword123"
}
```

**Response (200 OK):**
```json
{
  "message": "Password changed successfully"
}
```

---

## Employee Endpoints

### 8. Get All Employees
**GET** `/employees`

Get list of employees with optional filters.

**Query Parameters:**
- `status` (optional): "active" | "inactive"
- `department` (optional): Department name
- `search` (optional): Search term

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
[
  {
    "_id": "emp_123",
    "employeeId": "EMP001",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "designation": "Software Engineer",
    "department": "Engineering",
    "status": "active",
    "dateOfJoining": "2024-01-15",
    "dateOfBirth": "1990-05-20",
    "location": "New York",
    "businessUnit": "Technology",
    "reportingManagerId": "MGR001",
    "profilePhoto": "base64_or_url"
  }
]
```

---

### 9. Get Active Employees
**GET** `/employees/active`

Get list of active employees only.

**Response:** Same as Get All Employees

---

### 10. Get Next Employee ID
**GET** `/employees/next-id`

Get next available employee ID.

**Response (200 OK):**
```json
{
  "nextId": "EMP010"
}
```

---

### 11. Create Employee
**POST** `/employees`

Create a new employee.

**Request Body:**
```json
{
  "employeeId": "EMP010",
  "name": "Jane Smith",
  "email": "jane.smith@example.com",
  "phone": "+1234567890",
  "designation": "Senior Developer",
  "department": "Engineering",
  "dateOfJoining": "2024-03-01",
  "dateOfBirth": "1988-07-15",
  "location": "San Francisco",
  "businessUnit": "Technology",
  "reportingManagerId": "MGR001",
  "profilePhoto": "base64_string_optional",
  "status": "active"
}
```

**Response (201 Created):**
```json
{
  "_id": "emp_new_123",
  "employeeId": "EMP010",
  ...rest of employee data
}
```

---

### 12. Update Employee
**PUT** `/employees/:id`

Update employee information.

**Request Body:** Partial employee object with fields to update

**Response (200 OK):** Updated employee object

---

### 13. Mark Employee Inactive
**PATCH** `/employees/:id/inactive`

Mark employee as inactive.

**Response (200 OK):**
```json
{
  "message": "Employee marked as inactive"
}
```

---

### 14. Activate Employee
**PATCH** `/employees/:id/activate`

Reactivate inactive employee.

**Response (200 OK):**
```json
{
  "message": "Employee activated"
}
```

---

### 15. Delete Employee
**DELETE** `/employees/:id`

Permanently delete employee.

**Response (200 OK):**
```json
{
  "message": "Employee deleted"
}
```

---

### 16. Bulk Upload Employees
**POST** `/employees/bulk`

Upload multiple employees at once.

**Request Body:**
```json
[
  {
    "employeeId": "EMP011",
    "name": "Employee One",
    ...
  },
  {
    "employeeId": "EMP012",
    "name": "Employee Two",
    ...
  }
]
```

**Response (200 OK):**
```json
{
  "created": 10,
  "updated": 5,
  "errors": []
}
```

---

## Profile Endpoints

### 17. Get Employee Profile
**GET** `/profiles/:employeeId`

Get detailed employee profile.

**Response (200 OK):**
```json
{
  "data": {
    "employeeId": "EMP001",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "designation": "Software Engineer",
    "department": "Engineering",
    ...extended profile fields
  }
}
```

---

### 18. Update Profile
**PUT** `/profiles/:employeeId`

Update employee profile.

**Request Body:** Fields defined in `ProfileUpdateData` interface

**Response (200 OK):**
```json
{
  "data": { ...updated profile }
}
```

---

### 19. Update Profile Section
**PATCH** `/profiles/:employeeId/:section`

Update specific section of profile (e.g., contact, address).

**Request Body:** Section-specific data

**Response (200 OK):**
```json
{
  "data": { ...updated profile }
}
```

---

## Leave Management Endpoints

### 20. Get All Leave Requests
**GET** `/leaves/requests`

Get all leave requests.

**Response:** Array of leave request objects

---

### 21. Get Leaves by User
**GET** `/leaves/user/:userId`

Get leave requests for specific user.

---

### 22. Get Pending Leaves
**GET** `/leaves/pending`

Get all pending leave requests.

---

### 23. Get Leave Balance
**GET** `/leaves/balance/:userId`

Get leave balance for user.

**Response (200 OK):**
```json
{
  "employeeId": "EMP001",
  "casual": 12,
  "sick": 10,
  "earned": 15,
  "remote": 20
}
```

---

### 24. Apply for Leave
**POST** `/leaves`

Submit leave application.

**Request Body:**
```json
{
  "userId": "EMP001",
  "userName": "John Doe",
  "userEmail": "john.doe@example.com",
  "department": "Engineering",
  "leaveType": "casual",
  "startDate": "2024-12-01",
  "endDate": "2024-12-05",
  "days": 5,
  "isHalfDay": false,
  "justification": "Personal work",
  "managerId": "MGR001"
}
```

---

### 25. Approve Leave
**PATCH** `/leaves/:id/approve`

Approve leave request.

---

### 26. Reject Leave
**PATCH** `/leaves/:id/reject`

**Request Body:**
```json
{
  "reason": "Insufficient staff during this period"
}
```

---

## Helpdesk Endpoints

### 27. Get All Tickets
**GET** `/helpdesk/tickets`

Get all helpdesk tickets.

---

### 28. Get Tickets by User
**GET** `/helpdesk/tickets/user/:userId`

Get tickets for specific user.

---

### 29. Get Ticket by ID
**GET** `/helpdesk/tickets/:id`

Get specific ticket details.

---

### 30. Create Ticket
**POST** `/helpdesk/tickets`

Create new helpdesk ticket.

**Request Body:**
```json
{
  "userId": "EMP001",
  "userName": "John Doe",
  "userEmail": "john.doe@example.com",
  "department": "Engineering",
  "requestType": "Laptop Issue",
  "subject": "Laptop won't start",
  "description": "My laptop shows blue screen",
  "urgency": "High",
  "attachments": []
}
```

---

### 31. Update Ticket
**PUT** `/helpdesk/tickets/:id`

Update ticket information.

---

### 32. Update Ticket Status
**PATCH** `/helpdesk/tickets/:id/status`

**Request Body:**
```json
{
  "status": "In Progress"
}
```

---

### 33. Resolve Ticket
**PATCH** `/helpdesk/tickets/:id/resolve`

**Request Body:**
```json
{
  "resolvedBy": "IT001",
  "notes": "Replaced motherboard"
}
```

---

### 34. Add Message to Ticket
**POST** `/helpdesk/tickets/:id/messages`

**Request Body:**
```json
{
  "sender": "employee",
  "senderName": "John Doe",
  "message": "The issue persists",
  "attachments": []
}
```

---

### 35. Close Ticket
**PATCH** `/helpdesk/tickets/:id/close`

**Request Body:**
```json
{
  "closingNote": "Issue resolved",
  "closedBy": "IT001"
}
```

---

## Holiday Endpoints

### 36. Get All Holidays
**GET** `/holidays`

Get list of holidays.

---

### 37. Create Holiday
**POST** `/holidays`

**Request Body:**
```json
{
  "date": "2024-12-25",
  "name": "Christmas",
  "type": "Public Holiday"
}
```

---

### 38. Update Holiday
**PUT** `/holidays/:id`

Update holiday information.

---

### 39. Delete Holiday
**DELETE** `/holidays/:id`

Delete holiday.

---

## Attendance Endpoints

### 40. Get Attendance Records
**GET** `/attendance`

**Query Parameters:**
- `employeeId` (optional)
- `startDate` (optional)
- `endDate` (optional)

---

### 41. Clock In
**POST** `/attendance/clock-in`

**Request Body:**
```json
{
  "employeeId": "EMP001",
  "timestamp": "2024-11-28T09:00:00Z"
}
```

---

### 42. Clock Out
**POST** `/attendance/clock-out`

**Request Body:**
```json
{
  "employeeId": "EMP001",
  "timestamp": "2024-11-28T18:00:00Z"
}
```

---

## Security Best Practices

1. **Authentication:**
   - Use JWT tokens with secure secret
   - Implement token expiration
   - Store refresh tokens securely in database
   - Invalidate tokens on logout

2. **Authorization:**
   - Implement role-based access control (RBAC)
   - Verify user permissions for each endpoint
   - Use middleware for auth checks

3. **Input Validation:**
   - Validate all inputs server-side
   - Sanitize user inputs to prevent XSS
   - Use parameterized queries to prevent SQL injection
   - Validate file uploads (type, size)

4. **Rate Limiting:**
   - Implement rate limiting on all endpoints
   - Special limits for auth endpoints (5 attempts/15 min)
   - Return 429 status when limit exceeded

5. **CORS:**
   - Configure CORS appropriately
   - Whitelist frontend domain only

6. **HTTPS:**
   - Use HTTPS in production
   - Set secure cookie flags

7. **Error Handling:**
   - Don't expose internal errors to client
   - Log errors server-side
   - Return generic error messages

---

## Testing Checklist

- [ ] All endpoints return correct status codes
- [ ] Authentication works correctly
- [ ] Authorization checks prevent unauthorized access
- [ ] Input validation rejects invalid data
- [ ] Rate limiting works
- [ ] CORS configured correctly
- [ ] Error handling returns appropriate messages
- [ ] Database queries are optimized
- [ ] API documentation is up to date

---

## Implementation Notes

1. Start with authentication endpoints first
2. Test each endpoint thoroughly before moving to next
3. Use environment variables for configuration
4. Implement logging for debugging
5. Add API versioning for future updates (e.g., `/api/v1/...`)
6. Consider using API documentation tools (Swagger/OpenAPI)

---

**Last Updated:** 2025-11-28
**Version:** 1.0
