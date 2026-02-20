import express, { Request, Response } from 'express';
import UDA from '../models/UDA';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get all UDA configurations with optional filters
router.get('/', authenticateToken, async (req: Request, res: Response) => {
    try {
        const { active, type, search } = req.query;

        const query: any = {};

        if (active) {
            query.active = active;
        }

        if (type) {
            query.type = type;
        }

        if (search) {
            query.$or = [
                { udaNumber: { $regex: search, $options: 'i' } },
                { name: { $regex: search, $options: 'i' } },
            ];
        }

        const udas = await UDA.find(query).sort({ createdAt: -1 });
        res.json(udas);
    } catch (error) {
        console.error('Error fetching UDA configurations:', error);
        res.status(500).json({ message: 'Failed to fetch UDA configurations' });
    }
});

// Get a single UDA configuration by ID
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
        const uda = await UDA.findById(req.params.id);

        if (!uda) {
            return res.status(404).json({ message: 'UDA configuration not found' });
        }

        res.json(uda);
    } catch (error) {
        console.error('Error fetching UDA configuration:', error);
        res.status(500).json({ message: 'Failed to fetch UDA configuration' });
    }
});

// Create a new UDA configuration
router.post('/', authenticateToken, async (req: Request, res: Response) => {
    try {
        const {
            udaNumber,
            name,
            description,
            parentUDA,
            type,
            billable,
            projectRequired,
            active,
        } = req.body;

        // Check if UDA number already exists
        const existingUDA = await UDA.findOne({ udaNumber });
        if (existingUDA) {
            return res.status(400).json({ message: 'UDA number already exists' });
        }

        const newUDA = new UDA({
            udaNumber,
            name,
            description,
            parentUDA: parentUDA || '',
            type,
            billable,
            projectRequired,
            active,
        });

        const savedUDA = await newUDA.save();
        res.status(201).json(savedUDA);
    } catch (error) {
        console.error('Error creating UDA configuration:', error);
        res.status(500).json({ message: 'Failed to create UDA configuration' });
    }
});

// Update a UDA configuration
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
        const {
            udaNumber,
            name,
            description,
            parentUDA,
            type,
            billable,
            projectRequired,
            active,
        } = req.body;

        // If udaNumber is being changed, check if it already exists
        if (udaNumber) {
            const existingUDA = await UDA.findOne({
                udaNumber,
                _id: { $ne: req.params.id },
            });

            if (existingUDA) {
                return res.status(400).json({ message: 'UDA number already exists' });
            }
        }

        const updatedUDA = await UDA.findByIdAndUpdate(
            req.params.id,
            {
                udaNumber,
                name,
                description,
                parentUDA: parentUDA || '',
                type,
                billable,
                projectRequired,
                active,
            },
            { new: true, runValidators: true }
        );

        if (!updatedUDA) {
            return res.status(404).json({ message: 'UDA configuration not found' });
        }

        res.json(updatedUDA);
    } catch (error) {
        console.error('Error updating UDA configuration:', error);
        res.status(500).json({ message: 'Failed to update UDA configuration' });
    }
});

// Delete a UDA configuration
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
        const deletedUDA = await UDA.findByIdAndDelete(req.params.id);

        if (!deletedUDA) {
            return res.status(404).json({ message: 'UDA configuration not found' });
        }

        res.json({ message: 'UDA configuration deleted successfully' });
    } catch (error) {
        console.error('Error deleting UDA configuration:', error);
        res.status(500).json({ message: 'Failed to delete UDA configuration' });
    }
});

export default router;
