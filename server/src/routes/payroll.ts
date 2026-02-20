import express, { Request, Response } from 'express';
import Payroll from '../models/Payroll';
import { payrollValidation } from '../middleware/validation';

const router = express.Router();

// Get all payroll records (with optional filters)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { employeeId, year, month, status } = req.query;
    const query: Record<string, unknown> = {};

    if (employeeId) query.employeeId = employeeId;
    if (year) query.year = parseInt(year as string);
    if (month) query.month = month;
    if (status) query.paymentStatus = status;

    const payrolls = await Payroll.find(query).sort({ year: -1, month: -1 });
    res.json({ success: true, data: payrolls });
  } catch (error) {
    console.error('Failed to fetch payroll records:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch payroll records' });
  }
});

// Get payroll by employee ID
router.get('/employee/:employeeId', async (req: Request, res: Response) => {
  try {
    const payrolls = await Payroll.find({ employeeId: req.params.employeeId })
      .sort({ year: -1, month: -1 });
    res.json({ success: true, data: payrolls });
  } catch (error) {
    console.error('Failed to fetch employee payroll:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch employee payroll' });
  }
});

// Get current month payroll for an employee
router.get('/employee/:employeeId/current', async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const currentMonth = now.toLocaleString('en-US', { month: 'long' });
    const currentYear = now.getFullYear();

    const payroll = await Payroll.findOne({
      employeeId: req.params.employeeId,
      month: currentMonth,
      year: currentYear
    });

    if (!payroll) {
      return res.status(404).json({ success: false, message: 'Payroll not found for current month' });
    }

    res.json({ success: true, data: payroll });
  } catch (error) {
    console.error('Failed to fetch current payroll:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch current payroll' });
  }
});

// Get payroll by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) {
      return res.status(404).json({ success: false, message: 'Payroll record not found' });
    }
    res.json({ success: true, data: payroll });
  } catch (error) {
    console.error('Failed to fetch payroll:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch payroll' });
  }
});

// Create payroll record
router.post('/', payrollValidation.create, async (req: Request, res: Response) => {
  try {
    const payroll = new Payroll(req.body);
    await payroll.save();
    res.status(201).json({ success: true, data: payroll });
  } catch (error) {
    console.error('Failed to create payroll:', error);
    res.status(500).json({ success: false, message: 'Failed to create payroll record' });
  }
});

// Update payroll record
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const payroll = await Payroll.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!payroll) {
      return res.status(404).json({ success: false, message: 'Payroll record not found' });
    }

    res.json({ success: true, data: payroll });
  } catch (error) {
    console.error('Failed to update payroll:', error);
    res.status(500).json({ success: false, message: 'Failed to update payroll' });
  }
});

// Delete payroll record
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const payroll = await Payroll.findByIdAndDelete(req.params.id);
    if (!payroll) {
      return res.status(404).json({ success: false, message: 'Payroll record not found' });
    }
    res.json({ success: true, message: 'Payroll record deleted successfully' });
  } catch (error) {
    console.error('Failed to delete payroll:', error);
    res.status(500).json({ success: false, message: 'Failed to delete payroll' });
  }
});

// Update payment status
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { paymentStatus, paymentDate } = req.body;
    const updateData: { paymentStatus: string; paymentDate?: Date } = { paymentStatus };

    if (paymentDate) {
      updateData.paymentDate = new Date(paymentDate);
    }

    const payroll = await Payroll.findByIdAndUpdate(
      req.params.id,
      updateData,
      {  new: true , runValidators: true }
    );

    if (!payroll) {
      return res.status(404).json({ success: false, message: 'Payroll record not found' });
    }

    res.json({ success: true, data: payroll });
  } catch (error) {
    console.error('Failed to update payment status:', error);
    res.status(500).json({ success: false, message: 'Failed to update payment status' });
  }
});

export default router;

