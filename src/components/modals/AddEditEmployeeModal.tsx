import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { useEmployeeStore } from '@/store/employeeStore';
import type { Employee } from '@/services/employeeService';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';

interface AddEditEmployeeModalProps {
  open: boolean;
  onClose: () => void;
  employee?: Employee | null;
  onSuccess?: () => void;
}

export function AddEditEmployeeModal({ open, onClose, employee, onSuccess }: AddEditEmployeeModalProps) {
  const { addEmployee, updateEmployee, getNextEmployeeId, activeEmployees, fetchActiveEmployees } = useEmployeeStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profilePreview, setProfilePreview] = useState<string>('');
  
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    email: '',
    phone: '',
    designation: '',
    department: '',
    location: '',
    dateOfJoining: '',
    dateOfBirth: '',
    businessUnit: '',
    profilePhoto: '',
    reportingManagerId: '',
    dottedLineManagerId: '',
    status: 'active' as 'active' | 'inactive',
  });

  useEffect(() => {
    if (open) {
      fetchActiveEmployees();
      if (employee) {
        // Edit mode - populate form
        setFormData({
          employeeId: employee.employeeId,
          name: employee.name,
          email: employee.email,
          phone: employee.phone,
          designation: employee.designation,
          department: employee.department,
          location: employee.location,
          dateOfJoining: employee.dateOfJoining ? new Date(employee.dateOfJoining).toISOString().split('T')[0] : '',
          dateOfBirth: employee.dateOfBirth ? new Date(employee.dateOfBirth).toISOString().split('T')[0] : '',
          businessUnit: employee.businessUnit,
          profilePhoto: employee.profilePhoto || '',
          reportingManagerId: employee.reportingManagerId || '',
          dottedLineManagerId: employee.dottedLineManagerId || '',
          status: employee.status,
        });
        setProfilePreview(employee.profilePhoto || '');
      } else {
        // Add mode - get next employee ID
        getNextEmployeeId().then(nextId => {
          setFormData(prev => ({ ...prev, employeeId: nextId }));
        });
      }
    } else {
      // Reset form when closed
      setFormData({
        employeeId: '',
        name: '',
        email: '',
        phone: '',
        designation: '',
        department: '',
        location: '',
        dateOfJoining: '',
        dateOfBirth: '',
        businessUnit: '',
        profilePhoto: '',
        reportingManagerId: '',
        dottedLineManagerId: '',
        status: 'active',
      });
      setProfilePreview('');
    }
  }, [open, employee, getNextEmployeeId, fetchActiveEmployees]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
      toast.error('Invalid file type', {
        description: 'Please upload a valid image file (JPEG, PNG, GIF, or WebP)',
      });
      e.target.value = ''; // Reset input
      return;
    }

    // Validate file size (5MB max)
    const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSizeInBytes) {
      toast.error('File too large', {
        description: 'Please upload an image smaller than 5MB',
      });
      e.target.value = ''; // Reset input
      return;
    }

    // Read and process the file
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setFormData(prev => ({ ...prev, profilePhoto: base64String }));
      setProfilePreview(base64String);
    };
    reader.onerror = () => {
      toast.error('Failed to read file', {
        description: 'An error occurred while reading the file. Please try again.',
      });
      e.target.value = ''; // Reset input
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validation
      if (formData.reportingManagerId === formData.employeeId) {
        toast.error('Employee cannot be their own reporting manager');
        setIsSubmitting(false);
        return;
      }

      if (formData.dottedLineManagerId === formData.employeeId) {
        toast.error('Employee cannot be their own dotted line manager');
        setIsSubmitting(false);
        return;
      }

      if (employee?._id) {
        // Update existing employee
        await updateEmployee(employee._id, formData);
        toast.success('Employee updated successfully');
      } else {
        // Create new employee
        await addEmployee(formData);
        toast.success('Employee added successfully');
      }

      onClose();
      onSuccess?.();
    } catch (error) {
      console.error('Submit error:', error);
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage = err.response?.data?.message || err.message || 'Operation failed';
      // Don't show error toast if employee was stored locally
      if (!errorMessage.includes('stored locally')) {
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{employee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
          <DialogDescription>
            {employee ? 'Update employee information' : 'Fill in the details to add a new employee'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Photo Upload */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              {profilePreview ? (
                <img
                  src={profilePreview}
                  alt="Profile preview"
                  className="h-24 w-24 rounded-full object-cover border-2 border-primary"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center border-2 border-dashed border-primary">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="profilePhoto" className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                  <Upload className="h-4 w-4" />
                  <span>Upload Photo</span>
                </div>
                <Input
                  id="profilePhoto"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </Label>
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee ID *</Label>
              <Input
                id="employeeId"
                value={formData.employeeId}
                onChange={(e) => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
                required
                disabled={!!employee}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="designation">Designation *</Label>
              <Input
                id="designation"
                value={formData.designation}
                onChange={(e) => setFormData(prev => ({ ...prev, designation: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Select
                value={formData.department}
                onValueChange={(value: string) => setFormData(prev => ({ ...prev, department: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Engineering">Engineering</SelectItem>
                  <SelectItem value="Product">Product</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                  <SelectItem value="Operations">Operations</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Select
                value={formData.location}
                onValueChange={(value: string) => setFormData(prev => ({ ...prev, location: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="San Francisco, CA">San Francisco, CA</SelectItem>
                  <SelectItem value="New York, NY">New York, NY</SelectItem>
                  <SelectItem value="Austin, TX">Austin, TX</SelectItem>
                  <SelectItem value="Chicago, IL">Chicago, IL</SelectItem>
                  <SelectItem value="Seattle, WA">Seattle, WA</SelectItem>
                  <SelectItem value="Remote">Remote</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessUnit">Business Unit *</Label>
              <Select
                value={formData.businessUnit}
                onValueChange={(value: string) => setFormData(prev => ({ ...prev, businessUnit: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select business unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Marketing & Sales">Marketing & Sales</SelectItem>
                  <SelectItem value="Finance & Operations">Finance & Operations</SelectItem>
                  <SelectItem value="Human Resources">Human Resources</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfJoining">Date of Joining *</Label>
              <DatePicker
                value={formData.dateOfJoining}
                onChange={(date) => setFormData(prev => ({ ...prev, dateOfJoining: date }))}
                placeholder="Select joining date"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <DatePicker
                value={formData.dateOfBirth}
                onChange={(date) => setFormData(prev => ({ ...prev, dateOfBirth: date }))}
                placeholder="Select birth date"
              />
            </div>
          </div>

          {/* Manager Assignments */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold">Manager Assignments</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reportingManagerId">Reporting Manager</Label>
                <Select
                  value={formData.reportingManagerId || 'none'}
                  onValueChange={(value: string) => setFormData(prev => ({ ...prev, reportingManagerId: value === 'none' ? '' : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select reporting manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {activeEmployees
                      .filter(emp => emp.employeeId !== formData.employeeId)
                      .map(emp => (
                        <SelectItem key={emp.employeeId} value={emp.employeeId}>
                          {emp.name} ({emp.employeeId}) - {emp.designation}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dottedLineManagerId">Dotted Line Manager</Label>
                <Select
                  value={formData.dottedLineManagerId || 'none'}
                  onValueChange={(value: string) => setFormData(prev => ({ ...prev, dottedLineManagerId: value === 'none' ? '' : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select dotted line manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {activeEmployees
                      .filter(emp => emp.employeeId !== formData.employeeId)
                      .map(emp => (
                        <SelectItem key={emp.employeeId} value={emp.employeeId}>
                          {emp.name} ({emp.employeeId}) - {emp.designation}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : employee ? 'Update Employee' : 'Add Employee'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
