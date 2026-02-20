import express, { Request, Response } from 'express';
import Project from '../models/Project';

const router = express.Router();

// Get all projects (with optional filters)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, region, billingType, customerId, search } = req.query;
    const query: Record<string, unknown> = {};

    if (status) query.status = status;
    if (region) query.region = region;
    if (billingType) query.billingType = billingType;
    if (customerId) query.customerId = customerId;
    if (search) {
      query.$or = [
        { projectName: { $regex: search, $options: 'i' } },
        { projectId: { $regex: search, $options: 'i' } },
        { accountName: { $regex: search, $options: 'i' } }
      ];
    }

    const projects = await Project.find(query)
      .populate('customerId', 'customerName customerNo')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: projects });
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch projects' });
  }
});

// Get active projects only
router.get('/active', async (req: Request, res: Response) => {
  try {
    const projects = await Project.find({ status: 'active' }).sort({ name: 1 });
    res.json({ success: true, data: projects });
  } catch (error) {
    console.error('Failed to fetch active projects:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch active projects' });
  }
});

// Get project by project ID (must come before /:id route)
router.get('/by-project-id/:projectId', async (req: Request, res: Response) => {
  try {
    console.log('🔍 Looking for project with projectId:', req.params.projectId);
    const project = await Project.findOne({ projectId: req.params.projectId });
    if (!project) {
      console.log('⚠️ Project not found:', req.params.projectId);
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    console.log('✅ Found project:', project.projectName);
    res.json({ success: true, data: project });
  } catch (error) {
    console.error('Failed to fetch project:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch project' });
  }
});

// Get project by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    res.json({ success: true, data: project });
  } catch (error) {
    console.error('Failed to fetch project:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch project' });
  }
});

// Create new project
router.post('/', async (req: Request, res: Response) => {
  try {
    const project = new Project(req.body);
    await project.save();
    res.status(201).json({ success: true, data: project });
  } catch (error) {
    console.error('Failed to create project:', error);
    res.status(500).json({ success: false, message: 'Failed to create project' });
  }
});

// Update project
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    res.json({ success: true, data: project });
  } catch (error) {
    console.error('Failed to update project:', error);
    res.status(500).json({ success: false, message: 'Failed to update project' });
  }
});

// Delete project
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Failed to delete project:', error);
    res.status(500).json({ success: false, message: 'Failed to delete project' });
  }
});

// Update project status
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    res.json({ success: true, data: project });
  } catch (error) {
    console.error('Failed to update project status:', error);
    res.status(500).json({ success: false, message: 'Failed to update project status' });
  }
});

export default router;

