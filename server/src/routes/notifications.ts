import express, { Request, Response } from 'express';
import Notification from '../models/Notification';

const router = express.Router();

console.log('[Notifications] Route file loaded');

// Get unread notification count
router.get('/unread/count', async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.query;

    const query: Record<string, unknown> = { isRead: false };
    
    // Build $or conditions for matching notifications
    const orConditions: Record<string, unknown>[] = [];
    
    // Match notifications sent to this specific user
    if (userId) {
      orConditions.push({ userId: userId as string });
    }
    
    // Match notifications sent to this role (for approvers, IT admins, etc.)
    if (role && role !== 'all') {
      orConditions.push({ role: role as string });
    }
    
    // Always include broadcast notifications
    orConditions.push({ role: 'all' });
    
    if (orConditions.length > 0) {
      query.$or = orConditions;
    }

    const count = await Notification.countDocuments(query);

    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get notification count' });
  }
});

// Get all notifications for a user
router.get('/', async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.query;

    const query: Record<string, unknown> = {};
    
    // Build $or conditions for matching notifications
    const orConditions: Record<string, unknown>[] = [];
    
    // Match notifications sent to this specific user
    if (userId) {
      orConditions.push({ userId: userId as string });
    }
    
    // Match notifications sent to this role (for approvers, IT admins, etc.)
    if (role && role !== 'all') {
      orConditions.push({ role: role as string });
    }
    
    // Always include broadcast notifications
    orConditions.push({ role: 'all' });
    
    if (orConditions.length > 0) {
      query.$or = orConditions;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(100);

    // Map _id to id for frontend compatibility
    const notificationsWithId = notifications.map(n => ({
      ...n.toObject(),
      id: n._id.toString()
    }));

    res.json({ success: true, data: notificationsWithId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to read notifications' });
  }
});

// Create a new notification
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, description, type, userId, role, meta } = req.body;

    if (!title || !description || !type || !role) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: title, description, type, role' 
      });
    }

    const notification = new Notification({
      title,
      description,
      type,
      userId,
      role,
      meta: meta || {}
    });

    await notification.save();

    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create notification' });
  }
});

// Mark notification as read
router.patch('/:id/read', async (req: Request, res: Response) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true, runValidators: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    // Map _id to id for frontend compatibility
    const notificationWithId = {
      ...notification.toObject(),
      id: notification._id.toString()
    };

    res.json({ success: true, data: notificationWithId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.patch('/read-all', async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.query;

    const query: Record<string, unknown> = { isRead: false };
    
    // Build $or conditions for matching notifications
    const orConditions: Record<string, unknown>[] = [];
    
    // Match notifications sent to this specific user
    if (userId) {
      orConditions.push({ userId: userId as string });
    }
    
    // Match notifications sent to this role (for approvers, IT admins, etc.)
    if (role && role !== 'all') {
      orConditions.push({ role: role as string });
    }
    
    // Always include broadcast notifications
    orConditions.push({ role: 'all' });
    
    if (orConditions.length > 0) {
      query.$or = orConditions;
    }

    await Notification.updateMany(query, { isRead: true });

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to mark notifications as read' });
  }
});

// Delete a notification
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete notification' });
  }
});

// Clear all notifications for a user
router.delete('/clear-all', async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.query;

    console.log('[Clear All] Request received:', { userId, role });

    if (!userId && !role) {
      console.log('[Clear All] No userId or role provided');
      return res.status(400).json({ 
        success: false, 
        message: 'userId or role is required' 
      });
    }

    const query: Record<string, unknown> = {};
    
    // Build $or conditions for matching notifications
    const orConditions: Record<string, unknown>[] = [];
    
    // Match notifications sent to this specific user
    if (userId) {
      orConditions.push({ userId: userId as string });
    }
    
    // Match notifications sent to this role (for approvers, IT admins, etc.)
    if (role && role !== 'all') {
      orConditions.push({ role: role as string });
    }
    
    // Always include broadcast notifications
    orConditions.push({ role: 'all' });
    
    if (orConditions.length > 0) {
      query.$or = orConditions;
    }

    console.log('[Clear All] Delete query:', JSON.stringify(query, null, 2));

    const result = await Notification.deleteMany(query);
    
    console.log('[Clear All] Deleted count:', result.deletedCount);

    res.json({ 
      success: true, 
      message: 'All notifications cleared',
      deletedCount: result.deletedCount 
    });
  } catch (error: any) {
    console.error('[Clear All] Error:', error);
    console.error('[Clear All] Error stack:', error.stack);
    console.error('[Clear All] Error message:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to clear notifications', 
      error: error.message || String(error) 
    });
  }
});

export default router;

