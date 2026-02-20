# Development Mode Guide - RMG Portal

## 🚀 Working Without a Backend

This guide explains how to develop and test the RMG Portal **without a backend API** using mock data mode.

---

## Quick Start

### 1. Enable Mock Mode

Open your [.env](.env) file and set:

```env
VITE_USE_MOCK_API=true
```

### 2. Start Development Server

```bash
npm run dev
```

### 3. Login with Test Users

Use any of these test accounts:

| Email | Password | Role |
|-------|----------|------|
| `sainikhil.bomma@acuvate.com` | `Nikhil@123` | EMPLOYEE |
| `mohan.reddy@acuvate.com` | `Mohan@123` | RMG |
| `hr@acuvate.com` | `Hr@123` | HR |
| `rajesh.kumar@acuvate.com` | `Rajesh@123` | MANAGER |
| `priya.sharma@acuvate.com` | `Priya@123` | IT_ADMIN |

That's it! The app will work with local data files.

---

## How It Works

### Architecture

```
┌─────────────────┐
│  Login.tsx      │
└────────┬────────┘
         │
         ├─> import authService from '@/services/auth'
         │
         v
┌─────────────────┐
│  auth.ts        │ ◄── Adaptive Service (switches based on env)
└────────┬────────┘
         │
         ├─────────────┬─────────────┐
         │             │             │
         v             v             v
   VITE_USE_MOCK_API
         │
    ┌────┴────┐
    │         │
   true      false
    │         │
    v         v
┌─────┐   ┌─────┐
│MOCK │   │REAL │
│ API │   │ API │
└─────┘   └─────┘
    │         │
    v         v
users.json  Backend
```

### File Structure

```
src/
├── services/
│   ├── auth.ts              ← Adaptive (auto-switches)
│   ├── authService.ts       ← Real API implementation
│   └── mockAuthService.ts   ← Mock implementation (new)
├── data/
│   └── users.json          ← Test user data
└── pages/auth/
    └── Login.tsx           ← Uses adaptive service
```

---

## Mock vs Real API

### Mock Mode (Development)

**When to use:**
- ✅ No backend available yet
- ✅ Frontend development
- ✅ UI/UX testing
- ✅ Component development
- ✅ Rapid prototyping

**Features:**
- Uses local JSON files
- Simulates network delays
- No external dependencies
- Works offline
- Fast iteration

**Limitations:**
- ⚠️ Data doesn't persist (resets on refresh for some features)
- ⚠️ No real validation
- ⚠️ Limited error scenarios

### Real API Mode (Production)

**When to use:**
- ✅ Backend is ready
- ✅ Integration testing
- ✅ Production deployment
- ✅ End-to-end testing

**Features:**
- Real database
- Persistent data
- Proper validation
- Security features
- Error handling

---

## Configuration

### Environment Variables

#### `.env` (Your local config - not committed)

```env
# API Base URL
VITE_API_URL=http://localhost:3001/api

# Environment
VITE_ENV=development

# Mock Mode Toggle
VITE_USE_MOCK_API=true    # ← Change this!
```

#### `.env.example` (Template - committed to git)

```env
VITE_API_URL=http://localhost:3001/api
VITE_ENV=development
VITE_USE_MOCK_API=true
```

---

## Switching Modes

### Enable Mock Mode

1. Open [.env](.env)
2. Set: `VITE_USE_MOCK_API=true`
3. Restart dev server: `npm run dev`

**You'll see in console:**
```
🔐 Auth Mode: MOCK (Development)
```

### Enable Real API Mode

1. Make sure your backend is running on `http://localhost:3001`
2. Open [.env](.env)
3. Set: `VITE_USE_MOCK_API=false`
4. Restart dev server: `npm run dev`

**You'll see in console:**
```
🔐 Auth Mode: REAL API (Production)
```

---

## Mock Data Sources

### Authentication

**File:** [src/data/users.json](src/data/users.json)

Contains test user accounts with different roles.

**Service:** [src/services/mockAuthService.ts](src/services/mockAuthService.ts)

Simulates backend authentication behavior.

### Other Data

Most other services (employees, leaves, holidays, etc.) use similar patterns:
- Check if backend is available
- Fall back to local JSON files if not
- Already implemented in stores

---

## Development Workflow

### Scenario 1: Pure Frontend Development

```bash
# 1. Enable mock mode
VITE_USE_MOCK_API=true

# 2. Start dev server
npm run dev

# 3. Login with test account
# Use any email/password from users.json

# 4. Develop features
# All data is mocked, changes won't persist
```

### Scenario 2: Backend Integration

```bash
# 1. Start backend server
cd backend
npm start  # Runs on http://localhost:3001

# 2. Disable mock mode
VITE_USE_MOCK_API=false

# 3. Start frontend
npm run dev

# 4. Test integration
# Now uses real API calls
```

### Scenario 3: Hybrid Development

You can mix and match! Some developers prefer:
- Mock auth for quick login
- Real API for testing actual features

Modify [src/services/auth.ts](src/services/auth.ts) to customize.

---

## Adding New Mock Data

### Option 1: Modify Existing JSON Files

```json
// src/data/users.json
[
  {
    "id": "6",
    "name": "New Developer",
    "email": "dev@example.com",
    "password": "Dev@123",
    "role": "EMPLOYEE",
    "department": "Engineering",
    "employeeId": "EMP006"
  }
]
```

### Option 2: Create Mock Service

