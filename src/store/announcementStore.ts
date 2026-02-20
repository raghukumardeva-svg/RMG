import { create } from 'zustand';
import { useNotificationStore } from './notificationStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Comment {
  id: number;
  author: string;
  text: string;
  time: string;
}

export interface Reaction {
  oderId: string;
  userName: string;
  emoji: string;
  label: string;
  timestamp: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  votedBy: string[];
}

export interface Announcement {
  id: number;
  title: string;
  description: string;
  author: string;
  role: string;
  date: string;
  time: string;
  avatar: string;
  priority: 'high' | 'medium' | 'low';
  likes: number;
  liked?: boolean;
  likedBy: string[];
  reactions?: Reaction[];
  comments: Comment[];
  imageUrl?: string;
  isPinned?: boolean;
  category?: string;
  views?: number;
  expiresAt?: string; // Expiry date for announcements
  // Poll specific fields
  isPoll?: boolean;
  pollOptions?: PollOption[];
  allowMultipleAnswers?: boolean;
  isAnonymous?: boolean;
  pollExpiresAt?: string;
  totalVotes?: number;
}

interface AnnouncementState {
  announcements: Announcement[];
  isLoading: boolean;
  error: string | null;
  
  fetchAnnouncements: () => Promise<void>;
  addAnnouncement: (announcement: Omit<Announcement, 'id' | 'likes' | 'liked' | 'likedBy' | 'comments'>) => Promise<void>;
  updateAnnouncement: (id: number, updates: Partial<Announcement>) => Promise<void>;
  deleteAnnouncement: (id: number) => Promise<void>;
  toggleLike: (id: number, userId: string) => Promise<void>;
  addReaction: (id: number, oderId: string, userName: string, emoji: string, label: string) => Promise<void>;
  addComment: (id: number, comment: Omit<Comment, 'id'>) => Promise<void>;
  votePoll: (id: number, optionIds: string[], oderId: string) => Promise<void>;
}

