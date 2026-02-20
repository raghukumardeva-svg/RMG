import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCelebrationStore } from '@/store/celebrationStore';
import { toast } from 'sonner';

interface AddCelebrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'birthday' | 'anniversary';
}

export function AddCelebrationModal({ open, onOpenChange, type }: AddCelebrationModalProps) {
  const addCelebration = useCelebrationStore(state => state.addCelebration);
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    date: '',
    years: '',
    department: '',
    email: '',
    phone: '',
    location: '',
    jobTitle: '',
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
    
    if (!formData.name.trim() || !formData.date.trim() || !formData.employeeId.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (type === 'anniversary' && !formData.years) {
      toast.error('Please specify the number of years');
      return;
    }

    // Format date
    const dateObj = new Date(formData.date);
    const shortDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const fullDate = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'long' });

    addCelebration({
      employeeId: formData.employeeId,
      name: formData.name,
      type: type,
      date: shortDate,
      fullDate: fullDate,
      years: type === 'anniversary' ? parseInt(formData.years) : undefined,
      department: formData.department || 'General',
      avatar: generateAvatar(formData.name),
      email: formData.email || `${formData.name.toLowerCase().replace(' ', '.')}@company.com`,
      phone: formData.phone || '+1 234-567-8900',
      location: formData.location || 'Office',
      jobTitle: formData.jobTitle || 'Employee',
      businessUnit: formData.businessUnit || 'General'
    });

    toast.success(`${type === 'birthday' ? 'Birthday' : 'Anniversary'} added successfully!`);
    setFormData({
      employeeId: '',
      name: '',
      date: '',
      years: '',
      department: '',
      email: '',
      phone: '',
      location: '',
      jobTitle: '',
      businessUnit: ''
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add {type === 'birthday' ? 'Birthday' : 'Work Anniversary'}</DialogTitle>
          <DialogDescription>
            Add a new {type === 'birthday' ? 'employee birthday' : 'work anniversary'} celebration.
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
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            {type === 'anniversary' && (
              <div className="grid gap-2">
                <Label htmlFor="years">Years *</Label>
                <Input
                  id="years"
                  type="number"
                  min="1"
                  value={formData.years}
                  onChange={(e) => setFormData({ ...formData, years: e.target.value })}
                  placeholder="5"
                  required
                />
              </div>
            )}
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
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                placeholder="Software Engineer"
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
            <Button type="submit">Add {type === 'birthday' ? 'Birthday' : 'Anniversary'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
