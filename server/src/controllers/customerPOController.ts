import type { Request, Response } from 'express';
import CustomerPO from '../models/CustomerPO';
import Customer from '../models/Customer';
import Project from '../models/Project';

// Get all customer POs with filters
export const getCustomerPOs = async (req: Request, res: Response) => {
  try {
    const { status, customerId, projectId, bookingEntity, search } = req.query;
    const query: Record<string, unknown> = {};

    if (status) query.status = status;
    if (customerId) query.customerId = customerId;
    if (projectId) query.projectId = projectId;
    if (bookingEntity) query.bookingEntity = bookingEntity;
    
    if (search) {
      query.$or = [
        { contractNo: { $regex: search, $options: 'i' } },
        { poNo: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } }
      ];
    }

    const pos = await CustomerPO.find(query)
      .populate('customerId', 'customerName customerNo')
      .populate('projectId', 'projectName projectId')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: pos });
  } catch (error: unknown) {
    console.error('Failed to fetch customer POs:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch customer POs';
    res.status(500).json({ success: false, message });
  }
};

// Get active customer POs
export const getActiveCustomerPOs = async (req: Request, res: Response) => {
  try {
    const pos = await CustomerPO.find({ status: 'Active' })
      .populate('customerId', 'customerName customerNo')
      .populate('projectId', 'projectName projectId')
      .sort({ poNo: 1 });
    
    res.json({ success: true, data: pos });
  } catch (error: unknown) {
    console.error('Failed to fetch active customer POs:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch active customer POs';
    res.status(500).json({ success: false, message });
  }
};

// Get customer PO by ID
export const getCustomerPOById = async (req: Request, res: Response) => {
  try {
    const po = await CustomerPO.findById(req.params.id)
      .populate('customerId', 'customerName customerNo')
      .populate('projectId', 'projectName projectId');
    
    if (!po) {
      return res.status(404).json({ success: false, message: 'Customer PO not found' });
    }
    
    res.json({ success: true, data: po });
  } catch (error: unknown) {
    console.error('Failed to fetch customer PO:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch customer PO';
    res.status(500).json({ success: false, message });
  }
};

// Create new customer PO
export const createCustomerPO = async (req: Request, res: Response) => {
  try {
    // Validate customer exists
    if (req.body.customerId) {
      const customer = await Customer.findById(req.body.customerId);
      if (!customer) {
        return res.status(400).json({ success: false, message: 'Customer not found' });
      }
      req.body.customerName = customer.customerName;
    }

    // Validate project exists
    if (req.body.projectId) {
      const project = await Project.findById(req.body.projectId);
      if (!project) {
        return res.status(400).json({ success: false, message: 'Project not found' });
      }

      // Validate poValidityDate >= project endDate
      if (req.body.poValidityDate && project.endDate) {
        const poValidity = new Date(req.body.poValidityDate);
        const projectEnd = new Date(project.endDate);
        if (poValidity < projectEnd) {
          return res.status(400).json({ 
            success: false, 
            message: 'PO validity date must be greater than or equal to project end date' 
          });
        }
      }
    }

    const po = new CustomerPO(req.body);
    await po.save();
    
    const populatedPO = await CustomerPO.findById(po._id)
      .populate('customerId', 'customerName customerNo')
      .populate('projectId', 'projectName projectId');
    
    res.status(201).json({ success: true, data: populatedPO });
  } catch (error: unknown) {
    console.error('Failed to create customer PO:', error);
    const message = error instanceof Error ? error.message : 'Failed to create customer PO';
    res.status(500).json({ success: false, message });
  }
};

// Update customer PO
export const updateCustomerPO = async (req: Request, res: Response) => {
  try {
    // Validate project if being updated
    if (req.body.projectId) {
      const project = await Project.findById(req.body.projectId);
      if (!project) {
        return res.status(400).json({ success: false, message: 'Project not found' });
      }

      // Validate poValidityDate >= project endDate
      if (req.body.poValidityDate && project.endDate) {
        const poValidity = new Date(req.body.poValidityDate);
        const projectEnd = new Date(project.endDate);
        if (poValidity < projectEnd) {
          return res.status(400).json({ 
            success: false, 
            message: 'PO validity date must be greater than or equal to project end date' 
          });
        }
      }
    }

    const po = await CustomerPO.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('customerId', 'customerName customerNo')
      .populate('projectId', 'projectName projectId');

    if (!po) {
      return res.status(404).json({ success: false, message: 'Customer PO not found' });
    }

    res.json({ success: true, data: po });
  } catch (error: unknown) {
    console.error('Failed to update customer PO:', error);
    const message = error instanceof Error ? error.message : 'Failed to update customer PO';
    res.status(500).json({ success: false, message });
  }
};

// Delete customer PO
export const deleteCustomerPO = async (req: Request, res: Response) => {
  try {
    const po = await CustomerPO.findByIdAndDelete(req.params.id);
    
    if (!po) {
      return res.status(404).json({ success: false, message: 'Customer PO not found' });
    }
    
    res.json({ success: true, message: 'Customer PO deleted successfully' });
  } catch (error: unknown) {
    console.error('Failed to delete customer PO:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete customer PO';
    res.status(500).json({ success: false, message });
  }
};

// Get customer PO stats
export const getCustomerPOStats = async (req: Request, res: Response) => {
  try {
    const [total, active, closed, expired, totalAmount] = await Promise.all([
      CustomerPO.countDocuments(),
      CustomerPO.countDocuments({ status: 'Active' }),
      CustomerPO.countDocuments({ status: 'Closed' }),
      CustomerPO.countDocuments({ status: 'Expired' }),
      CustomerPO.aggregate([
        { $match: { status: 'Active' } },
        { $group: { _id: null, total: { $sum: '$poAmount' } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        total,
        active,
        closed,
        expired,
        totalActiveAmount: totalAmount[0]?.total || 0
      }
    });
  } catch (error: unknown) {
    console.error('Failed to fetch customer PO stats:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch stats';
    res.status(500).json({ success: false, message });
  }
};
