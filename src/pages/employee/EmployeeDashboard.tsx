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
import { Users, CalendarDays, Plane, LogIn, LogOut, Megaphone, Cake, Gift, UserPlus, Heart, MessageCircle, Send, Clock, Pin, Bookmark, Timer, Zap, AlertCircle, CheckCircle2, Calendar, Flame, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Sparkles, Tag, BadgeCheck, Eye, Share2, BarChart3, Mail } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { EmployeeCard } from '@/components/dashboard/EmployeeCard';
import { HolidaysDialog } from '@/components/modals/HolidaysDialog';
import { getAvatarGradient } from '@/constants/design-system';

export function EmployeeDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { checkIn, checkOut, getTodayRecord } = useAttendanceStore();
  const announcements = useAnnouncementStore((state) => state.announcements);
  const { toggleLike, addComment: addAnnouncementComment, fetchAnnouncements, addReaction } = useAnnouncementStore();
  const isLoadingAnnouncements = useAnnouncementStore((state) => state.isLoading);
  const announcementError = useAnnouncementStore((state) => state.error);
  const { fetchHolidays } = useHolidayStore();
  const allHolidays = useHolidayStore((state) => state.holidays);
  const { fetchEmployees, getBirthdays, getAnniversaries, getNewJoiners } = useEmployeeStore();
  const leaves = useLeaveStore((state) => state.leaves) || [];
  const leaveBalance = useLeaveStore((state) => state.leaveBalance);
  const fetchLeaveBalance = useLeaveStore((state) => state.fetchLeaveBalance);
  const [hoveredEmployee, setHoveredEmployee] = useState<string | null>(null);
  const [showAllHolidaysModal, setShowAllHolidaysModal] = useState(false);
  
  // Holiday navigation state
  const selectedYear = new Date().getFullYear(); // Fixed to current year
  const [currentHolidayIndex, setCurrentHolidayIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [indexInitialized, setIndexInitialized] = useState(false);

  // Get all holidays for the selected year, sorted by date
  const yearHolidays = useMemo(() => {
    return allHolidays
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

  // Fetch data on component mount
  useEffect(() => {
    fetchAnnouncements();
    fetchHolidays();
    fetchEmployees();
    if (user?.employeeId) {
      fetchLeaveBalance(user.employeeId);
    }
  }, [fetchAnnouncements, fetchHolidays, fetchEmployees, fetchLeaveBalance, user?.employeeId]);

  const todayRecord = getTodayRecord(user?.employeeId || '');

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
  const birthdays = getBirthdays() || [];
  const anniversaries = getAnniversaries() || [];
  const newJoiners = getNewJoiners() || [];

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

  // Emoji reactions configuration
  const reactionEmojis = [
    { emoji: '👍', label: 'Like', color: 'text-blue-500' },
    { emoji: '❤️', label: 'Love', color: 'text-red-500' },
    { emoji: '🎉', label: 'Celebrate', color: 'text-yellow-500' },
    { emoji: '👏', label: 'Applause', color: 'text-green-500' },
    { emoji: '🔥', label: 'Fire', color: 'text-orange-500' },
  ];

  // Category colors configuration
  const categoryColors: Record<string, string> = {
    general: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    policy: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    event: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    announcement: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    hr: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
    urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    celebration: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  };

  const toggleExpand = (postId: number) => {
    setExpandedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Filter out expired announcements for employees, then sort: pinned first, then by date
  const sortedAnnouncements = useMemo(() => {
    if (!announcements) return [];
    const now = new Date();
    
    // Filter out expired announcements (employees should not see expired posts)
    const activeAnnouncements = announcements.filter(announcement => {
      // Check announcement expiry
      if (announcement.expiresAt) {
        const expiryDate = new Date(announcement.expiresAt);
        if (expiryDate < now) return false;
      }
      // Check poll expiry
      if (announcement.isPoll && announcement.pollExpiresAt) {
        const pollExpiryDate = new Date(announcement.pollExpiresAt);
        if (pollExpiryDate < now) return false;
      }
      return true;
    });
    
    return [...activeAnnouncements].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [announcements]);

  const handleLike = (postId: number) => {
    toggleLike(postId, user?.employeeId || '');
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
    if (!commentText) return;

    addAnnouncementComment(postId, {
      author: user?.name || 'You',
      text: commentText,
      time: 'Just now'
    });

    setNewComment(prev => ({ ...prev, [postId]: '' }));
  };

  // Dynamic leave balances - only Earned Leave and Sabbatical Leave
  const leaveBalances = useMemo(() => {
    return [
      {
        type: 'Earned Leave',
        balance: leaveBalance?.earnedLeave?.remaining ?? 0,
        total: leaveBalance?.earnedLeave?.total ?? 15
      },
      {
        type: 'Sabbatical Leave',
        balance: leaveBalance?.sabbaticalLeave?.remaining ?? 0,
        total: leaveBalance?.sabbaticalLeave?.total ?? 30
      },
    ];
  }, [leaveBalance]);

  // Generate confetti animation with pre-defined values to avoid Math.random during render
  const confettiElements = useMemo(() => {
    const preDefinedValues = [
      { left: 10, delay: 0.2, duration: 3.5, emoji: '🎉' },
      { left: 25, delay: 0.8, duration: 4.2, emoji: '🎊' },
      { left: 40, delay: 0.1, duration: 3.8, emoji: '🎈' },
      { left: 55, delay: 1.2, duration: 4.5, emoji: '⭐' },
      { left: 70, delay: 0.5, duration: 3.2, emoji: '✨' },
      { left: 85, delay: 1.5, duration: 4.1, emoji: '🎉' },
      { left: 15, delay: 0.9, duration: 3.7, emoji: '🎊' },
      { left: 35, delay: 0.3, duration: 4.3, emoji: '🎈' },
      { left: 60, delay: 1.1, duration: 3.9, emoji: '⭐' },
      { left: 80, delay: 0.7, duration: 4.0, emoji: '✨' },
      { left: 5, delay: 1.8, duration: 3.6, emoji: '🎉' },
      { left: 30, delay: 0.4, duration: 4.4, emoji: '🎊' },
      { left: 50, delay: 1.3, duration: 3.3, emoji: '🎈' },
      { left: 75, delay: 0.6, duration: 4.6, emoji: '⭐' },
      { left: 90, delay: 1.0, duration: 3.4, emoji: '✨' },
      { left: 20, delay: 1.6, duration: 4.7, emoji: '🎉' },
      { left: 45, delay: 0.2, duration: 3.1, emoji: '🎊' },
      { left: 65, delay: 1.4, duration: 4.8, emoji: '🎈' },
      { left: 8, delay: 0.8, duration: 3.5, emoji: '⭐' },
      { left: 95, delay: 1.7, duration: 4.2, emoji: '✨' }
    ];
    
    return preDefinedValues.map((config, i) => (
      <div
        key={i}
        className="absolute animate-confetti"
        style={{
          left: `${config.left}%`,
          animationDelay: `${config.delay}s`,
          animationDuration: `${config.duration}s`
        }}
      >
        <span className="text-2xl">{config.emoji}</span>
      </div>
    ));
  }, []);

  const todayBirthdays = birthdays.filter(b => b.isToday);
  const upcomingBirthdays = birthdays.filter(b => b.isUpcoming);


  return (
    <div className="space-y-8">
      {/* 2-Column Layout: 4 cols (left) + 8 cols (right) */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* LEFT COLUMN - 4 columns */}
        <div className="lg:col-span-4 space-y-8 animate-in slide-in-from-left-6 duration-500">
          {/* Holiday Calendar - Enhanced */}
          <Card className="overflow-hidden transition-all duration-300 hover:shadow-xl border-2">
            <CardHeader className="bg-blue-50 dark:bg-blue-950/30">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">
                    Holidays
                  </CardTitle>
                  <CardDescription className="mt-1">Upcoming company holidays</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllHolidaysModal(true)}
                  className="text-xs hover:bg-blue-100 dark:hover:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-medium"
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {yearHolidays.length === 0 ? (
                <div className="text-center py-12 bg-muted/20 rounded-xl">
                  <div className="flex flex-col items-center justify-center h-full">
                    <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground font-medium">No upcoming holidays</p>
                    <p className="text-xs text-muted-foreground mt-1">Check back later for updates</p>
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
                      const isTomorrow = daysUntil === 1;
                      
                      const getHolidayTheme = (type: string) => {
                        const typeStr = type?.toLowerCase() || '';
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
                              <div>
                                <h3 className={`font-bold text-xl leading-tight ${hasBackgroundImage ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                  {holiday.name}
                                </h3>
                                <p className={`text-sm mt-2 font-medium ${hasBackgroundImage ? 'text-white/90' : 'text-gray-600 dark:text-gray-300'}`}>
                                  {formatHolidayDate(holiday.date)}
                                </p>
                              </div>
                              
                              {/* Holiday Details */}
                              <div className="flex items-end justify-between">
                                <div className={`${hasBackgroundImage ? 'text-white/90' : 'text-gray-600 dark:text-gray-400'}`}>
                                  {daysUntil > 0 ? (
                                    <p className="text-sm font-medium text-white/90">
                                      {isTomorrow ? 'Tomorrow' : `in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`}
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
          <Card className="transition-all duration-300 hover:shadow-xl border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    Team Leave Details
                  </CardTitle>
                  <CardDescription className="mt-1">Team members on leave</CardDescription>
                </div>
                {teamLeaves.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {teamLeaves.length} away
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {teamLeaves.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">No team members on leave</p>
                    <p className="text-xs text-muted-foreground mt-1">Everyone is in the office! 🎉</p>
                  </div>
                ) : (
                  teamLeaves.map((leave, index) => {
                    const endDate = new Date(leave.endDate);
                    const today = new Date();
                    const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    
                    // Color code leave types
                    const getLeaveColor = (type: string) => {
                      if (type.toLowerCase().includes('sick')) return 'bg-red-100 text-red-700 border-red-300 dark:bg-red-950/30 dark:text-red-400';
                      if (type.toLowerCase().includes('casual')) return 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-950/30 dark:text-yellow-400';
                      if (type.toLowerCase().includes('earned')) return 'bg-green-100 text-green-700 border-green-300 dark:bg-green-950/30 dark:text-green-400';
                      return 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950/30 dark:text-blue-400';
                    };

                    return (
                      <div key={index} className="group relative p-3 border rounded-lg transition-all duration-300 hover:shadow-md hover:scale-[1.02] bg-purple-50/30 dark:bg-purple-950/10">
                        <div className="flex items-center gap-3">
                          {/* Avatar */}
                          <div className={`w-10 h-10 rounded-full ${getAvatarGradient(leave.userName || 'Unknown')} flex items-center justify-center text-white font-semibold flex-shrink-0`}>
                            {(leave.userName || 'Unknown').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          
                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{leave.userName || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">{formatLeaveDate(leave.startDate, leave.endDate)}</p>
                            {daysRemaining > 0 && (
                              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Back in {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}
                              </p>
                            )}
                          </div>
                          
                          {/* Badge */}
                          <Badge variant="outline" className={`flex-shrink-0 ${getLeaveColor(leave.leaveType)}`}>
                            {leave.leaveType}
                          </Badge>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Web Check-In - Enhanced */}
          <Card className="transition-all duration-300 hover:shadow-xl border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                Web Check-In
              </CardTitle>
              <CardDescription>
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Large Check-In Button */}
              <div className="flex justify-center">
                {!todayRecord?.checkIn || todayRecord?.checkOut ? (
                  <Button
                    size="lg"
                    onClick={() => checkIn(user?.employeeId || '')}
                    className="w-full h-20 text-lg font-semibold bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl transition-all duration-300 group"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <LogIn className="h-8 w-8 group-hover:scale-110 transition-transform" />
                      <span>Check In Now</span>
                    </div>
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => checkOut(user?.employeeId || '')}
                    className="w-full h-20 text-lg font-semibold border-2 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-300 group"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <LogOut className="h-8 w-8 group-hover:scale-110 transition-transform" />
                      <span>Check Out</span>
                    </div>
                  </Button>
                )}
              </div>

              {/* Status Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border bg-blue-50/50 dark:bg-blue-950/20">
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <Badge
                    variant={todayRecord?.checkOut ? 'secondary' : todayRecord?.checkIn ? 'default' : 'outline'}
                    className={`w-full justify-center ${
                      todayRecord?.checkIn && !todayRecord?.checkOut
                        ? 'bg-green-500 hover:bg-green-600 animate-pulse'
                        : ''
                    }`}
                  >
                    {todayRecord?.checkOut ? '✓ Checked Out' : todayRecord?.checkIn ? '● Active' : 'Not Checked In'}
                  </Badge>
                </div>
                <div className="p-3 rounded-lg border bg-purple-50/50 dark:bg-purple-950/20">
                  <p className="text-xs text-muted-foreground mb-1">Check-in Time</p>
                  <p className="font-semibold text-sm">{todayRecord?.checkIn || '--:--'}</p>
                </div>
              </div>

              {/* Hours Info */}
              {todayRecord?.checkOut && (
                <div className="p-3 rounded-lg border bg-green-50/50 dark:bg-green-950/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Timer className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium">Total Hours Today</span>
                    </div>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      {todayRecord.effectiveHours}
                    </span>
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                <div className="text-center p-2">
                  <p className="text-xs text-muted-foreground">This Week</p>
                  <p className="text-sm font-semibold">40h</p>
                </div>
                <div className="text-center p-2">
                  <p className="text-xs text-muted-foreground">On-Time %</p>
                  <p className="text-sm font-semibold text-green-600 dark:text-green-400">95%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Leave Balances - Enhanced */}
          <Card className="transition-all duration-300 hover:shadow-xl border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-cyan-500/10">
                  <Plane className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                Leave Balances
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Circular Progress Rings with Color Coding */}
              <div className="flex items-center justify-center gap-8 py-4">
                {leaveBalances.map((leave) => {
                  const percentage = (leave.balance / leave.total) * 100;
                  const radius = 36;
                  const circumference = 2 * Math.PI * radius;
                  const strokeDashoffset = circumference - (percentage / 100) * circumference;
                  
                  // Color coding based on balance level
                  const getColorClass = () => {
                    if (percentage > 50) return 'text-green-500';
                    if (percentage > 20) return 'text-yellow-500';
                    return 'text-red-500';
                  };
                  
                  const getWarningIcon = () => {
                    if (percentage <= 20) return <AlertCircle className="h-4 w-4 text-red-500 animate-pulse" />;
                    if (percentage <= 50) return <AlertCircle className="h-4 w-4 text-yellow-500" />;
                    return <CheckCircle2 className="h-4 w-4 text-green-500" />;
                  };

                  return (
                    <div key={leave.type} className="flex flex-col items-center group cursor-pointer transition-transform hover:scale-105">
                      <div className="relative w-28 h-28">
                        {/* Background circle */}
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                          <circle
                            cx="40"
                            cy="40"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="none"
                            className="text-muted/20"
                          />
                          {/* Progress circle with gradient effect */}
                          <circle
                            cx="40"
                            cy="40"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="none"
                            strokeLinecap="round"
                            className={`${getColorClass()} transition-all duration-500`}
                            style={{
                              strokeDasharray: circumference,
                              strokeDashoffset: strokeDashoffset,
                              filter: 'drop-shadow(0 0 4px currentColor)'
                            }}
                          />
                        </svg>
                        {/* Center text with animation */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-2xl font-bold group-hover:scale-110 transition-transform">{leave.balance}</span>
                          <span className="text-xs text-muted-foreground">/ {leave.total}</span>
                        </div>
                        {/* Warning indicator */}
                        <div className="absolute -top-1 -right-1">
                          {getWarningIcon()}
                        </div>
                      </div>
                      <div className="mt-3 text-center">
                        <span className="text-sm font-medium text-foreground block">
                          {leave.type.replace(' Leave', '')}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {percentage.toFixed(0)}% remaining
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Expiry Warning - Dynamic based on earned leave */}
              {(() => {
                const earnedLeaveRemaining = leaveBalance?.earnedLeave?.remaining ?? 0;
                const currentYear = new Date().getFullYear();
                const yearEnd = new Date(currentYear, 11, 31); // Dec 31
                const today = new Date();
                const daysUntilExpiry = Math.ceil((yearEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                
                // Only show warning if there's remaining leave and within 60 days of year end
                if (earnedLeaveRemaining > 0 && daysUntilExpiry <= 60 && daysUntilExpiry > 0) {
                  return (
                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-amber-900 dark:text-amber-100">Expiring Soon</p>
                          <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                            {earnedLeaveRemaining} day{earnedLeaveRemaining !== 1 ? 's' : ''} will expire on Dec 31, {currentYear}
                          </p>
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                            {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''} remaining to use your earned leave
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button 
                  variant="default" 
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  onClick={() => navigate('/leave')}
                >
                  <Plane className="h-4 w-4 mr-2" />
                  Request Leave
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => navigate('/leave')}
                >
                  View All
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN - 8 columns */}
        <div className="lg:col-span-8 space-y-8 animate-in slide-in-from-right-6 duration-500">
          {/* Employee Celebrations - Enhanced with Confetti */}
          <Card className="transition-all duration-300 hover:shadow-xl border-2 relative overflow-hidden">
            {todayBirthdays.length > 0 && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full">
                  {confettiElements}
                </div>
              </div>
            )}
            <CardHeader className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-pink-500/10">
                      <Cake className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                    </div>
                    Team Celebrations
                  </CardTitle>
                  <CardDescription className="mt-1">Birthdays, anniversaries, and new team members</CardDescription>
                </div>
                {todayBirthdays.length > 0 && (
                  <Badge className="bg-pink-500 animate-pulse">
                    {todayBirthdays.length} Today!
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <Tabs defaultValue="birthdays" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="birthdays" className="flex items-center gap-2 relative">
                    <Cake className="h-4 w-4" />
                    Birthdays
                    {todayBirthdays.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    )}
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
                    <div className="p-4 rounded-lg bg-pink-50 dark:bg-pink-950/20 border-2 border-pink-200 dark:border-pink-800">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="h-4 w-4 text-pink-600 dark:text-pink-400 animate-pulse" />
                        <h3 className="text-sm font-semibold text-pink-900 dark:text-pink-100 uppercase tracking-wide">
                          Birthdays Today 🎂
                        </h3>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {todayBirthdays.map((person) => (
                          <div key={person.id} className="group">
                            <EmployeeCard
                              person={person}
                              type="birthday"
                              onHover={setHoveredEmployee}
                              isHovered={hoveredEmployee === person.id}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full mt-2 border-pink-300 hover:bg-pink-50 dark:hover:bg-pink-950/30 group-hover:border-pink-500 transition-all"
                              onClick={() => {
                                // Open email client with birthday wish
                                const subject = encodeURIComponent(`Happy Birthday, ${person.name}! 🎂`);
                                const body = encodeURIComponent(
                                  `Dear ${person.name},\n\nWishing you a very Happy Birthday! 🎉🎂\n\nMay this special day bring you joy, happiness, and all the wonderful things you deserve.\n\nBest wishes,\n${user?.name || 'Your colleague'}`
                                );
                                const email = person.email || '';
                                if (email) {
                                  window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
                                  toast.success(`Opening email to send wishes to ${person.name}`);
                                } else {
                                  toast.info(`Birthday wishes sent to ${person.name}! 🎉`, {
                                    description: 'Have a wonderful celebration!'
                                  });
                                }
                              }}
                            >
                              <Mail className="h-3 w-3 mr-2" />
                              Send Wishes 🎉
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upcoming Birthdays Section */}
                  {upcomingBirthdays.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
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
                  
                  {todayBirthdays.length === 0 && upcomingBirthdays.length === 0 && (
                    <div className="text-center py-8">
                      <Cake className="h-12 w-12 mx-auto text-muted-foreground/30 mb-2" />
                      <p className="text-sm text-muted-foreground">No upcoming birthdays</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="anniversaries" className="space-y-3">
                  {anniversaries.length > 0 ? (
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
                  ) : (
                    <div className="text-center py-8">
                      <Gift className="h-12 w-12 mx-auto text-muted-foreground/30 mb-2" />
                      <p className="text-sm text-muted-foreground">No work anniversaries this month</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="newjoinees" className="space-y-3">
                  {newJoiners.length > 0 ? (
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
                  ) : (
                    <div className="text-center py-8">
                      <UserPlus className="h-12 w-12 mx-auto text-muted-foreground/30 mb-2" />
                      <p className="text-sm text-muted-foreground">No new joiners this month</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Company Announcements - Enhanced Social Style */}
          <Card className="overflow-hidden transition-all duration-300 hover:shadow-xl border-2">
            <CardHeader className="bg-orange-50 dark:bg-orange-950/30">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-orange-500/10">
                      <Megaphone className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <span className="text-primary">Company Announcements</span>
                  </CardTitle>
                  <CardDescription className="mt-1">Latest updates and news from the company</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    {sortedAnnouncements.filter(a => !a.liked).length} New
                  </Badge>
                </div>
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
              ) : sortedAnnouncements.length === 0 ? (
                <div className="text-center py-8">
                  <Megaphone className="h-12 w-12 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No announcements yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Check back later for updates</p>
                </div>
              ) : (
              sortedAnnouncements.map((announcement, index) => {
                const isLiked = user?.employeeId ? announcement.likedBy.includes(user.employeeId) : false;
                const isExpanded = expandedPosts[announcement.id] || false;
                const shouldTruncate = announcement.description.length > 150;
                const displayText = shouldTruncate && !isExpanded 
                  ? announcement.description.slice(0, 150) + '...' 
                  : announcement.description;
                const authorName = announcement.author || 'Company';
                const category = announcement.category || 'general';
                const isUnread = !announcement.liked;

                return (
                <div 
                  key={announcement.id} 
                  className={`relative border-2 rounded-xl p-5 space-y-4 transition-all duration-300 hover:shadow-lg hover:border-orange-200 dark:hover:border-orange-800 animate-in slide-in-from-bottom-4 ${isUnread ? 'border-l-4 border-l-blue-500' : ''}`}
                  style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'both' }}
                >
                  {/* Pinned Indicator */}
                  {announcement.isPinned && (
                    <div className="absolute -top-3 left-4 px-3 py-1 bg-amber-500 text-white text-xs font-medium rounded-full shadow-lg flex items-center gap-1">
                      <Pin className="h-3 w-3" />
                      Pinned
                    </div>
                  )}

                  {/* Unread Indicator */}
                  {isUnread && (
                    <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
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
                        <span className="text-xs text-muted-foreground">• {announcement.role || 'Official'}</span>
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

                    {/* Priority & Category Badges + Bookmark */}
                    <div className="flex flex-col gap-2 items-end">
                      <div className="flex items-center gap-2">
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
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toast.info('Bookmarks coming soon!')}
                        >
                          <Bookmark className="h-4 w-4" />
                        </Button>
                      </div>
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
                    {announcement.priority === 'high' && !announcement.isPoll && <Zap className="h-4 w-4 text-orange-500 animate-pulse" />}
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
                                  } ${isSelected ? 'border-purple-500 bg-purple-500' : 'border-gray-300'}`}>
                                    {isSelected && <CheckCircle2 className="h-3 w-3 text-white" />}
                                  </div>
                                  <span className="text-sm font-medium">{option.text}</span>
                                </div>
                                {submitted && (
                                  <span className="text-sm font-semibold text-purple-600">{percentage}%</span>
                                )}
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
                        <span>{announcement.totalVotes || 0} votes</span>
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
                            className="text-orange-600 dark:text-orange-400 hover:underline font-medium mt-1 inline-flex items-center gap-1"
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
                            className="w-full h-auto object-contain max-h-96 hover:scale-105 transition-transform duration-300"
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
                                className="w-5 h-5 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-[10px] border border-white dark:border-gray-800 shadow-sm"
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
                          className="absolute bottom-full left-0 flex items-center gap-1 bg-white dark:bg-gray-800 rounded-full shadow-xl border-2 px-2 py-1 animate-in fade-in slide-in-from-bottom-2 duration-200 z-10"
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
                          <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 shadow-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm">{comment.author}</span>
                              <span className="text-muted-foreground text-xs">{comment.time}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">{comment.text}</p>
                          </div>
                        </div>
                      ))}
                      {announcement.comments.length > 2 && (
                        <button className="text-xs text-orange-600 dark:text-orange-400 hover:underline ml-11">
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
                        className="flex-1 rounded-full bg-muted/50 border-0 focus-visible:ring-2 focus-visible:ring-orange-500"
                      />
                      <Button
                        size="sm"
                        className="rounded-full bg-orange-600 hover:bg-orange-700"
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

      {/* All Holidays Modal - Modern Enterprise Style */}
      <HolidaysDialog
        open={showAllHolidaysModal}
        onOpenChange={setShowAllHolidaysModal}
        holidays={allHolidays}
        showEditButton={false}
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
                    className="flex-1 min-w-[60px] data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800"
                  >
                    All ({getSelectedAnnouncementReactions().length})
                  </TabsTrigger>
                  {groupReactionsByEmoji(getSelectedAnnouncementReactions()).map((group) => (
                    <TabsTrigger 
                      key={group.emoji} 
                      value={group.emoji}
                      className="flex-1 min-w-[50px] data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800"
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
    </div>
  );
}
