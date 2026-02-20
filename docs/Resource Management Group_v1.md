# Resource Management Group (RMG) – React Application Development Guide (Final Version)

> **Purpose**
> This document is the **single source of truth** for GitHub Copilot to continue building the **RMG (Resource Management Group)** application in **React + TypeScript**.

---

## 1. Tech Stack (Current Implementation)

* **Frontend Framework:** React 18.3.1
* **Language:** TypeScript
* **Build Tool:** Vite 6.0.5
* **UI Framework:** TailwindCSS 3.4.17
* **Component Library:** ShadCN UI (Radix UI primitives)
* **State Management:** Zustand 5.0.2
* **Form Handling:** React Hook Form 7.54.2
* **Validation:** Zod 3.24.1
* **Date Handling:** date-fns 4.1.0
* **Table/Grid:** TanStack Table 8.20.6
* **Routing:** React Router v7.1.1
* **Icons:** Lucide React 0.469.0
* **HTTP Client:** Axios 1.7.9
* **Backend:** Node.js + Express (configured)
* **Database:** MongoDB

---

## 2. Current Application Structure (Aligned)

```
/RMG-Portal
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/              # ShadCN UI components
│   │   │   ├── layout/          # Layout components
│   │   │   └── common/          # Shared components
│   │   ├── pages/
│   │   │   ├── customers/       # Customer module
│   │   │   ├── projects/        # Project module
│   │   │   ├── customer-po/     # Customer PO module
│   │   │   └── financial-lines/ # FL module
│   │   ├── services/            # API service layer
│   │   ├── stores/              # Zustand stores
│   │   ├── hooks/               # Custom React hooks
│   │   ├── lib/                 # Utility functions
│   │   ├── types/               # TypeScript types
│   │   └── App.tsx
│   ├── public/
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   └── server.js
│   └── package.json
└── README.md
```

---

## 3. Customer Module (Implemented)

### Current Implementation Status:
✅ **Customer List Page** exists  
✅ **Create Customer** functionality needed  
✅ Using ShadCN Dialog/Sheet components

### Required Fields:
* customerNo (string, required, unique)
* customerName (string, required)
* hubspotRecordId (string, optional)
* industry (dropdown, required)
* region (dropdown: UK, India, USA, ME, Other)
* regionHead (dropdown)
* status (Active / Inactive)

### Validation Rules:
* Use Zod schema validation
* React Hook Form for form management
* Zustand store for state management

---

## 4. Project Module (To Be Implemented)

### 4.1 Project Creation Form

**Layout:** Use ShadCN Card with Tabs for sections

#### Section 1: Basic Details
* projectId (auto-generated UUID)
* projectName (required, max 100 chars)
* accountName (customer dropdown reference)
* legalEntity (dropdown)
* hubspotDealId (optional)
* billingType (dropdown: T&M, Fixed Bid, Fixed Monthly, License)
* practiceUnit (dropdown: AiB & Automation, GenAI, Data & Analytics, Cloud Engineering, etc.)
* region (UK, India, USA, ME, Other)
* projectManager (searchable dropdown)
* deliveryManager (searchable dropdown)
* industry (inherited from customer or override)
* clientType (dropdown)
* revenueType (dropdown)

#### Section 2: Schedule & Financial
* projectStartDate (required, DatePicker)
* projectEndDate (required, must be > startDate)
* projectCurrency (required dropdown: USD, GBP, INR, EUR, AED)
* estimatedValue (optional number)

**Immutable Fields After Activation:**
* billingType (locked once project status = Active)

---

## 5. Customer PO (Contract) Module

### 5.1 PO Creation

**UI Component:** ShadCN Sheet (Drawer) or Dialog

**Form Fields:**
```typescript
{
  contractNo: string (required, unique)
  poNo: string (required)
  customerId: string (reference)
  customerName: string (auto-filled, read-only)
  bookingEntity: string (dropdown)
  poCreationDate: Date (required)
  poStartDate: Date (required)
  poValidityDate: Date (required, >= project end date)
  poAmount: number (required, > 0)
  poCurrency: string (required)
  paymentTerms: string (dropdown: Net 30, Net 45, Net 60, etc.)
  autoRelease: boolean (default: false)
}
```

**Validation Rules:**
```typescript
poAmount > 0
poValidityDate >= projectEndDate
contractNo must be unique
poStartDate <= poValidityDate
```

---

## 6. Financial Lines (FL) Module

### 6.1 FL Creation Wizard (4-Step Stepper)

**Use:** Custom Stepper component with ShadCN Card for each step

