import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { useHolidayStore } from '@/store/holidayStore';
import type { Holiday } from '@/store/holidayStore';
import { toast } from 'sonner';
import { Calendar, Upload, Image, X, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface EditHolidayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  holiday: Holiday | null;
}

const HOLIDAY_TYPES = [
  'Public Holiday',
  'Company Holiday',
  'National',
  'Regional',
  'Optional',
  'Floating Holiday'
];

// Predefined background images for holidays
const PRESET_BACKGROUNDS = [
  { name: 'Celebration', url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400&q=80' },
  { name: 'Fireworks', url: 'https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=400&q=80' },
  { name: 'Balloons', url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&q=80' },
  { name: 'Festival', url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&q=80' },
  { name: 'Nature', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&q=80' },
  { name: 'Office Party', url: 'https://images.unsplash.com/photo-1496843916299-590492c751f4?w=400&q=80' },
];

export function EditHolidayModal({ open, onOpenChange, holiday }: EditHolidayModalProps) {
  const { updateHoliday, deleteHoliday } = useHolidayStore();
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    type: 'Public Holiday',
    backgroundImage: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse the display date back to YYYY-MM-DD format for the date input
  const parseDateForInput = (displayDate: string): string => {
    try {
      // If it's already in YYYY-MM-DD format, return as is
      if (/^\d{4}-\d{2}-\d{2}$/.test(displayDate)) {
        return displayDate;
      }
      
      // For other formats, parse carefully to avoid timezone issues
      const date = new Date(displayDate);
      if (!isNaN(date.getTime())) {
        // Use local date components to avoid timezone shifts
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    } catch {
      // If parsing fails, return empty string
    }
    return '';
  };

  useEffect(() => {
    if (holiday) {
      setFormData({
        name: holiday.name,
        date: parseDateForInput(holiday.date),
        type: holiday.type,
        backgroundImage: holiday.backgroundImage || ''
      });
    }
  }, [holiday]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!holiday) return;
    
    if (!formData.name.trim() || !formData.date.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateHoliday(holiday.id, {
        name: formData.name,
        date: formData.date,
        type: formData.type,
        backgroundImage: formData.backgroundImage
      });

      toast.success('Holiday updated successfully!');
      onOpenChange(false);
    } catch {
      toast.error('Failed to update holiday. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!holiday) return;
    
    setIsSubmitting(true);
    try {
      await deleteHoliday(holiday.id);
      toast.success('Holiday deleted successfully!');
      onOpenChange(false);
    } catch {
      toast.error('Failed to delete holiday. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFormData(prev => ({ ...prev, backgroundImage: base64 }));
    };
    reader.readAsDataURL(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePresetSelect = (url: string) => {
    setFormData(prev => ({ ...prev, backgroundImage: url }));
    setShowPresets(false);
  };

  const clearBackgroundImage = () => {
    setFormData(prev => ({ ...prev, backgroundImage: '' }));
  };

  if (!holiday) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-brand-green" />
            Edit Holiday
          </DialogTitle>
          <DialogDescription>
            Update holiday details and add a background image.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-name">Holiday Name *</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Independence Day"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-date">Date *</Label>
            <DatePicker
              value={formData.date}
              onChange={(date) => setFormData({ ...formData, date })}
              placeholder="Select holiday date"
              className="w-full"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-type">Type *</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select holiday type" />
              </SelectTrigger>
              <SelectContent>
                {HOLIDAY_TYPES.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Background Image Section */}
          <div className="grid gap-2">
            <Label>Background Image</Label>
            
            {/* Current Image Preview */}
            {formData.backgroundImage && (
              <div className="relative rounded-lg overflow-hidden h-32 mb-2">
                <img
                  src={formData.backgroundImage}
                  alt="Holiday background"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 h-8 w-8 p-0"
                  onClick={clearBackgroundImage}
                >
                  <X className="h-4 w-4" />
                </Button>
                <p className="absolute bottom-2 left-2 text-white text-sm font-medium">
                  {formData.name}
                </p>
              </div>
            )}

            {/* Upload Options */}
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Image
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPresets(!showPresets)}
                className="flex-1"
              >
                <Image className="h-4 w-4 mr-2" />
                Preset Images
              </Button>
            </div>

            {/* Preset Images Grid */}
            {showPresets && (
              <div className="grid grid-cols-3 gap-2 mt-2 p-2 border rounded-lg bg-muted/30">
                {PRESET_BACKGROUNDS.map((preset, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handlePresetSelect(preset.url)}
                    className="relative rounded-md overflow-hidden h-16 group hover:ring-2 hover:ring-primary transition-all"
                  >
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs font-medium">{preset.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Upload an image (max 2MB) or choose from presets. Supported formats: JPG, PNG, GIF
            </p>
          </div>

          <DialogFooter className="flex justify-between sm:justify-between gap-2 pt-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Holiday</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{holiday.name}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
