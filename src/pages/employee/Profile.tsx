import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Mail,
  Phone,
  Calendar,
  MapPin,
  User,
  Users,
  Pencil,
  Camera,
  GraduationCap,
  Landmark
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { profileService } from '@/services/profileService';
import { toast } from 'sonner';

// Profile Loading Skeleton
function ProfileSkeleton() {
  return (
    <div className="w-full animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-6">
          {/* Tabs skeleton */}
          <div className="flex gap-4 border-b pb-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-24" />
          </div>
          
          {/* About section skeleton */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-8 w-8" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
          
          {/* Contact section skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        
        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          {/* Profile card skeleton */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Skeleton className="h-24 w-24 rounded-full mb-4" />
                <Skeleton className="h-6 w-40 mb-2" />
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
            </CardContent>
          </Card>
          
          {/* Quick info skeleton */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Extended profile interface
interface EmployeeProfile {
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  location: string;
  dateOfBirth: string;
  businessUnit: string;
  reportingManager: { id: string; name: string } | null;
  dottedLineManager: { id: string; name: string } | null;
  photo: string;
  status: string;
  dateOfJoining: string;
  personalEmail: string;
  workPhone: string;
  emergencyContact: string;
  gender: string;
  maritalStatus: string;
  bloodGroup: string;
  nationality: string;
  panNumber: string;
  aadharNumber: string;
  passportNumber: string;
  currentAddress: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  permanentAddress: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  previousExperience: {
    company: string;
    designation: string;
    duration: string;
    from: string;
    to: string;
  }[];
  projects: {
    name: string;
    role: string;
    status: string;
    startDate: string;
    endDate?: string;
  }[];
  employmentType: string;
  probationEndDate: string;
  confirmationDate: string;
  noticePeriod: string;
  timeline: {
    date: string;
    event: string;
    type: 'joining' | 'promotion' | 'transfer' | 'recognition' | 'other';
    description: string;
  }[];
  assets: {
    name: string;
    type: string;
    serialNumber: string;
    status: string;
    dateIssued: string;
  }[];
  summary: string;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
  };
}

interface ProfileProps {
  employeeId?: string;
  isDialog?: boolean;
}

export function Profile({ employeeId: propEmployeeId }: ProfileProps) {
  const user = useAuthStore((state) => state.user);
  const [employee, setEmployee] = useState<EmployeeProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('about');

  // Edit dialog states
  const [editSummaryOpen, setEditSummaryOpen] = useState(false);
  const [editContactOpen, setEditContactOpen] = useState(false);
  const [editPrimaryOpen, setEditPrimaryOpen] = useState(false);
  const [editIdentityOpen, setEditIdentityOpen] = useState(false);
  const [editAddressOpen, setEditAddressOpen] = useState(false);
  const [editJobOpen, setEditJobOpen] = useState(false);

  // Form states
  const [summaryForm, setSummaryForm] = useState('');
  const [contactForm, setContactForm] = useState({ personalEmail: '', workPhone: '', emergencyContact: '' });
  const [primaryForm, setPrimaryForm] = useState({ gender: '', dateOfBirth: '', maritalStatus: '', bloodGroup: '', nationality: '' });
  const [identityForm, setIdentityForm] = useState({ panNumber: '', aadharNumber: '', passportNumber: '' });
  const [addressForm, setAddressForm] = useState({
    currentAddress: { street: '', city: '', state: '', pincode: '', country: '' },
    permanentAddress: { street: '', city: '', state: '', pincode: '', country: '' }
  });
  const [jobForm, setJobForm] = useState({ employmentType: '', noticePeriod: '' });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const targetEmployeeId = propEmployeeId || user?.employeeId;
  const isOwnProfile = !propEmployeeId || propEmployeeId === user?.employeeId;

  const fetchProfile = useCallback(async () => {
    if (!targetEmployeeId) return;
    setIsLoading(true);
    try {
      const data = await profileService.getProfile(targetEmployeeId);
      setEmployee(data);
    } catch {
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }, [targetEmployeeId]);

  useEffect(() => {
    if (targetEmployeeId) {
      fetchProfile();
    }
  }, [targetEmployeeId, fetchProfile]);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !targetEmployeeId) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploadingPhoto(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        await profileService.updateSection(targetEmployeeId, 'photo', { photo: base64String });
        setEmployee(prev => prev ? { ...prev, photo: base64String } : null);
        
        if (isOwnProfile && user) {
          const updateUser = useAuthStore.getState().updateUser;
          updateUser({ avatar: base64String });
        }
        
        toast.success('Profile picture updated');
        setUploadingPhoto(false);
      };
      reader.onerror = () => {
        toast.error('Failed to read image file');
        setUploadingPhoto(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error('Failed to upload profile picture');
      setUploadingPhoto(false);
    }
  };

  // Edit handlers
  const handleEditSummary = () => {
    if (employee) {
      setSummaryForm(employee.summary);
      setEditSummaryOpen(true);
    }
  };

  const handleSaveSummary = async () => {
    if (!targetEmployeeId) return;
    try {
      await profileService.updateSection(targetEmployeeId, 'summary', { summary: summaryForm });
      setEmployee(prev => prev ? { ...prev, summary: summaryForm } : null);
      setEditSummaryOpen(false);
      toast.success('Summary updated successfully');
    } catch {
      toast.error('Failed to update summary');
    }
  };

  const handleEditContact = () => {
    if (employee) {
      setContactForm({
        personalEmail: employee.personalEmail,
        workPhone: employee.workPhone,
        emergencyContact: employee.emergencyContact
      });
      setEditContactOpen(true);
    }
  };

  const handleSaveContact = async () => {
    if (!targetEmployeeId) return;
    try {
      await profileService.updateSection(targetEmployeeId, 'contact', contactForm);
      setEmployee(prev => prev ? { ...prev, ...contactForm } : null);
      setEditContactOpen(false);
      toast.success('Contact details updated');
    } catch {
      toast.error('Failed to update contact details');
    }
  };

  const handleEditPrimary = () => {
    if (employee) {
      setPrimaryForm({
        gender: employee.gender,
        dateOfBirth: employee.dateOfBirth,
        maritalStatus: employee.maritalStatus,
        bloodGroup: employee.bloodGroup,
        nationality: employee.nationality
      });
      setEditPrimaryOpen(true);
    }
  };

  const handleSavePrimary = async () => {
    if (!targetEmployeeId) return;
    try {
      await profileService.updateSection(targetEmployeeId, 'primary', primaryForm);
      setEmployee(prev => prev ? { ...prev, ...primaryForm } : null);
      setEditPrimaryOpen(false);
      toast.success('Primary details updated');
    } catch {
      toast.error('Failed to update primary details');
    }
  };

  const handleEditIdentity = () => {
    if (employee) {
      setIdentityForm({
        panNumber: employee.panNumber,
        aadharNumber: employee.aadharNumber,
        passportNumber: employee.passportNumber
      });
      setEditIdentityOpen(true);
    }
  };

  const handleSaveIdentity = async () => {
    if (!targetEmployeeId) return;
    try {
      await profileService.updateSection(targetEmployeeId, 'identity', identityForm);
      setEmployee(prev => prev ? { ...prev, ...identityForm } : null);
      setEditIdentityOpen(false);
      toast.success('Identity information updated');
    } catch {
      toast.error('Failed to update identity information');
    }
  };

  const handleEditAddress = () => {
    if (employee) {
      setAddressForm({
        currentAddress: { ...employee.currentAddress },
        permanentAddress: { ...employee.permanentAddress }
      });
      setEditAddressOpen(true);
    }
  };

  const handleSaveAddress = async () => {
    if (!targetEmployeeId) return;
    try {
      await profileService.updateSection(targetEmployeeId, 'address', addressForm);
      setEmployee(prev => prev ? { ...prev, ...addressForm } : null);
      setEditAddressOpen(false);
      toast.success('Address updated');
    } catch {
      toast.error('Failed to update address');
    }
  };

  const handleEditJob = () => {
    if (employee) {
      setJobForm({
        employmentType: employee.employmentType,
        noticePeriod: employee.noticePeriod
      });
      setEditJobOpen(true);
    }
  };

  const handleSaveJob = async () => {
    if (!targetEmployeeId) return;
    try {
      await profileService.updateSection(targetEmployeeId, 'job', jobForm);
      setEmployee(prev => prev ? { ...prev, ...jobForm } : null);
      setEditJobOpen(false);
      toast.success('Job details updated');
    } catch {
      toast.error('Failed to update job details');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const maskValue = (value: string) => {
    if (!value) return 'N/A';
    if (value.length <= 4) return '****';
    return value.slice(0, -4).replace(/./g, '*') + value.slice(-4);
  };

  const getTimelineColor = (type: string) => {
    const colors = {
      joining: 'bg-blue-500',
      promotion: 'bg-green-500',
      transfer: 'bg-orange-500',
      recognition: 'bg-purple-500',
      other: 'bg-gray-500'
    };
    return colors[type as keyof typeof colors] || colors.other;
  };

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (!employee) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN - Main Content (70%) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
              <TabsTrigger 
                value="about" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
              >
                ABOUT
              </TabsTrigger>
              <TabsTrigger 
                value="profile"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
              >
                PROFILE
              </TabsTrigger>
              <TabsTrigger 
                value="job"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
              >
                JOB
              </TabsTrigger>
              <TabsTrigger 
                value="assets"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
              >
                ASSETS
              </TabsTrigger>
            </TabsList>

            {/* ABOUT TAB */}
            <TabsContent value="about" className="mt-6 space-y-6">
              {/* Summary Section */}
              <Card className="border border-gray-200 dark:border-gray-700 shadow-sm rounded-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-semibold">Summary</CardTitle>
                    {isOwnProfile && (
                      <Button variant="ghost" size="sm" onClick={handleEditSummary} className="h-8 w-8 p-0">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{employee.summary}</p>
                </CardContent>
              </Card>

              {/* Timeline Section */}
              <Card className="border border-gray-200 dark:border-gray-700 shadow-sm rounded-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold">Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {employee.timeline.map((event, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`h-3 w-3 rounded-full ${getTimelineColor(event.type)} flex-shrink-0`} />
                          {index < employee.timeline.length - 1 && (
                            <div className="w-0.5 h-full bg-gray-200 flex-1 mt-1" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-gray-900 dark:text-gray-100">{event.event}</span>
                            <Badge variant="outline" className="text-xs bg-gray-50">
                              {formatDate(event.date)}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{event.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* PROFILE TAB */}
            <TabsContent value="profile" className="mt-6 space-y-6">
              {/* Contact Details */}
              <Card className="border border-gray-200 dark:border-gray-700 shadow-sm rounded-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-semibold">Contact Details</CardTitle>
                    {isOwnProfile && (
                      <Button variant="ghost" size="sm" onClick={handleEditContact} className="h-8 w-8 p-0">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Work Email</Label>
                      <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">{employee.email}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Personal Email</Label>
                      <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">{employee.personalEmail}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Work Phone</Label>
                      <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">{employee.workPhone}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Mobile</Label>
                      <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">{employee.phone}</p>
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Emergency Contact</Label>
                      <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">{employee.emergencyContact}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Primary Details */}
              <Card className="border border-gray-200 dark:border-gray-700 shadow-sm rounded-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-semibold">Primary Details</CardTitle>
                    {isOwnProfile && (
                      <Button variant="ghost" size="sm" onClick={handleEditPrimary} className="h-8 w-8 p-0">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Employee ID</Label>
                      <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">{employee.employeeId}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Gender</Label>
                      <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">{employee.gender}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Date of Birth</Label>
                      <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">{formatDate(employee.dateOfBirth)}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Marital Status</Label>
                      <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">{employee.maritalStatus}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Blood Group</Label>
                      <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">{employee.bloodGroup}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Nationality</Label>
                      <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">{employee.nationality}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Identity Information */}
              <Card className="border border-gray-200 dark:border-gray-700 shadow-sm rounded-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-semibold">Identity Information</CardTitle>
                    {isOwnProfile && (
                      <Button variant="ghost" size="sm" onClick={handleEditIdentity} className="h-8 w-8 p-0">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">PAN Number</Label>
                      <p className="text-sm text-gray-900 dark:text-gray-100 mt-1 font-mono">{maskValue(employee.panNumber)}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Aadhar Number</Label>
                      <p className="text-sm text-gray-900 dark:text-gray-100 mt-1 font-mono">{maskValue(employee.aadharNumber)}</p>
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Passport Number</Label>
                      <p className="text-sm text-gray-900 dark:text-gray-100 mt-1 font-mono">{maskValue(employee.passportNumber)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Addresses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border border-gray-200 dark:border-gray-700 shadow-sm rounded-lg">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg font-semibold">Current Address</CardTitle>
                      {isOwnProfile && (
                        <Button variant="ghost" size="sm" onClick={handleEditAddress} className="h-8 w-8 p-0">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {employee.currentAddress.street}<br />
                      {employee.currentAddress.city}, {employee.currentAddress.state}<br />
                      {employee.currentAddress.pincode}<br />
                      {employee.currentAddress.country}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200 dark:border-gray-700 shadow-sm rounded-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold">Permanent Address</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {employee.permanentAddress.street}<br />
                      {employee.permanentAddress.city}, {employee.permanentAddress.state}<br />
                      {employee.permanentAddress.pincode}<br />
                      {employee.permanentAddress.country}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Projects */}
              <Card className="border border-gray-200 dark:border-gray-700 shadow-sm rounded-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold">Projects</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {employee.projects.map((project, index) => (
                      <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 dark:text-gray-100">{project.name}</span>
                              <Badge variant={project.status === 'Active' ? 'default' : 'secondary'} className="text-xs">
                                {project.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{project.role}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {formatDate(project.startDate)} - {project.endDate ? formatDate(project.endDate) : 'Present'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* JOB TAB */}
            <TabsContent value="job" className="mt-6 space-y-6">
              {/* Job Details */}
              <Card className="border border-gray-200 dark:border-gray-700 shadow-sm rounded-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-semibold">Job Details</CardTitle>
                    {isOwnProfile && (
                      <Button variant="ghost" size="sm" onClick={handleEditJob} className="h-8 w-8 p-0">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Designation</Label>
                      <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">{employee.designation}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Department</Label>
                      <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">{employee.department}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Employment Type</Label>
                      <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">{employee.employmentType}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Notice Period</Label>
                      <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">{employee.noticePeriod}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Organization */}
              <Card className="border border-gray-200 dark:border-gray-700 shadow-sm rounded-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold">Organization</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Business Unit</Label>
                      <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">{employee.businessUnit}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Location</Label>
                      <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">{employee.location}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Reporting Manager</Label>
                      <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">{employee.reportingManager?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Dotted Line Manager</Label>
                      <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">{employee.dottedLineManager?.name || 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Employee Time */}
              <Card className="border border-gray-200 dark:border-gray-700 shadow-sm rounded-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold">Employee Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Date of Joining</Label>
                      <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">{formatDate(employee.dateOfJoining)}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Probation End</Label>
                      <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">{formatDate(employee.probationEndDate)}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Confirmation Date</Label>
                      <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">{formatDate(employee.confirmationDate)}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Experience</Label>
                      <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                        {(() => {
                          const joiningDate = new Date(employee.dateOfJoining);
                          const today = new Date();
                          const diffTime = Math.abs(today.getTime() - joiningDate.getTime());
                          const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
                          const diffMonths = Math.floor((diffTime % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
                          return `${diffYears} years, ${diffMonths} months`;
                        })()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ASSETS TAB */}
            <TabsContent value="assets" className="mt-6 space-y-6">
              <Card className="border border-gray-200 dark:border-gray-700 shadow-sm rounded-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold">Assigned Assets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide pb-3">Asset Name</th>
                          <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide pb-3">Type</th>
                          <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide pb-3">Serial Number</th>
                          <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide pb-3">Status</th>
                          <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide pb-3">Date Issued</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {employee.assets.map((asset, index) => (
                          <tr key={index} className="hover:bg-gray-50 transition-colors">
                            <td className="py-3 text-sm text-gray-900 dark:text-gray-100">{asset.name}</td>
                            <td className="py-3 text-sm text-gray-700 dark:text-gray-300">{asset.type}</td>
                            <td className="py-3 text-sm text-gray-700 dark:text-gray-300 font-mono">{asset.serialNumber}</td>
                            <td className="py-3">
                              <Badge variant={asset.status === 'Active' ? 'default' : 'secondary'} className="text-xs">
                                {asset.status}
                              </Badge>
                            </td>
                            <td className="py-3 text-sm text-gray-700 dark:text-gray-300">{formatDate(asset.dateIssued)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* RIGHT COLUMN - Summary Panel (30%) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Profile Header Card */}
          <Card className="border border-gray-200 dark:border-gray-700 shadow-sm rounded-lg sticky top-6">
            <CardContent className="p-6">
              {/* Profile Picture */}
              <div className="flex flex-col items-center">
                <div className="relative h-24 w-24 rounded-full bg-primary flex items-center justify-center overflow-hidden group mb-4">
                  {employee.photo ? (
                    <img src={employee.photo} alt={employee.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-white">{employee.name?.charAt(0)}</span>
                  )}
                  {isOwnProfile && (
                    <>
                      <input
                        type="file"
                        id="photo-upload-sidebar"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        disabled={uploadingPhoto}
                      />
                      <label
                        htmlFor="photo-upload-sidebar"
                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <Camera className="h-6 w-6 text-white" />
                      </label>
                      {uploadingPhoto && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </>
                  )}
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-center">{employee.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-1">{employee.designation}</p>
                <Badge variant={employee.status === 'Active' ? 'default' : 'secondary'} className="mt-2">
                  {employee.status}
                </Badge>
              </div>

              {/* Personal Info */}
              <div className="mt-6 space-y-3 border-t pt-4">
                <div className="flex items-start gap-2">
                  <Mail className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100 truncate">{employee.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{employee.phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Location</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{employee.location}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Date of Birth</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{formatDate(employee.dateOfBirth)}</p>
                  </div>
                </div>
              </div>

              {/* Management */}
              <div className="mt-6 space-y-3 border-t pt-4">
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Management</h4>
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Reporting Manager</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{employee.reportingManager?.name || 'N/A'}</p>
                  </div>
                </div>
                {employee.dottedLineManager && (
                  <div className="flex items-start gap-2">
                    <Users className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Dotted Line Manager</p>
                      <p className="text-sm text-gray-900 dark:text-gray-100">{employee.dottedLineManager.name}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Bank Information */}
              {employee.bankDetails && (
                <div className="mt-6 space-y-3 border-t pt-4">
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-2">
                    <Landmark className="h-4 w-4" />
                    Bank Information
                  </h4>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Bank Name</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{employee.bankDetails.bankName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Account Number</p>
                    <p className="text-sm text-gray-900 font-mono">{maskValue(employee.bankDetails.accountNumber)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">IFSC Code</p>
                    <p className="text-sm text-gray-900 font-mono">{employee.bankDetails.ifscCode}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">PAN</p>
                    <p className="text-sm text-gray-900 font-mono">{maskValue(employee.panNumber)}</p>
                  </div>
                </div>
              )}

              {/* Education / Experience */}
              {employee.previousExperience && employee.previousExperience.length > 0 && (
                <div className="mt-6 space-y-3 border-t pt-4">
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Previous Experience
                  </h4>
                  {employee.previousExperience.slice(0, 3).map((exp, index) => (
                    <div key={index} className="pb-3 border-b border-gray-100 last:border-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{exp.designation}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{exp.company}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{exp.duration}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialogs */}
      {/* Summary Edit Dialog */}
      <Dialog open={editSummaryOpen} onOpenChange={setEditSummaryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Summary</DialogTitle>
            <DialogDescription>Update your professional summary</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={summaryForm}
              onChange={(e) => setSummaryForm(e.target.value)}
              rows={6}
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSummaryOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveSummary}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contact Edit Dialog */}
      <Dialog open={editContactOpen} onOpenChange={setEditContactOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Contact Details</DialogTitle>
            <DialogDescription>Update your contact information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="personalEmail">Personal Email</Label>
              <Input
                id="personalEmail"
                type="email"
                value={contactForm.personalEmail}
                onChange={(e) => setContactForm({ ...contactForm, personalEmail: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="workPhone">Work Phone</Label>
              <Input
                id="workPhone"
                value={contactForm.workPhone}
                onChange={(e) => setContactForm({ ...contactForm, workPhone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="emergencyContact">Emergency Contact</Label>
              <Input
                id="emergencyContact"
                value={contactForm.emergencyContact}
                onChange={(e) => setContactForm({ ...contactForm, emergencyContact: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditContactOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveContact}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Primary Details Edit Dialog */}
      <Dialog open={editPrimaryOpen} onOpenChange={setEditPrimaryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Primary Details</DialogTitle>
            <DialogDescription>Update your primary information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="gender">Gender</Label>
              <Select value={primaryForm.gender} onValueChange={(value) => setPrimaryForm({ ...primaryForm, gender: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={primaryForm.dateOfBirth}
                onChange={(e) => setPrimaryForm({ ...primaryForm, dateOfBirth: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="maritalStatus">Marital Status</Label>
              <Select value={primaryForm.maritalStatus} onValueChange={(value) => setPrimaryForm({ ...primaryForm, maritalStatus: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Single">Single</SelectItem>
                  <SelectItem value="Married">Married</SelectItem>
                  <SelectItem value="Divorced">Divorced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="bloodGroup">Blood Group</Label>
              <Input
                id="bloodGroup"
                value={primaryForm.bloodGroup}
                onChange={(e) => setPrimaryForm({ ...primaryForm, bloodGroup: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="nationality">Nationality</Label>
              <Input
                id="nationality"
                value={primaryForm.nationality}
                onChange={(e) => setPrimaryForm({ ...primaryForm, nationality: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPrimaryOpen(false)}>Cancel</Button>
            <Button onClick={handleSavePrimary}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Identity Edit Dialog */}
      <Dialog open={editIdentityOpen} onOpenChange={setEditIdentityOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Identity Information</DialogTitle>
            <DialogDescription>Update your identity documents</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="panNumber">PAN Number</Label>
              <Input
                id="panNumber"
                value={identityForm.panNumber}
                onChange={(e) => setIdentityForm({ ...identityForm, panNumber: e.target.value.toUpperCase() })}
                maxLength={10}
              />
            </div>
            <div>
              <Label htmlFor="aadharNumber">Aadhar Number</Label>
              <Input
                id="aadharNumber"
                value={identityForm.aadharNumber}
                onChange={(e) => setIdentityForm({ ...identityForm, aadharNumber: e.target.value })}
                maxLength={12}
              />
            </div>
            <div>
              <Label htmlFor="passportNumber">Passport Number</Label>
              <Input
                id="passportNumber"
                value={identityForm.passportNumber}
                onChange={(e) => setIdentityForm({ ...identityForm, passportNumber: e.target.value.toUpperCase() })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditIdentityOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveIdentity}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Address Edit Dialog */}
      <Dialog open={editAddressOpen} onOpenChange={setEditAddressOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Address</DialogTitle>
            <DialogDescription>Update your current and permanent address</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto">
            <div>
              <h4 className="font-medium mb-3">Current Address</h4>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="currentStreet">Street</Label>
                  <Input
                    id="currentStreet"
                    value={addressForm.currentAddress.street}
                    onChange={(e) => setAddressForm({ ...addressForm, currentAddress: { ...addressForm.currentAddress, street: e.target.value } })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="currentCity">City</Label>
                    <Input
                      id="currentCity"
                      value={addressForm.currentAddress.city}
                      onChange={(e) => setAddressForm({ ...addressForm, currentAddress: { ...addressForm.currentAddress, city: e.target.value } })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="currentState">State</Label>
                    <Input
                      id="currentState"
                      value={addressForm.currentAddress.state}
                      onChange={(e) => setAddressForm({ ...addressForm, currentAddress: { ...addressForm.currentAddress, state: e.target.value } })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="currentPincode">Pincode</Label>
                    <Input
                      id="currentPincode"
                      value={addressForm.currentAddress.pincode}
                      onChange={(e) => setAddressForm({ ...addressForm, currentAddress: { ...addressForm.currentAddress, pincode: e.target.value } })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="currentCountry">Country</Label>
                    <Input
                      id="currentCountry"
                      value={addressForm.currentAddress.country}
                      onChange={(e) => setAddressForm({ ...addressForm, currentAddress: { ...addressForm.currentAddress, country: e.target.value } })}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-3">Permanent Address</h4>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="permanentStreet">Street</Label>
                  <Input
                    id="permanentStreet"
                    value={addressForm.permanentAddress.street}
                    onChange={(e) => setAddressForm({ ...addressForm, permanentAddress: { ...addressForm.permanentAddress, street: e.target.value } })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="permanentCity">City</Label>
                    <Input
                      id="permanentCity"
                      value={addressForm.permanentAddress.city}
                      onChange={(e) => setAddressForm({ ...addressForm, permanentAddress: { ...addressForm.permanentAddress, city: e.target.value } })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="permanentState">State</Label>
                    <Input
                      id="permanentState"
                      value={addressForm.permanentAddress.state}
                      onChange={(e) => setAddressForm({ ...addressForm, permanentAddress: { ...addressForm.permanentAddress, state: e.target.value } })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="permanentPincode">Pincode</Label>
                    <Input
                      id="permanentPincode"
                      value={addressForm.permanentAddress.pincode}
                      onChange={(e) => setAddressForm({ ...addressForm, permanentAddress: { ...addressForm.permanentAddress, pincode: e.target.value } })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="permanentCountry">Country</Label>
                    <Input
                      id="permanentCountry"
                      value={addressForm.permanentAddress.country}
                      onChange={(e) => setAddressForm({ ...addressForm, permanentAddress: { ...addressForm.permanentAddress, country: e.target.value } })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditAddressOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAddress}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Job Edit Dialog */}
      <Dialog open={editJobOpen} onOpenChange={setEditJobOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Job Details</DialogTitle>
            <DialogDescription>Update your employment information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="employmentType">Employment Type</Label>
              <Select value={jobForm.employmentType} onValueChange={(value) => setJobForm({ ...jobForm, employmentType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Full-Time">Full-Time</SelectItem>
                  <SelectItem value="Part-Time">Part-Time</SelectItem>
                  <SelectItem value="Contract">Contract</SelectItem>
                  <SelectItem value="Intern">Intern</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="noticePeriod">Notice Period</Label>
              <Input
                id="noticePeriod"
                value={jobForm.noticePeriod}
                onChange={(e) => setJobForm({ ...jobForm, noticePeriod: e.target.value })}
                placeholder="e.g., 30 days, 60 days"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditJobOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveJob}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