---

#### **Step 1: FL Basic Details**

```typescript
{
  flNo: string (auto-generated: FL-YYYY-XXXX)
  flName: string (required, max 150 chars)
  contractType: string (inherited from project billingType, read-only)
  locationType: 'Onsite' | 'Offshore' | 'Hybrid' (required)
  executionEntity: string (dropdown)
  timesheetApprover: string (user dropdown)
  scheduleStart: Date (required)
  scheduleEnd: Date (required, > scheduleStart)
  currency: string (project currency, read-only)
}
```

**Validations:**
* scheduleStart must be within project dates
* scheduleEnd must be within project dates

---

#### **Step 2: Funding Details**

```typescript
{
  poNo: string (dropdown - only active POs with available balance)
  contractNo: string (auto-filled from selected PO)
  unitRate: number (required, > 0)
  fundingUnits: number (required, > 0)
  unitUOM: 'Hour' | 'Day' | 'Month' (required)
  fundingValue: number (calculated, read-only)
}
```

**Calculation:**
```typescript
fundingValue = unitRate * fundingUnits
```

**Validation:**
```typescript
fundingValue <= availablePOBalance
```

**UI:** Show available PO balance prominently

---

#### **Step 3: Revenue Planning (Monthly Grid)**

**Component:** TanStack Table with editable cells

**Columns:**
```typescript
{
  month: string (format: MMM YYYY)
  plannedUnits: number (editable)
  plannedRevenue: number (calculated = plannedUnits * unitRate)
  actualUnits: number (read-only, default 0)
  forecastedUnits: number (editable)
  variance: number (calculated)
}
```

**Auto-generate rows:** From scheduleStart to scheduleEnd (monthly)

**Validation:**
```typescript
SUM(plannedRevenue) <= fundingValue
```

**UI Features:**
* Inline editing
* Auto-save on blur
* Real-time sum calculation
* Warning if sum exceeds funding value

---

#### **Step 4: Payment Milestones**

**Component:** Dynamic Form Array (React Hook Form)

```typescript
{
  milestones: Array<{
    milestoneName: string (required)
    milestoneAmount: number (required, > 0)
    dueDate: Date (required)
    status: 'Pending' | 'Paid' (default: Pending)
  }>
}
```

**Validation:**
```typescript
SUM(milestoneAmount) === fundingValue
```

**UI:**
* Add/Remove milestone buttons
* Running total display
* Error state if sum ≠ funding value
* Cannot proceed if validation fails

---

## 7. Financial Overview Dashboards

### 7.1 FL List View (Table)

**Columns:**
* FL No (link to detail)
* FL Name
* Contract Type
* Location Type
* Start Date (formatted)
* End Date (formatted)
* Bill Rate
* Total Effort (units)
* Planned Revenue
* Status badge
* Actions (Edit, View, Delete)

**Features:**
* Sorting
* Filtering by status, location type, contract type
* Search by FL name/number
* Pagination

---

### 7.2 Customer PO Summary (Table)

**Columns:**
* Contract No
* PO No
* PO Value
* Allocated Fund (sum of FLs)
* Available Balance (calculated)
* Utilization % (visual indicator)
* Status
* Actions

**Calculations:**
```typescript
availableBalance = poAmount - allocatedFund
utilization = (allocatedFund / poAmount) * 100
```

**Visual Indicators:**
* Green: < 80% utilized
* Yellow: 80-95% utilized
* Red: > 95% utilized

---

## 8. Global Business Rules & Validations

### 8.1 PO Allocation Rules
```typescript
- PO allocation cannot exceed PO value
- Cannot delete PO if FLs are associated
- PO status must be Active for FL creation
- Warning if PO expires within 30 days
```

### 8.2 Project Rules
```typescript
- Project cannot move to Active without at least one PO
- billingType is immutable once project is Active
- Project end date cannot be before earliest FL end date
```

### 8.3 FL Rules
```typescript
- FL cannot start before project start date
- FL cannot end after project end date
- FL cannot be deleted if timesheet entries exist
- FL funding cannot exceed available PO balance
- Planned revenue sum must not exceed funding value
- Milestone amounts must equal funding value exactly
```

### 8.4 Read-Only Mode
```typescript
Enable read-only when:
- FL has actual timesheet entries
- Project is Closed
- PO is Expired
```

---

## 9. UI/UX Standards (ShadCN Based)