export const useAnnouncementStore = create<AnnouncementState>((set, get) => ({
  announcements: [],
  isLoading: false,
  error: null,

  fetchAnnouncements: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/announcements`);
      if (!response.ok) {
        console.error('Failed to fetch announcements:', response.status, response.statusText);
        set({ error: 'Failed to fetch announcements', isLoading: false });
        return;
      }
      const result = await response.json();
      
      if (result.success) {
        // Add computed 'liked' field for current user and ensure required fields
        const announcements = result.data.map((a: any) => ({
          ...a,
          id: a.id || a._id, // MongoDB returns _id
          liked: false, // Will be computed per user in components
          likedBy: a.likedBy || [],
          comments: a.comments || [],
          reactions: a.reactions || [],
          likes: a.likes || 0,
          imageUrl: a.imageUrl || a.image || null // Handle both field names
        }));
        set({ announcements, isLoading: false });
      } else {
        console.error('Announcement fetch failed:', result.message);
        set({ error: result.message, isLoading: false });
      }
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
      set({ error: 'Failed to fetch announcements', isLoading: false });
    }
  },

  addAnnouncement: async (announcement) => {
    try {
      const response = await fetch(`${API_URL}/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(announcement),
      });
      const result = await response.json();
      
      if (!response.ok) {
        console.error('API error:', result);
        set({ error: result.error?.message || result.message || 'Failed to add announcement' });
        throw new Error(result.error?.message || result.message || 'Failed to add announcement');
      }
      
      if (result.success) {
        const newAnnouncement = {
          ...result.data,
          id: result.data.id || result.data._id,
          likedBy: result.data.likedBy || [],
          comments: result.data.comments || [],
          likes: result.data.likes || 0,
          imageUrl: result.data.imageUrl || announcement.imageUrl // Preserve imageUrl
        };
        set({ announcements: [newAnnouncement, ...get().announcements] });

        // Create notification for all users about new announcement
        try {
          const priorityEmoji = result.data.priority === 'high' ? '🔴' : result.data.priority === 'medium' ? '🟡' : '🟢';
          await useNotificationStore.getState().createNotification({
            title: `${priorityEmoji} New Announcement`,
            description: `${result.data.author} posted: ${result.data.title}`,
            type: 'announcement',
            role: 'all', // Notify all users
            meta: {
              announcementId: result.data.id,
              priority: result.data.priority,
              actionUrl: '/dashboard',
            },
          });
        } catch (notifError) {
          // Notification creation failed, continue without it
        }
      }
    } catch (_error) {
      set({ error: 'Failed to add announcement' });
    }
  },

  updateAnnouncement: async (id, updates) => {
    try {
      const response = await fetch(`${API_URL}/announcements/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const result = await response.json();
      if (result.success) {
        set({
          announcements: get().announcements.map(a =>
            a.id === id ? result.data : a
          ),
        });
      }
    } catch (_error) {
      set({ error: 'Failed to update announcement' });
    }
  },

  deleteAnnouncement: async (id) => {
    try {
      await fetch(`${API_URL}/announcements/${id}`, { method: 'DELETE' });
      set({ announcements: get().announcements.filter(a => a.id !== id) });
    } catch (_error) {
      set({ error: 'Failed to delete announcement' });
    }
  },

  toggleLike: async (id, userId) => {
    try {
      const response = await fetch(`${API_URL}/announcements/${id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const result = await response.json();
      if (result.success) {
        set({
          announcements: get().announcements.map(a =>
            a.id === id ? result.data : a
          ),
        });
      }
    } catch (_error) {
      set({ error: 'Failed to toggle like' });
    }
  },

  addComment: async (id, comment) => {
    try {
      const response = await fetch(`${API_URL}/announcements/${id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(comment),
      });
      const result = await response.json();
      if (result.success) {
        set({
          announcements: get().announcements.map(a =>
            a.id === id ? result.data : a
          ),
        });
      }
    } catch (_error) {
      set({ error: 'Failed to add comment' });
    }
  },

  addReaction: async (id, oderId, userName, emoji, label) => {
    // Update reactions locally (optimistic update)
    set({
      announcements: get().announcements.map(a => {
        if (a.id === id) {
          const currentReactions = a.reactions || [];
          // Check if user already reacted
          const existingReactionIndex = currentReactions.findIndex(r => r.oderId === oderId);
          
          let updatedReactions: Reaction[];
          let updatedLikes = a.likes || 0;
          let updatedLikedBy = [...(a.likedBy || [])];
          
          if (existingReactionIndex >= 0) {
            // User already reacted - update their reaction
            if (currentReactions[existingReactionIndex].emoji === emoji) {
              // Same emoji - remove reaction
              updatedReactions = currentReactions.filter(r => r.oderId !== oderId);
              updatedLikes = Math.max(0, updatedLikes - 1);
              updatedLikedBy = updatedLikedBy.filter(id => id !== oderId);
            } else {
              // Different emoji - update reaction
              updatedReactions = currentReactions.map(r => 
                r.oderId === oderId 
                  ? { ...r, emoji, label, timestamp: new Date().toISOString() }
                  : r
              );
            }
          } else {
            // New reaction
            updatedReactions = [
              ...currentReactions,
              {
                oderId,
                userName,
                emoji,
                label,
                timestamp: new Date().toISOString()
              }
            ];
            updatedLikes = updatedLikes + 1;
            if (!updatedLikedBy.includes(oderId)) {
              updatedLikedBy.push(oderId);
            }
          }
          
          return {
            ...a,
            reactions: updatedReactions,
            likes: updatedLikes,
            likedBy: updatedLikedBy
          };
        }
        return a;
      })
    });

    // Persist reaction to backend
    try {
      const response = await fetch(`${API_URL}/announcements/${id}/reaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oderId, userName, emoji, label }),
      });
      const result = await response.json();
      if (result.success) {
        // Update with server response to ensure consistency
        set({
          announcements: get().announcements.map(a =>
            a.id === id ? { ...result.data, id: result.data.id || result.data._id } : a
          ),
        });
      }
    } catch (error) {
      console.error('Failed to persist reaction:', error);
    }
  },

  votePoll: async (id, optionIds, oderId) => {
    // Update vote counts locally (optimistic update)
    set({
      announcements: get().announcements.map(a => {
        if (a.id === id && a.isPoll && a.pollOptions) {
          const updatedOptions = a.pollOptions.map(option => {
            if (optionIds.includes(option.id)) {
              return {
                ...option,
                votes: (option.votes || 0) + 1,
                votedBy: [...(option.votedBy || []), oderId]
              };
            }
            return option;
          });
          return {
            ...a,
            pollOptions: updatedOptions,
            totalVotes: (a.totalVotes || 0) + 1
          };
        }
        return a;
      })
    });

    // Persist vote to backend
    try {
      await fetch(`${API_URL}/announcements/${id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionIds, oderId }),
      });
    } catch (error) {
      console.error('Failed to persist poll vote:', error);
    }
  },
}));
