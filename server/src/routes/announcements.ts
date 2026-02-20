import express, { Request, Response } from 'express';
import Announcement from '../models/Announcement';
import { announcementValidation } from '../middleware/validation';

const router = express.Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.json({ success: true, data: announcements });
  } catch (error) {
    console.error('Failed to read announcements:', error);
    res.status(500).json({ success: false, message: 'Failed to read announcements' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }
    res.json({ success: true, data: announcement });
  } catch (error) {
    console.error('Failed to read announcement:', error);
    res.status(500).json({ success: false, message: 'Failed to read announcement' });
  }
});

router.post('/', announcementValidation.create, async (req: Request, res: Response) => {
  try {
    const announcement = new Announcement(req.body);
    await announcement.save();
    res.status(201).json({ success: true, data: announcement });
  } catch (error) {
    console.error('Failed to create announcement:', error);
    res.status(500).json({ success: false, message: 'Failed to create announcement' });
  }
});

router.put('/:id', announcementValidation.update, async (req: Request, res: Response) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, {  new: true , runValidators: true });
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }
    res.json({ success: true, data: announcement });
  } catch (error) {
    console.error('Failed to update announcement:', error);
    res.status(500).json({ success: false, message: 'Failed to update announcement' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }
    res.json({ success: true, message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Failed to delete announcement:', error);
    res.status(500).json({ success: false, message: 'Failed to delete announcement' });
  }
});

// Toggle like on announcement
router.post('/:id/like', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    const likedBy = announcement.likedBy || [];
    const userIndex = likedBy.indexOf(userId);

    if (userIndex > -1) {
      // User already liked, remove like
      likedBy.splice(userIndex, 1);
      announcement.likes = Math.max(0, (announcement.likes || 1) - 1);
    } else {
      // Add like
      likedBy.push(userId);
      announcement.likes = (announcement.likes || 0) + 1;
    }

    announcement.likedBy = likedBy;
    await announcement.save();

    res.json({ success: true, data: announcement });
  } catch (error) {
    console.error('Failed to toggle like:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle like' });
  }
});

// Add comment to announcement
router.post('/:id/comment', async (req: Request, res: Response) => {
  try {
    const { author, text, time } = req.body;
    if (!author || !text) {
      return res.status(400).json({ success: false, message: 'Author and text are required' });
    }

    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    const comments = announcement.comments || [];
    const newComment = {
      id: comments.length + 1,
      author,
      text,
      time: time || new Date().toLocaleString()
    };

    comments.push(newComment);
    announcement.comments = comments;
    await announcement.save();

    res.json({ success: true, data: announcement });
  } catch (error) {
    console.error('Failed to add comment:', error);
    res.status(500).json({ success: false, message: 'Failed to add comment' });
  }
});

// Add or update reaction on announcement
router.post('/:id/reaction', async (req: Request, res: Response) => {
  try {
    const { oderId, userName, emoji, label } = req.body;
    if (!oderId || !userName || !emoji || !label) {
      return res.status(400).json({ success: false, message: 'oderId, userName, emoji, and label are required' });
    }

    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    const reactions = announcement.reactions || [];
    const existingReactionIndex = reactions.findIndex((r: any) => r.oderId === oderId);
    const timestamp = new Date().toISOString();

    if (existingReactionIndex >= 0) {
      // User already reacted
      if (reactions[existingReactionIndex].emoji === emoji) {
        // Same emoji - remove reaction
        reactions.splice(existingReactionIndex, 1);
        announcement.likes = Math.max(0, (announcement.likes || 1) - 1);
        // Remove from likedBy
        const likedBy = announcement.likedBy || [];
        const userIndex = likedBy.indexOf(oderId);
        if (userIndex > -1) {
          likedBy.splice(userIndex, 1);
          announcement.likedBy = likedBy;
        }
      } else {
        // Different emoji - update reaction
        reactions[existingReactionIndex] = { oderId, userName, emoji, label, timestamp };
      }
    } else {
      // New reaction
      reactions.push({ oderId, userName, emoji, label, timestamp });
      announcement.likes = (announcement.likes || 0) + 1;
      // Add to likedBy if not already there
      const likedBy = announcement.likedBy || [];
      if (!likedBy.includes(oderId)) {
        likedBy.push(oderId);
        announcement.likedBy = likedBy;
      }
    }

    announcement.reactions = reactions;
    await announcement.save();

    res.json({ success: true, data: announcement });
  } catch (error) {
    console.error('Failed to add reaction:', error);
    res.status(500).json({ success: false, message: 'Failed to add reaction' });
  }
});

// Vote on poll
router.post('/:id/vote', async (req: Request, res: Response) => {
  try {
    const { optionIds, oderId } = req.body;
    if (!optionIds || !Array.isArray(optionIds) || optionIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Option IDs are required' });
    }
    if (!oderId) {
      return res.status(400).json({ success: false, message: 'Voter ID is required' });
    }

    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    if (!announcement.isPoll || !announcement.pollOptions) {
      return res.status(400).json({ success: false, message: 'This announcement is not a poll' });
    }

    // Check if user has already voted
    const hasAlreadyVoted = announcement.pollOptions.some(
      (option: any) => option.votedBy && option.votedBy.includes(oderId)
    );

    if (hasAlreadyVoted) {
      return res.status(400).json({ success: false, message: 'User has already voted on this poll' });
    }

    // Update vote counts for selected options
    announcement.pollOptions = announcement.pollOptions.map((option: any) => {
      if (optionIds.includes(option.id)) {
        return {
          ...option.toObject ? option.toObject() : option,
          votes: (option.votes || 0) + 1,
          votedBy: [...(option.votedBy || []), oderId]
        };
      }
      return option.toObject ? option.toObject() : option;
    });

    // Update total votes
    announcement.totalVotes = (announcement.totalVotes || 0) + 1;

    await announcement.save();

    res.json({ success: true, data: announcement });
  } catch (error) {
    console.error('Failed to vote on poll:', error);
    res.status(500).json({ success: false, message: 'Failed to vote on poll' });
  }
});

export default router;

