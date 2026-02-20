import { useAuthStore } from '@/store/authStore';
import { useAttendanceStore } from '@/store/attendanceStore';
import { useAnnouncementStore } from '@/store/announcementStore';
import { useHolidayStore } from '@/store/holidayStore';
import { useEmployeeStore } from '@/store/employeeStore';
import { useLeaveStore } from '@/store/leaveStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Calendar, Clock, TrendingUp, FileText, Users, CalendarDays, Plane, LogIn, LogOut, Megaphone, Cake, Gift, UserPlus, Heart, MessageCircle, Send, Plus, Flame, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Sparkles, Tag, BadgeCheck, Eye, Share2, Pin, BarChart3, CheckCircle2, Pencil, AlertCircle } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { AddHolidayModal } from '@/components/modals/AddHolidayModal';
import { EditHolidayModal } from '@/components/modals/EditHolidayModal';
import { HolidaysDialog } from '@/components/modals/HolidaysDialog';
import { EmployeeCard } from '@/components/dashboard/EmployeeCard';
import { getAvatarGradient } from '@/constants/design-system';
import type { Holiday } from '@/store/holidayStore';

export function HRDashboard() {
  const navigate = useNavigate();
  const [hoveredEmployee, setHoveredEmployee] = useState<string | null>(null);
  const user = useAuthStore((state) => state.user);
  const { checkIn, checkOut, getTodayRecord } = useAttendanceStore();
  const todayRecord = getTodayRecord(user?.employeeId || '');

  // Store data
  const announcements = useAnnouncementStore((state) => state.announcements);
  const { toggleLike, addComment: addAnnouncementComment, fetchAnnouncements, addReaction } = useAnnouncementStore();
  const isLoadingAnnouncements = useAnnouncementStore((state) => state.isLoading);
  const announcementError = useAnnouncementStore((state) => state.error);
  const { fetchHolidays } = useHolidayStore();
  const allHolidays = useHolidayStore((state) => state.holidays);
  const { employees, fetchEmployees, getBirthdays, getAnniversaries, getNewJoiners } = useEmployeeStore();
  const leaves = useLeaveStore((state) => state.leaves);
  const [showAllHolidaysModal, setShowAllHolidaysModal] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    fetchAnnouncements();
    fetchHolidays();
    fetchEmployees();
  }, [fetchAnnouncements, fetchHolidays, fetchEmployees]);

  // Modal states
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [showEditHolidayModal, setShowEditHolidayModal] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);
  
  // Holiday navigation state
  const selectedYear = new Date().getFullYear(); // Fixed to current year
  const [currentHolidayIndex, setCurrentHolidayIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [indexInitialized, setIndexInitialized] = useState(false);

  // Get all holidays for the selected year, sorted by date
  const yearHolidays = useMemo(() => {
    return (allHolidays || [])
      .filter(holiday => {
        const holidayYear = new Date(holiday.date).getFullYear();
        return holidayYear === selectedYear;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [allHolidays, selectedYear]);

  // Smart default index logic
  const getDefaultHolidayIndex = useMemo(() => {
    if (yearHolidays.length === 0) return 0;
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // 1. Check if today is a holiday
    const todayHolidayIndex = yearHolidays.findIndex(holiday => 
      holiday.date === todayStr
    );
    if (todayHolidayIndex !== -1) {
      return todayHolidayIndex;
    }
    
    // 2. Find next upcoming holiday
    const upcomingHolidayIndex = yearHolidays.findIndex(holiday => {
      const holidayDate = new Date(holiday.date);
      return holidayDate > today;
    });
    if (upcomingHolidayIndex !== -1) {
      return upcomingHolidayIndex;
    }
    
    // 3. Fallback to first holiday of the year
    return 0;
  }, [yearHolidays]);

  // Initialize holiday index based on the computed default
  if (!indexInitialized && yearHolidays.length > 0) {
    setCurrentHolidayIndex(getDefaultHolidayIndex);
    setIndexInitialized(true);
  }

  const handleEditHoliday = (holiday: Holiday) => {
    setSelectedHoliday(holiday);
    setShowEditHolidayModal(true);
  };

  // Holiday navigation functions with boundary handling
  const handlePrevHoliday = () => {
    if (isTransitioning || yearHolidays.length <= 1 || currentHolidayIndex <= 0) return;
    setIsTransitioning(true);
    setCurrentHolidayIndex(prev => prev - 1);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const handleNextHoliday = () => {
    if (isTransitioning || yearHolidays.length <= 1 || currentHolidayIndex >= yearHolidays.length - 1) return;
    setIsTransitioning(true);
    setCurrentHolidayIndex(prev => prev + 1);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  // Navigation state helpers
  const isPrevDisabled = currentHolidayIndex <= 0 || yearHolidays.length <= 1;
  const isNextDisabled = currentHolidayIndex >= yearHolidays.length - 1 || yearHolidays.length <= 1;

  // Format holiday date with day name
  const formatHolidayDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const teamLeaves = leaves.filter(l => l.status === 'approved');
  const birthdays = getBirthdays();
  const anniversaries = getAnniversaries();
  const newJoiners = getNewJoiners();

  const formatLeaveDate = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (startDate === endDate) {
      return format(start, 'MMM dd, yyyy');
    }
    return `${format(start, 'MMM dd')} - ${format(end, 'MMM dd, yyyy')}`;
  };

  const [newComment, setNewComment] = useState<Record<number, string>>({});
  const [expandedPosts, setExpandedPosts] = useState<Record<number, boolean>>({});
  const [showReactionPicker, setShowReactionPicker] = useState<number | null>(null);
  const [reactionDialogOpen, setReactionDialogOpen] = useState(false);
  const [selectedAnnouncementReactions, setSelectedAnnouncementReactions] = useState<{ id: number; title: string } | null>(null);
  const [activeReactionTab, setActiveReactionTab] = useState('all');
  
  // Poll voters drawer state
  const [pollVotersDrawerOpen, setPollVotersDrawerOpen] = useState(false);
  const [selectedPollData, setSelectedPollData] = useState<{
    pollTitle: string;
    options: Array<{ id: string; text: string; voters: string[]; votes: number }>;
    isAnonymous: boolean;
    totalVotes: number;
  } | null>(null);
  const [activePollTab, setActivePollTab] = useState('option-0');
  
  // Get current user ID - prioritize authenticated user's employeeId
  const currentUserId = user?.employeeId || user?.email || 'anonymous';
  const pollStorageKey = `pollVotes_${currentUserId}`;

  // Compute initial poll state based on announcements data
  const initialPollState = useMemo(() => {
    const alreadyVoted: Record<number, boolean> = {};
    const userSelections: Record<number, string[]> = {};
    
    // Load from user-specific localStorage
    const savedVotes = JSON.parse(localStorage.getItem(pollStorageKey) || '{}');
    
    announcements.forEach(announcement => {
      if (announcement.isPoll && announcement.pollOptions) {
        // Check if THIS user has voted by looking at votedBy arrays
        const votedOptions: string[] = [];
        announcement.pollOptions.forEach(option => {
          if (option.votedBy && option.votedBy.includes(currentUserId)) {
            votedOptions.push(option.id);
          }
        });
        
        // Only mark as voted if THIS user's ID is in votedBy
        if (votedOptions.length > 0) {
          alreadyVoted[announcement.id] = true;
          userSelections[announcement.id] = votedOptions;
        } else if (savedVotes[announcement.id]) {
          // Fallback to user-specific localStorage
          alreadyVoted[announcement.id] = true;
          userSelections[announcement.id] = savedVotes[announcement.id];
        }
      }
    });
    
    return { alreadyVoted, userSelections };
  }, [announcements, currentUserId, pollStorageKey]);

  const [selectedPollOptions, setSelectedPollOptions] = useState<Record<number, string[]>>({});
  const [submittedPolls, setSubmittedPolls] = useState<Record<number, boolean>>({});
  const [pollStateInitialized, setPollStateInitialized] = useState(false);
  
  // Sync initial poll state when announcements load (only once)
  if (!pollStateInitialized && Object.keys(initialPollState.alreadyVoted).length > 0) {
    setSubmittedPolls(initialPollState.alreadyVoted);
    setSelectedPollOptions(initialPollState.userSelections);
    setPollStateInitialized(true);
  }

  // Poll option selection handler (before submit)
  const handlePollOptionSelect = (announcementId: number, optionId: string) => {
    const currentSelections = selectedPollOptions[announcementId] || [];
    const announcement = announcements.find(a => a.id === announcementId);
    
    if (!announcement?.isPoll || submittedPolls[announcementId]) return;
    
    if (announcement.allowMultipleAnswers) {
      // Toggle selection for multiple choice
      if (currentSelections.includes(optionId)) {
        setSelectedPollOptions(prev => ({
          ...prev,
          [announcementId]: currentSelections.filter(id => id !== optionId)
        }));
      } else {
        setSelectedPollOptions(prev => ({
          ...prev,
          [announcementId]: [...currentSelections, optionId]
        }));
      }
    } else {
      // Single choice - replace selection
      setSelectedPollOptions(prev => ({
        ...prev,
        [announcementId]: [optionId]
      }));
    }
  };

  // Submit poll vote
  const handlePollSubmit = (announcementId: number) => {
    const selections = selectedPollOptions[announcementId] || [];
    if (selections.length === 0) return;
    
    // Update vote counts in the store with THIS user's ID
    useAnnouncementStore.getState().votePoll(announcementId, selections, currentUserId);
    
    // Save to user-specific localStorage for persistence
    const savedVotes = JSON.parse(localStorage.getItem(pollStorageKey) || '{}');
    savedVotes[announcementId] = selections;
    localStorage.setItem(pollStorageKey, JSON.stringify(savedVotes));
    
    setSubmittedPolls(prev => ({ ...prev, [announcementId]: true }));
  };

  const hasSubmittedPoll = (announcementId: number) => {
    return submittedPolls[announcementId] || false;
  };

  const hasSelections = (announcementId: number) => {
    return (selectedPollOptions[announcementId] || []).length > 0;
  };

  const isOptionSelected = (announcementId: number, optionId: string) => {
    return (selectedPollOptions[announcementId] || []).includes(optionId);
  };

  // Show poll voters drawer with all options (HR feature)
  const showPollVoters = (announcement: typeof announcements[0]) => {
    if (!announcement.pollOptions) return;
    
    const options = announcement.pollOptions.map(opt => ({
      id: opt.id,
      text: opt.text,
      voters: opt.votedBy || [],
      votes: opt.votes || 0
    }));
    
    setSelectedPollData({
      pollTitle: announcement.title,
      options,
      isAnonymous: announcement.isAnonymous || false,
      totalVotes: announcement.totalVotes || options.reduce((sum, o) => sum + o.votes, 0)
    });
    setActivePollTab('option-0');
    setPollVotersDrawerOpen(true);
  };

  // Get employee name from employeeId
  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => e.employeeId === employeeId || e._id === employeeId);
    return employee?.name || employeeId;
  };

  // Emoji reactions configuration
  const reactionEmojis = [
    { emoji: '👍', label: 'Like', color: 'text-primary' },
    { emoji: '❤️', label: 'Love', color: 'text-destructive' },
    { emoji: '🎉', label: 'Celebrate', color: 'text-yellow-500' },
    { emoji: '👏', label: 'Applause', color: 'text-primary' },
    { emoji: '🔥', label: 'Fire', color: 'text-orange-500' },
  ];

  // Category colors configuration
  const categoryColors: Record<string, string> = {
    general: 'bg-muted text-muted-foreground',
    policy: 'bg-primary/10 text-primary',
    event: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    announcement: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    hr: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
    urgent: 'bg-destructive/10 text-destructive',
    celebration: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  };

  const toggleExpand = (postId: number) => {
    setExpandedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Sort announcements: pinned first, then by date
  const sortedAnnouncements = useMemo(() => {
    if (!announcements) return [];
    return [...announcements].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [announcements]);

  // Helper function to check if announcement/poll is expired
  const isExpired = (announcement: typeof announcements[0]) => {
    const now = new Date();
    if (announcement.expiresAt) {
      return new Date(announcement.expiresAt) < now;
    }
    if (announcement.isPoll && announcement.pollExpiresAt) {
      return new Date(announcement.pollExpiresAt) < now;
    }
    return false;
  };

  const handleLike = (postId: number) => {
    if (!user?.employeeId) return;
    toggleLike(postId, user.employeeId);
  };

  // Handle adding a reaction with emoji
  const handleReaction = (postId: number, emoji: string, label: string) => {
    if (!user?.employeeId) return;
    addReaction(postId, user.employeeId, user.name || 'Unknown', emoji, label);
  };

  // Show reactions dialog
  const handleShowReactions = (announcementId: number, title: string) => {
    setSelectedAnnouncementReactions({ id: announcementId, title });
    setReactionDialogOpen(true);
  };

  // Get reactions for selected announcement
  const getSelectedAnnouncementReactions = () => {
    if (!selectedAnnouncementReactions) return [];
    const announcement = announcements.find(a => a.id === selectedAnnouncementReactions.id);
    return announcement?.reactions || [];
  };

  // Group reactions by emoji for display
  const groupReactionsByEmoji = (reactions: Array<{ emoji: string; label: string; userName: string; timestamp: string }>) => {
    const grouped: Record<string, { emoji: string; label: string; users: Array<{ userName: string; timestamp: string }> }> = {};
    reactions.forEach(r => {
      if (!grouped[r.emoji]) {
        grouped[r.emoji] = { emoji: r.emoji, label: r.label, users: [] };
      }
      grouped[r.emoji].users.push({ userName: r.userName, timestamp: r.timestamp });
    });
    return Object.values(grouped);
  };

  const handleAddComment = (postId: number) => {
    const commentText = newComment[postId]?.trim();
    if (!commentText || !user?.employeeId) return;

    addAnnouncementComment(postId, {
      author: user.name || 'You',
      text: commentText,
      time: 'Just now'
    });

    setNewComment(prev => ({ ...prev, [postId]: '' }));
  };

  const stats = [
    { label: 'Total Employees', value: employees.filter(emp => emp.status === 'active').length.toString(), icon: Users, color: 'text-primary' },
    { label: 'Pending Leaves', value: leaves.filter(l => l.status === 'pending').length.toString(), icon: Calendar, color: 'text-orange-600 dark:text-orange-400' },
    { label: 'Open Positions', value: '8', icon: FileText, color: 'text-primary' },
    { label: 'Attrition Rate', value: '3.2%', icon: TrendingUp, color: 'text-destructive' },
  ];

  const leaveBalances = [
    { type: 'Approved Leaves', balance: leaves.filter(l => l.status === 'approved').length, total: 60 },
    { type: 'Pending Approvals', balance: leaves.filter(l => l.status === 'pending').length, total: 15 },
    { type: 'Rejected Requests', balance: leaves.filter(l => l.status === 'rejected').length, total: 10 },
    { type: 'On Leave Today', balance: 8, total: 20 },
  ];

  // Separate today's and upcoming birthdays (already done by the store)
  const todayBirthdays = birthdays.filter(b => b.isToday);
  const upcomingBirthdays = birthdays.filter(b => b.isUpcoming);

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="relative overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
              <div className="absolute inset-0 bg-primary/5 dark:bg-primary/10" />
              <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
                <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-background/80 flex items-center justify-center shadow-sm">
                  <Icon className={`h-4 w-4 ${stat.color} group-hover:scale-110 transition-transform`} />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 2-Column Layout: 4 cols (left) + 8 cols (right) */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* LEFT COLUMN - 4 columns */}
        <div className="lg:col-span-4 space-y-8 animate-in slide-in-from-left-6 duration-500">
          {/* Holiday Calendar - Enhanced */}
          <Card className="overflow-hidden transition-all duration-300 hover:shadow-xl border-2">
            <CardHeader className="bg-primary/5 dark:bg-primary/10">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">
                    Holidays
                  </CardTitle>
                  <CardDescription className="mt-1">Upcoming company holidays</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllHolidaysModal(true)}
                    className="text-xs hover:bg-primary/10 dark:hover:bg-primary/20 text-primary font-medium"
                  >
                    View All
                  </Button>
                  <Button onClick={() => setShowHolidayModal(true)} size="sm" className="bg-primary hover:bg-primary/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {yearHolidays.length === 0 ? (
                <div className="text-center py-12 bg-muted/20 rounded-xl">
                  <div className="flex flex-col items-center justify-center h-full">
                    <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground font-medium">No upcoming holidays</p>
                    <p className="text-xs text-muted-foreground mt-1">Add holidays to see them here</p>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  {/* Navigation Arrows */}
                  {yearHolidays.length > 1 && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handlePrevHoliday}
                        disabled={isTransitioning || isPrevDisabled}
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 h-8 w-8 p-0 hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleNextHoliday}
                        disabled={isTransitioning || isNextDisabled}
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 h-8 w-8 p-0 hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </>
                  )}

                  {/* Holiday Card with Transition */}
                  <div className={`transition-all duration-300 ease-in-out ${isTransitioning ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}>
                    {(() => {
                      const holiday = yearHolidays[currentHolidayIndex];
                      if (!holiday) return null;
                      const holidayDate = new Date(holiday.date);
                      const today = new Date();
                      const daysUntil = Math.ceil((holidayDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                      const isToday = daysUntil === 0;
                      
                      const getHolidayTheme = (type: string) => {
                        const typeStr = type.toLowerCase();
                        if (typeStr.includes('public')) {
                          return { bg: 'bg-blue-50 dark:bg-blue-950/30', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' };
                        } else if (typeStr.includes('national')) {
                          return { bg: 'bg-orange-50 dark:bg-orange-950/30', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300' };
                        } else if (typeStr.includes('company')) {
                          return { bg: 'bg-emerald-50 dark:bg-emerald-950/30', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' };
                        } else if (typeStr.includes('regional')) {
                          return { bg: 'bg-purple-50 dark:bg-purple-950/30', badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' };
                        } else if (typeStr.includes('optional')) {
                          return { bg: 'bg-cyan-50 dark:bg-cyan-950/30', badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300' };
                        } else if (typeStr.includes('floating')) {
                          return { bg: 'bg-pink-50 dark:bg-pink-950/30', badge: 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300' };
                        } else {
                          return { bg: 'bg-gray-50 dark:bg-gray-950/30', badge: 'bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-300' };
                        }
                      };
                      
                      const theme = isToday 
                        ? { bg: 'bg-gradient-to-br from-orange-100 to-yellow-100 dark:from-orange-950/40 dark:to-yellow-950/40', badge: 'bg-orange-500 text-white' }
                        : getHolidayTheme(holiday.type);
                      
                      const hasBackgroundImage = holiday.backgroundImage && holiday.backgroundImage.length > 0;
                      
                      return (
                        <div 
                          className={`relative overflow-hidden rounded-2xl p-4 transition-all duration-300 hover:shadow-xl ${!hasBackgroundImage ? theme.bg : ''} `}
                          style={hasBackgroundImage ? {
                            backgroundImage: `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.2)), url(${holiday.backgroundImage})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            minHeight: '120px'
                          } : { minHeight: '120px' }}
                        >
                          {/* Today Badge */}
                          {isToday && (
                            <div className="absolute -top-2 -right-2 z-10">
                              <Badge className="bg-orange-500 text-white animate-pulse shadow-lg">
                                <Sparkles className="h-3 w-3 mr-1" />
                                Today! 🎉
                              </Badge>
                            </div>
                          )}
                          
                          <div className={`relative z-10 h-full flex flex-col justify-between ${hasBackgroundImage ? 'text-white' : ''}`}>
                            {/* Holiday Content */}
                            <div className="space-y-4">
                              {/* Holiday Name */}
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h3 className={`font-bold text-xl leading-tight ${hasBackgroundImage ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                    {holiday.name}
                                  </h3>
                                  <p className={`text-sm mt-2 font-medium ${hasBackgroundImage ? 'text-white/90' : 'text-gray-600 dark:text-gray-300'}`}>
                                    {formatHolidayDate(holiday.date)}
                                  </p>
                                </div>
                                
                                {/* Edit Button */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={`h-8 w-8 p-0 ${hasBackgroundImage ? 'text-white/80 hover:text-white hover:bg-white/20' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                                  onClick={() => handleEditHoliday(holiday)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              {/* Holiday Details */}
                              <div className="flex items-end justify-between">
                                <div className={`${hasBackgroundImage ? 'text-white/90' : 'text-gray-600 dark:text-gray-400'}`}>
                                  {daysUntil > 0 ? (
                                    <p className="text-sm font-medium text-white/90">
                                      {daysUntil === 1 ? 'Tomorrow' : `in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`}
                                    </p>
                                  ) : daysUntil === 0 ? (
                                    <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Today</p>
                                  ) : (
                                    <p className="text-sm font-medium opacity-70 text-white/90">Past holiday</p>
                                  )}
                                </div>
                                
                                <Badge 
                                  variant="secondary" 
                                  className={`${
                                    hasBackgroundImage 
                                      ? 'bg-white/20 text-white border-white/30 backdrop-blur-sm' 
                                      : isToday 
                                        ? 'bg-orange-500 text-white' 
                                        : theme.badge
                                  }`}
                                >
                                  {holiday.type}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()} 
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Team Leave Details - Enhanced */}
          <Card className="overflow-hidden transition-all duration-300 hover:shadow-xl border-2">
            <CardHeader className="bg-purple-50 dark:bg-purple-950/30">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="text-primary">Team Leave Details</span>
                  </CardTitle>
                  <CardDescription className="mt-1">Team members on leave</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {teamLeaves.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">Everyone is in the office! 🎉</p>
                  </div>
                ) : (
                  teamLeaves.slice(0, 5).map((leave, index) => {
                    const leaveTypeColors: Record<string, string> = {
                      'Sick Leave': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                      'Casual Leave': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                      'Earned Leave': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                    };
                    const userName = (leave.userName || 'Unknown').split(' ');
                    const initials = userName.length > 1 ? `${userName[0][0]}${userName[1][0]}` : userName[0][0];
                    
                    return (
                      <div key={index} className="flex items-center gap-3 p-4 border rounded-lg hover:shadow-md transition-all bg-purple-50/30 dark:bg-purple-950/20">
                        <div className={`h-10 w-10 rounded-full ${getAvatarGradient(leave.userName || 'Unknown')} flex items-center justify-center text-white font-semibold shadow-md`}>
                          {initials}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-primary">{leave.userName}</p>
                          <p className="text-sm text-muted-foreground">{formatLeaveDate(leave.startDate, leave.endDate)}</p>
                        </div>
                        <Badge variant="outline" className={leaveTypeColors[leave.leaveType] || 'bg-muted text-muted-foreground'}>
                          {leave.leaveType}
                        </Badge>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Web Check-In - Enhanced */}
          <Card className="overflow-hidden transition-all duration-300 hover:shadow-xl border-2">
            <CardHeader className="bg-green-50 dark:bg-green-950/30">
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <LogIn className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-primary">Web Check-In</span>
              </CardTitle>
              <CardDescription className="mt-1">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  {!todayRecord?.checkIn || todayRecord?.checkOut ? (
                    <Button
                      size="lg"
                      className="w-full h-20 text-lg bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl transition-all"
                      onClick={() => checkIn(user?.employeeId || '')}
                    >
                      <Clock className="h-6 w-6 mr-3 animate-pulse" />
                      Check In Now
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full h-20 text-lg border-2 hover:bg-red-50 dark:hover:bg-red-950/20"
                      onClick={() => checkOut(user?.employeeId || '')}
                    >
                      <LogOut className="h-6 w-6 mr-3" />
                      Check Out
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border">
                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                    <Badge variant={
                      todayRecord?.checkOut
                        ? "secondary"
                        : todayRecord?.checkIn
                          ? "default"
                          : "outline"
                    } className="text-xs">
                      {todayRecord?.checkOut ? "Checked Out" : todayRecord?.checkIn ? "Checked In" : "Not Checked In"}
                    </Badge>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 border">
                    <p className="text-xs text-muted-foreground mb-1">Check-in Time</p>
                    <p className="text-sm font-semibold">{todayRecord?.checkIn || '--:--'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border">
                    <p className="text-xs text-muted-foreground mb-1">Total Hours</p>
                    <p className="text-sm font-semibold">{todayRecord?.effectiveHours || '0h'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950/30 border">
                    <p className="text-xs text-muted-foreground mb-1">This Week</p>
                    <p className="text-sm font-semibold">40h</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Leave Management Stats - Enhanced */}
          <Card className="overflow-hidden transition-all duration-300 hover:shadow-xl border-2">
            <CardHeader className="bg-orange-50 dark:bg-orange-950/30">
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Plane className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <span className="text-primary">Leave Statistics</span>
              </CardTitle>
              <CardDescription className="mt-1">Current leave overview</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-4 sm:grid-cols-2">
                {leaveBalances.map((leave) => (
                  <div key={leave.type} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{leave.type}</span>
                      <span className="text-sm text-muted-foreground">
                        {leave.balance}/{leave.total}
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-orange-500 h-2 rounded-full transition-all"
                        style={{ width: `${(leave.balance / leave.total) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN - 8 columns */}
        <div className="lg:col-span-8 space-y-8 animate-in slide-in-from-right-6 duration-500">
          {/* Employee Celebrations - Tabbed Component */}
          <Card className="overflow-hidden transition-all duration-300 hover:shadow-xl border-2">
            <CardHeader className="bg-pink-50 dark:bg-pink-950/30">
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-pink-500/10">
                  <Cake className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                </div>
                <span className="text-primary">Team Celebrations</span>
              </CardTitle>
              <CardDescription className="mt-1">Birthdays, anniversaries, and new team members</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs defaultValue="birthdays" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="birthdays" className="flex items-center gap-2">
                    <Cake className="h-4 w-4" />
                    Birthdays
                  </TabsTrigger>
                  <TabsTrigger value="anniversaries" className="flex items-center gap-2">
                    <Gift className="h-4 w-4" />
                    Anniversaries
                  </TabsTrigger>
                  <TabsTrigger value="newjoinees" className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    New Joinees
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="birthdays" className="space-y-6">
                  {/* Birthdays Today Section */}
                  {todayBirthdays.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                        Birthdays Today
                      </h3>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {todayBirthdays.map((person) => (
                          <EmployeeCard
                            key={person.id}
                            person={person}
                            type="birthday"
                            onHover={setHoveredEmployee}
                            isHovered={hoveredEmployee === person.id}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upcoming Birthdays Section */}
                  {upcomingBirthdays.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                        Upcoming Birthdays
                      </h3>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {upcomingBirthdays.map((person) => (
                          <EmployeeCard
                            key={person.id}
                            person={person}
                            type="birthday"
                            onHover={setHoveredEmployee}
                            isHovered={hoveredEmployee === person.id}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="anniversaries" className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {anniversaries.map((person) => (
                      <EmployeeCard
                        key={person.id}
                        person={person}
                        type="anniversary"
                        onHover={setHoveredEmployee}
                        isHovered={hoveredEmployee === person.id}
                      />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="newjoinees" className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {newJoiners.map((person) => (
                      <EmployeeCard
                        key={person.id}
                        person={person}
                        type="newjoinee"
                        onHover={setHoveredEmployee}
                        isHovered={hoveredEmployee === person.id}
                      />
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Company Announcements - Enhanced Social Style */}
          <Card className="overflow-hidden transition-all duration-300 hover:shadow-xl border-2">
            <CardHeader className="bg-indigo-50 dark:bg-indigo-950/30">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-indigo-500/10">
                      <Megaphone className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <span className="text-primary">HR Announcements</span>
                  </CardTitle>
                  <CardDescription className="mt-1">Latest updates and news for HR team</CardDescription>
                </div>
                <Button onClick={() => navigate('/new-announcement')} className="bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  New Announcement
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {isLoadingAnnouncements ? (
                <div className="text-center py-8">
                  <Megaphone className="h-12 w-12 mx-auto text-muted-foreground/30 mb-2 animate-pulse" />
                  <p className="text-sm text-muted-foreground">Loading announcements...</p>
                </div>
              ) : announcementError ? (
                <div className="text-center py-8">
                  <Megaphone className="h-12 w-12 mx-auto text-red-500/30 mb-2" />
                  <p className="text-sm text-red-500">Failed to load announcements</p>
                  <p className="text-xs text-muted-foreground mt-1">{announcementError}</p>
                </div>
              ) : !sortedAnnouncements || sortedAnnouncements.length === 0 ? (
                <div className="text-center py-8">
                  <Megaphone className="h-12 w-12 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No announcements yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Create your first announcement!</p>
                </div>
              ) : (
              sortedAnnouncements.map((announcement, index) => {
                const isLiked = user?.employeeId ? announcement.likedBy.includes(user.employeeId) : false;
                const isExpanded = expandedPosts[announcement.id] || false;
                const shouldTruncate = announcement.description.length > 150;
                const displayText = shouldTruncate && !isExpanded 
                  ? announcement.description.slice(0, 150) + '...' 
                  : announcement.description;
                const authorName = announcement.author || 'HR Team';
                const category = announcement.category || 'general';
                const expired = isExpired(announcement);

                return (
                <div 
                  key={announcement.id} 
                  className={`relative border-2 rounded-xl p-5 space-y-4 transition-all duration-300 hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-800 animate-in slide-in-from-bottom-4 ${expired ? 'opacity-60 border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-950/10' : ''}`}
                  style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'both' }}
                >
                  {/* Pinned Indicator */}
                  {announcement.isPinned && (
                    <div className="absolute -top-3 left-4 px-3 py-1 bg-amber-500 text-white text-xs font-medium rounded-full shadow-lg flex items-center gap-1">
                      <Pin className="h-3 w-3" />
                      Pinned
                    </div>
                  )}
                  
                  {/* Expired Indicator - Only visible to HR */}
                  {isExpired(announcement) && (
                    <div className="absolute -top-3 right-4 px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-full shadow-lg flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Expired
                    </div>
                  )}

                  {/* Social Media Style Header */}
                  <div className="flex items-start gap-3">
                    {/* Author Avatar */}
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarGradient(authorName)} flex items-center justify-center text-white font-semibold shadow-lg ring-2 ring-white dark:ring-gray-800`}>
                      {getInitials(authorName)}
                    </div>
                    
                    {/* Author Info & Meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-base truncate">{authorName}</span>
                        <BadgeCheck className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <span className="text-xs text-muted-foreground">• HR Team</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <Clock className="h-3 w-3" />
                        <span>{announcement.date}</span>
                        {announcement.views && (
                          <>
                            <span>•</span>
                            <Eye className="h-3 w-3" />
                            <span>{announcement.views} views</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Priority & Category Badges */}
                    <div className="flex flex-col gap-2 items-end">
                      <Badge
                        variant={
                          announcement.priority === 'high'
                            ? 'destructive'
                            : announcement.priority === 'medium'
                            ? 'default'
                            : 'secondary'
                        }
                        className="flex-shrink-0 capitalize"
                      >
                        {announcement.priority === 'high' && <Flame className="h-3 w-3 mr-1" />}
                        {announcement.priority}
                      </Badge>
                      {category && (
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${categoryColors[category] || categoryColors.general}`}
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {category}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Post Title */}
                  <h3 className="font-semibold text-lg leading-tight flex items-center gap-2">
                    {announcement.isPoll && <BarChart3 className="h-5 w-5 text-purple-600" />}
                    {announcement.title}
                  </h3>

                  {/* Poll Content */}
                  {announcement.isPoll && announcement.pollOptions ? (
                    <div className="space-y-3">
                      {/* Poll Options */}
                      <div className="space-y-2">
                        {announcement.pollOptions.map((option) => {
                          const totalVotes = announcement.totalVotes || announcement.pollOptions!.reduce((sum, o) => sum + (o.votes || 0), 0);
                          const percentage = totalVotes > 0 ? Math.round(((option.votes || 0) / totalVotes) * 100) : 0;
                          const isSelected = isOptionSelected(announcement.id, option.id);
                          const submitted = hasSubmittedPoll(announcement.id);
                          
                          return (
                            <div
                              key={option.id}
                              className={`relative overflow-hidden border-2 rounded-lg p-3 transition-all ${
                                submitted ? 'cursor-default' : 'cursor-pointer'
                              } ${
                                isSelected 
                                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30' 
                                  : 'border-border hover:border-purple-300 dark:hover:border-purple-700'
                              }`}
                              onClick={() => !submitted && handlePollOptionSelect(announcement.id, option.id)}
                            >
                              {/* Progress bar background - only show after submit */}
                              {submitted && (
                                <div 
                                  className="absolute inset-0 bg-purple-100 dark:bg-purple-900/20 transition-all duration-500"
                                  style={{ width: `${percentage}%` }}
                                />
                              )}
                              <div className="relative flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <div className={`w-5 h-5 border-2 flex items-center justify-center ${
                                    announcement.allowMultipleAnswers ? 'rounded' : 'rounded-full'
                                  } ${isSelected ? 'border-primary bg-primary' : 'border-border'}`}>
                                    {isSelected && <CheckCircle2 className="h-3 w-3 text-white" />}
                                  </div>
                                  <span className="text-sm font-medium">{option.text}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {submitted && (
                                    <span className="text-sm font-semibold text-purple-600">{percentage}%</span>
                                  )}
                                  {/* HR can click to see who voted for this option */}
                                  {(option.votes || 0) > 0 && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        showPollVoters(announcement);
                                        // Set the tab to this specific option
                                        const optionIndex = announcement.pollOptions?.findIndex(o => o.id === option.id) || 0;
                                        setActivePollTab(`option-${optionIndex}`);
                                      }}
                                      className="text-xs text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 underline flex items-center gap-1"
                                    >
                                      <Users className="h-3 w-3" />
                                      {option.votes} {option.votes === 1 ? 'vote' : 'votes'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Submit Button - only show if not submitted and has selections */}
                      {!hasSubmittedPoll(announcement.id) && (
                        <Button
                          onClick={() => handlePollSubmit(announcement.id)}
                          disabled={!hasSelections(announcement.id)}
                          className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                        >
                          Submit Vote
                        </Button>
                      )}
                      
                      {/* Poll Footer */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                        <button
                          onClick={() => showPollVoters(announcement)}
                          className="flex items-center gap-1 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 hover:underline"
                        >
                          <Users className="h-3 w-3" />
                          {announcement.totalVotes || 0} votes
                        </button>
                        <div className="flex items-center gap-2">
                          {announcement.isAnonymous && (
                            <Badge variant="outline" className="text-xs">Anonymous</Badge>
                          )}
                          {announcement.allowMultipleAnswers && (
                            <Badge variant="outline" className="text-xs">Multiple Choice</Badge>
                          )}
                          {announcement.pollExpiresAt && (
                            <span>Expires: {new Date(announcement.pollExpiresAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Regular Post Content with Read More/Less */}
                      <div className="text-sm leading-relaxed text-muted-foreground">
                        <p>{displayText}</p>
                        {shouldTruncate && (
                          <button
                            onClick={() => toggleExpand(announcement.id)}
                            className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium mt-1 inline-flex items-center gap-1"
                          >
                            {isExpanded ? (
                              <>Show less <ChevronUp className="h-4 w-4" /></>
                            ) : (
                              <>Read more <ChevronDown className="h-4 w-4" /></>
                            )}
                          </button>
                        )}
                      </div>

                      {/* Image if available */}
                      {announcement.imageUrl && (
                        <div className="rounded-xl overflow-hidden border-2 bg-muted/20">
                          <img 
                            src={announcement.imageUrl} 
                            alt={announcement.title}
                            className="w-full h-auto object-contain max-h-96"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </>
                  )}

                  {/* Engagement Stats Bar */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground py-2 border-y">
                    <button 
                      className="flex items-center gap-1 hover:underline cursor-pointer"
                      onClick={() => handleShowReactions(announcement.id, announcement.title)}
                    >
                      {announcement.reactions && announcement.reactions.length > 0 ? (
                        <>
                          <div className="flex -space-x-1">
                            {/* Show unique reaction emojis */}
                            {[...new Set(announcement.reactions.map(r => r.emoji))].slice(0, 3).map((emoji, idx) => (
                              <span 
                                key={idx} 
                                className="w-5 h-5 rounded-full bg-muted border border-background shadow-sm flex items-center justify-center text-[10px]"
                              >
                                {emoji}
                              </span>
                            ))}
                          </div>
                          <span className="ml-1 hover:text-primary">{announcement.reactions.length} reactions</span>
                        </>
                      ) : (
                        <>
                          <div className="flex -space-x-1">
                            <span className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-[10px]">❤️</span>
                            <span className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px]">👍</span>
                            <span className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center text-white text-[10px]">🎉</span>
                          </div>
                          <span className="ml-1">{announcement.likes} reactions</span>
                        </>
                      )}
                    </button>
                    <span>{announcement.comments.length} comments</span>
                  </div>

                  {/* Enhanced Engagement Section with Emoji Reactions */}
                  <div className="flex items-center gap-2 relative">
                    {/* Reaction Button with Picker */}
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`gap-2 hover:bg-muted/80 ${isLiked ? 'text-red-500' : ''}`}
                        onClick={() => handleLike(announcement.id)}
                        onMouseEnter={() => setShowReactionPicker(announcement.id)}
                        onMouseLeave={() => setShowReactionPicker(null)}
                      >
                        <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                        <span>React</span>
                      </Button>
                      
                      {/* Emoji Reaction Picker */}
                      {showReactionPicker === announcement.id && (
                        <div 
                          className="absolute bottom-full left-0 flex items-center gap-1 bg-card rounded-full shadow-xl border-2 px-2 py-1 animate-in fade-in slide-in-from-bottom-2 duration-200 z-10"
                          onMouseEnter={() => setShowReactionPicker(announcement.id)}
                          onMouseLeave={() => setShowReactionPicker(null)}
                        >
                          {reactionEmojis.map((reaction) => (
                            <button
                              key={reaction.label}
                              className="text-xl hover:scale-125 transition-transform p-1 hover:bg-muted rounded-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReaction(announcement.id, reaction.emoji, reaction.label);
                                setShowReactionPicker(null);
                              }}
                              title={reaction.label}
                            >
                              {reaction.emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <Button variant="ghost" size="sm" className="gap-2 hover:bg-muted/80">
                      <MessageCircle className="h-4 w-4" />
                      <span>Comment</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2 hover:bg-muted/80">
                      <Share2 className="h-4 w-4" />
                      <span>Share</span>
                    </Button>
                  </div>

                  {/* Comments Section - Enhanced */}
                  {announcement.comments.length > 0 && (
                    <div className="space-y-3 bg-muted/30 rounded-xl p-4">
                      {announcement.comments.slice(0, 2).map((comment) => (
                        <div key={comment.id} className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarGradient(comment.author)} flex items-center justify-center text-white text-xs font-semibold`}>
                            {getInitials(comment.author)}
                          </div>
                          <div className="flex-1 bg-card rounded-xl px-3 py-2 shadow-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm">{comment.author}</span>
                              <span className="text-muted-foreground text-xs">{comment.time}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">{comment.text}</p>
                          </div>
                        </div>
                      ))}
                      {announcement.comments.length > 2 && (
                        <button className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline ml-11">
                          View all {announcement.comments.length} comments
                        </button>
                      )}
                    </div>
                  )}

                  {/* Add Comment - Enhanced */}
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarGradient(user?.name || 'User')} flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}>
                      {getInitials(user?.name || 'User')}
                    </div>
                    <div className="flex-1 flex gap-2">
                      <Input
                        placeholder="Write a comment..."
                        value={newComment[announcement.id] || ''}
                        onChange={(e) => setNewComment(prev => ({ ...prev, [announcement.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleAddComment(announcement.id);
                          }
                        }}
                        className="flex-1 rounded-full bg-muted/50 border-0 focus-visible:ring-2 focus-visible:ring-indigo-500"
                      />
                      <Button
                        size="sm"
                        className="rounded-full bg-indigo-600 hover:bg-indigo-700"
                        onClick={() => handleAddComment(announcement.id)}
                        disabled={!newComment[announcement.id]?.trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                );
              }))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <AddHolidayModal
        open={showHolidayModal}
        onOpenChange={setShowHolidayModal}
      />

      <EditHolidayModal
        open={showEditHolidayModal}
        onOpenChange={setShowEditHolidayModal}
        holiday={selectedHoliday}
      />

      {/* All Holidays Modal - Modern Enterprise Style */}
      <HolidaysDialog
        open={showAllHolidaysModal}
        onOpenChange={setShowAllHolidaysModal}
        holidays={allHolidays}
        onEditHoliday={handleEditHoliday}
        showEditButton={true}
      />

      {/* Reactions Drawer */}
      <Sheet open={reactionDialogOpen} onOpenChange={setReactionDialogOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="pb-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Reactions
            </SheetTitle>
            <SheetDescription>
              {selectedAnnouncementReactions?.title || 'See who reacted to this post'}
            </SheetDescription>
          </SheetHeader>
          
          {getSelectedAnnouncementReactions().length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Heart className="h-16 w-16 mx-auto mb-3 opacity-20" />
              <p className="text-lg font-medium">No reactions yet</p>
              <p className="text-sm">Be the first to react!</p>
            </div>
          ) : (
            <div className="mt-4">
              {/* Reaction Tabs */}
              <Tabs value={activeReactionTab} onValueChange={setActiveReactionTab} className="w-full">
                <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
                  <TabsTrigger 
                    value="all" 
                    className="flex-1 min-w-[60px] data-[state=active]:bg-background"
                  >
                    All ({getSelectedAnnouncementReactions().length})
                  </TabsTrigger>
                  {groupReactionsByEmoji(getSelectedAnnouncementReactions()).map((group) => (
                    <TabsTrigger 
                      key={group.emoji} 
                      value={group.emoji}
                      className="flex-1 min-w-[50px] data-[state=active]:bg-background"
                    >
                      {group.emoji} {group.users.length}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {/* All Reactions Tab */}
                <TabsContent value="all" className="mt-4 space-y-2">
                  {getSelectedAnnouncementReactions().map((reaction, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarGradient(reaction.userName)} flex items-center justify-center text-white text-sm font-semibold`}>
                        {reaction.userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{reaction.userName}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(reaction.timestamp).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <span className="text-2xl">{reaction.emoji}</span>
                    </div>
                  ))}
                </TabsContent>
                
                {/* Individual Emoji Tabs */}
                {groupReactionsByEmoji(getSelectedAnnouncementReactions()).map((group) => (
                  <TabsContent key={group.emoji} value={group.emoji} className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                      <span className="text-3xl">{group.emoji}</span>
                      <span className="font-semibold text-lg">{group.label}</span>
                      <Badge variant="secondary" className="ml-auto">{group.users.length}</Badge>
                    </div>
                    {group.users.map((userReaction, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarGradient(userReaction.userName)} flex items-center justify-center text-white text-sm font-semibold`}>
                          {userReaction.userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{userReaction.userName}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(userReaction.timestamp).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Poll Voters Drawer - HR can see who voted for each option */}
      <Sheet open={pollVotersDrawerOpen} onOpenChange={setPollVotersDrawerOpen}>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Poll Voters
            </SheetTitle>
            <SheetDescription>
              {selectedPollData?.pollTitle}
            </SheetDescription>
          </SheetHeader>
          
          {selectedPollData && (
            <div className="mt-6">
              {/* Poll Summary */}
              <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Total Votes</span>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                    {selectedPollData?.totalVotes || 0}
                  </Badge>
                </div>
              </div>

              {selectedPollData?.isAnonymous ? (
                <div className="p-6 text-center bg-muted/30 rounded-lg">
                  <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">Anonymous Poll</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Voter identities are hidden for this poll.
                  </p>
                </div>
              ) : (
                <Tabs value={activePollTab} onValueChange={setActivePollTab} className="w-full">
                  <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
                    {selectedPollData?.options?.map((option, index) => (
                      <TabsTrigger 
                        key={option.id} 
                        value={`option-${index}`}
                        className="flex-1 min-w-[80px] text-xs py-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                      >
                        Option {index + 1}
                        <Badge variant="outline" className="ml-1 text-[10px] px-1">
                          {option.votes}
                        </Badge>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  {selectedPollData?.options?.map((option, index) => (
                    <TabsContent key={option.id} value={`option-${index}`} className="mt-4">
                      {/* Option Text */}
                      <div className="mb-4 p-3 bg-muted/30 rounded-lg border">
                        <p className="text-xs text-muted-foreground mb-1">Option {index + 1}</p>
                        <p className="font-semibold">{option.text}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {option.votes} {option.votes === 1 ? 'vote' : 'votes'}
                        </p>
                      </div>

                      {/* Voters List */}
                      {option.voters.length === 0 ? (
                        <div className="p-4 text-center bg-muted/30 rounded-lg">
                          <p className="text-sm text-muted-foreground">No votes for this option</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                          <p className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-3">
                            <Users className="h-4 w-4" />
                            {option.voters.length} {option.voters.length === 1 ? 'person' : 'people'} voted
                          </p>
                          {option.voters.map((voterId, voterIndex) => {
                            const voterName = getEmployeeName(voterId);
                            return (
                              <div 
                                key={voterIndex} 
                                className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                              >
                                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarGradient(voterName)} flex items-center justify-center text-white text-sm font-semibold`}>
                                  {voterName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{voterName}</p>
                                  <p className="text-xs text-muted-foreground">{voterId}</p>
                                </div>
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
