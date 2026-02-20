import express from 'express';
import CTCMaster from '../models/CTCMaster';

const router = express.Router();

/**
 * GET /api/ctc-master
 * Get all CTC records with optional filters
 */
router.get('/', async (req, res) => {
    try {
        const { search, currency } = req.query;
        const filter: Record<string, unknown> = {};

        // Apply search filter (employee ID or name)
        if (search) {
            filter.$or = [
                { employeeId: { $regex: search, $options: 'i' } },
                { employeeName: { $regex: search, $options: 'i' } }
            ];
        }

        // Apply currency filter
        if (currency && currency !== 'all') {
            filter.currency = currency;
        }

        const records = await CTCMaster.find(filter).sort({ createdAt: -1 });

        res.json(records);
    } catch (error) {
        console.error('Error fetching CTC records:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch CTC records'
        });
    }
});

/**
 * GET /api/ctc-master/:id
 * Get a single CTC record by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const record = await CTCMaster.findById(id);

        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'CTC record not found'
            });
        }

        res.json(record);
    } catch (error) {
        console.error('Error fetching CTC record:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch CTC record'
        });
    }
});

/**
 * POST /api/ctc-master
 * Create a new CTC record
 */
router.post('/', async (req, res) => {
    try {
        const {
            employeeId,
            employeeName,
            employeeEmail,
            latestAnnualCTC,
            latestActualCurrency,
            latestActualUOM,
            latestPlannedCTC,
            currency,
            uom
        } = req.body;

        // Validate required fields
        if (!employeeId || !employeeName || !employeeEmail) {
            return res.status(400).json({
                success: false,
                message: 'Employee ID, name, and email are required'
            });
        }

        // Check if record already exists for this employee
        const existingRecord = await CTCMaster.findOne({ employeeId });
        if (existingRecord) {
            return res.status(400).json({
                success: false,
                message: 'CTC record already exists for this employee'
            });
        }

        const newRecord = new CTCMaster({
            employeeId,
            employeeName,
            employeeEmail,
            latestAnnualCTC: latestAnnualCTC || 0,
            latestActualCurrency: latestActualCurrency || 'INR',
            latestActualUOM: latestActualUOM || 'Annual',
            latestPlannedCTC: latestPlannedCTC || 0,
            currency: currency || 'INR',
            uom: uom || 'Annual',
            ctcHistory: []
        });

        await newRecord.save();

        res.status(201).json(newRecord);
    } catch (error) {
        console.error('Error creating CTC record:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create CTC record'
        });
    }
});

/**
 * PUT /api/ctc-master/:id
 * Update an existing CTC record
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const updatedRecord = await CTCMaster.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedRecord) {
            return res.status(404).json({
                success: false,
                message: 'CTC record not found'
            });
        }

        res.json(updatedRecord);
    } catch (error) {
        console.error('Error updating CTC record:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update CTC record'
        });
    }
});

/**
 * DELETE /api/ctc-master/:id
 * Delete a CTC record
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const deletedRecord = await CTCMaster.findByIdAndDelete(id);

        if (!deletedRecord) {
            return res.status(404).json({
                success: false,
                message: 'CTC record not found'
            });
        }

        res.json({
            success: true,
            message: 'CTC record deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting CTC record:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete CTC record'
        });
    }
});

export default router;
