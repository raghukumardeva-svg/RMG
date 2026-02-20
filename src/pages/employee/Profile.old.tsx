import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Briefcase,
  MapPin,
  Building2,
  User,
  Clock,
  TrendingUp,
  FileText,
  Laptop,
  CreditCard,
  Globe,
  Home,
  Users,
  Pencil,
  Camera
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { profileService } from '@/services/profileService';
import { toast } from 'sonner';

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
}

interface ProfileProps {
  employeeId?: string;
  isDialog?: boolean;
}

export function Profile({ employeeId: propEmployeeId, isDialog = false }: ProfileProps) {
  const user = useAuthStore((state) => state.user);
  const [employee, setEmployee] = useState<EmployeeProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !targetEmployeeId) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploadingPhoto(true);
    try {
      // Convert to base64 for local storage/display
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        await profileService.updateSection(targetEmployeeId, 'photo', { photo: base64String });
        setEmployee(prev => prev ? { ...prev, photo: base64String } : null);
        
        // Update auth store if it's the user's own profile
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

  const isOwnProfile = !propEmployeeId || propEmployeeId === user?.employeeId;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Profile not found</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isDialog ? '' : ''}`}>
      {/* Profile Header Card */}
      <Card className="overflow-hidden">
        <div className="bg-primary h-32" />
        <CardContent className="relative pb-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-16">
            <div className="relative h-32 w-32 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center overflow-hidden group">
              {employee.photo ? (
                <img src={employee.photo} alt={employee.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-primary">{employee.name?.charAt(0)}</span>
              )}
              {isOwnProfile && (
                <>
                  <input
                    type="file"
                    id="photo-upload"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={uploadingPhoto}
                  />
                  <label
                    htmlFor="photo-upload"
                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Camera className="h-8 w-8 text-white" />
                  </label>
                  {uploadingPhoto && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="flex-1 md:pb-2">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <h1 className="text-2xl font-medium text-card-foreground">{employee.name}</h1>
                  <p className="text-base text-muted-foreground">{employee.designation}</p>
                </div>
                <Badge variant={employee.status === 'Active' ? 'default' : 'secondary'}>
                  {employee.status}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-6 pt-6 border-t">
            <QuickInfoItem icon={<Mail className="h-4 w-4" />} label="Email" value={employee.email} />
            <QuickInfoItem icon={<Phone className="h-4 w-4" />} label="Phone" value={employee.phone} />
            <QuickInfoItem icon={<Briefcase className="h-4 w-4" />} label="Department" value={employee.department} />
            <QuickInfoItem icon={<MapPin className="h-4 w-4" />} label="Location" value={employee.location} />
            <QuickInfoItem icon={<Calendar className="h-4 w-4" />} label="DOB" value={formatDate(employee.dateOfBirth)} />
            <QuickInfoItem icon={<Building2 className="h-4 w-4" />} label="Business Unit" value={employee.businessUnit} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
            <QuickInfoItem icon={<User className="h-4 w-4" />} label="Reporting Manager" value={employee.reportingManager?.name || 'N/A'} />
            <QuickInfoItem icon={<Users className="h-4 w-4" />} label="Dotted Line Manager" value={employee.dottedLineManager?.name || 'N/A'} />
          </div>
        </CardContent>
      </Card>

      {/* Tabs Section */}
      <Tabs defaultValue="about" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="about">ABOUT</TabsTrigger>
          <TabsTrigger value="profile">PROFILE</TabsTrigger>
          <TabsTrigger value="job">JOB</TabsTrigger>
          <TabsTrigger value="assets">ASSETS</TabsTrigger>
        </TabsList>

        {/* ABOUT Tab */}
        <TabsContent value="about" className="space-y-6 mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Summary
              </CardTitle>
              {isOwnProfile && (
                <Button variant="ghost" size="sm" onClick={handleEditSummary}>
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">{employee.summary}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employee.timeline.map((event, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`h-3 w-3 rounded-full ${getTimelineColor(event.type)}`} />
                      {index < employee.timeline.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-200 mt-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{event.event}</span>
                        <Badge variant="outline" className="text-xs">
                          {formatDate(event.date)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PROFILE Tab */}
        <TabsContent value="profile" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Details
                </CardTitle>
                {isOwnProfile && (
                  <Button variant="ghost" size="sm" onClick={handleEditContact}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow label="Work Email" value={employee.email} />
                <InfoRow label="Personal Email" value={employee.personalEmail} />
                <InfoRow label="Work Phone" value={employee.workPhone} />
                <InfoRow label="Mobile" value={employee.phone} />
                <InfoRow label="Emergency Contact" value={employee.emergencyContact} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Primary Details
                </CardTitle>
                {isOwnProfile && (
                  <Button variant="ghost" size="sm" onClick={handleEditPrimary}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow label="Employee ID" value={employee.employeeId} />
                <InfoRow label="Gender" value={employee.gender} />
                <InfoRow label="Date of Birth" value={formatDate(employee.dateOfBirth)} />
                <InfoRow label="Marital Status" value={employee.maritalStatus} />
                <InfoRow label="Blood Group" value={employee.bloodGroup} />
                <InfoRow label="Nationality" value={employee.nationality} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Identity Information
                </CardTitle>
                {isOwnProfile && (
                  <Button variant="ghost" size="sm" onClick={handleEditIdentity}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow label="PAN Number" value={maskValue(employee.panNumber)} />
                <InfoRow label="Aadhar Number" value={maskValue(employee.aadharNumber)} />
                <InfoRow label="Passport Number" value={maskValue(employee.passportNumber)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {employee.projects.map((project, index) => (
                    <div key={index} className="p-3 bg-muted-color/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{project.name}</span>
                        <Badge variant={project.status === 'Active' ? 'default' : 'secondary'}>
                          {project.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{project.role}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(project.startDate)} - {project.endDate ? formatDate(project.endDate) : 'Present'}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Current Address
                </CardTitle>
                {isOwnProfile && (
                  <Button variant="ghost" size="sm" onClick={handleEditAddress}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  {employee.currentAddress.street}<br />
                  {employee.currentAddress.city}, {employee.currentAddress.state}<br />
                  {employee.currentAddress.pincode}<br />
                  {employee.currentAddress.country}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Permanent Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  {employee.permanentAddress.street}<br />
                  {employee.permanentAddress.city}, {employee.permanentAddress.state}<br />
                  {employee.permanentAddress.pincode}<br />
                  {employee.permanentAddress.country}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Previous Experience
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employee.previousExperience.map((exp, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{exp.company}</span>
                        <p className="text-sm text-muted-foreground">{exp.designation}</p>
                      </div>
                      <Badge variant="outline">{exp.duration}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDate(exp.from)} - {formatDate(exp.to)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* JOB Tab */}
        <TabsContent value="job" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Job Details
                </CardTitle>
                {isOwnProfile && (
                  <Button variant="ghost" size="sm" onClick={handleEditJob}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow label="Designation" value={employee.designation} />
                <InfoRow label="Department" value={employee.department} />
                <InfoRow label="Employment Type" value={employee.employmentType} />
                <InfoRow label="Notice Period" value={employee.noticePeriod} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Organization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow label="Business Unit" value={employee.businessUnit} />
                <InfoRow label="Location" value={employee.location} />
                <InfoRow label="Reporting Manager" value={employee.reportingManager?.name || 'N/A'} />
                <InfoRow label="Dotted Line Manager" value={employee.dottedLineManager?.name || 'N/A'} />
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Employee Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-muted-color/50 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">Date of Joining</p>
                    <p className="font-medium mt-1">{formatDate(employee.dateOfJoining)}</p>
                  </div>
                  <div className="p-4 bg-muted-color/50 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">Probation End</p>
                    <p className="font-medium mt-1">{formatDate(employee.probationEndDate)}</p>
                  </div>
                  <div className="p-4 bg-muted-color/50 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">Confirmation Date</p>
                    <p className="font-medium mt-1">{formatDate(employee.confirmationDate)}</p>
                  </div>
                  <div className="p-4 bg-muted-color/50 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">Total Experience</p>
                    <p className="font-medium mt-1">{calculateTenure(employee.dateOfJoining)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ASSETS Tab */}
        <TabsContent value="assets" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Laptop className="h-5 w-5" />
                Assigned Assets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Asset Name</th>
                      <th className="text-left py-3 px-4 font-medium">Type</th>
                      <th className="text-left py-3 px-4 font-medium">Serial Number</th>
                      <th className="text-left py-3 px-4 font-medium">Status</th>
                      <th className="text-left py-3 px-4 font-medium">Date Issued</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employee.assets.map((asset, index) => (
                      <tr key={index} className="border-b last:border-0">
                        <td className="py-3 px-4">{asset.name}</td>
                        <td className="py-3 px-4 text-muted-foreground">{asset.type}</td>
                        <td className="py-3 px-4 font-mono text-sm">{asset.serialNumber}</td>
                        <td className="py-3 px-4">
                          <Badge variant={asset.status === 'Active' ? 'default' : 'secondary'}>
                            {asset.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{formatDate(asset.dateIssued)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {employee.assets.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No assets assigned</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Summary Dialog */}
      <Dialog open={editSummaryOpen} onOpenChange={setEditSummaryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Summary</DialogTitle>
            <DialogDescription>Update your professional summary</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={summaryForm}
              onChange={(e) => setSummaryForm(e.target.value)}
              rows={6}
              placeholder="Write about yourself..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSummaryOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveSummary}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Contact Dialog */}
      <Dialog open={editContactOpen} onOpenChange={setEditContactOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Contact Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Personal Email</Label>
              <Input value={contactForm.personalEmail} onChange={(e) => setContactForm({ ...contactForm, personalEmail: e.target.value })} />
            </div>
            <div>
              <Label>Work Phone</Label>
              <Input value={contactForm.workPhone} onChange={(e) => setContactForm({ ...contactForm, workPhone: e.target.value })} />
            </div>
            <div>
              <Label>Emergency Contact</Label>
              <Input value={contactForm.emergencyContact} onChange={(e) => setContactForm({ ...contactForm, emergencyContact: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditContactOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveContact}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Primary Details Dialog */}
      <Dialog open={editPrimaryOpen} onOpenChange={setEditPrimaryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Primary Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Gender</Label>
              <Select value={primaryForm.gender} onValueChange={(v) => setPrimaryForm({ ...primaryForm, gender: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date of Birth</Label>
              <Input type="date" value={primaryForm.dateOfBirth} onChange={(e) => setPrimaryForm({ ...primaryForm, dateOfBirth: e.target.value })} />
            </div>
            <div>
              <Label>Marital Status</Label>
              <Select value={primaryForm.maritalStatus} onValueChange={(v) => setPrimaryForm({ ...primaryForm, maritalStatus: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Single">Single</SelectItem>
                  <SelectItem value="Married">Married</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Blood Group</Label>
              <Input value={primaryForm.bloodGroup} onChange={(e) => setPrimaryForm({ ...primaryForm, bloodGroup: e.target.value })} />
            </div>
            <div>
              <Label>Nationality</Label>
              <Input value={primaryForm.nationality} onChange={(e) => setPrimaryForm({ ...primaryForm, nationality: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPrimaryOpen(false)}>Cancel</Button>
            <Button onClick={handleSavePrimary}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Identity Dialog */}
      <Dialog open={editIdentityOpen} onOpenChange={setEditIdentityOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Identity Information</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>PAN Number</Label>
              <Input value={identityForm.panNumber} onChange={(e) => setIdentityForm({ ...identityForm, panNumber: e.target.value })} />
            </div>
            <div>
              <Label>Aadhar Number</Label>
              <Input value={identityForm.aadharNumber} onChange={(e) => setIdentityForm({ ...identityForm, aadharNumber: e.target.value })} />
            </div>
            <div>
              <Label>Passport Number</Label>
              <Input value={identityForm.passportNumber} onChange={(e) => setIdentityForm({ ...identityForm, passportNumber: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditIdentityOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveIdentity}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Address Dialog */}
      <Dialog open={editAddressOpen} onOpenChange={setEditAddressOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Address</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Current Address</h4>
              <div>
                <Label>Street</Label>
                <Input value={addressForm.currentAddress.street} onChange={(e) => setAddressForm({ ...addressForm, currentAddress: { ...addressForm.currentAddress, street: e.target.value } })} />
              </div>
              <div>
                <Label>City</Label>
                <Input value={addressForm.currentAddress.city} onChange={(e) => setAddressForm({ ...addressForm, currentAddress: { ...addressForm.currentAddress, city: e.target.value } })} />
              </div>
              <div>
                <Label>State</Label>
                <Input value={addressForm.currentAddress.state} onChange={(e) => setAddressForm({ ...addressForm, currentAddress: { ...addressForm.currentAddress, state: e.target.value } })} />
              </div>
              <div>
                <Label>Pincode</Label>
                <Input value={addressForm.currentAddress.pincode} onChange={(e) => setAddressForm({ ...addressForm, currentAddress: { ...addressForm.currentAddress, pincode: e.target.value } })} />
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-medium">Permanent Address</h4>
              <div>
                <Label>Street</Label>
                <Input value={addressForm.permanentAddress.street} onChange={(e) => setAddressForm({ ...addressForm, permanentAddress: { ...addressForm.permanentAddress, street: e.target.value } })} />
              </div>
              <div>
                <Label>City</Label>
                <Input value={addressForm.permanentAddress.city} onChange={(e) => setAddressForm({ ...addressForm, permanentAddress: { ...addressForm.permanentAddress, city: e.target.value } })} />
              </div>
              <div>
                <Label>State</Label>
                <Input value={addressForm.permanentAddress.state} onChange={(e) => setAddressForm({ ...addressForm, permanentAddress: { ...addressForm.permanentAddress, state: e.target.value } })} />
              </div>
              <div>
                <Label>Pincode</Label>
                <Input value={addressForm.permanentAddress.pincode} onChange={(e) => setAddressForm({ ...addressForm, permanentAddress: { ...addressForm.permanentAddress, pincode: e.target.value } })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditAddressOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAddress}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Job Dialog */}
      <Dialog open={editJobOpen} onOpenChange={setEditJobOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Job Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Employment Type</Label>
              <Select value={jobForm.employmentType} onValueChange={(v) => setJobForm({ ...jobForm, employmentType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Full Time">Full Time</SelectItem>
                  <SelectItem value="Part Time">Part Time</SelectItem>
                  <SelectItem value="Contract">Contract</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notice Period</Label>
              <Select value={jobForm.noticePeriod} onValueChange={(v) => setJobForm({ ...jobForm, noticePeriod: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="30 days">30 days</SelectItem>
                  <SelectItem value="60 days">60 days</SelectItem>
                  <SelectItem value="90 days">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditJobOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveJob}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Export a dialog wrapper for viewing team member profiles
export function ProfileViewDialog({
  employeeId,
  open,
  onOpenChange
}: {
  employeeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <Profile employeeId={employeeId} isDialog={true} />
      </DialogContent>
    </Dialog>
  );
}

// Helper Components
function QuickInfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

// Helper Functions
function formatDate(dateString: string): string {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
}

function maskValue(value: string): string {
  if (!value) return 'N/A';
  if (value.length <= 4) return value;
  return '••••' + value.slice(-4);
}

function getTimelineColor(type: string): string {
  switch (type) {
    case 'joining': return 'bg-green-500';
    case 'promotion': return 'bg-blue-500';
    case 'transfer': return 'bg-orange-100 dark:bg-orange-900/10';
    case 'recognition': return 'bg-purple-500';
    default: return 'bg-gray-400';
  }
}

function calculateTenure(joiningDate: string): string {
  if (!joiningDate) return 'N/A';
  const start = new Date(joiningDate);
  const now = new Date();
  const years = now.getFullYear() - start.getFullYear();
  const months = now.getMonth() - start.getMonth();

  if (years === 0) {
    return `${months} months`;
  } else if (months < 0) {
    return `${years - 1} years ${12 + months} months`;
  }
  return `${years} years ${months} months`;
}
