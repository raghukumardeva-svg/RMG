import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link,
  Image,
  Code,
  Quote,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Strikethrough,
  Paperclip,
  Camera,
  X,
  Eye,
  FileText,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

interface RichTextEditorProps {
  value?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  minHeight?: string;
  maxHeight?: string;
  disabled?: boolean;
  showAttachments?: boolean;
  onAttachmentsChange?: (files: File[]) => void;
  className?: string;
}

interface ToolbarButton {
  id: string;
  icon: React.ElementType;
  label: string;
  command: string;
  value?: string;
  shortcut?: string;
}

const TOOLBAR_BUTTONS: ToolbarButton[] = [
  { id: 'bold', icon: Bold, label: 'Bold', command: 'bold', shortcut: 'Ctrl+B' },
  { id: 'italic', icon: Italic, label: 'Italic', command: 'italic', shortcut: 'Ctrl+I' },
  { id: 'underline', icon: Underline, label: 'Underline', command: 'underline', shortcut: 'Ctrl+U' },
  { id: 'strikethrough', icon: Strikethrough, label: 'Strikethrough', command: 'strikeThrough' },
  { id: 'separator1', icon: () => null, label: '', command: '' },
  { id: 'ul', icon: List, label: 'Bullet List', command: 'insertUnorderedList' },
  { id: 'ol', icon: ListOrdered, label: 'Numbered List', command: 'insertOrderedList' },
  { id: 'separator2', icon: () => null, label: '', command: '' },
  { id: 'alignLeft', icon: AlignLeft, label: 'Align Left', command: 'justifyLeft' },
  { id: 'alignCenter', icon: AlignCenter, label: 'Align Center', command: 'justifyCenter' },
  { id: 'alignRight', icon: AlignRight, label: 'Align Right', command: 'justifyRight' },
  { id: 'separator3', icon: () => null, label: '', command: '' },
  { id: 'blockquote', icon: Quote, label: 'Quote', command: 'formatBlock', value: 'blockquote' },
  { id: 'code', icon: Code, label: 'Code Block', command: 'formatBlock', value: 'pre' },
  { id: 'separator4', icon: () => null, label: '', command: '' },
  { id: 'link', icon: Link, label: 'Insert Link', command: 'createLink', shortcut: 'Ctrl+K' },
  { id: 'image', icon: Image, label: 'Insert Image', command: 'insertImage' },
  { id: 'separator5', icon: () => null, label: '', command: '' },
  { id: 'undo', icon: Undo, label: 'Undo', command: 'undo', shortcut: 'Ctrl+Z' },
  { id: 'redo', icon: Redo, label: 'Redo', command: 'redo', shortcut: 'Ctrl+Y' },
];

