import React, { useState, useCallback, useRef } from 'react';
import {
  Upload,
  File,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  X,
  Eye,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface FileAttachment {
  id: string;
  file: File;
  preview?: string;
  uploadProgress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  errorMessage?: string;
  url?: string;
}

interface FileAttachmentProps {
  maxFiles?: number;
  maxFileSize?: number; // in MB
  allowedTypes?: string[];
  onFilesChange?: (files: File[]) => void;
  autoUpload?: boolean;
  existingFiles?: FileAttachment[];
  disabled?: boolean;
  className?: string;
}

const FILE_TYPE_ICONS: Record<string, React.ElementType> = {
  'image': FileImage,
  'video': FileVideo,
  'audio': FileAudio,
  'pdf': FileText,
  'document': FileText,
  'spreadsheet': FileText,
  'archive': FileArchive,
  'default': File,
};

const MIME_TYPE_CATEGORIES: Record<string, string> = {
  'image/': 'image',
  'video/': 'video',
  'audio/': 'audio',
  'application/pdf': 'pdf',
  'application/msword': 'document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml': 'document',
  'application/vnd.ms-excel': 'spreadsheet',
  'application/vnd.openxmlformats-officedocument.spreadsheetml': 'spreadsheet',
  'application/zip': 'archive',
  'application/x-rar': 'archive',
  'application/x-7z': 'archive',
};

export const FileAttachmentUpload = React.memo<FileAttachmentProps>(({
  maxFiles = 10,
  maxFileSize = 10, // 10MB default
  allowedTypes = ['image/*', '.pdf', '.doc', '.docx', '.txt', '.csv', '.xlsx', '.xls', '.zip'],
  onFilesChange,
  autoUpload = false,
  existingFiles = [],
  disabled = false,
  className = '',
}) => {
  const [attachments, setAttachments] = useState<FileAttachment[]>(existingFiles);
  const [isDragging, setIsDragging] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileAttachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  // Get file type category
  const getFileCategory = useCallback((file: File): string => {
    const mimeType = file.type;
    
    for (const [prefix, category] of Object.entries(MIME_TYPE_CATEGORIES)) {
      if (mimeType.startsWith(prefix) || mimeType === prefix) {
        return category;
      }
    }
    
    return 'default';
  }, []);

  // Get file icon
  const getFileIcon = useCallback((file: File) => {
    const category = getFileCategory(file);
    return FILE_TYPE_ICONS[category] || FILE_TYPE_ICONS.default;
  }, [getFileCategory]);

  // Format file size
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }, []);

  // Validate file
  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    // Check file size
    const maxSizeBytes = maxFileSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        error: `File size exceeds ${maxFileSize}MB limit`,
      };
    }

    // Check file type
    const fileType = file.type;
    const fileName = file.name.toLowerCase();
    const isAllowed = allowedTypes.some(type => {
      if (type.startsWith('.')) {
        return fileName.endsWith(type);
      }
      if (type.endsWith('/*')) {
        const category = type.replace('/*', '');
        return fileType.startsWith(category);
      }
      return fileType === type;
    });

    if (!isAllowed) {
      return {
        valid: false,
        error: 'File type not allowed',
      };
    }

    return { valid: true };
  }, [maxFileSize, allowedTypes]);

  // Create file preview
  const createFilePreview = useCallback((file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => resolve(undefined);
        reader.readAsDataURL(file);
      } else {
        resolve(undefined);
      }
    });
  }, []);

  // Upload file
  const uploadFile = useCallback(async (attachment: FileAttachment) => {
    setAttachments(prev =>
      prev.map(a =>
        a.id === attachment.id ? { ...a, status: 'uploading' as const } : a
      )
    );

    try {
      const formData = new FormData();
      formData.append('file', attachment.file);

      // Simulate upload progress
      const simulateProgress = () => {
        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          if (progress <= 90) {
            setAttachments(prev =>
              prev.map(a =>
                a.id === attachment.id ? { ...a, uploadProgress: progress } : a
              )
            );
          } else {
            clearInterval(interval);
          }
        }, 200);
        return interval;
      };

      const progressInterval = simulateProgress();

      // Make upload request (in real implementation)
      // const response = await fetch(uploadEndpoint, {
      //   method: 'POST',
      //   body: formData,
      // });

      // Simulate successful upload
      await new Promise(resolve => setTimeout(resolve, 2000));

      clearInterval(progressInterval);

      setAttachments(prev =>
        prev.map(a =>
          a.id === attachment.id
            ? {
                ...a,
                uploadProgress: 100,
                status: 'completed' as const,
                url: URL.createObjectURL(attachment.file), // In real implementation, use server URL
              }
            : a
        )
      );

      toast.success(`${attachment.file.name} uploaded successfully`);
    } catch {
      setAttachments(prev =>
        prev.map(a =>
          a.id === attachment.id
            ? {
                ...a,
                status: 'error' as const,
                errorMessage: 'Upload failed. Please try again.',
              }
            : a
        )
      );
      toast.error(`Failed to upload ${attachment.file.name}`);
    }
  }, []);

  // Process files
  const processFiles = useCallback(async (files: File[]) => {
    if (disabled) return;

    // Check max files limit
    if (attachments.length + files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const validFiles: FileAttachment[] = [];
    const invalidFiles: string[] = [];

    for (const file of files) {
      const validation = validateFile(file);
      
      if (validation.valid) {
        const preview = await createFilePreview(file);
        const fileAttachment: FileAttachment = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          preview,
          uploadProgress: 0,
          status: 'pending',
        };
        validFiles.push(fileAttachment);
      } else {
        invalidFiles.push(`${file.name}: ${validation.error}`);
      }
    }

    if (invalidFiles.length > 0) {
      invalidFiles.forEach(error => toast.error(error));
    }

    if (validFiles.length > 0) {
      const newAttachments = [...attachments, ...validFiles];
      setAttachments(newAttachments);
      onFilesChange?.(newAttachments.map(a => a.file));
      toast.success(`${validFiles.length} file(s) added`);

      // Auto upload if enabled
      if (autoUpload) {
        validFiles.forEach(attachment => uploadFile(attachment));
      }
    }
  }, [
    disabled,
    attachments,
    maxFiles,
    validateFile,
    createFilePreview,
    onFilesChange,
    autoUpload,
    uploadFile,
  ]);

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      processFiles(files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [processFiles]);

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFiles(files);
    }
  }, [processFiles]);

  // Remove attachment
  const handleRemoveAttachment = useCallback((attachmentId: string) => {
    setAttachments(prev => {
      const newAttachments = prev.filter(a => a.id !== attachmentId);
      onFilesChange?.(newAttachments.map(a => a.file));
      return newAttachments;
    });
    toast.success('Attachment removed');
  }, [onFilesChange]);

  // Retry upload
  const handleRetryUpload = useCallback((attachment: FileAttachment) => {
    uploadFile(attachment);
  }, [uploadFile]);

  // Upload all pending files
  const handleUploadAll = useCallback(() => {
    const pendingFiles = attachments.filter(a => a.status === 'pending');
    pendingFiles.forEach(attachment => uploadFile(attachment));
  }, [attachments, uploadFile]);

  // Clear all attachments
  const handleClearAll = useCallback(() => {
    setAttachments([]);
    onFilesChange?.([]);
    toast.success('All attachments cleared');
  }, [onFilesChange]);

  // Preview file
  const handlePreview = useCallback((attachment: FileAttachment) => {
    setPreviewFile(attachment);
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : 'border-gray-300 dark:border-gray-700'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'}
        `}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center gap-3">
          <div className={`p-4 rounded-full ${isDragging ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-100 dark:bg-gray-800'}`}>
            <Upload className={`w-8 h-8 ${isDragging ? 'text-blue-600' : 'text-gray-600'}`} />
          </div>
          
          <div>
            <p className="text-lg font-medium">
              {isDragging ? 'Drop files here' : 'Drag & drop files here'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              or click to browse files
            </p>
          </div>
          
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Maximum file size: {maxFileSize}MB</p>
            <p>Maximum files: {maxFiles}</p>
            <p>Allowed types: {allowedTypes.join(', ')}</p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileInputChange}
          accept={allowedTypes.join(',')}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {/* Attachments List */}
      {attachments.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium">
                Attachments ({attachments.length}/{maxFiles})
              </Label>
              
              <div className="flex gap-2">
                {!autoUpload && attachments.some(a => a.status === 'pending') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUploadAll}
                    disabled={disabled}
                  >
                    Upload All
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  disabled={disabled}
                >
                  Clear All
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {attachments.map((attachment) => {
                const Icon = getFileIcon(attachment.file);
                
                return (
                  <div
                    key={attachment.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                  >
                    {/* Preview or Icon */}
                    <div className="flex-shrink-0">
                      {attachment.preview ? (
                        <img
                          src={attachment.preview}
                          alt={attachment.file.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 flex items-center justify-center bg-gray-200 dark:bg-gray-800 rounded">
                          <Icon className="w-6 h-6 text-gray-600" />
                        </div>
                      )}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium truncate">
                          {attachment.file.name}
                        </p>
                        {attachment.status === 'completed' && (
                          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                        )}
                        {attachment.status === 'error' && (
                          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                        )}
                        {attachment.status === 'uploading' && (
                          <Loader2 className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(attachment.file.size)}</span>
                        <span>•</span>
                        <Badge variant="secondary" className="text-xs">
                          {getFileCategory(attachment.file)}
                        </Badge>
                        {attachment.status === 'error' && attachment.errorMessage && (
                          <>
                            <span>•</span>
                            <span className="text-red-600">{attachment.errorMessage}</span>
                          </>
                        )}
                      </div>

                      {/* Upload Progress */}
                      {(attachment.status === 'uploading' || 
                        (attachment.status === 'completed' && attachment.uploadProgress === 100)) && (
                        <Progress 
                          value={attachment.uploadProgress} 
                          className="h-1 mt-2"
                        />
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {attachment.status === 'completed' && attachment.preview && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreview(attachment)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      
                      {attachment.status === 'error' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRetryUpload(attachment)}
                          className="h-8 w-8 p-0"
                        >
                          <Upload className="w-4 h-4" />
                        </Button>
                      )}
                      
                      {!autoUpload && attachment.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => uploadFile(attachment)}
                          className="h-8 w-8 p-0"
                        >
                          <Upload className="w-4 h-4" />
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveAttachment(attachment.id)}
                        disabled={attachment.status === 'uploading'}
                        className="h-8 w-8 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog */}
      {previewFile && (
        <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{previewFile.file.name}</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              {previewFile.preview ? (
                <img
                  src={previewFile.preview}
                  alt={previewFile.file.name}
                  className="w-full h-auto rounded-lg"
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <File className="w-16 h-16 mb-4" />
                  <p>Preview not available for this file type</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
});

FileAttachmentUpload.displayName = 'FileAttachmentUpload';

export default FileAttachmentUpload;
