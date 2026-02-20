import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEmployeeStore } from '@/store/employeeStore';

interface UploadEmployeesModalProps {
  open: boolean;
  onClose: () => void;
}

interface ParsedEmployee {
  employeeId: string;
  name: string;
  email: string;
  designation?: string;
  department: string;
  location?: string;
  dateOfJoining?: string;
  businessUnit?: string;
  reportingManagerId?: string;
  phone?: string;
  status?: 'active' | 'inactive';
  dateOfBirth?: string;
}

export function UploadEmployeesModal({ open, onClose }: UploadEmployeesModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedEmployee[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { bulkUploadEmployees } = useEmployeeStore();

  const downloadTemplate = () => {
    const templateData = [
      {
        EmployeeID: 'EMP999',
        Name: 'John Doe',
        Email: 'john.doe@company.com',
        Designation: 'Software Engineer',
        Department: 'Engineering',
        Location: 'New York',
        DateOfJoining: '2024-01-15',
        BusinessUnit: 'Technology',
        ReportingManagerId: 'MGR001',
        Phone: '+1234567890',
        Status: 'active',
        DateOfBirth: '1990-05-20',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Employees');
    
    // Set column widths
    ws['!cols'] = [
      { wch: 12 }, // EmployeeID
      { wch: 20 }, // Name
      { wch: 25 }, // Email
      { wch: 20 }, // Designation
      { wch: 15 }, // Department
      { wch: 15 }, // Location
      { wch: 15 }, // DateOfJoining
      { wch: 15 }, // BusinessUnit
      { wch: 18 }, // ReportingManagerId
      { wch: 15 }, // Phone
      { wch: 10 }, // Status
      { wch: 15 }, // DateOfBirth
    ];

    XLSX.writeFile(wb, 'Employee_Upload_Template.xlsx');
    toast.success('Template downloaded successfully');
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];

    if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Invalid file type. Please upload an Excel file (.xlsx or .xls)');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    parseExcelFile(file);
  };

  const parseExcelFile = async (file: File) => {
    setIsProcessing(true);
    setValidationErrors([]);
    setParsedData([]);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });

      // Get first sheet
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (jsonData.length === 0) {
        toast.error('Excel file is empty');
        setIsProcessing(false);
        return;
      }

      // Parse and validate data
      const errors: string[] = [];
      const employees: ParsedEmployee[] = [];
      const seenIds = new Set<string>();

      (jsonData as Record<string, unknown>[]).forEach((row, index: number) => {
        const rowNum = index + 2; // Excel rows start at 1, plus header row

        // Map Excel columns to employee object (case-insensitive)
        const employeeId = String(row.EmployeeID || row.employeeId || row.EMPLOYEEID || '').trim();
        const name = String(row.Name || row.name || row.NAME || '').trim();
        const email = String(row.Email || row.email || row.EMAIL || '').trim();
        const department = String(row.Department || row.department || row.DEPARTMENT || '').trim();

        // Validate required fields
        if (!employeeId) {
          errors.push(`Row ${rowNum}: EmployeeID is required`);
          return;
        }
        if (!name) {
          errors.push(`Row ${rowNum}: Name is required`);
          return;
        }
        if (!email) {
          errors.push(`Row ${rowNum}: Email is required`);
          return;
        }
        if (!department) {
          errors.push(`Row ${rowNum}: Department is required`);
          return;
        }

        // Check for duplicate IDs in the file
        if (seenIds.has(employeeId)) {
          errors.push(`Row ${rowNum}: Duplicate EmployeeID "${employeeId}" in file`);
          return;
        }
        seenIds.add(employeeId);

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          errors.push(`Row ${rowNum}: Invalid email format "${email}"`);
          return;
        }

        employees.push({
          employeeId,
          name,
          email,
          designation: String(row.Designation || row.designation || '').trim(),
          department,
          location: String(row.Location || row.location || '').trim(),
          dateOfJoining: String(row.DateOfJoining || row.dateOfJoining || '').trim(),
          businessUnit: String(row.BusinessUnit || row.businessUnit || '').trim(),
          reportingManagerId: String(row.ReportingManagerId || row.reportingManagerId || '').trim(),
          phone: String(row.Phone || row.phone || '').trim(),
          status: (String(row.Status || row.status || 'active').trim().toLowerCase() === 'active' ? 'active' : 'inactive') as 'active' | 'inactive',
          dateOfBirth: String(row.DateOfBirth || row.dateOfBirth || '').trim(),
        });
      });

      if (errors.length > 0) {
        setValidationErrors(errors);
        toast.error(`Found ${errors.length} validation error(s)`);
      } else {
        setParsedData(employees);
        toast.success(`Successfully parsed ${employees.length} employee(s)`);
      }
    } catch (error) {
      console.error('Failed to parse Excel file:', error);
      toast.error('Failed to parse Excel file. Please check the format.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUpload = async () => {
    if (parsedData.length === 0) {
      toast.error('No valid data to upload');
      return;
    }

    setIsProcessing(true);
    try {
      await bulkUploadEmployees(parsedData);
      toast.success(`Successfully uploaded ${parsedData.length} employee(s)`);
      setParsedData([]);
      setValidationErrors([]);
      onClose();
    } catch (error) {
      console.error('Failed to upload employees:', error);
      toast.error('Failed to upload employees. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setParsedData([]);
      setValidationErrors([]);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Employees from Excel</DialogTitle>
          <DialogDescription>
            Upload employee data from an Excel file. Download the template for the correct format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Download Template */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted-color/50">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">Download Template</p>
                <p className="text-sm text-muted-foreground">
                  Get the Excel template with sample data
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Upload Excel File</label>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
                id="excel-upload"
              />
              <Button
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Excel File
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Accepted formats: .xlsx, .xls
            </p>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="p-4 border border-red-200 rounded-lg bg-red-50">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-red-900">Validation Errors</p>
                  <ul className="mt-2 space-y-1 text-sm text-red-800 max-h-40 overflow-y-auto">
                    {validationErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Parsed Data Preview */}
          {parsedData.length > 0 && (
            <div className="p-4 border border-green-200 rounded-lg bg-green-50">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-green-900">
                    Ready to Upload ({parsedData.length} employees)
                  </p>
                  <div className="mt-3 max-h-60 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-green-100 sticky top-0">
                        <tr className="text-left text-green-900">
                          <th className="px-2 py-1">ID</th>
                          <th className="px-2 py-1">Name</th>
                          <th className="px-2 py-1">Email</th>
                          <th className="px-2 py-1">Department</th>
                          <th className="px-2 py-1">Status</th>
                        </tr>
                      </thead>
                      <tbody className="text-green-800">
                        {parsedData.slice(0, 10).map((emp, index) => (
                          <tr key={index} className="border-t border-green-200">
                            <td className="px-2 py-1">{emp.employeeId}</td>
                            <td className="px-2 py-1">{emp.name}</td>
                            <td className="px-2 py-1">{emp.email}</td>
                            <td className="px-2 py-1">{emp.department}</td>
                            <td className="px-2 py-1">{emp.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {parsedData.length > 10 && (
                      <p className="text-xs text-green-700 mt-2 px-2">
                        ... and {parsedData.length - 10} more
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={parsedData.length === 0 || isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload {parsedData.length} Employee(s)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
