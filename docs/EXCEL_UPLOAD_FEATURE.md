# Excel Upload Feature Documentation

## Overview
The Excel upload feature allows HR users to bulk import/update employee data from Excel files (.xlsx, .xls). This feature includes validation, merge logic, template download, and comprehensive error handling.

## Features Implemented

### 1. Frontend Components

#### **UploadEmployeesModal.tsx**
Location: `src/components/modals/UploadEmployeesModal.tsx`

**Features:**
- Excel file picker with .xlsx/.xls validation
- Template download with sample data
- Real-time Excel parsing using `xlsx` library
- Comprehensive validation:
  - Required fields: EmployeeID, Name, Email, Department
  - Email format validation
  - Duplicate EmployeeID detection within file
  - Case-insensitive column name matching
- Visual feedback:
  - Validation errors with detailed messages
  - Preview of parsed data (first 10 rows)
  - Loading states for parsing and upload
  - Success/error toasts
- Upload confirmation with employee count

**Column Mapping (Case-Insensitive):**
- EmployeeID / employeeId / EMPLOYEEID → employeeId (Required)
- Name / name / NAME → name (Required)
- Email / email / EMAIL → email (Required)
- Department / department / DEPARTMENT → department (Required)
- Designation / designation → designation
- Location / location → location
- DateOfJoining / dateOfJoining → dateOfJoining
- BusinessUnit / businessUnit → businessUnit
- ReportingManagerId / reportingManagerId → reportingManagerId
- Phone / phone → phone
- Status / status → status (active/inactive, defaults to active)
- DateOfBirth / dateOfBirth → dateOfBirth

### 2. State Management

#### **employeeStore.ts**
Added method: `bulkUploadEmployees(employees: Partial<Employee>[])`

**Functionality:**
- Calls backend bulk upload API
- Automatically refreshes employee list after upload
- Displays success toast with upload count
- Handles errors with appropriate feedback

### 3. Service Layer

#### **employeeService.ts**
Added method: `bulkUpload(employees: Partial<Employee>[])`

**Endpoint:** `POST /api/employees/bulk-upload`

**Request Body:**
```json
{
  "employees": [
    {
      "employeeId": "EMP999",
      "name": "John Doe",
      "email": "john.doe@company.com",
      "department": "Engineering",
      ...
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "imported": 5,
    "updated": 3
  }
}
```

### 4. Backend API

#### **server/src/routes/json/employees.ts**
Added endpoint: `POST /bulk-upload`

**Merge Logic:**
- **Update Existing:** If EmployeeID exists, update all fields (preserves `_id`)
- **Add New:** If EmployeeID doesn't exist, create new employee with generated `_id`
- **Status:** Defaults to 'active' if not provided

**Response Includes:**
- `imported`: Count of new employees added
- `updated`: Count of existing employees updated

### 5. UI Integration

#### **EmployeeManagement.tsx**
Added "Upload Excel" button next to "Add Employee" button

**Features:**
- Opens UploadEmployeesModal when clicked
- Positioned in header for easy access
- Styled with Upload icon

## Template Format

### Excel Template Columns
```
EmployeeID | Name | Email | Designation | Department | Location | DateOfJoining | BusinessUnit | ReportingManagerId | Phone | Status | DateOfBirth
```

### Sample Data
```
EMP999 | John Doe | john.doe@company.com | Software Engineer | Engineering | New York | 2024-01-15 | Technology | MGR001 | +1234567890 | active | 1990-05-20
```

## User Workflow

### 1. Download Template
1. Click "Upload Excel" button
2. Click "Download Template" in modal
3. Template file `Employee_Upload_Template.xlsx` downloads with:
   - Correct column headers
   - One sample row
   - Proper column widths

### 2. Prepare Data
1. Open template in Excel
2. Fill in employee data (one row per employee)
3. Ensure required fields are filled:
   - EmployeeID
   - Name
   - Email
   - Department
4. Save as .xlsx or .xls

### 3. Upload File
1. Click "Choose Excel File" in modal
2. Select prepared file
3. Wait for parsing (automatic)
4. Review validation results:
   - **Green box:** Shows valid employees ready for upload
   - **Red box:** Shows validation errors to fix
5. Click "Upload X Employee(s)" to confirm

### 4. Review Results
- Success toast shows: "Successfully uploaded X employee(s)"
- Employee list automatically refreshes
- New employees appear in Active tab
- Updated employees show latest data

## Validation Rules

### Required Fields
- **EmployeeID:** Must be unique within file and non-empty
- **Name:** Must be non-empty
- **Email:** Must be valid email format (xxx@xxx.xxx)
- **Department:** Must be non-empty

### Data Type Handling
- All fields converted to strings
- Whitespace trimmed from all values
- Case-insensitive column name matching
- Empty cells treated as empty strings