### Layout Components
* **Page Container:** `<div className="container mx-auto py-6">`
* **Section Cards:** ShadCN Card component
* **Forms:** ShadCN Form with React Hook Form
* **Buttons:** ShadCN Button (variants: default, destructive, outline, ghost)
* **Dialogs:** ShadCN Dialog for modals
* **Sheets:** ShadCN Sheet for drawer forms

### Form Patterns
```tsx
// Use ShadCN Form components
<Form {...form}>
  <FormField
    control={form.control}
    name="fieldName"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Label</FormLabel>
        <FormControl>
          <Input {...field} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
</Form>
```

### Action Buttons
* **Sticky Footer:** For multi-step forms
* **Button Group:** Cancel (outline) + Save (default)
* **Disabled State:** When form invalid or submitting

### Validation Feedback
* Inline error messages (FormMessage)
* Toast notifications for success/error (ShadCN Sonner)
* Form-level error summary at top

---

## 10. API Integration Layer

### 10.1 Service Architecture

```typescript
// src/services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
```

### 10.2 API Endpoints

```typescript
// Customers
GET    /api/customers
POST   /api/customers
GET    /api/customers/:id
PUT    /api/customers/:id
DELETE /api/customers/:id

// Projects
GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PUT    /api/projects/:id
DELETE /api/projects/:id

// Customer POs
GET    /api/projects/:projectId/pos
POST   /api/projects/:projectId/pos
GET    /api/pos/:id
PUT    /api/pos/:id
DELETE /api/pos/:id

// Financial Lines
GET    /api/projects/:projectId/fls
POST   /api/projects/:projectId/fls
GET    /api/fls/:id
PUT    /api/fls/:id
DELETE /api/fls/:id
GET    /api/fls/:id/revenue-plan
PUT    /api/fls/:id/revenue-plan
GET    /api/fls/:id/milestones
PUT    /api/fls/:id/milestones
```

---

## 11. State Management (Zustand)

### Store Structure

```typescript
// src/stores/useCustomerStore.ts
// src/stores/useProjectStore.ts
// src/stores/usePOStore.ts
// src/stores/useFLStore.ts
// src/stores/useAppStore.ts (global state)
```

### Example Store Pattern

```typescript
import { create } from 'zustand';

interface CustomerStore {
  customers: Customer[];
  isLoading: boolean;
  error: string | null;
  fetchCustomers: () => Promise<void>;
  addCustomer: (customer: Customer) => Promise<void>;
}

export const useCustomerStore = create<CustomerStore>((set) => ({
  customers: [],
  isLoading: false,
  error: null,
  fetchCustomers: async () => {
    // Implementation
  },
  addCustomer: async (customer) => {
    // Implementation
  },
}));
```

---

## 12. Type Definitions

### Core Types

```typescript
// src/types/customer.ts
export interface Customer {
  id: string;
  customerNo: string;
  customerName: string;
  hubspotRecordId?: string;
  industry: string;
  region: 'UK' | 'India' | 'USA' | 'ME' | 'Other';
  regionHead: string;
  status: 'Active' | 'Inactive';
  createdAt: Date;
  updatedAt: Date;
}

// src/types/project.ts
export interface Project {
  id: string;
  projectId: string;
  projectName: string;
  customerId: string;
  legalEntity: string;
  billingType: 'T&M' | 'Fixed Bid' | 'Fixed Monthly' | 'License';
  practiceUnit: string;
  region: string;
  projectStartDate: Date;
  projectEndDate: Date;
  projectCurrency: string;
  status: 'Draft' | 'Active' | 'On Hold' | 'Closed';
  // ... other fields
}

// src/types/po.ts
export interface CustomerPO {
  id: string;
  contractNo: string;
  poNo: string;
  customerId: string;
  customerName: string;
  bookingEntity: string;
  poCreationDate: Date;
  poStartDate: Date;
  poValidityDate: Date;
  poAmount: number;
  poCurrency: string;
  paymentTerms: string;
  autoRelease: boolean;
  status: 'Active' | 'Expired' | 'Closed';
  createdAt: Date;
  updatedAt: Date;
}

// src/types/fl.ts
export interface FinancialLine {
  id: string;
  flNo: string;
  flName: string;
  projectId: string;
  contractType: string;
  locationType: 'Onsite' | 'Offshore' | 'Hybrid';
  executionEntity: string;
  timesheetApprover: string;
  scheduleStart: Date;
  scheduleEnd: Date;
  currency: string;
  poNo: string;
  contractNo: string;
  unitRate: number;
  fundingUnits: number;
  unitUOM: 'Hour' | 'Day' | 'Month';
  fundingValue: number;
  status: 'Draft' | 'Active' | 'Completed' | 'Closed';
  createdAt: Date;
  updatedAt: Date;
}

export interface RevenuePlan {
  id: string;
  flId: string;
  month: string;
  plannedUnits: number;
  plannedRevenue: number;
  actualUnits: number;
  forecastedUnits: number;
  variance: number;
}

export interface PaymentMilestone {
  id: string;
  flId: string;
  milestoneName: string;
  milestoneAmount: number;
  dueDate: Date;
  status: 'Pending' | 'Paid';
}
```

