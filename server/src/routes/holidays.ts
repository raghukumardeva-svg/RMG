import express, { Request, Response } from 'express';
import Holiday from '../models/Holiday';

const router = express.Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const holidays = await Holiday.find().sort({ date: 1 });
    res.json({ success: true, data: holidays });
  } catch (error) {
    console.error('Failed to read holidays:', error);
    res.status(500).json({ success: false, message: 'Failed to read holidays' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const holiday = new Holiday(req.body);
    await holiday.save();
    res.status(201).json({ success: true, data: holiday });
  } catch (error) {
    console.error('Failed to create holiday:', error);
    res.status(500).json({ success: false, message: 'Failed to create holiday' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const holiday = await Holiday.findByIdAndUpdate(req.params.id, req.body, {  new: true , runValidators: true });
    if (!holiday) {
      return res.status(404).json({ success: false, message: 'Holiday not found' });
    }
    res.json({ success: true, data: holiday });
  } catch (error) {
    console.error('Failed to update holiday:', error);
    res.status(500).json({ success: false, message: 'Failed to update holiday' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const holiday = await Holiday.findByIdAndDelete(req.params.id);
    if (!holiday) {
      return res.status(404).json({ success: false, message: 'Holiday not found' });
    }
    res.json({ success: true, message: 'Holiday deleted successfully' });
  } catch (error) {
    console.error('Failed to delete holiday:', error);
    res.status(500).json({ success: false, message: 'Failed to delete holiday' });
  }
});

export default router;