```typescript
// src/services/mockYourService.ts
const mockYourService = {
  getData: async () => {
    // Simulate delay
    await new Promise(r => setTimeout(r, 500));

    // Return mock data
    return mockData;
  },

  create: async (data) => {
    // Simulate creation
    console.log('MOCK: Creating', data);
    return { id: Date.now(), ...data };
  },
};

export default mockYourService;
```

### Option 3: Extend Adaptive Pattern

```typescript
// src/services/yourService.ts
import realService from './realYourService';
import mockService from './mockYourService';

const useMock = import.meta.env.VITE_USE_MOCK_API === 'true';
const yourService = useMock ? mockService : realService;

export default yourService;
```

---

## Testing Different Roles

### Employee Role
```
Email: sainikhil.bomma@acuvate.com
Password: Nikhil@123
Access: Employee dashboard, profile, attendance, leave
```

### Manager Role
```
Email: rajesh.kumar@acuvate.com
Password: Rajesh@123
Access: Employee features + team management, approvals
```

### HR Role
```
Email: hr@acuvate.com
Password: Hr@123
Access: Employee management, payroll, recruitment
```

### RMG Role
```
Email: mohan.reddy@acuvate.com
Password: Mohan@123
Access: Resource allocation, utilization, forecasting
```

### IT Admin Role
```
Email: priya.sharma@acuvate.com
Password: Priya@123
Access: Helpdesk management, ticket resolution
```

---

## Common Issues & Solutions

### Issue 1: "Invalid Credentials" Error

**Cause:** Using wrong email/password

**Solution:**
- Check [src/data/users.json](src/data/users.json) for valid credentials
- Make sure `VITE_USE_MOCK_API=true` in `.env`
- Restart dev server after changing `.env`

### Issue 2: "Cannot connect to server" Error

**Cause:** Mock mode is disabled but backend is not running

**Solution:**
```bash
# Option A: Enable mock mode
VITE_USE_MOCK_API=true

# Option B: Start backend server
cd backend && npm start
```

### Issue 3: Data Changes Don't Persist

**This is expected in mock mode!**

**Explanation:**
- Mock mode uses in-memory data
- Changes lost on page refresh
- By design for quick testing

**Solution:**
- Use real backend for persistent data
- Or implement localStorage persistence in mock service

### Issue 4: Environment Variable Not Working

**Solution:**
```bash
# 1. Make sure you edited .env (not .env.example)

# 2. Restart dev server (required!)
Ctrl+C
npm run dev

# 3. Check console for confirmation:
# Should see: "🔐 Auth Mode: MOCK (Development)"
```

---

## Best Practices

### Do's ✅

- ✅ Use mock mode for rapid UI development
- ✅ Test different user roles easily
- ✅ Commit `.env.example` to git
- ✅ Keep test data in `src/data/` organized
- ✅ Document mock data structure

### Don'ts ❌

- ❌ Don't commit `.env` to git (contains your settings)
- ❌ Don't rely on mock mode for production
- ❌ Don't expect data persistence in mock mode
- ❌ Don't test security features in mock mode
- ❌ Don't forget to test with real API before deploy

---

## Migration Path

### Phase 1: Current (Mock Mode)
```
┌──────────┐
│ Frontend │──┐
└──────────┘  │
              ├─► Mock Data (users.json)
┌──────────┐  │
│ Backend  │──┘ (Not needed)
└──────────┘
```

### Phase 2: Integration
```
┌──────────┐
│ Frontend │─────► Real API
└──────────┘
              ┌──────────┐
              │ Backend  │─────► Database
              └──────────┘
```

### Phase 3: Production
```
┌──────────┐     ┌──────────┐     ┌──────────┐
│ Frontend │────►│ Backend  │────►│ Database │
└──────────┘     └──────────┘     └──────────┘
     │                │                 │
     └────────────────┴─────────────────┘
          HTTPS + Auth + Security
```

---

## Quick Reference

### Enable Mock Mode
```bash
# .env
VITE_USE_MOCK_API=true
```

### Disable Mock Mode
```bash
# .env
VITE_USE_MOCK_API=false
```

### Check Current Mode
Look for console message when app starts:
```
🔐 Auth Mode: MOCK (Development)
```
or
```
🔐 Auth Mode: REAL API (Production)
```

### Test Users
All passwords follow pattern: `Name@123`
- Nikhil@123
- Mohan@123
- Hr@123
- Rajesh@123
- Priya@123

---

## Next Steps

1. **Continue Development**
   - Use mock mode for frontend work
   - Focus on UI/UX
   - Test different user roles

2. **When Backend is Ready**
   - Switch to real API mode
   - Test integration
   - Fix any issues

3. **Before Production**
   - Ensure `VITE_USE_MOCK_API=false`
   - Test all features with real backend
   - Remove mock services if not needed

---

## Support

### Need Help?

1. **Check console messages** - Mode is logged on startup
2. **Verify .env file** - Make sure it exists and has correct values
3. **Restart dev server** - Required after .env changes
4. **Check this guide** - Most issues covered here

### Files to Reference

- [src/services/auth.ts](src/services/auth.ts) - Adaptive service
- [src/services/mockAuthService.ts](src/services/mockAuthService.ts) - Mock implementation
- [src/services/authService.ts](src/services/authService.ts) - Real implementation
- [src/data/users.json](src/data/users.json) - Test user data
- [.env.example](.env.example) - Configuration template

---

**Happy coding! 🚀**

*You can now develop the entire frontend without waiting for the backend!*

---

**Last Updated:** 2025-11-28
**Version:** 1.0
