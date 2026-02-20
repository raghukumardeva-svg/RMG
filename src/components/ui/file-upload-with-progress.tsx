import { useState } from 'react';
import { Progress } from './progress';
import { Upload, X, FileIcon, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface FileUploadWithProgressProps {
  accept?: string;
  maxSize?: number; // in bytes
  multiple?: boolean;
  onFilesSelected: (files: File[]) => void;
  className?: string;
  label?: string;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'complete' | 'error';
  error?: string;
}

export function FileUploadWithProgress({
  accept = '*',
  maxSize = 20 * 1024 * 1024, // 20MB default
  multiple = false,
  onFilesSelected,
  className,
  label = 'Upload File',
}: FileUploadWithProgressProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0);
      return `File size exceeds ${maxSizeMB}MB limit`;
    }

    // Check file type if accept is specified
    if (accept !== '*') {
      const acceptedTypes = accept.split(',').map(t => t.trim());
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      const mimeType = file.type;

      const isAccepted = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return fileExtension === type;
        }
        return mimeType.match(new RegExp(type.replace('*', '.*')));
      });

      if (!isAccepted) {
        return `File type not accepted. Allowed: ${accept}`;
      }
    }

    return null;
  };

  const simulateUpload = (_file: File, index: number): Promise<void> => {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setUploadingFiles(prev =>
            prev.map((f, i) =>
              i === index ? { ...f, progress: 100, status: 'complete' } : f
            )
          );
          resolve();
        } else {
          setUploadingFiles(prev =>
            prev.map((f, i) =>
              i === index ? { ...f, progress: Math.min(progress, 100) } : f
            )
          );
        }
      }, 200);
    });
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const newUploadingFiles: UploadingFile[] = [];

    // Validate all files first
    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        toast.error('File validation failed', {
          description: `${file.name}: ${error}`,
        });
        newUploadingFiles.push({
          file,
          progress: 0,
          status: 'error',
          error,
        });
      } else {
        validFiles.push(file);
        newUploadingFiles.push({
          file,
          progress: 0,
          status: 'uploading',
        });
      }
    }

    if (validFiles.length === 0) return;

    setUploadingFiles(newUploadingFiles);

    // Simulate upload progress for each file
    await Promise.all(
      newUploadingFiles.map((_, index) =>
        newUploadingFiles[index].status === 'uploading'
          ? simulateUpload(newUploadingFiles[index].file, index)
          : Promise.resolve()
      )
    );

    // Call the callback with valid files
    onFilesSelected(validFiles);

    // Clear uploading files after a delay
    setTimeout(() => {
      setUploadingFiles([]);
    }, 2000);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    handleFiles(e.target.files);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Upload Area */}
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-6 transition-colors',
          dragActive
            ? 'border-brand-green bg-brand-green/5'
            : 'border-gray-300 dark:border-gray-600 hover:border-brand-green',
          'cursor-pointer'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center justify-center text-center">
          <Upload className="h-10 w-10 text-gray-400 dark:text-gray-500 mb-3" />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Drag and drop or click to browse
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Max size: {(maxSize / (1024 * 1024)).toFixed(0)}MB
          </p>
        </div>
      </div>

      {/* Upload Progress */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map((uploadFile, index) => (
            <div
              key={index}
              className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg space-y-2"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <FileIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {uploadFile.file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(uploadFile.file.size)}
                    </p>
                  </div>
                </div>
                {uploadFile.status === 'complete' && (
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                )}
                {uploadFile.status === 'error' && (
                  <X className="h-5 w-5 text-red-500 flex-shrink-0" />
                )}
              </div>

              {uploadFile.status === 'uploading' && (
                <Progress value={uploadFile.progress} className="h-1.5" />
              )}

              {uploadFile.status === 'error' && uploadFile.error && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  {uploadFile.error}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
