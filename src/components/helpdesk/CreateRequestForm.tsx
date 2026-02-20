import { useState, useEffect, useMemo } from 'react';
import DOMPurify from 'dompurify';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { PeoplePicker } from '@/components/ui/people-picker';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, Paperclip, XCircle, Send, Headphones, Building, DollarSign } from 'lucide-react';
import type {
  HighLevelCategory,
  HelpdeskFormData,
  SubCategoryConfig,
} from '@/types/helpdeskNew';
import { subCategoryConfigService } from '@/services/subCategoryConfigService';
import { toast } from 'sonner';
import type { ReopenTicketData } from './RaiseRequestDrawer';

interface CreateRequestFormProps {
  onSubmit: (formData: HelpdeskFormData) => Promise<void>;
  isLoading?: boolean;
  fixedCategory?: HighLevelCategory;
  inDrawer?: boolean;
  onSubmitClick?: () => void;
  reopenData?: ReopenTicketData | null;
}

const categoryInfo: Record<HighLevelCategory, { label: string; icon: React.ReactNode; description: string }> = {
  IT: {
    label: 'IT Helpdesk',
    icon: <Headphones className="h-5 w-5" />,
    description: 'Hardware, software, network, and access issues'
  },
  Facilities: {
    label: 'Facilities Helpdesk',
    icon: <Building className="h-5 w-5" />,
    description: 'Maintenance, repairs, and facility-related requests'
  },
  Finance: {
    label: 'Finance Helpdesk',
    icon: <DollarSign className="h-5 w-5" />,
    description: 'Payroll, expenses, invoices, and financial queries'
  }
};

