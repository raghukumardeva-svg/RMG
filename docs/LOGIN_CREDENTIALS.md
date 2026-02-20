# Login Credentials

## Authorized Users

### Employee Account
- **Email:** sainikhil.bomma@acuvate.com
- **Password:** Nikhil@123
- **Role:** EMPLOYEE
- **Department:** Engineering
- **Employee ID:** EMP001

### RMG Account
- **Email:** mohan.reddy@acuvate.com
- **Password:** Mohan@123
- **Role:** RMG
- **Department:** Resource Management
- **Employee ID:** RMG001

### HR Account
- **Email:** hr@acuvate.com
- **Password:** Hr@123
- **Role:** HR
- **Department:** Human Resources
- **Employee ID:** HR001

### Finance Admin Account
- **Email:** finance@acuvate.com
- **Password:** Finance@123
- **Role:** FINANCE_ADMIN
- **Department:** Finance
- **Employee ID:** FIN001

### Facilities Admin Account
- **Email:** facilities@acuvate.com
- **Password:** Facilities@123
- **Role:** FACILITIES_ADMIN
- **Department:** Facilities
- **Employee ID:** FAC001

### Finance Specialists
**1. Rajesh Kumar**
- **Email:** finance.specialist1@acuvate.com
- **Password:** Finance@123
- **Role:** EMPLOYEE
- **Department:** Finance
- **Employee ID:** FINS001

**2. Priya Sharma**
- **Email:** finance.specialist2@acuvate.com
- **Password:** Finance@123
- **Role:** EMPLOYEE
- **Department:** Finance
- **Employee ID:** FINS002

### Facilities Specialists
**1. Arun Reddy**
- **Email:** facilities.specialist1@acuvate.com
- **Password:** Facilities@123
- **Role:** EMPLOYEE
- **Department:** Facilities
- **Employee ID:** FACS001

**2. Meena Patel**
- **Email:** facilities.specialist2@acuvate.com
- **Password:** Facilities@123
- **Role:** EMPLOYEE
- **Department:** Facilities
- **Employee ID:** FACS002

---

## Login Validation

### ✅ Features Implemented

1. **Email + Password Validation**
   - Both email and password must match stored credentials
   - Case-insensitive email matching
   - Exact password matching

2. **Error Handling**
   - Invalid email shows error: "Invalid Credentials"
   - Wrong password shows error: "Invalid Credentials"
   - Same error message for both (security best practice)

3. **Session Persistence**
   - Login state saved in localStorage via Zustand persist middleware
   - User stays logged in after page refresh
   - Session includes: name, email, role, department, employeeId

4. **Logout Functionality**
   - Logout button in Topbar (top-right corner)
   - Clears session from localStorage
   - Redirects to /login page

5. **Security**
   - Passwords stored in separate JSON file (src/data/users.json)
   - Password not stored in authentication state
   - Password excluded before saving to localStorage

---

## Testing Checklist

- [x] Login with correct email + password → Success
- [x] Login with wrong password → Shows error
- [x] Login with wrong email → Shows error
- [x] Login with empty fields → Browser validation error
- [x] After successful login → Redirects to Dashboard
- [x] Dashboard shows correct user name
- [x] Page refresh → User stays logged in
- [x] Logout button → Clears session and redirects to login
- [x] After logout, try to access dashboard → Redirects to login

---

## Migration to Azure AD

When ready to integrate with Azure AD:

1. Replace the `handleLogin` function in `src/pages/auth/Login.tsx`
2. Call Azure AD API endpoint
3. Handle OAuth2 flow
4. Map Azure AD response to User object
5. Store session using existing `login()` function

The "Sign in with Microsoft" button is already in place and ready for Azure AD integration.
