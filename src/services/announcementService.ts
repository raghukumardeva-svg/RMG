import apiClient from './api';

export interface Announcement {
  id?: number;
  _id?: string;
  title: string;
  description: string;
  author: string;
  role: string;
  date: string;
  time: string;
  avatar: string;
  priority: 'high' | 'medium' | 'low';
  likes?: number;
  liked?: boolean;
  likedBy?: string[];
  comments?: Array<{
    id: number;
    author: string;
    text: string;
    time: string;
  }>;
  imageUrl?: string;
}

export const announcementService = {
  async getAll() {
    const response = await apiClient.get('/announcements');
    return response.data.data;
  },

  async getById(id: string | number) {
    const response = await apiClient.get(`/announcements/${id}`);
    return response.data.data;
  },

  async create(data: Omit<Announcement, 'id' | '_id' | 'likes' | 'liked' | 'likedBy' | 'comments'>) {
    const response = await apiClient.post('/announcements', data);
    return response.data.data;
  },

  async update(id: string | number, data: Partial<Announcement>) {
    const response = await apiClient.put(`/announcements/${id}`, data);
    return response.data.data;
  },

  async delete(id: string | number) {
    const response = await apiClient.delete(`/announcements/${id}`);
    return response.data;
  },

  async toggleLike(id: string | number, userId: string) {
    const response = await apiClient.post(`/announcements/${id}/like`, { userId });
    return response.data.data;
  },

  async addComment(id: string | number, comment: { author: string; text: string; time: string }) {
    const response = await apiClient.post(`/announcements/${id}/comments`, comment);
    return response.data.data;
  }
};
