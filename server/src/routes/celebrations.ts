import express, { Request, Response } from 'express';
import Celebration from '../models/Celebration';

const router = express.Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const celebrations = await Celebration.find().sort({ date: -1 });
    res.json({ success: true, data: celebrations });
  } catch (error) {
    console.error('Failed to read celebrations:', error);
    res.status(500).json({ success: false, message: 'Failed to read celebrations' });
  }
});

export default router;

