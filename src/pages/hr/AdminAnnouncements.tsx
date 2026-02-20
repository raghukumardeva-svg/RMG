import { useState, useEffect } from 'react';
import { useAnnouncementStore } from '@/store/announcementStore';
import type { Announcement, PollOption } from '@/store/announcementStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Megaphone, 
  Trash2, 
  Search, 
  Eye, 
  BarChart3, 
  Calendar,
  User,
  AlertTriangle,
  MessageCircle,
  Heart,
  Pin,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function AdminAnnouncements() {
  const { announcements, fetchAnnouncements, deleteAnnouncement, isLoading } = useAnnouncementStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'announcement' | 'poll'>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // Filter announcements
  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = 
      announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      announcement.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      announcement.author.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'all' || 
      (filterType === 'poll' && announcement.isPoll) ||
      (filterType === 'announcement' && !announcement.isPoll);
    
    const matchesPriority = filterPriority === 'all' || announcement.priority === filterPriority;
    
    return matchesSearch && matchesType && matchesPriority;
  });

  const handleDeleteClick = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedAnnouncement) {
      await deleteAnnouncement(selectedAnnouncement.id);
      setDeleteDialogOpen(false);
      setSelectedAnnouncement(null);
    }
  };

  const handleViewClick = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setViewDialogOpen(true);
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
      low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    };
    return styles[priority as keyof typeof styles] || styles.low;
  };

  const getTypeBadge = (isPoll: boolean) => {
    return isPoll 
      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
  };

  // Stats
  const totalAnnouncements = announcements.filter(a => !a.isPoll).length;
  const totalPolls = announcements.filter(a => a.isPoll).length;
  const highPriorityCount = announcements.filter(a => a.priority === 'high').length;
  const totalEngagement = announcements.reduce((sum, a) => sum + (a.likes || 0) + (a.comments?.length || 0), 0);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">
            <Megaphone className="h-7 w-7 text-primary" />
            Announcements Admin
          </h1>
          <p className="page-description">
            Manage all published announcements and polls
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Announcements</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAnnouncements}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Polls</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPolls}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highPriorityCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Engagement</CardTitle>
            <Heart className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEngagement}</div>
            <p className="text-xs text-muted-foreground">likes & comments</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title, content, or author..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={(value: 'all' | 'announcement' | 'poll') => setFilterType(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="announcement">Announcements</SelectItem>
                <SelectItem value="poll">Polls</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={(value: 'all' | 'high' | 'medium' | 'low') => setFilterPriority(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Announcements Table */}
      <Card>
        <CardHeader>
          <CardTitle>Published Content</CardTitle>
          <CardDescription>
            {filteredAnnouncements.length} of {announcements.length} items shown
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No announcements found</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Engagement</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAnnouncements.map((announcement) => (
                    <TableRow key={announcement.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {announcement.isPinned && (
                            <Pin className="h-4 w-4 text-amber-500" />
                          )}
                          <span className="font-medium truncate max-w-[250px]">
                            {announcement.title}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeBadge(announcement.isPoll || false)}>
                          {announcement.isPoll ? 'Poll' : 'Announcement'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityBadge(announcement.priority)}>
                          {announcement.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {announcement.author}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(announcement.date), 'MMM dd, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="flex items-center gap-1">
                            <Heart className="h-4 w-4 text-pink-500" />
                            {announcement.likes || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4 text-blue-500" />
                            {announcement.comments?.length || 0}
                          </span>
                          {announcement.isPoll && (
                            <span className="flex items-center gap-1">
                              <BarChart3 className="h-4 w-4 text-purple-500" />
                              {announcement.totalVotes || 0}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewClick(announcement)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteClick(announcement)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedAnnouncement?.isPoll ? (
                <BarChart3 className="h-5 w-5 text-purple-500" />
              ) : (
                <Megaphone className="h-5 w-5 text-blue-500" />
              )}
              {selectedAnnouncement?.title}
            </DialogTitle>
            <DialogDescription>
              Posted by {selectedAnnouncement?.author} on{' '}
              {selectedAnnouncement?.date && format(new Date(selectedAnnouncement.date), 'MMMM dd, yyyy')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Badge className={getTypeBadge(selectedAnnouncement?.isPoll || false)}>
                {selectedAnnouncement?.isPoll ? 'Poll' : 'Announcement'}
              </Badge>
              <Badge className={getPriorityBadge(selectedAnnouncement?.priority || 'low')}>
                {selectedAnnouncement?.priority}
              </Badge>
              {selectedAnnouncement?.category && (
                <Badge variant="outline">{selectedAnnouncement.category}</Badge>
              )}
            </div>
            
            <div className="prose dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap">{selectedAnnouncement?.description}</p>
            </div>

            {selectedAnnouncement?.imageUrl && (
              <img 
                src={selectedAnnouncement.imageUrl} 
                alt="Announcement" 
                className="rounded-lg max-h-64 object-cover"
              />
            )}

            {/* Poll Options */}
            {selectedAnnouncement?.isPoll && selectedAnnouncement?.pollOptions && (
              <div className="space-y-2">
                <h4 className="font-semibold">Poll Results</h4>
                {selectedAnnouncement.pollOptions.map((option: PollOption) => {
                  const totalVotes = selectedAnnouncement.totalVotes || 
                    (selectedAnnouncement.pollOptions || []).reduce((sum: number, o: PollOption) => sum + (o.votes || 0), 0);
                  const percentage = totalVotes > 0 ? Math.round(((option.votes || 0) / totalVotes) * 100) : 0;
                  
                  return (
                    <div key={option.id} className="relative overflow-hidden border rounded-lg p-3">
                      <div 
                        className="absolute inset-0 bg-purple-100 dark:bg-purple-900/20"
                        style={{ width: `${percentage}%` }}
                      />
                      <div className="relative flex items-center justify-between">
                        <span>{option.text}</span>
                        <span className="font-semibold">{percentage}% ({option.votes || 0} votes)</span>
                      </div>
                    </div>
                  );
                })}
                <p className="text-sm text-muted-foreground">
                  Total votes: {selectedAnnouncement.totalVotes || 0}
                </p>
              </div>
            )}

            {/* Engagement Stats */}
            <div className="flex items-center gap-4 pt-4 border-t">
              <span className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-pink-500" />
                {selectedAnnouncement?.likes || 0} likes
              </span>
              <span className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-blue-500" />
                {selectedAnnouncement?.comments?.length || 0} comments
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete {selectedAnnouncement?.isPoll ? 'Poll' : 'Announcement'}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedAnnouncement?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
