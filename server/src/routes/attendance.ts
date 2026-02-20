import express, { Request, Response } from 'express';
import Attendance from '../models/Attendance';
import { attendanceValidation } from '../middleware/validation';

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { employeeId, startDate, endDate } = req.query;
    const query: Record<string, unknown> = {};
    
    if (employeeId) query.employeeId = employeeId;
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }
    
    const attendance = await Attendance.find(query).sort({ date: -1 });
    res.json({ success: true, data: attendance });
  } catch (error) {
    console.error('Failed to read attendance:', error);
    res.status(500).json({ success: false, message: 'Failed to read attendance' });
  }
});

router.post('/', attendanceValidation.create, async (req: Request, res: Response) => {
  try {
    const attendance = new Attendance(req.body);
    await attendance.save();
    res.status(201).json({ success: true, data: attendance });
  } catch (error) {
    console.error('Failed to create attendance:', error);
    res.status(500).json({ success: false, message: 'Failed to create attendance' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const attendance = await Attendance.findByIdAndUpdate(req.params.id, req.body, {  new: true , runValidators: true });
    if (!attendance) {
      return res.status(404).json({ success: false, message: 'Attendance not found' });
    }
    res.json({ success: true, data: attendance });
  } catch (error) {
    console.error('Failed to update attendance:', error);
    res.status(500).json({ success: false, message: 'Failed to update attendance' });
  }
});

export default router;

