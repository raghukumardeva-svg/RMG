import express, { Request, Response } from 'express';
import NewJoiner from '../models/NewJoiner';

const router = express.Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const newJoiners = await NewJoiner.find().sort({ joiningDate: -1 });
    res.json({ success: true, data: newJoiners });
  } catch (error) {
    console.error('Failed to read new joiners:', error);
    res.status(500).json({ success: false, message: 'Failed to read new joiners' });
  }
});

export default router;