---

## 13. Development Guidelines for Copilot

### Code Quality Standards
```typescript
✅ Use strict TypeScript (no 'any' types)
✅ Proper error handling with try-catch
✅ Async/await for API calls
✅ Loading states for all async operations
✅ Optimistic UI updates where appropriate
✅ Proper TypeScript interfaces for all data structures
✅ Reusable utility functions
✅ Custom hooks for complex logic
✅ Comments for complex business logic only
```

### Component Structure
```tsx
// 1. Imports (grouped: React, external, internal)
// 2. Type definitions
// 3. Component definition
// 4. Return JSX
// 5. Export
```

### Naming Conventions
```typescript
- Components: PascalCase (CustomerForm.tsx)
- Hooks: camelCase with 'use' prefix (useCustomers.ts)
- Utils: camelCase (formatCurrency.ts)
- Types: PascalCase (Customer.ts)
- Constants: UPPER_SNAKE_CASE
```

### Error Handling Pattern
```typescript
try {
  setIsLoading(true);
  const result = await apiCall();
  toast.success('Operation successful');
  return result;
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  toast.error(message);
  setError(message);
} finally {
  setIsLoading(false);
}
```

---

## 14. Testing Strategy (Future Phase)

* **Unit Tests:** Vitest
* **Component Tests:** React Testing Library
* **E2E Tests:** Playwright
* **Coverage Target:** 80%+

### Test Structure
```typescript
// CustomerForm.test.tsx
describe('CustomerForm', () => {
  it('should validate required fields', () => {});
  it('should submit valid form data', () => {});
  it('should display error messages', () => {});
});
```

---

## 15. Performance Optimization

### Code Splitting
```typescript
// Lazy load routes
const CustomerPage = lazy(() => import('./pages/customers/CustomerPage'));
const ProjectPage = lazy(() => import('./pages/projects/ProjectPage'));
```

### Memoization
```typescript
// Use React.memo for expensive components
export const CustomerTable = React.memo(({ data }) => {
  // Component logic
});

// Use useMemo for expensive calculations
const totalRevenue = useMemo(
  () => calculateTotalRevenue(projects),
  [projects]
);
```

### Virtual Scrolling
```typescript
// For large tables (> 100 rows)
import { useVirtualizer } from '@tanstack/react-virtual';
```

### Debounced Search
```typescript
import { useDebouncedCallback } from 'use-debounce';

const handleSearch = useDebouncedCallback((value: string) => {
  performSearch(value);
}, 300);
```

---

## 16. Immediate Development Priorities

### Phase 1 (Current)
1. ✅ Customer List Page (exists)
2. 🔄 Customer Create/Edit Form
3. 🔄 Project Module (full CRUD)
4. 🔄 Customer PO Module

### Phase 2
5. FL Creation Wizard (4 steps)
6. Revenue Planning Grid
7. Payment Milestones

### Phase 3
8. Dashboard & Analytics
9. Resource Management
10. Reporting

---

## 17. Accessibility Standards

* Use semantic HTML elements
* ARIA labels for interactive elements
* Keyboard navigation support
* Focus management in modals/dialogs
* Color contrast ratio >= 4.5:1
* Screen reader friendly

---

## 18. Security Considerations

* Input sanitization on client and server
* CSRF protection
* XSS prevention
* Secure authentication tokens
* Role-based access control (RBAC)
* Audit logging for sensitive operations

---

## 19. Environment Configuration

```bash
# .env.local
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=RMG Portal
VITE_APP_VERSION=1.0.0
VITE_ENABLE_MOCK_API=false
```

---

## 20. Deployment Checklist

- [ ] Environment variables configured
- [ ] Build optimizations enabled
- [ ] Error tracking setup (Sentry)
- [ ] Analytics configured
- [ ] SSL certificates installed
- [ ] Database migrations run
- [ ] API documentation updated
- [ ] User documentation created

---

**This is the final aligned version based on your current RMG Portal implementation.**

**Last Updated:** January 30, 2026  
**Version:** 1.0  
**Author:** Development Team
