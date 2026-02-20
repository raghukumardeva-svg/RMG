import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNewJoinerStore } from '@/store/newJoinerStore';
import { toast } from 'sonner';

interface AddNewJoinerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddNewJoinerModal({ open, onOpenChange }: AddNewJoinerModalProps) {
  const addNewJoiner = useNewJoinerStore(state => state.addNewJoiner);
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    role: '',
    joinDate: '',
    email: '',
    phone: '',
    location: '',
    department: '',
    businessUnit: ''
  });

  const generateAvatar = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.role.trim() || !formData.joinDate.trim() || !formData.employeeId.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Format date
    const dateObj = new Date(formData.joinDate);
    const shortDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const longDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const fullDate = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });

    addNewJoiner({
      employeeId: formData.employeeId,
      name: formData.name,
      role: formData.role,
      date: shortDate,
      joinDate: longDate,
      fullDate: fullDate,
      department: formData.department || 'General',
      avatar: generateAvatar(formData.name),
      email: formData.email || `${formData.name.toLowerCase().replace(' ', '.')}@company.com`,
      phone: formData.phone || '+1 234-567-8900',
      location: formData.location || 'Office',
      jobTitle: formData.role,
      businessUnit: formData.businessUnit || 'General'
    });

    toast.success('New joiner added successfully!');
    setFormData({
      employeeId: '',
      name: '',
      role: '',
      joinDate: '',
      email: '',
      phone: '',
      location: '',
      department: '',
      businessUnit: ''
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Joiner</DialogTitle>
          <DialogDescription>
            Add a new employee to the team celebrations list.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="employeeId">Employee ID *</Label>
              <Input
                id="employeeId"
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                placeholder="EMP001"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role/Job Title *</Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="Software Engineer"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="joinDate">Join Date *</Label>
              <Input
                id="joinDate"
                type="date"
                value={formData.joinDate}
                onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john.doe@company.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 234-567-8900"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="Engineering"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="San Francisco, CA"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add New Joiner</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
