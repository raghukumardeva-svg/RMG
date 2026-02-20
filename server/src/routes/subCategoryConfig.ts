import express, { Request, Response } from 'express';
import SubCategoryConfig from '../models/SubCategoryConfig';

const router = express.Router();

// Get all subcategory configurations (grouped by high-level category)
router.get('/', async (req: Request, res: Response) => {
  try {
    const configs = await SubCategoryConfig.find({ isActive: true }).sort({ highLevelCategory: 1, order: 1, subCategory: 1 });

    // Transform into nested object structure for frontend compatibility
    const mappingObject: Record<string, Record<string, { requiresApproval: boolean; processingQueue: string; specialistQueue: string }>> = {};

    configs.forEach(config => {
      if (!mappingObject[config.highLevelCategory]) {
        mappingObject[config.highLevelCategory] = {};
      }

      mappingObject[config.highLevelCategory][config.subCategory] = {
        requiresApproval: config.requiresApproval,
        processingQueue: config.processingQueue,
        specialistQueue: config.specialistQueue
      };
    });

    res.json({ success: true, data: mappingObject });
  } catch (error) {
    console.error('Failed to fetch subcategory configs:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch subcategory configurations' });
  }
});

// Get configurations for a specific high-level category
router.get('/category/:category', async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const configs = await SubCategoryConfig.find({
      highLevelCategory: category,
      isActive: true
    }).sort({ order: 1, subCategory: 1 });

    res.json({ success: true, data: configs });
  } catch (error) {
    console.error('Failed to fetch category configs:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch category configurations' });
  }
});

// Get specific subcategory configuration
router.get('/:category/:subCategory', async (req: Request, res: Response) => {
  try {
    const { category, subCategory } = req.params;
    const config = await SubCategoryConfig.findOne({
      highLevelCategory: category,
      subCategory: decodeURIComponent(subCategory),
      isActive: true
    });

    if (!config) {
      return res.status(404).json({ success: false, message: 'Configuration not found' });
    }

    res.json({ success: true, data: config });
  } catch (error) {
    console.error('Failed to fetch config:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch configuration' });
  }
});

// Create new subcategory configuration
router.post('/', async (req: Request, res: Response) => {
  try {
    const config = new SubCategoryConfig(req.body);
    await config.save();
    res.status(201).json({ success: true, data: config });
  } catch (error) {
    console.error('Failed to create subcategory config:', error);
    res.status(500).json({ success: false, message: 'Failed to create configuration' });
  }
});

// Update subcategory configuration
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const config = await SubCategoryConfig.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!config) {
      return res.status(404).json({ success: false, message: 'Configuration not found' });
    }

    res.json({ success: true, data: config });
  } catch (error) {
    console.error('Failed to update config:', error);
    res.status(500).json({ success: false, message: 'Failed to update configuration' });
  }
});

// Delete (soft delete) subcategory configuration
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const config = await SubCategoryConfig.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      {  new: true , runValidators: true }
    );

    if (!config) {
      return res.status(404).json({ success: false, message: 'Configuration not found' });
    }

    res.json({ success: true, message: 'Configuration deactivated successfully' });
  } catch (error) {
    console.error('Failed to delete config:', error);
    res.status(500).json({ success: false, message: 'Failed to delete configuration' });
  }
});

export default router;

