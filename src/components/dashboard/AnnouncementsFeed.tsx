import { useState, useEffect, useMemo } from 'react';
import { useAnnouncementStore } from '@/store/announcementStore';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Megaphone, 
  Heart, 
  MessageCircle, 
  Send, 
  ChevronDown, 
  ChevronUp, 
  BarChart3, 
  CheckCircle2,
  Pin,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { getAvatarGradient } from '@/constants/design-system';

interface AnnouncementsFeedProps {
  maxHeight?: string;
  showTitle?: boolean;
}

export function AnnouncementsFeed({ 
  maxHeight = '600px', 
  showTitle = true
}: AnnouncementsFeedProps) {
  const user = useAuthStore((state) => state.user);
  const announcements = useAnnouncementStore((state) => state.announcements);
  const { toggleLike, addComment, fetchAnnouncements, addReaction } = useAnnouncementStore();
  const isLoading = useAnnouncementStore((state) => state.isLoading);

  const [newComment, setNewComment] = useState<Record<number, string>>({});
  const [expandedPosts, setExpandedPosts] = useState<Record<number, boolean>>({});
  const [showReactionPicker, setShowReactionPicker] = useState<number | null>(null);
  const [reactionDialogOpen, setReactionDialogOpen] = useState(false);
  const [selectedAnnouncementReactions, setSelectedAnnouncementReactions] = useState<{ id: number; title: string } | null>(null);
  const [activeReactionTab, setActiveReactionTab] = useState('all');

  // Get current user ID - prioritize authenticated user's employeeId
  const currentUserId = user?.employeeId || user?.email || 'anonymous';
  const pollStorageKey = `pollVotes_${currentUserId}`;

  // Poll state
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
  
  if (!pollStateInitialized && Object.keys(initialPollState.alreadyVoted).length > 0) {
    setSubmittedPolls(initialPollState.alreadyVoted);
    setSelectedPollOptions(initialPollState.userSelections);
    setPollStateInitialized(true);
  }

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // Poll handlers
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

  const hasSubmittedPoll = (announcementId: number) => submittedPolls[announcementId] || false;
  const hasSelections = (announcementId: number) => (selectedPollOptions[announcementId] || []).length > 0;
  const isOptionSelected = (announcementId: number, optionId: string) => 
    (selectedPollOptions[announcementId] || []).includes(optionId);

  const toggleExpand = (postId: number) => {
    setExpandedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));
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

  // Reaction emojis
  const reactionEmojis = [
    { emoji: '❤️', label: 'Love' },
    { emoji: '👍', label: 'Like' },
    { emoji: '🎉', label: 'Celebrate' },
    { emoji: '😊', label: 'Happy' },
    { emoji: '🔥', label: 'Fire' },
    { emoji: '👏', label: 'Clap' },
  ];

  const handleComment = (postId: number) => {
    const comment = newComment[postId]?.trim();
    if (!comment || !user) return;
    
    addComment(postId, {
      author: user.name,
      text: comment,
      time: format(new Date(), 'MMM dd, yyyy HH:mm'),
    });
    setNewComment(prev => ({ ...prev, [postId]: '' }));
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const sortedAnnouncements = useMemo(() => {
    if (!announcements) return [];
    return [...announcements].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [announcements]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
      default: return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
    }
  };

  if (isLoading) {
    return (
      <Card>
        {showTitle && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-blue-500" />
              Announcements & Polls
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-blue-500" />
            Announcements & Polls
          </CardTitle>
          <CardDescription>Stay updated with latest news and participate in polls</CardDescription>
        </CardHeader>
      )}
      <CardContent>
        <div 
          className="space-y-4 overflow-y-auto pr-2" 
          style={{ maxHeight }}
        >
          {sortedAnnouncements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No announcements yet</p>
            </div>
          ) : (
            sortedAnnouncements.map((announcement) => (
              <div
                key={announcement.id}
                className={`border rounded-lg p-4 space-y-3 transition-all hover:shadow-md ${
                  announcement.isPinned ? 'border-amber-300 bg-amber-50/50 dark:bg-amber-950/20' : ''
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${getAvatarGradient(announcement.author)} flex items-center justify-center text-white font-semibold text-sm`}>
                      {getInitials(announcement.author)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{announcement.author}</span>
                        {announcement.isPinned && <Pin className="h-3 w-3 text-amber-500" />}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {announcement.role} • {announcement.date} {announcement.time}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {announcement.isPoll && (
                      <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                        <BarChart3 className="h-3 w-3 mr-1" />
                        Poll
                      </Badge>
                    )}
                    <Badge className={getPriorityColor(announcement.priority)}>
                      {announcement.priority}
                    </Badge>
                  </div>
                </div>

                {/* Title */}
                <h3 className="font-semibold">{announcement.title}</h3>

                {/* Content */}
                {announcement.isPoll && announcement.pollOptions ? (
                  <div className="space-y-3">
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

                    {!hasSubmittedPoll(announcement.id) && (
                      <Button
                        onClick={() => handlePollSubmit(announcement.id)}
                        disabled={!hasSelections(announcement.id)}
                        className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                      >
                        Submit Vote
                      </Button>
                    )}
                    
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
                  <p className={`text-sm text-muted-foreground ${!expandedPosts[announcement.id] && announcement.description.length > 150 ? 'line-clamp-3' : ''}`}>
                    {announcement.description}
                  </p>
                )}

                {!announcement.isPoll && announcement.description.length > 150 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => toggleExpand(announcement.id)}
                    className="text-xs"
                  >
                    {expandedPosts[announcement.id] ? (
                      <>Show less <ChevronUp className="h-3 w-3 ml-1" /></>
                    ) : (
                      <>Show more <ChevronDown className="h-3 w-3 ml-1" /></>
                    )}
                  </Button>
                )}

                {/* Image */}
                {announcement.imageUrl && (
                  <img 
                    src={announcement.imageUrl} 
                    alt="Announcement" 
                    className="rounded-lg max-h-48 w-full object-cover"
                  />
                )}

                {/* Actions */}
                <div className="flex items-center gap-4 pt-2 border-t">
                  {/* Reaction Button with Picker */}
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(announcement.id)}
                      onMouseEnter={() => setShowReactionPicker(announcement.id)}
                      onMouseLeave={() => setShowReactionPicker(null)}
                      className={announcement.likedBy?.includes(user?.employeeId || '') ? 'text-red-500' : ''}
                    >
                      <Heart className={`h-4 w-4 mr-1 ${announcement.likedBy?.includes(user?.employeeId || '') ? 'fill-current' : ''}`} />
                      React
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
                            className="text-lg hover:scale-125 transition-transform p-1 hover:bg-muted rounded-full"
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
                  
                  {/* Reaction Count - Clickable */}
                  <button
                    className="text-xs text-muted-foreground hover:text-foreground hover:underline flex items-center gap-1"
                    onClick={() => handleShowReactions(announcement.id, announcement.title)}
                  >
                    {announcement.reactions && announcement.reactions.length > 0 ? (
                      <>
                        {[...new Set(announcement.reactions.map(r => r.emoji))].slice(0, 3).map((emoji, idx) => (
                          <span key={idx}>{emoji}</span>
                        ))}
                        <span>{announcement.reactions.length}</span>
                      </>
                    ) : (
                      <span>{announcement.likes || 0} reactions</span>
                    )}
                  </button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpand(announcement.id)}
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    {announcement.comments?.length || 0}
                  </Button>
                </div>

                {/* Comments */}
                {expandedPosts[announcement.id] && (
                  <div className="space-y-3 pt-2">
                    {announcement.comments?.slice(0, 3).map((comment) => (
                      <div key={comment.id} className="flex gap-2 text-sm">
                        <div className={`h-6 w-6 rounded-full bg-gradient-to-br ${getAvatarGradient(comment.author)} flex items-center justify-center text-white text-xs`}>
                          {getInitials(comment.author)}
                        </div>
                        <div className="flex-1 bg-muted rounded-lg p-2">
                          <span className="font-medium text-xs">{comment.author}</span>
                          <p className="text-xs">{comment.text}</p>
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Write a comment..."
                        value={newComment[announcement.id] || ''}
                        onChange={(e) => setNewComment(prev => ({ ...prev, [announcement.id]: e.target.value }))}
                        onKeyPress={(e) => e.key === 'Enter' && handleComment(announcement.id)}
                        className="text-sm h-8"
                      />
                      <Button size="sm" onClick={() => handleComment(announcement.id)}>
                        <Send className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>

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
    </Card>
  );
}
