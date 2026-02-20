import express from 'express';
import {
  getFinancialLines,
  getActiveFinancialLines,
  getFinancialLineById,
  createFinancialLine,
  updateFinancialLine,
  deleteFinancialLine,
  getFinancialLineStats
} from '../controllers/financialLineController';

const router = express.Router();

// Get all financial lines with filters
router.get('/', getFinancialLines);

// Get active financial lines only
router.get('/active', getActiveFinancialLines);

// Get stats
router.get('/stats', getFinancialLineStats);

// Get financial line by ID
router.get('/:id', getFinancialLineById);

// Create new financial line
router.post('/', createFinancialLine);

// Update financial line
router.put('/:id', updateFinancialLine);

// Delete financial line
router.delete('/:id', deleteFinancialLine);

export default router;
