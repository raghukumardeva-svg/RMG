import express from 'express';
import {
  getCustomerPOs,
  getActiveCustomerPOs,
  getCustomerPOById,
  createCustomerPO,
  updateCustomerPO,
  deleteCustomerPO,
  getCustomerPOStats
} from '../controllers/customerPOController';

const router = express.Router();

// Get all customer POs with filters
router.get('/', getCustomerPOs);

// Get active customer POs only
router.get('/active', getActiveCustomerPOs);

// Get stats
router.get('/stats', getCustomerPOStats);

// Get customer PO by ID
router.get('/:id', getCustomerPOById);

// Create new customer PO
router.post('/', createCustomerPO);

// Update customer PO
router.put('/:id', updateCustomerPO);

// Delete customer PO
router.delete('/:id', deleteCustomerPO);

export default router;
