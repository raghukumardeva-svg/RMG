import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { useHolidayStore } from '@/store/holidayStore';
import { toast } from 'sonner';
import { Upload, Plus, FileSpreadsheet, Calendar, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AddHolidayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface BulkHoliday {
  name: string;
  date: string;
  type: string;
  isValid: boolean;
  error?: string;
}

const HOLIDAY_TYPES = [
  'Public Holiday',
  'Company Holiday',
  'National',
  'Regional',
  'Optional',
  'Floating Holiday'
];

export function AddHolidayModal({ open, onOpenChange }: AddHolidayModalProps) {
  const addHoliday = useHolidayStore(state => state.addHoliday);
  const [activeTab, setActiveTab] = useState('single');
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    type: 'Public Holiday'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Bulk upload states
  const [bulkHolidays, setBulkHolidays] = useState<BulkHoliday[]>([]);
  const [bulkText, setBulkText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.date.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await addHoliday({
        name: formData.name,
        date: formData.date,
        type: formData.type
      });

      toast.success('Holiday added successfully!');
      setFormData({ name: '', date: '', type: 'Public Holiday' });
      onOpenChange(false);
    } catch {
      toast.error('Failed to add holiday. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const parseDate = (dateStr: string): string | null => {
    // Try multiple date formats
    const formats = [
      // ISO format: 2026-01-15
      /^(\d{4})-(\d{2})-(\d{2})$/,
      // US format: 01/15/2026 or 1/15/2026
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
      // European format: 15-01-2026
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
    ];

    for (const format of formats) {
      const match = dateStr.trim().match(format);
      if (match) {
        let year: string, month: string, day: string;
        
        if (format === formats[0]) {
          [, year, month, day] = match;
        } else if (format === formats[1]) {
          [, month, day, year] = match;
        } else {
          [, day, month, year] = match;
        }
        
        // Validate date
        const dateObj = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
        if (!isNaN(dateObj.getTime())) {
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }
    }
    
    // Try parsing with Date constructor
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
    
    return null;
  };

  const validateHoliday = (holiday: Partial<BulkHoliday>): BulkHoliday => {
    const errors: string[] = [];
    
    if (!holiday.name?.trim()) {
      errors.push('Name required');
    }
    
    const parsedDate = holiday.date ? parseDate(holiday.date) : null;
    if (!parsedDate) {
      errors.push('Invalid date');
    }
    
    const validType = HOLIDAY_TYPES.find(t => 
      t.toLowerCase() === holiday.type?.toLowerCase()
    ) || 'Public Holiday';
    
    return {
      name: holiday.name?.trim() || '',
      date: parsedDate || holiday.date || '',
      type: validType,
      isValid: errors.length === 0,
      error: errors.length > 0 ? errors.join(', ') : undefined
    };
  };

  const parseBulkText = (text: string) => {
    const lines = text.trim().split('\n').filter(line => line.trim());
    const holidays: BulkHoliday[] = [];
    
    for (const line of lines) {
      // Skip header line if present
      if (line.toLowerCase().includes('name') && line.toLowerCase().includes('date')) {
        continue;
      }
      
      // Try to parse CSV or tab-separated
      const parts = line.includes('\t') 
        ? line.split('\t') 
        : line.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
      
      if (parts.length >= 2) {
        const holiday = validateHoliday({
          name: parts[0],
          date: parts[1],
          type: parts[2] || 'Public Holiday'
        });
        holidays.push(holiday);
      }
    }
    
    setBulkHolidays(holidays);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setBulkText(text);
      parseBulkText(text);
    };
    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleBulkTextChange = (text: string) => {
    setBulkText(text);
    if (text.trim()) {
      parseBulkText(text);
    } else {
      setBulkHolidays([]);
    }
  };

  const removeHoliday = (index: number) => {
    setBulkHolidays(prev => prev.filter((_, i) => i !== index));
  };

  const handleBulkSubmit = async () => {
    const validHolidays = bulkHolidays.filter(h => h.isValid);
    
    if (validHolidays.length === 0) {
      toast.error('No valid holidays to add');
      return;
    }

    setIsSubmitting(true);
    let successCount = 0;
    let failCount = 0;

    for (const holiday of validHolidays) {
      try {
        await addHoliday({
          name: holiday.name,
          date: holiday.date,
          type: holiday.type
        });
        successCount++;
      } catch {
        failCount++;
      }
    }

    setIsSubmitting(false);

    if (successCount > 0) {
      toast.success(`Successfully added ${successCount} holiday${successCount > 1 ? 's' : ''}`);
    }
    if (failCount > 0) {
      toast.error(`Failed to add ${failCount} holiday${failCount > 1 ? 's' : ''}`);
    }

    if (failCount === 0) {
      setBulkHolidays([]);
      setBulkText('');
      onOpenChange(false);
    }
  };

  const validCount = bulkHolidays.filter(h => h.isValid).length;
  const invalidCount = bulkHolidays.filter(h => !h.isValid).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-brand-green" />
            Add Holiday
          </DialogTitle>
          <DialogDescription>
            Add a single holiday or bulk upload multiple holidays at once.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Single
            </TabsTrigger>
            <TabsTrigger value="bulk" className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Bulk Upload
            </TabsTrigger>
          </TabsList>

          {/* Single Holiday Tab */}
          <TabsContent value="single" className="flex-1 mt-4">
            <form onSubmit={handleSingleSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Holiday Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Independence Day"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">Date *</Label>
                <DatePicker
                  value={formData.date}
                  onChange={(date) => setFormData({ ...formData, date })}
                  placeholder="Select holiday date"
                  className="w-full"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Type *</Label>
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
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Adding...' : 'Add Holiday'}
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* Bulk Upload Tab */}
          <TabsContent value="bulk" className="flex-1 flex flex-col overflow-hidden mt-4 space-y-4">
            {/* File Upload */}
            <div className="space-y-2">
              <Label>Upload CSV File</Label>
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose File
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                CSV format: Name, Date (YYYY-MM-DD), Type (optional)
              </p>
            </div>

            {/* Or paste text */}
            <div className="space-y-2">
              <Label>Or Paste Data</Label>
              <Textarea
                placeholder={`Paste holidays here (one per line):
New Year's Day, 2026-01-01, Public Holiday
Republic Day, 2026-01-26, National
Holi, 2026-03-14, Optional`}
                value={bulkText}
                onChange={(e) => handleBulkTextChange(e.target.value)}
                className="h-24 font-mono text-sm"
              />
            </div>

            {/* Preview */}
            {bulkHolidays.length > 0 && (
              <div className="flex-1 flex flex-col overflow-hidden border rounded-lg">
                <div className="flex items-center justify-between p-3 bg-muted/50 border-b">
                  <span className="text-sm font-medium">Preview ({bulkHolidays.length} holidays)</span>
                  <div className="flex items-center gap-2">
                    {validCount > 0 && (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {validCount} valid
                      </Badge>
                    )}
                    {invalidCount > 0 && (
                      <Badge variant="destructive">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {invalidCount} invalid
                      </Badge>
                    )}
                  </div>
                </div>
                <ScrollArea className="flex-1 max-h-[200px]">
                  <div className="p-2 space-y-1">
                    {bulkHolidays.map((holiday, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-2 rounded-md text-sm ${
                          holiday.isValid 
                            ? 'bg-green-50 dark:bg-green-950/20' 
                            : 'bg-red-50 dark:bg-red-950/20'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {holiday.isValid ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                            )}
                            <span className="font-medium truncate">{holiday.name || '(No name)'}</span>
                          </div>
                          <div className="flex items-center gap-2 ml-6 text-xs text-muted-foreground">
                            <span>{holiday.date || 'Invalid date'}</span>
                            <span>•</span>
                            <span>{holiday.type}</span>
                            {holiday.error && (
                              <>
                                <span>•</span>
                                <span className="text-red-500">{holiday.error}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeHoliday(index)}
                          className="h-8 w-8 p-0 flex-shrink-0"
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleBulkSubmit}
                disabled={isSubmitting || validCount === 0}
              >
                {isSubmitting ? 'Adding...' : `Add ${validCount} Holiday${validCount !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