### Error Messages
- `Row X: EmployeeID is required`
- `Row X: Name is required`
- `Row X: Email is required`
- `Row X: Department is required`
- `Row X: Invalid email format "xxx"`
- `Row X: Duplicate EmployeeID "XXX" in file`

## Technical Details

### Dependencies
- **xlsx (v0.18.5):** Excel parsing library
- Installed in both frontend and backend projects

### File Size Limits
- No explicit limit set
- Recommended: < 1000 employees per upload
- Larger files may cause browser lag during parsing

### Performance
- Parsing happens client-side (no server overhead)
- Validation runs before upload
- Single API call for entire batch
- Efficient merge logic using employeeId lookup

### Data Sync
- Frontend employees.json updated via API
- Backend employees.json updated directly
- Store automatically refreshes after upload
- All components using employeeStore get updated data

## Error Handling

### Client-Side Errors
- Invalid file type → Toast error
- Empty file → Toast error
- Validation errors → Red error box with details
- Parse errors → Toast error with message

### Server-Side Errors
- Invalid request → 400 Bad Request
- File system errors → 500 Internal Server Error
- Errors logged to console with ❌ prefix

### Network Errors
- Handled by employeeStore
- Shows toast: "Failed to upload employees. Please try again."
- Doesn't clear parsed data (user can retry)

## Testing Scenarios

### Happy Path
1. Download template
2. Add 3 new employees
3. Upload file
4. Verify 3 imported, 0 updated
5. Check Active tab for new employees

### Update Existing
1. Download existing employee list
2. Modify email for EMP001
3. Upload file
4. Verify 0 imported, 1 updated
5. Check employee details for updated email

### Mixed Operations
1. File with 5 new + 3 existing employees
2. Upload file
3. Verify 5 imported, 3 updated
4. Check all employees appear correctly

### Validation Errors
1. File with missing Name in row 3
2. File with invalid email in row 5
3. File with duplicate EmployeeID in rows 2 and 4
4. Verify all errors shown in red box
5. Verify no upload happens until fixed

### Edge Cases
1. Case-insensitive columns (eMaIl, NAME, DePaRtMeNt)
2. Extra spaces in data
3. Missing optional fields
4. Status = "ACTIVE" / "inactive" / "" (default)

## Future Enhancements

### Possible Improvements
- [ ] Add progress bar for large files
- [ ] Support CSV files in addition to Excel
- [ ] Validation for reportingManagerId (must exist)
- [ ] Duplicate email detection
- [ ] Phone number format validation
- [ ] Date format validation and conversion
- [ ] Preview mode (show changes before applying)
- [ ] Rollback capability for recent uploads
- [ ] Upload history/audit log
- [ ] Partial upload (skip invalid rows, upload valid ones)
- [ ] Support for bulk employee photo upload

## Files Modified

### Created
- `src/components/modals/UploadEmployeesModal.tsx` (387 lines)
- `EXCEL_UPLOAD_FEATURE.md` (this file)

### Modified
- `src/store/employeeStore.ts` - Added bulkUploadEmployees method
- `src/services/employeeService.ts` - Added bulkUpload method
- `src/pages/hr/EmployeeManagement.tsx` - Added Upload button and modal
- `server/src/routes/json/employees.ts` - Added POST /bulk-upload endpoint
- `package.json` - Added xlsx dependency
- `server/package.json` - Added xlsx dependency

## Installation

### Frontend
```bash
npm install xlsx
```

### Backend
```bash
cd server
npm install xlsx
```

Both installations already completed during implementation.

## Usage Example

```typescript
// In EmployeeManagement component
import { UploadEmployeesModal } from '@/components/modals/UploadEmployeesModal';

const [showUploadModal, setShowUploadModal] = useState(false);

// In JSX
<Button variant="outline" onClick={() => setShowUploadModal(true)}>
  <Upload className="mr-2 h-4 w-4" />
  Upload Excel
</Button>

<UploadEmployeesModal 
  open={showUploadModal} 
  onClose={() => setShowUploadModal(false)} 
/>
```

## API Reference

### Frontend Service
```typescript
employeeService.bulkUpload(employees: Partial<Employee>[])
  .then(response => {
    // response.data = { imported: number, updated: number }
  })
  .catch(error => {
    // Handle error
  });
```

### Backend Endpoint
```
POST /api/employees/bulk-upload
Content-Type: application/json

Body:
{
  "employees": [
    { "employeeId": "EMP999", "name": "John", ... }
  ]
}

Response:
{
  "success": true,
  "data": {
    "imported": 5,
    "updated": 3
  }
}
```

## Security Considerations

- Client-side file parsing (no file upload to server)
- Validation before database update
- No execution of Excel formulas
- Only processes data cells, ignores macros
- Uses read-only XLSX parsing

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- IE11: ❌ Not supported (xlsx requires modern JS)

---

**Feature Status:** ✅ Fully Implemented and Ready for Use

**Last Updated:** 2024