export function CreateRequestForm({ onSubmit, isLoading = false, fixedCategory, inDrawer = false, onSubmitClick, reopenData }: CreateRequestFormProps) {
  const effectiveCategory = reopenData?.highLevelCategory || fixedCategory || 'IT';

  const [formData, setFormData] = useState<HelpdeskFormData>({
    highLevelCategory: effectiveCategory,
    subCategory: reopenData?.subCategory || '',
    subject: reopenData?.subject || '',
    description: reopenData?.description || '',
    urgency: reopenData?.urgency || 'Medium',
    dynamicFields: [],
    attachments: [],
    previousTicketNumber: reopenData?.previousTicketNumber,
  });

  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof HelpdeskFormData, string>>>({});
  const [customSubCategory, setCustomSubCategory] = useState('');
  const [notifyPeople, setNotifyPeople] = useState<Array<{ id: string; name: string; email: string }>>([]);

  // State for subcategory mapping from API
  const [categoryMapping, setCategoryMapping] = useState<Record<string, Record<string, SubCategoryConfig>>>({});
  const [isLoadingMapping, setIsLoadingMapping] = useState(true);

  // Mock available people - In production, this would come from an API
  const availablePeople = useMemo(() => [
    { id: '1', name: 'John Doe', email: 'john.doe@company.com' },
    { id: '2', name: 'Jane Smith', email: 'jane.smith@company.com' },
    { id: '3', name: 'Robert Johnson', email: 'robert.johnson@company.com' },
    { id: '4', name: 'Emily Davis', email: 'emily.davis@company.com' },
    { id: '5', name: 'Michael Brown', email: 'michael.brown@company.com' },
    { id: '6', name: 'Sarah Wilson', email: 'sarah.wilson@company.com' },
    { id: '7', name: 'David Martinez', email: 'david.martinez@company.com' },
    { id: '8', name: 'Lisa Anderson', email: 'lisa.anderson@company.com' },
    { id: '9', name: 'James Taylor', email: 'james.taylor@company.com' },
    { id: '10', name: 'Jennifer Thomas', email: 'jennifer.thomas@company.com' },
  ], []);

  // Fetch subcategory mapping from API on mount
  useEffect(() => {
    const fetchSubCategoryMapping = async () => {
      try {
        setIsLoadingMapping(true);
        const mapping = await subCategoryConfigService.getAll();
        setCategoryMapping(mapping as Record<string, Record<string, SubCategoryConfig>>);
      } catch (error) {
        console.error('Failed to fetch subcategory mapping:', error);
        toast.error('Failed to load category configuration. Please refresh the page.');
      } finally {
        setIsLoadingMapping(false);
      }
    };

    fetchSubCategoryMapping();
  }, []);

  // Reset subcategory when fixedCategory prop changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      highLevelCategory: effectiveCategory,
      subCategory: '',
    }));
    setCustomSubCategory('');
  }, [effectiveCategory]);

  // Update form when reopenData changes (e.g., reopening different tickets)
  useEffect(() => {
    if (reopenData) {
      setFormData({
        highLevelCategory: reopenData.highLevelCategory,
        subCategory: reopenData.subCategory,
        subject: reopenData.subject,
        description: reopenData.description,
        urgency: reopenData.urgency,
        dynamicFields: [],
        attachments: [],
        previousTicketNumber: reopenData.previousTicketNumber,
      });
    }
  }, [reopenData]);

  // Get subcategories based on selected high-level category
  const getSubCategories = (): string[] => {
    const subCategories = categoryMapping[formData.highLevelCategory];
    return subCategories ? Object.keys(subCategories) : [];
  };

  // Derive subcategory config from current selection
  const subCategoryConfig = useMemo(() => {
    if (!formData.subCategory) return null;
    return categoryMapping[formData.highLevelCategory]?.[formData.subCategory] || null;
  }, [formData.highLevelCategory, formData.subCategory, categoryMapping]);

  const handleInputChange = (field: keyof HelpdeskFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Reset customSubCategory when subCategory changes
    if (field === 'subCategory' && value !== 'Other') {
      setCustomSubCategory('');
    }

    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);

      // File validation constants
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
      const MAX_TOTAL_SIZE = 25 * 1024 * 1024; // 25MB total
      const MAX_FILES = 5;
      const ALLOWED_TYPES = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/png',
        'image/jpeg',
        'image/jpg',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];

      // Validate each file
      for (const file of files) {
        // Check file size
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`File "${file.name}" is too large. Maximum size is 10MB.`);
          e.target.value = ''; // Reset input
          return;
        }

        // Check file type
        if (!ALLOWED_TYPES.includes(file.type)) {
          toast.error(`File "${file.name}" has an invalid type. Only PDF, DOC, DOCX, TXT, PNG, JPG, XLSX, XLS are allowed.`);
          e.target.value = ''; // Reset input
          return;
        }
      }

      // Check total number of files
      const totalFiles = attachedFiles.length + files.length;
      if (totalFiles > MAX_FILES) {
        toast.error(`Maximum ${MAX_FILES} files allowed. You have ${attachedFiles.length} files already.`);
        e.target.value = ''; // Reset input
        return;
      }

      // Check total size
      const currentTotalSize = attachedFiles.reduce((sum, file) => sum + file.size, 0);
      const newFilesSize = files.reduce((sum, file) => sum + file.size, 0);
      const totalSize = currentTotalSize + newFilesSize;

      if (totalSize > MAX_TOTAL_SIZE) {
        toast.error(`Total file size exceeds 25MB limit. Current: ${(currentTotalSize / 1024 / 1024).toFixed(1)}MB`);
        e.target.value = ''; // Reset input
        return;
      }

      // All validations passed
      setAttachedFiles(prev => [...prev, ...files]);
      e.target.value = ''; // Reset input for reuse
      toast.success(`${files.length} file(s) attached successfully`);
    }
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Helper function to sanitize and strip HTML tags securely
  // Uses DOMPurify to prevent XSS attacks before extracting text
  const stripHtml = (html: string): string => {
    // First sanitize the HTML to remove any malicious scripts
    const sanitized = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [], // Strip all tags
      KEEP_CONTENT: true, // Keep text content
    });

    // Create temporary element to extract text content
    const tmp = document.createElement('div');
    tmp.textContent = sanitized; // Use textContent (not innerHTML) to prevent script execution
    return tmp.textContent || '';
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof HelpdeskFormData, string>> = {};

    if (!formData.highLevelCategory) {
      errors.highLevelCategory = 'Category is required';
    }
    if (!formData.subCategory) {
      errors.subCategory = 'Sub-category is required';
    }
    // If "Other" is selected, validate custom subcategory
    if (formData.subCategory === 'Other' && !customSubCategory.trim()) {
      errors.subCategory = 'Please specify the request type';
    }
    if (!formData.subject || formData.subject.trim().length === 0) {
      errors.subject = 'Subject is required';
    } else if (formData.subject.trim().length < 5) {
      errors.subject = 'Subject must be at least 5 characters';
    } else if (formData.subject.trim().length > 200) {
      errors.subject = 'Subject must be at most 200 characters';
    }
    // For rich text editor, strip HTML and check for actual content
    const descriptionText = stripHtml(formData.description).trim();
    if (!formData.description || descriptionText.length === 0) {
      errors.description = 'Description is required';
    } else if (descriptionText.length < 10) {
      errors.description = 'Description must be at least 10 characters';
    }
    if (!formData.urgency) {
      errors.urgency = 'Urgency level is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Use customSubCategory if "Other" is selected
      const finalSubCategory = formData.subCategory === 'Other' && customSubCategory.trim()
        ? customSubCategory.trim()
        : formData.subCategory;

      // Sanitize HTML description to prevent XSS attacks
      const sanitizedDescription = DOMPurify.sanitize(formData.description, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'a'],
        ALLOWED_ATTR: ['href', 'target'],
        ALLOW_DATA_ATTR: false,
      });

      const formDataWithAttachments = {
        ...formData,
        description: sanitizedDescription,
        subCategory: finalSubCategory,
        attachments: attachedFiles,
      };

      await onSubmit(formDataWithAttachments);

      // Reset form
      setFormData({
        highLevelCategory: fixedCategory || 'IT',
        subCategory: '',
        subject: '',
        description: '',
        urgency: 'Medium',
        dynamicFields: [],
        attachments: [],
      });
      setAttachedFiles([]);
      setFormErrors({});
      setCustomSubCategory('');
      setNotifyPeople([]);
    } catch (error) {
      console.error('Failed to submit request:', error);
      toast.error('Failed to submit request. Please try again.');
    }
  };

  const isFormValid =
    formData.highLevelCategory &&
    formData.subCategory &&
    formData.subject.trim() &&
    stripHtml(formData.description).trim() &&
    formData.urgency;

  const getCategoryTitle = (): string => {
    switch (formData.highLevelCategory) {
      case 'IT':
        return 'IT Helpdesk Request';
      case 'Facilities':
        return 'Facilities Helpdesk Request';
      case 'Finance':
        return 'Finance Helpdesk Request';
      default:
        return 'Submit New Request';
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4" id={inDrawer ? "raise-request-form" : undefined}>
      {/* Row 1: Two-column - Select Helpdesk Category and Request Type */}
      <div className="grid grid-cols-2 gap-4">
        {/* Select Helpdesk Category - Only show if not fixed */}
        {!fixedCategory && (
          <div className="space-y-2">
            <Label htmlFor="highLevelCategory" className="text-brand-slate dark:text-gray-300">
              Select Helpdesk Category <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.highLevelCategory}
              onValueChange={(value) => handleInputChange('highLevelCategory', value as HighLevelCategory)}
            >
              <SelectTrigger
                id="highLevelCategory"
                className={formErrors.highLevelCategory ? 'border-red-500 text-left' : 'text-left'}
              >
                <SelectValue placeholder="Choose category" className="text-left" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(categoryInfo) as HighLevelCategory[]).map((category) => {
                  const info = categoryInfo[category];
                  return (
                    <SelectItem
                      key={category}
                      value={category}
                      className="py-3 cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-brand-green mt-0.5">
                          {info.icon}
                        </div>
                        <div>
                          <div className="font-medium text-brand-navy dark:text-gray-100">
                            {info.label}
                          </div>
                          <div className="text-xs text-brand-slate dark:text-gray-400 mt-0.5">
                            {info.description}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {formErrors.highLevelCategory && (
              <p className="text-sm text-red-500">{formErrors.highLevelCategory}</p>
            )}
          </div>
        )}
        
        {/* Request Type */}
        <div className={`space-y-2 ${fixedCategory ? 'col-span-2' : ''}`}>
          <Label htmlFor="subCategory" className="text-brand-slate dark:text-gray-300">
            Request Type <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.subCategory}
            onValueChange={(value) => handleInputChange('subCategory', value)}
          >
            <SelectTrigger
              id="subCategory"
              className={formErrors.subCategory ? 'border-red-500 text-left' : 'text-left'}
            >
              <SelectValue placeholder="Select request type" className="text-left" />
            </SelectTrigger>
            <SelectContent>
              {getSubCategories().map((subCat) => (
                <SelectItem key={subCat} value={subCat}>
                  {subCat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {formErrors.subCategory && (
            <p className="text-sm text-red-500">{formErrors.subCategory}</p>
          )}
        </div>
      </div>

          {/* Custom Subcategory Input for "Other" */}
          {formData.subCategory === 'Other' && (
            <div className="space-y-2">
              <Label htmlFor="customSubCategory" className="text-brand-slate dark:text-gray-300">
                Specify Request Type <span className="text-red-500">*</span>
              </Label>
              <Input
                id="customSubCategory"
                placeholder="Please describe the type of IT request"
                value={customSubCategory}
                onChange={(e) => setCustomSubCategory(e.target.value)}
                className={formErrors.subCategory && !customSubCategory.trim() ? 'border-red-500' : ''}
              />
              <p className="text-xs text-brand-slate dark:text-gray-400">
                Since you selected "Other", please specify what type of IT assistance you need.
              </p>
            </div>
          )}

          {/* Approval Indicator - Only show if approval is required */}
          {subCategoryConfig && subCategoryConfig.requiresApproval && (
            <div className="flex items-center gap-2 text-sm">
              <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                Requires Approval
              </Badge>
            </div>
          )}

          {/* Row 2: Single-column - Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject" className="text-brand-slate dark:text-gray-300">
              Subject / Request Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="subject"
              placeholder="Brief description of your request"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              className={formErrors.subject ? 'border-red-500' : ''}
            />
            {formErrors.subject && (
              <p className="text-sm text-red-500">{formErrors.subject}</p>
            )}
          </div>

          {/* Row 3: Single-column - Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-brand-slate dark:text-gray-300">
              Description <span className="text-red-500">*</span>
            </Label>
            <RichTextEditor
              value={formData.description}
              onChange={(value) => handleInputChange('description', value)}
              placeholder="Provide detailed information about your request..."
              error={!!formErrors.description}
            />
            {formErrors.description && (
              <p className="text-sm text-red-500">{formErrors.description}</p>
            )}
          </div>

          {/* Row 4: Two-column - Urgency Level and Attachments */}
          <div className="grid grid-cols-2 gap-4">
            {/* Urgency Level */}
            <div className="space-y-2">
              <Label htmlFor="urgency" className="text-brand-slate dark:text-gray-300">
                Urgency Level <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.urgency}
                onValueChange={(value) => handleInputChange('urgency', value)}
              >
                <SelectTrigger
                  id="urgency"
                  className={formErrors.urgency ? 'border-red-500 text-left' : 'text-left'}
                >
                  <SelectValue placeholder="Select urgency level" className="text-left" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-gray-400"></span>
                      Low
                    </div>
                  </SelectItem>
                  <SelectItem value="Medium">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                      Medium
                    </div>
                  </SelectItem>
                  <SelectItem value="High">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-orange-500"></span>
                      High
                    </div>
                  </SelectItem>
                  <SelectItem value="Critical">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-500"></span>
                      Critical
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {formErrors.urgency && (
                <p className="text-sm text-red-500">{formErrors.urgency}</p>
              )}
            </div>

            {/* Attachments */}
            <div className="space-y-2">
              <Label htmlFor="attachments" className="text-brand-slate dark:text-gray-300">
                Attachments (Coming Soon)
              </Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    id="attachments"
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="flex-1"
                    accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.xlsx,.xls"
                    disabled
                    title="File upload feature coming soon"
                  />
                  <Button type="button" variant="outline" size="icon" disabled title="File upload feature coming soon">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-500">
                  Note: File attachment feature is currently under development and will be available soon.
                </p>
              </div>
            </div>
          </div>

          {/* Attached Files List - Full width */}
          {attachedFiles.length > 0 && (
            <div className="space-y-1">
              {attachedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-md text-sm"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-brand-slate dark:text-gray-400" />
                    <span className="truncate max-w-xs text-brand-navy dark:text-gray-300">
                      {file.name}
                    </span>
                    <span className="text-brand-slate dark:text-gray-400">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile(index)}
                  >
                    <XCircle className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Row 5: Single-column - Notify People */}
          <div className="space-y-2">
            <Label htmlFor="notify" className="text-brand-slate dark:text-gray-300">
              Notify (Optional)
            </Label>
            <PeoplePicker
              value={notifyPeople}
              onChange={setNotifyPeople}
              placeholder="Type to search people..."
              availablePeople={availablePeople}
            />
          </div>

          {/* Submit Button - Only show when NOT in drawer */}
          {!inDrawer && (
            <div className="flex justify-end pt-3 border-t border-brand-light-gray dark:border-gray-700">
              <Button
                type="submit"
                disabled={!isFormValid || isLoading}
                className="min-w-32"
              >
                {isLoading ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          )}
    </form>
  );

  // If in drawer, return form without card wrapper
  if (inDrawer) {
    return (
      <>
        {formContent}
        {onSubmitClick && (
          <input type="hidden" id="form-valid" value={isFormValid ? 'true' : 'false'} />
        )}
      </>
    );
  }

  // Default: return form wrapped in card
  return (
    <Card className="border-brand-light-gray dark:border-gray-700">
      <CardHeader className="pb-4">
        <CardTitle className="text-brand-navy dark:text-gray-100 flex items-center gap-2">
          <Send className="h-5 w-5 text-brand-green" />
          {getCategoryTitle()}
        </CardTitle>
        <CardDescription className="text-brand-slate dark:text-gray-400">
          Select the type of request and provide details
        </CardDescription>
      </CardHeader>
      <CardContent>
        {formContent}
      </CardContent>
    </Card>
  );
}
