import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { sanitizeString } from '@/utils/sanitize';
import { useAnnouncementStore } from '@/store/announcementStore';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  Save, 
  Send, 
  Bold, 
  Italic, 
  List, 
  ListOrdered,
  Maximize2,
  Heart,
  MessageCircle,
  Eye,
  FileText,
  Calendar,
  Pin,
  BarChart3,
  Plus,
  Trash2,
  Clock,
  Users,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { getAvatarGradient } from '@/constants/design-system';

interface AnnouncementFormData {
  title: string;
  description: string;
  type: 'general' | 'event';
  category: string;
  isPinned: boolean;
  needsAcknowledgement: boolean;
  image: string | null;
  attachments: File[];
  expiresIn: string;
}

interface PollOption {
  id: string;
  text: string;
}

interface PollFormData {
  question: string;
  options: PollOption[];
  allowMultipleAnswers: boolean;
  isAnonymous: boolean;
  expiresIn: string;
  category: string;
}

export function NewAnnouncement() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const [isFullPreview, setIsFullPreview] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [activeTab, setActiveTab] = useState('announcement');
  
  // Store hooks
  const addAnnouncement = useAnnouncementStore(state => state.addAnnouncement);
  const fetchAnnouncements = useAnnouncementStore(state => state.fetchAnnouncements);
  const user = useAuthStore(state => state.user);
  
  const [formData, setFormData] = useState<AnnouncementFormData>({
    title: '',
    description: '',
    type: 'general',
    category: 'general',
    isPinned: false,
    needsAcknowledgement: false,
    image: null,
    attachments: [],
    expiresIn: '7days'
  });

  // Poll form state
  const [pollData, setPollData] = useState<PollFormData>({
    question: '',
    options: [
      { id: '1', text: '' },
      { id: '2', text: '' }
    ],
    allowMultipleAnswers: false,
    isAnonymous: false,
    expiresIn: '7days',
    category: 'general'
  });

  const [textFormatting, setTextFormatting] = useState({
    bold: false,
    italic: false,
    bulletList: false,
    numberedList: false
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        toast.error('File too large', {
          description: 'Maximum file size is 20MB'
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const aspectRatio = img.width / img.height;
          if (Math.abs(aspectRatio - 1) > 0.1) {
            toast.warning('Image Ratio', {
              description: 'Recommended aspect ratio is 1:1 for best display'
            });
          }
          setFormData(prev => ({ ...prev, image: reader.result as string }));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        toast.error('Invalid file type', {
          description: 'Only PNG, JPG, JPEG, and PDF files are allowed'
        });
        return false;
      }
      if (file.size > 20 * 1024 * 1024) {
        toast.error('File too large', {
          description: `${file.name} exceeds 20MB limit`
        });
        return false;
      }
      return true;
    });

    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...validFiles]
    }));
  };

  const removeAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleGetFromPexels = () => {
    // Simulate Pexels integration
    const sampleImages = [
      'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&h=800&fit=crop'
    ];
    const randomImage = sampleImages[Math.floor(Math.random() * sampleImages.length)];
    setFormData(prev => ({ ...prev, image: randomImage }));
    toast.success('Image loaded from Pexels');
  };

  const handleSaveDraft = () => {
    if (!formData.title.trim()) {
      toast.error('Title required', {
        description: 'Please enter an announcement title'
      });
      return;
    }

    toast.success('Draft saved', {
      description: 'Your announcement has been saved as draft'
    });
    
    setTimeout(() => {
      navigate('/dashboard');
    }, 1000);
  };

  const handlePublish = async () => {
    // Sanitize input data
    const sanitizedTitle = sanitizeString(formData.title);
    const sanitizedDescription = sanitizeString(formData.description);

    if (!sanitizedTitle.trim() || !sanitizedDescription.trim()) {
      toast.error('Required fields missing', {
        description: 'Please fill in title and description'
      });
      return;
    }

    setIsPublishing(true);

    try {
      const today = new Date();
      const dateStr = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      
      // Calculate expiry date for announcement
      const expiryDays = formData.expiresIn === 'never' ? null : parseInt(formData.expiresIn.replace('days', '').replace('day', ''));
      const expiryDate = expiryDays ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString() : undefined;

      await addAnnouncement({
        title: sanitizedTitle,
        description: sanitizedDescription,
        author: user?.name || 'Admin',
        role: user?.role || 'Administrator',
        date: dateStr,
        time: 'Just now',
        avatar: user?.name?.split(' ').map(n => n[0]).join('') || 'AD',
        priority: formData.type === 'event' ? 'high' : 'medium',
        imageUrl: formData.image || undefined,
        category: formData.category,
        isPinned: formData.isPinned,
        views: 0,
        expiresAt: expiryDate
      });

      // Refetch announcements to ensure sync
      await fetchAnnouncements();

      toast.success('Announcement published!', {
        description: 'Your announcement is now visible to all users'
      });

      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (error) {
      console.error('Failed to publish announcement:', error);
      toast.error('Failed to publish', {
        description: 'Please try again later'
      });
    } finally {
      setIsPublishing(false);
    }
  };

  // Poll helper functions
  const addPollOption = () => {
    if (pollData.options.length >= 6) {
      toast.error('Maximum options reached', {
        description: 'You can add up to 6 options'
      });
      return;
    }
    setPollData(prev => ({
      ...prev,
      options: [...prev.options, { id: Date.now().toString(), text: '' }]
    }));
  };

  const removePollOption = (id: string) => {
    if (pollData.options.length <= 2) {
      toast.error('Minimum options required', {
        description: 'A poll must have at least 2 options'
      });
      return;
    }
    setPollData(prev => ({
      ...prev,
      options: prev.options.filter(opt => opt.id !== id)
    }));
  };

  const updatePollOption = (id: string, text: string) => {
    setPollData(prev => ({
      ...prev,
      options: prev.options.map(opt => opt.id === id ? { ...opt, text } : opt)
    }));
  };

  const handlePublishPoll = async () => {
    const sanitizedQuestion = sanitizeString(pollData.question);
    
    if (!sanitizedQuestion.trim()) {
      toast.error('Question required', {
        description: 'Please enter a poll question'
      });
      return;
    }

    const validOptions = pollData.options.filter(opt => opt.text.trim());
    if (validOptions.length < 2) {
      toast.error('Options required', {
        description: 'Please provide at least 2 options'
      });
      return;
    }

    setIsPublishing(true);

    try {
      const today = new Date();
      const dateStr = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      
      // Calculate expiry date
      const expiryDays = pollData.expiresIn === 'never' ? null : parseInt(pollData.expiresIn.replace('days', '').replace('day', ''));
      const expiryDate = expiryDays ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString() : undefined;

      await addAnnouncement({
        title: sanitizedQuestion,
        description: `Poll with ${validOptions.length} options`,
        author: user?.name || 'Admin',
        role: user?.role || 'Administrator',
        date: dateStr,
        time: 'Just now',
        avatar: user?.name?.split(' ').map(n => n[0]).join('') || 'AD',
        priority: 'medium',
        category: pollData.category,
        isPinned: false,
        views: 0,
        // Poll specific fields
        isPoll: true,
        pollOptions: validOptions.map(opt => ({
          id: opt.id,
          text: sanitizeString(opt.text),
          votes: 0,
          votedBy: []
        })),
        allowMultipleAnswers: pollData.allowMultipleAnswers,
        isAnonymous: pollData.isAnonymous,
        pollExpiresAt: expiryDate,
        totalVotes: 0
      });

      await fetchAnnouncements();

      toast.success('Poll published!', {
        description: 'Your poll is now visible to all users'
      });

      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (error) {
      console.error('Failed to publish poll:', error);
      toast.error('Failed to publish', {
        description: 'Please try again later'
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const applyFormatting = (format: keyof typeof textFormatting) => {
    setTextFormatting(prev => ({
      ...prev,
      [format]: !prev[format]
    }));
    // In a real implementation, this would apply formatting to selected text
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/dashboard')}
              >
                <X className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Create New</h1>
                <p className="text-sm text-muted-foreground">Create announcements or polls for your organization</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {activeTab === 'announcement' ? (
                <>
                  <Button variant="outline" onClick={handleSaveDraft} disabled={isPublishing}>
                    <Save className="h-4 w-4 mr-2" />
                    Save as Draft
                  </Button>
                  <Button onClick={handlePublish} disabled={isPublishing}>
                    <Send className="h-4 w-4 mr-2" />
                    {isPublishing ? 'Publishing...' : 'Publish Announcement'}
                  </Button>
                </>
              ) : (
                <Button onClick={handlePublishPoll} disabled={isPublishing}>
                  <Send className="h-4 w-4 mr-2" />
                  {isPublishing ? 'Publishing...' : 'Publish Poll'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Tabs */}
      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="announcement" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              New Announcement
            </TabsTrigger>
            <TabsTrigger value="polls" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Polls
            </TabsTrigger>
          </TabsList>

          {/* Announcement Tab */}
          <TabsContent value="announcement">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* LEFT SECTION - Form */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Announcement Details</CardTitle>
                    <CardDescription>Fill in the information for your announcement</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Title */}
                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter announcement title..."
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="text-lg"
                  />
                </div>

                {/* Rich Text Editor */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <div className="border rounded-lg">
                    {/* Toolbar */}
                    <div className="flex items-center gap-1 p-2 border-b bg-muted-color/50">
                      <Button
                        type="button"
                        variant={textFormatting.bold ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => applyFormatting('bold')}
                      >
                        <Bold className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant={textFormatting.italic ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => applyFormatting('italic')}
                      >
                        <Italic className="h-4 w-4" />
                      </Button>
                      <div className="w-px h-6 bg-border mx-1" />
                      <Button
                        type="button"
                        variant={textFormatting.bulletList ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => applyFormatting('bulletList')}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant={textFormatting.numberedList ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => applyFormatting('numberedList')}
                      >
                        <ListOrdered className="h-4 w-4" />
                      </Button>
                    </div>
                    {/* Text Area */}
                    <Textarea
                      id="description"
                      placeholder="Write your announcement description here..."
                      value={formData.description}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="min-h-[200px] border-0 focus-visible:ring-0 resize-none"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formData.description.length} characters
                  </p>
                </div>

                {/* Announcement Type */}
                <div className="space-y-2">
                  <Label>Announcement Type</Label>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant={formData.type === 'general' ? 'default' : 'outline'}
                      onClick={() => setFormData(prev => ({ ...prev, type: 'general' }))}
                      className="flex-1"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      General
                    </Button>
                    <Button
                      type="button"
                      variant={formData.type === 'event' ? 'default' : 'outline'}
                      onClick={() => setFormData(prev => ({ ...prev, type: 'event' }))}
                      className="flex-1"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Event
                    </Button>
                  </div>
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="policy">Policy</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="hr">HR</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="celebration">Celebration</SelectItem>
                      <SelectItem value="announcement">Announcement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Pin Announcement */}
                <div className="flex items-center justify-between p-4 border rounded-lg bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                  <div className="space-y-0.5">
                    <Label htmlFor="pinned" className="flex items-center gap-2">
                      <Pin className="h-4 w-4 text-amber-600" />
                      Pin this announcement
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Pinned announcements appear at the top of the feed
                    </p>
                  </div>
                  <Switch
                    id="pinned"
                    checked={formData.isPinned}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, isPinned: checked }))
                    }
                  />
                </div>

                {/* Announcement Duration */}
                <div className="space-y-2">
                  <Label htmlFor="duration" className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    Announcement Duration
                  </Label>
                  <Select
                    value={formData.expiresIn}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, expiresIn: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1day">1 Day</SelectItem>
                      <SelectItem value="3days">3 Days</SelectItem>
                      <SelectItem value="7days">7 Days</SelectItem>
                      <SelectItem value="14days">14 Days</SelectItem>
                      <SelectItem value="30days">30 Days</SelectItem>
                      <SelectItem value="90days">90 Days</SelectItem>
                      <SelectItem value="never">No Expiry</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    After this duration, the announcement will only be visible to HR
                  </p>
                </div>

                {/* Needs Acknowledgement */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="acknowledgement">Needs Acknowledgement?</Label>
                    <p className="text-sm text-muted-foreground">
                      Require users to acknowledge they've read this announcement
                    </p>
                  </div>
                  <Switch
                    id="acknowledgement"
                    checked={formData.needsAcknowledgement}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, needsAcknowledgement: checked }))
                    }
                  />
                </div>

                {/* Attachments */}
                <div className="space-y-2">
                  <Label>Additional Attachments</Label>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center">
                    <input
                      ref={attachmentInputRef}
                      type="file"
                      multiple
                      accept=".png,.jpg,.jpeg,.pdf"
                      onChange={handleAttachmentUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => attachmentInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Files
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      PNG, JPG, JPEG, PDF (max 20MB each)
                    </p>
                  </div>
                  
                  {/* Attachment List */}
                  {formData.attachments.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {formData.attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAttachment(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT SECTION - Image Upload & Preview */}
          <div className="space-y-6">
            {/* Image Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Header Image</CardTitle>
                <CardDescription>Upload or select an image for your announcement</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.image ? (
                  <div className="relative aspect-square rounded-lg overflow-hidden border">
                    <img 
                      src={formData.image} 
                      alt="Announcement header" 
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => setFormData(prev => ({ ...prev, image: null }))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="aspect-square border-2 border-dashed rounded-lg flex items-center justify-center bg-muted-color/50">
                    <div className="text-center p-6">
                      <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-sm text-muted-foreground mb-4">
                        Recommended ratio: 1:1 (Square)
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Image
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGetFromPexels}
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Get from Pexels
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Live Preview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Live Wall Preview</CardTitle>
                    <CardDescription>How your announcement will appear</CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsFullPreview(true)}
                  >
                    <Maximize2 className="h-4 w-4 mr-2" />
                    Full Preview
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  {/* Preview Card */}
                  <div className="">
                    {formData.image && (
                      <div className="aspect-video w-full overflow-hidden">
                        <img 
                          src={formData.image} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4 space-y-3">
                      {/* Title */}
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-semibold text-lg line-clamp-2">
                          {formData.title || 'Announcement Title'}
                        </h3>
                        <Badge variant={formData.type === 'event' ? 'default' : 'secondary'}>
                          {formData.type}
                        </Badge>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {formData.description || 'Your announcement description will appear here...'}
                      </p>

                      {/* Acknowledgement Badge */}
                      {formData.needsAcknowledgement && (
                        <Badge variant="outline" className="text-xs">
                          Acknowledgement Required
                        </Badge>
                      )}

                      {/* Engagement Section */}
                      <div className="flex items-center gap-4 pt-2 border-t">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Heart className="h-4 w-4" />
                          <span className="text-sm">0</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MessageCircle className="h-4 w-4" />
                          <span className="text-sm">0</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Eye className="h-4 w-4" />
                          <span className="text-sm">0</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
          </TabsContent>

          {/* Polls Tab */}
          <TabsContent value="polls">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* LEFT SECTION - Poll Form */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-purple-600" />
                      Create a Poll
                    </CardTitle>
                    <CardDescription>Create engaging polls to gather feedback from your team</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Poll Question */}
                    <div className="space-y-2">
                      <Label htmlFor="question">Question *</Label>
                      <Input
                        id="question"
                        placeholder="Ask your question..."
                        value={pollData.question}
                        onChange={(e) => setPollData(prev => ({ ...prev, question: e.target.value }))}
                        className="text-lg"
                      />
                    </div>

                    {/* Poll Options */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Options *</Label>
                        <span className="text-xs text-muted-foreground">{pollData.options.length}/6 options</span>
                      </div>
                      <div className="space-y-2">
                        {pollData.options.map((option, index) => (
                          <div key={option.id} className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 text-sm font-medium">
                              {index + 1}
                            </div>
                            <Input
                              placeholder={`Option ${index + 1}`}
                              value={option.text}
                              onChange={(e) => updatePollOption(option.id, e.target.value)}
                              className="flex-1"
                            />
                            {pollData.options.length > 2 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => removePollOption(option.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                      {pollData.options.length < 6 && (
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full border-dashed"
                          onClick={addPollOption}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Option
                        </Button>
                      )}
                    </div>

                    {/* Poll Category */}
                    <div className="space-y-2">
                      <Label htmlFor="pollCategory">Category</Label>
                      <Select
                        value={pollData.category}
                        onValueChange={(value) => setPollData(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="feedback">Feedback</SelectItem>
                          <SelectItem value="hr">HR</SelectItem>
                          <SelectItem value="event">Event Planning</SelectItem>
                          <SelectItem value="policy">Policy</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Poll Duration */}
                    <div className="space-y-2">
                      <Label htmlFor="duration">Poll Duration</Label>
                      <Select
                        value={pollData.expiresIn}
                        onValueChange={(value) => setPollData(prev => ({ ...prev, expiresIn: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1day">1 Day</SelectItem>
                          <SelectItem value="3days">3 Days</SelectItem>
                          <SelectItem value="7days">7 Days</SelectItem>
                          <SelectItem value="14days">14 Days</SelectItem>
                          <SelectItem value="30days">30 Days</SelectItem>
                          <SelectItem value="never">No Expiry</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Poll Settings */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-0.5">
                          <Label htmlFor="multipleAnswers" className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            Allow Multiple Answers
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Users can select more than one option
                          </p>
                        </div>
                        <Switch
                          id="multipleAnswers"
                          checked={pollData.allowMultipleAnswers}
                          onCheckedChange={(checked) => 
                            setPollData(prev => ({ ...prev, allowMultipleAnswers: checked }))
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-0.5">
                          <Label htmlFor="anonymous" className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-600" />
                            Anonymous Voting
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Hide who voted for which option
                          </p>
                        </div>
                        <Switch
                          id="anonymous"
                          checked={pollData.isAnonymous}
                          onCheckedChange={(checked) => 
                            setPollData(prev => ({ ...prev, isAnonymous: checked }))
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* RIGHT SECTION - Poll Preview */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Poll Preview</CardTitle>
                    <CardDescription>How your poll will appear to users</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border-2 rounded-xl p-5 space-y-4 bg-purple-50 dark:bg-purple-950/20">
                      {/* Poll Header */}
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-full ${getAvatarGradient(user?.name || 'Admin')} flex items-center justify-center text-white font-semibold`}>
                          {user?.name?.split(' ').map(n => n[0]).join('') || 'AD'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{user?.name || 'Admin'}</span>
                            <Badge variant="secondary" className="text-xs">Poll</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>Just now</span>
                            <span>•</span>
                            <span>{pollData.expiresIn === 'never' ? 'No expiry' : `Expires in ${pollData.expiresIn.replace('days', ' days').replace('day', ' day')}`}</span>
                          </div>
                        </div>
                      </div>

                      {/* Poll Question */}
                      <h3 className="font-semibold text-lg">
                        {pollData.question || 'Your poll question will appear here...'}
                      </h3>

                      {/* Poll Options Preview */}
                      <div className="space-y-2">
                        {pollData.options.map((option, index) => (
                          <div
                            key={option.id}
                            className="relative overflow-hidden border-2 rounded-lg p-3 hover:border-purple-300 dark:hover:border-purple-700 transition-colors cursor-pointer bg-white dark:bg-gray-800"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-full border-2 ${pollData.allowMultipleAnswers ? 'rounded-md' : ''} border-purple-300 flex items-center justify-center`}>
                                {index === 0 && <div className="w-3 h-3 bg-purple-500 rounded-full" />}
                              </div>
                              <span className="text-sm font-medium">
                                {option.text || `Option ${index + 1}`}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Poll Footer */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                        <span>0 votes</span>
                        <div className="flex items-center gap-2">
                          {pollData.isAnonymous && (
                            <Badge variant="outline" className="text-xs">Anonymous</Badge>
                          )}
                          {pollData.allowMultipleAnswers && (
                            <Badge variant="outline" className="text-xs">Multiple Choice</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Poll Tips */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">💡 Tips for Great Polls</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Keep questions clear and concise</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Provide balanced and distinct options</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Use anonymous voting for sensitive topics</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Set appropriate duration based on urgency</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Full Screen Preview Modal */}
      {isFullPreview && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
              <h2 className="font-semibold">Full Preview</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullPreview(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-6">
              {formData.image && (
                <div className="aspect-video w-full overflow-hidden rounded-lg mb-4">
                  <img 
                    src={formData.image} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <h1 className="text-2xl font-bold">
                    {formData.title || 'Announcement Title'}
                  </h1>
                  <Badge variant={formData.type === 'event' ? 'default' : 'secondary'}>
                    {formData.type}
                  </Badge>
                </div>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {formData.description || 'Your announcement description will appear here...'}
                </p>
                {formData.needsAcknowledgement && (
                  <Badge variant="outline">
                    Acknowledgement Required
                  </Badge>
                )}
                <div className="flex items-center gap-6 pt-4 border-t">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Heart className="h-4 w-4" />
                    <span>0</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <MessageCircle className="h-4 w-4" />
                    <span>0</span>
                  </Button>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Eye className="h-4 w-4" />
                    <span className="text-sm">0 views</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
