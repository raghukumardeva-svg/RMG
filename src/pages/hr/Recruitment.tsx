import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  UserPlus, 
  Users, 
  Search, 
  Filter,
  Briefcase,
  Calendar,
  Mail,
  Phone,
  FileText,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface JobPosition {
  id: number;
  title: string;
  department: string;
  location: string;
  employmentType: 'full-time' | 'part-time' | 'contract';
  experience: string;
  salary: string;
  openings: number;
  applicants: number;
  status: 'active' | 'closed' | 'on-hold';
  postedDate: string;
  description: string;
  requirements: string[];
}

interface Candidate {
  id: number;
  name: string;
  email: string;
  phone: string;
  position: string;
  experience: number;
  currentCompany: string;
  location: string;
  expectedSalary: string;
  stage: 'applied' | 'screening' | 'interview' | 'technical' | 'offered' | 'rejected' | 'hired';
  status: 'pending' | 'in-progress' | 'completed';
  appliedDate: string;
  resumeUrl?: string;
  skills: string[];
}

export function Recruitment() {
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');
  const [showJobDialog, setShowJobDialog] = useState(false);
  const [showCandidateDialog, setShowCandidateDialog] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  // Job form state
  const [jobForm, setJobForm] = useState({
    title: '',
    department: '',
    location: '',
    employmentType: 'full-time' as const,
    experience: '',
    salary: '',
    openings: 1,
    description: '',
    requirements: '',
  });

  // Mock job positions data
  const positions: JobPosition[] = [
    {
      id: 1,
      title: 'Senior Frontend Developer',
      department: 'Engineering',
      location: 'Bangalore',
      employmentType: 'full-time',
      experience: '5-8 years',
      salary: '$80k - $120k',
      openings: 2,
      applicants: 45,
      status: 'active',
      postedDate: '2025-12-15',
      description: 'We are looking for an experienced Frontend Developer to join our team.',
      requirements: ['React', 'TypeScript', 'Tailwind CSS', '5+ years experience'],
    },
    {
      id: 2,
      title: 'Product Manager',
      department: 'Product',
      location: 'Mumbai',
      employmentType: 'full-time',
      experience: '3-5 years',
      salary: '$70k - $100k',
      openings: 1,
      applicants: 32,
      status: 'active',
      postedDate: '2025-12-10',
      description: 'Product Manager to lead product strategy and execution.',
      requirements: ['Product Management', 'Agile', 'Leadership', '3+ years experience'],
    },
    {
      id: 3,
      title: 'DevOps Engineer',
      department: 'Engineering',
      location: 'Pune',
      employmentType: 'full-time',
      experience: '4-7 years',
      salary: '$75k - $110k',
      openings: 3,
      applicants: 28,
      status: 'active',
      postedDate: '2025-12-08',
      description: 'DevOps Engineer to manage infrastructure and CI/CD pipelines.',
      requirements: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', '4+ years experience'],
    },
    {
      id: 4,
      title: 'UI/UX Designer',
      department: 'Design',
      location: 'Remote',
      employmentType: 'full-time',
      experience: '2-4 years',
      salary: '$60k - $90k',
      openings: 2,
      applicants: 56,
      status: 'active',
      postedDate: '2025-12-05',
      description: 'Creative UI/UX Designer to create amazing user experiences.',
      requirements: ['Figma', 'Adobe XD', 'User Research', '2+ years experience'],
    },
  ];

  // Mock candidates data
  const candidates: Candidate[] = [
    {
      id: 1,
      name: 'Alice Cooper',
      email: 'alice.cooper@email.com',
      phone: '+91 98765 43210',
      position: 'Senior Frontend Developer',
      experience: 6,
      currentCompany: 'Tech Corp',
      location: 'Bangalore',
      expectedSalary: '$100k',
      stage: 'interview',
      status: 'in-progress',
      appliedDate: '2025-12-20',
      skills: ['React', 'TypeScript', 'Node.js', 'AWS'],
    },
    {
      id: 2,
      name: 'Bob Wilson',
      email: 'bob.wilson@email.com',
      phone: '+91 98765 43211',
      position: 'Product Manager',
      experience: 4,
      currentCompany: 'Product Inc',
      location: 'Mumbai',
      expectedSalary: '$85k',
      stage: 'offered',
      status: 'pending',
      appliedDate: '2025-12-18',
      skills: ['Product Management', 'Agile', 'Analytics', 'Leadership'],
    },
    {
      id: 3,
      name: 'Carol Martinez',
      email: 'carol.m@email.com',
      phone: '+91 98765 43212',
      position: 'DevOps Engineer',
      experience: 5,
      currentCompany: 'Cloud Systems',
      location: 'Pune',
      expectedSalary: '$90k',
      stage: 'technical',
      status: 'in-progress',
      appliedDate: '2025-12-22',
      skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform'],
    },
    {
      id: 4,
      name: 'David Brown',
      email: 'david.b@email.com',
      phone: '+91 98765 43213',
      position: 'UI/UX Designer',
      experience: 3,
      currentCompany: 'Design Studio',
      location: 'Remote',
      expectedSalary: '$75k',
      stage: 'screening',
      status: 'pending',
      appliedDate: '2025-12-25',
      skills: ['Figma', 'UI Design', 'Prototyping', 'User Research'],
    },
    {
      id: 5,
      name: 'Emma Johnson',
      email: 'emma.j@email.com',
      phone: '+91 98765 43214',
      position: 'Senior Frontend Developer',
      experience: 7,
      currentCompany: 'Web Solutions',
      location: 'Bangalore',
      expectedSalary: '$110k',
      stage: 'hired',
      status: 'completed',
      appliedDate: '2025-12-10',
      skills: ['React', 'Vue.js', 'TypeScript', 'GraphQL'],
    },
  ];

  // Get unique departments
  const departments = useMemo(() => {
    const depts = positions.map(p => p.department);
    return ['all', ...Array.from(new Set(depts))];
  }, []);

  // Calculate statistics
  const stats = useMemo(() => {
    const openPositions = positions.filter(p => p.status === 'active').length;
    const totalApplicants = positions.reduce((sum, p) => sum + p.applicants, 0);
    const offersCount = candidates.filter(c => c.stage === 'offered').length;
    const hiredCount = candidates.filter(c => c.stage === 'hired').length;
    const inInterviewCount = candidates.filter(c => c.stage === 'interview' || c.stage === 'technical').length;

    return {
      openPositions,
      totalApplicants,
      offersCount,
      hiredCount,
      inInterviewCount,
    };
  }, [candidates]);

  // Filter candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter(candidate => {
      const matchesSearch = candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           candidate.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           candidate.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDepartment = departmentFilter === 'all' || 
                               positions.find(p => p.title === candidate.position)?.department === departmentFilter;
      const matchesStage = stageFilter === 'all' || candidate.stage === stageFilter;
      
      return matchesSearch && matchesDepartment && matchesStage;
    });
  }, [candidates, searchQuery, departmentFilter, stageFilter]);

  const getStageBadge = (stage: Candidate['stage']) => {
    const variants = {
      applied: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
      screening: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
      interview: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
      technical: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
      offered: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
      rejected: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
      hired: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
    };

    const labels = {
      applied: 'Applied',
      screening: 'Screening',
      interview: 'Interview',
      technical: 'Technical',
      offered: 'Offered',
      rejected: 'Rejected',
      hired: 'Hired',
    };

    return (
      <Badge variant="outline" className={variants[stage]}>
        {labels[stage]}
      </Badge>
    );
  };

  const getStatusBadge = (status: JobPosition['status']) => {
    const variants = {
      active: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
      closed: 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400',
      'on-hold': 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
    };

    return (
      <Badge variant="outline" className={variants[status]}>
        {status}
      </Badge>
    );
  };

  const handleViewCandidate = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setShowCandidateDialog(true);
  };

  const handleCreateJob = () => {
    if (!jobForm.title || !jobForm.department) {
      toast.error('Please fill all required fields');
      return;
    }

    toast.success('Job posting created successfully');
    setShowJobDialog(false);
    setJobForm({
      title: '',
      department: '',
      location: '',
      employmentType: 'full-time',
      experience: '',
      salary: '',
      openings: 1,
      description: '',
      requirements: '',
    });
  };

  const handleCandidateAction = (action: 'shortlist' | 'reject' | 'schedule') => {
    const actions = {
      shortlist: 'Candidate shortlisted for next round',
      reject: 'Candidate application rejected',
      schedule: 'Interview scheduled successfully',
    };

    toast.success(actions[action]);
    setShowCandidateDialog(false);
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">
            <Briefcase className="h-7 w-7 text-primary" />
            Recruitment
          </h1>
          <p className="page-description">Manage job openings and candidate pipeline</p>
        </div>
        <Button onClick={() => setShowJobDialog(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Post New Job
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Open Positions</CardTitle>
            <Briefcase className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openPositions}</div>
            <p className="text-xs text-muted-foreground">Active postings</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Applicants</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalApplicants}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">In Interview</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.inInterviewCount}</div>
            <p className="text-xs text-muted-foreground">Active interviews</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Offers Made</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.offersCount}</div>
            <p className="text-xs text-muted-foreground">Pending acceptance</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Hired</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.hiredCount}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="candidates">
        <TabsList>
          <TabsTrigger value="candidates">Candidates</TabsTrigger>
          <TabsTrigger value="positions">Open Positions</TabsTrigger>
          <TabsTrigger value="pipeline">Hiring Pipeline</TabsTrigger>
        </TabsList>

        {/* Candidates Tab */}
        <TabsContent value="candidates" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Candidate Applications</CardTitle>
                  <CardDescription>
                    {filteredCandidates.length} candidates
                  </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search candidates..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 w-full sm:w-64"
                    />
                  </div>
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger className="w-full sm:w-40">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map(dept => (
                        <SelectItem key={dept} value={dept}>
                          {dept === 'all' ? 'All Departments' : dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={stageFilter} onValueChange={setStageFilter}>
                    <SelectTrigger className="w-full sm:w-32">
                      <SelectValue placeholder="Stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Stages</SelectItem>
                      <SelectItem value="applied">Applied</SelectItem>
                      <SelectItem value="screening">Screening</SelectItem>
                      <SelectItem value="interview">Interview</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="offered">Offered</SelectItem>
                      <SelectItem value="hired">Hired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Candidate</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Experience</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Expected Salary</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCandidates.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No candidates found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCandidates.map((candidate) => (
                        <TableRow key={candidate.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{candidate.name}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {candidate.email}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">{candidate.position}</p>
                            <p className="text-xs text-muted-foreground">{candidate.currentCompany}</p>
                          </TableCell>
                          <TableCell className="text-sm">{candidate.experience} years</TableCell>
                          <TableCell className="text-sm flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {candidate.location}
                          </TableCell>
                          <TableCell className="text-sm">{candidate.expectedSalary}</TableCell>
                          <TableCell>{getStageBadge(candidate.stage)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewCandidate(candidate)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Open Positions Tab */}
        <TabsContent value="positions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Openings</CardTitle>
              <CardDescription>Current active job postings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {positions.map((position) => (
                  <div key={position.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{position.title}</h3>
                          {getStatusBadge(position.status)}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-2">
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-4 w-4" />
                            {position.department}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {position.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {position.experience}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {position.salary}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{position.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center gap-4">
                        <Badge variant="secondary">
                          {position.openings} opening{position.openings > 1 ? 's' : ''}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {position.applicants} applicants
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Posted: {new Date(position.postedDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Users className="h-4 w-4 mr-1" />
                          Candidates
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pipeline Tab */}
        <TabsContent value="pipeline" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Screening</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {candidates.filter(c => c.stage === 'screening' || c.stage === 'applied').map((candidate) => (
                    <div key={candidate.id} className="p-3 border rounded-lg text-sm">
                      <p className="font-medium">{candidate.name}</p>
                      <p className="text-xs text-muted-foreground">{candidate.position}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Interview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {candidates.filter(c => c.stage === 'interview' || c.stage === 'technical').map((candidate) => (
                    <div key={candidate.id} className="p-3 border rounded-lg text-sm bg-orange-50 dark:bg-orange-900/10">
                      <p className="font-medium">{candidate.name}</p>
                      <p className="text-xs text-muted-foreground">{candidate.position}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Offer / Hired</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {candidates.filter(c => c.stage === 'offered' || c.stage === 'hired').map((candidate) => (
                    <div key={candidate.id} className="p-3 border rounded-lg text-sm bg-green-50 dark:bg-green-900/10">
                      <p className="font-medium">{candidate.name}</p>
                      <p className="text-xs text-muted-foreground">{candidate.position}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Job Dialog */}
      <Dialog open={showJobDialog} onOpenChange={setShowJobDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Post New Job</DialogTitle>
            <DialogDescription>Create a new job posting</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="job-title">Job Title *</Label>
              <Input
                id="job-title"
                placeholder="e.g., Senior Software Engineer"
                value={jobForm.title}
                onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                className="mt-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="job-department">Department *</Label>
                <Input
                  id="job-department"
                  placeholder="e.g., Engineering"
                  value={jobForm.department}
                  onChange={(e) => setJobForm({ ...jobForm, department: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="job-location">Location</Label>
                <Input
                  id="job-location"
                  placeholder="e.g., Bangalore"
                  value={jobForm.location}
                  onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                  className="mt-2"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="job-type">Employment Type</Label>
                <Select value={jobForm.employmentType} onValueChange={(value: any) => setJobForm({ ...jobForm, employmentType: value })}>
                  <SelectTrigger id="job-type" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full Time</SelectItem>
                    <SelectItem value="part-time">Part Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="job-experience">Experience</Label>
                <Input
                  id="job-experience"
                  placeholder="e.g., 3-5 years"
                  value={jobForm.experience}
                  onChange={(e) => setJobForm({ ...jobForm, experience: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="job-openings">Openings</Label>
                <Input
                  id="job-openings"
                  type="number"
                  min="1"
                  value={jobForm.openings}
                  onChange={(e) => setJobForm({ ...jobForm, openings: parseInt(e.target.value) })}
                  className="mt-2"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="job-salary">Salary Range</Label>
              <Input
                id="job-salary"
                placeholder="e.g., $80k - $120k"
                value={jobForm.salary}
                onChange={(e) => setJobForm({ ...jobForm, salary: e.target.value })}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="job-description">Job Description</Label>
              <Textarea
                id="job-description"
                placeholder="Describe the role and responsibilities..."
                value={jobForm.description}
                onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                rows={4}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="job-requirements">Requirements (one per line)</Label>
              <Textarea
                id="job-requirements"
                placeholder="List key requirements and qualifications..."
                value={jobForm.requirements}
                onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })}
                rows={4}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowJobDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateJob}>Post Job</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Candidate Details Dialog */}
      <Dialog open={showCandidateDialog} onOpenChange={setShowCandidateDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Candidate Profile</DialogTitle>
            <DialogDescription>Complete candidate information</DialogDescription>
          </DialogHeader>
          {selectedCandidate && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-semibold">{selectedCandidate.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Applied For</p>
                  <p className="font-semibold">{selectedCandidate.position}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    Email
                  </p>
                  <p className="font-semibold text-sm">{selectedCandidate.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    Phone
                  </p>
                  <p className="font-semibold">{selectedCandidate.phone}</p>
                </div>
              </div>

              {/* Professional Info */}
              <div className="space-y-3">
                <h3 className="font-semibold">Professional Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Experience</p>
                    <p className="font-medium">{selectedCandidate.experience} years</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Company</p>
                    <p className="font-medium">{selectedCandidate.currentCompany}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{selectedCandidate.location}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Expected Salary</p>
                    <p className="font-medium">{selectedCandidate.expectedSalary}</p>
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div>
                <h3 className="font-semibold mb-2">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedCandidate.skills.map((skill, idx) => (
                    <Badge key={idx} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </div>

              {/* Application Status */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Application Status</p>
                  {getStageBadge(selectedCandidate.stage)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Applied on: {new Date(selectedCandidate.appliedDate).toLocaleDateString()}
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => handleCandidateAction('reject')}
                  className="text-red-600"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleCandidateAction('schedule')}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Interview
                </Button>
                <Button onClick={() => handleCandidateAction('shortlist')}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Shortlist
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