export const RichTextEditor = React.memo<RichTextEditorProps>(({
  value = '',
  onChange,
  placeholder = 'Start typing your message...',
  minHeight = '200px',
  maxHeight = '500px',
  disabled = false,
  showAttachments = true,
  onAttachmentsChange,
  className = '',
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState(value);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeView, setActiveView] = useState<'edit' | 'preview'>('edit');
  const [isFocused, setIsFocused] = useState(false);

  // Initialize editor content
  React.useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
      setContent(value);
    }
  }, [value]);

  // Handle content changes
  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      setContent(newContent);
      onChange?.(newContent);
    }
  }, [onChange]);

  // Execute formatting command
  const execCommand = useCallback((command: string, value?: string) => {
    if (disabled) return;

    if (command === 'createLink') {
      const url = prompt('Enter the URL:');
      if (url) {
        document.execCommand(command, false, url);
      }
    } else if (command === 'insertImage') {
      const url = prompt('Enter the image URL:');
      if (url) {
        document.execCommand(command, false, url);
      }
    } else if (value) {
      document.execCommand(command, false, value);
    } else {
      document.execCommand(command, false);
    }

    handleInput();
    editorRef.current?.focus();
  }, [disabled, handleInput]);

  // Handle paste to clean up formatting
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }, []);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          execCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          execCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          execCommand('underline');
          break;
        case 'k':
          e.preventDefault();
          execCommand('createLink');
          break;
        case 'z':
          if (!e.shiftKey) {
            e.preventDefault();
            execCommand('undo');
          }
          break;
        case 'y':
          e.preventDefault();
          execCommand('redo');
          break;
      }
    }
  }, [execCommand]);

  // Handle file attachment
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate file size (max 10MB per file)
    const maxSize = 10 * 1024 * 1024;
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        toast.error(`File "${file.name}" is too large. Maximum size is 10MB.`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      const newAttachments = [...attachments, ...validFiles];
      setAttachments(newAttachments);
      onAttachmentsChange?.(newAttachments);
      toast.success(`${validFiles.length} file(s) attached`);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [attachments, onAttachmentsChange]);

  // Remove attachment
  const handleRemoveAttachment = useCallback((index: number) => {
    const newAttachments = attachments.filter((_, i) => i !== index);
    setAttachments(newAttachments);
    onAttachmentsChange?.(newAttachments);
    toast.success('Attachment removed');
  }, [attachments, onAttachmentsChange]);

  // Handle screenshot capture (simplified - would need actual implementation)
  const handleScreenshot = useCallback(() => {
    toast.info('Screenshot feature - Please use browser extension or paste from clipboard');
  }, []);

  // Clear all content
  const handleClear = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
      setContent('');
      onChange?.('');
    }
  }, [onChange]);

  // Get formatted content for preview
  const previewContent = useMemo(() => {
    return content || '<p class="text-muted-foreground">No content to preview</p>';
  }, [content]);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Card className={`overflow-hidden ${isFocused ? 'ring-2 ring-blue-500' : ''}`}>
        <CardContent className="p-0">
          {/* Toolbar */}
          <div className="border-b bg-gray-50 dark:bg-gray-900 p-2">
            <div className="flex items-center gap-1 flex-wrap">
              <TooltipProvider>
                {TOOLBAR_BUTTONS.map((button) => {
                  if (button.id.startsWith('separator')) {
                    return (
                      <div
                        key={button.id}
                        className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1"
                      />
                    );
                  }

                  const Icon = button.icon;
                  return (
                    <Tooltip key={button.id}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => execCommand(button.command, button.value)}
                          disabled={disabled}
                          className="h-8 w-8 p-0"
                        >
                          <Icon className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {button.label}
                          {button.shortcut && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({button.shortcut})
                            </span>
                          )}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}

                {/* Additional Actions */}
                <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1" />
                
                {showAttachments && (
                  <>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={disabled}
                          className="h-8 w-8 p-0"
                        >
                          <Paperclip className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Attach Files</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleScreenshot}
                          disabled={disabled}
                          className="h-8 w-8 p-0"
                        >
                          <Camera className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Capture Screenshot</p>
                      </TooltipContent>
                    </Tooltip>
                  </>
                )}

                <div className="flex-1" />

                {/* View Toggle */}
                <div className="flex items-center gap-1 ml-auto">
                  <Button
                    variant={activeView === 'edit' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveView('edit')}
                    className="h-8 px-3"
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant={activeView === 'preview' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveView('preview')}
                    className="h-8 px-3"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Preview
                  </Button>
                </div>

                <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1" />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="h-8 w-8 p-0"
                    >
                      {isExpanded ? (
                        <Minimize2 className="w-4 h-4" />
                      ) : (
                        <Maximize2 className="w-4 h-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isExpanded ? 'Collapse' : 'Expand'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Editor / Preview Area */}
          <div className="relative">
            {activeView === 'edit' ? (
              <div
                ref={editorRef}
                contentEditable={!disabled}
                onInput={handleInput}
                onPaste={handlePaste}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="p-4 outline-none prose prose-sm max-w-none dark:prose-invert overflow-y-auto"
                style={{
                  minHeight: isExpanded ? '400px' : minHeight,
                  maxHeight: isExpanded ? '800px' : maxHeight,
                }}
                data-placeholder={placeholder}
              />
            ) : (
              <div
                className="p-4 prose prose-sm max-w-none dark:prose-invert overflow-y-auto bg-gray-50 dark:bg-gray-900"
                style={{
                  minHeight: isExpanded ? '400px' : minHeight,
                  maxHeight: isExpanded ? '800px' : maxHeight,
                }}
                dangerouslySetInnerHTML={{ __html: previewContent }}
              />
            )}

            {/* Placeholder */}
            {!content && activeView === 'edit' && (
              <div
                className="absolute top-4 left-4 text-muted-foreground pointer-events-none"
                style={{ display: content ? 'none' : 'block' }}
              >
                {placeholder}
              </div>
            )}
          </div>

          {/* Status Bar */}
          <div className="border-t bg-gray-50 dark:bg-gray-900 px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>
                {content.replace(/<[^>]*>/g, '').length} characters
              </span>
              {attachments.length > 0 && (
                <span>
                  {attachments.length} attachment{attachments.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            {content && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-6 text-xs"
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Attachments List */}
      {showAttachments && attachments.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <Label className="text-sm font-medium mb-2 block">
              Attachments ({attachments.length})
            </Label>
            <div className="space-y-2">
              {attachments.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded-md"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Paperclip className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)} • {file.type || 'Unknown type'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveAttachment(index)}
                    className="h-8 w-8 p-0 flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.xls"
      />

      {/* CSS for placeholder and editor styles */}
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        
        [contenteditable] {
          caret-color: currentColor;
        }
        
        [contenteditable] p {
          margin: 0.5em 0;
        }
        
        [contenteditable] ul,
        [contenteditable] ol {
          margin: 0.5em 0;
          padding-left: 2em;
        }
        
        [contenteditable] blockquote {
          margin: 0.5em 0;
          padding-left: 1em;
          border-left: 3px solid #e5e7eb;
        }
        
        [contenteditable] pre {
          background: #f3f4f6;
          padding: 1em;
          border-radius: 0.375rem;
          overflow-x: auto;
        }
        
        [contenteditable] code {
          background: #f3f4f6;
          padding: 0.2em 0.4em;
          border-radius: 0.25rem;
          font-size: 0.875em;
        }
        
        [contenteditable] a {
          color: #3b82f6;
          text-decoration: underline;
        }
        
        [contenteditable] img {
          max-width: 100%;
          height: auto;
          border-radius: 0.375rem;
        }

        .dark [contenteditable] blockquote {
          border-left-color: #374151;
        }
        
        .dark [contenteditable] pre,
        .dark [contenteditable] code {
          background: #1f2937;
        }
      `}</style>
    </div>
  );
});

RichTextEditor.displayName = 'RichTextEditor';

export default RichTextEditor;
