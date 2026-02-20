import express, { Request, Response } from 'express';
import ITSpecialist from '../models/ITSpecialist';

const router = express.Router();

// Get all IT specialists
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, specialization } = req.query;
    const query: Record<string, unknown> = {};
    
    if (status) query.status = status;
    if (specialization) query.specializations = specialization;
    
    const specialists = await ITSpecialist.find(query).sort({ name: 1 });
    
    res.json({ success: true, data: specialists });
  } catch (error) {
    console.error('Failed to fetch IT specialists:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch IT specialists' });
  }
});

// Get specialists by specialization
router.get('/specialization/:specialization', async (req: Request, res: Response) => {
  try {
    const { specialization } = req.params;
    
    const specialists = await ITSpecialist.find({
      specializations: specialization,
      status: 'active'
    }).sort({ activeTicketCount: 1 }); // Sort by workload
    
    res.json({ success: true, data: specialists });
  } catch (error) {
    console.error('Failed to fetch specialists by specialization:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch specialists' });
  }
});

// Get specialist by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const specialist = await ITSpecialist.findById(req.params.id);
    
    if (!specialist) {
      return res.status(404).json({ success: false, message: 'Specialist not found' });
    }
    
    res.json({ success: true, data: specialist });
  } catch (error) {
    console.error('Failed to fetch specialist:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch specialist' });
  }
});

// Get specialist by employee ID
router.get('/employee/:employeeId', async (req: Request, res: Response) => {
  try {
    const specialist = await ITSpecialist.findOne({ employeeId: req.params.employeeId });
    
    if (!specialist) {
      return res.status(404).json({ success: false, message: 'Specialist not found' });
    }
    
    res.json({ success: true, data: specialist });
  } catch (error) {
    console.error('Failed to fetch specialist:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch specialist' });
  }
});

// Create IT specialist
router.post('/', async (req: Request, res: Response) => {
  try {
    const specialist = new ITSpecialist(req.body);
    await specialist.save();
    
    res.status(201).json({ success: true, data: specialist });
  } catch (error: unknown) {
    console.error('Failed to create specialist:', error);
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Specialist with this email or employee ID already exists' 
      });
    }
    
    res.status(500).json({ success: false, message: 'Failed to create specialist' });
  }
});

// Update specialist
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const specialist = await ITSpecialist.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    if (!specialist) {
      return res.status(404).json({ success: false, message: 'Specialist not found' });
    }
    
    res.json({ success: true, data: specialist });
  } catch (error) {
    console.error('Failed to update specialist:', error);
    res.status(500).json({ success: false, message: 'Failed to update specialist' });
  }
});

// Increment active ticket count
router.post('/:id/increment-tickets', async (req: Request, res: Response) => {
  try {
    const specialist = await ITSpecialist.findByIdAndUpdate(
      req.params.id,
      { $inc: { activeTicketCount: 1 } },
      {  new: true , runValidators: true }
    );
    
    if (!specialist) {
      return res.status(404).json({ success: false, message: 'Specialist not found' });
    }
    
    res.json({ success: true, data: specialist });
  } catch (error) {
    console.error('Failed to increment ticket count:', error);
    res.status(500).json({ success: false, message: 'Failed to update ticket count' });
  }
});

// Decrement active ticket count
router.post('/:id/decrement-tickets', async (req: Request, res: Response) => {
  try {
    const specialist = await ITSpecialist.findById(req.params.id);
    
    if (!specialist) {
      return res.status(404).json({ success: false, message: 'Specialist not found' });
    }
    
    // Don't allow negative counts
    if (specialist.activeTicketCount > 0) {
      specialist.activeTicketCount -= 1;
      await specialist.save();
    }
    
    res.json({ success: true, data: specialist });
  } catch (error) {
    console.error('Failed to decrement ticket count:', error);
    res.status(500).json({ success: false, message: 'Failed to update ticket count' });
  }
});

// Delete specialist
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const specialist = await ITSpecialist.findByIdAndDelete(req.params.id);
    
    if (!specialist) {
      return res.status(404).json({ success: false, message: 'Specialist not found' });
    }
    
    res.json({ success: true, message: 'Specialist deleted successfully' });
  } catch (error) {
    console.error('Failed to delete specialist:', error);
    res.status(500).json({ success: false, message: 'Failed to delete specialist' });
  }
});

export default router;

