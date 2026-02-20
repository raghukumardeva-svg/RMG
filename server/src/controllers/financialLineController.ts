import type { Request, Response } from 'express';
import FinancialLine from '../models/FinancialLine';
import Project from '../models/Project';
import CustomerPO from '../models/CustomerPO';

// Generate FL number
const generateFLNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const count = await FinancialLine.countDocuments({
    flNo: new RegExp(`^FL-${year}-`)
  });
  const sequence = String(count + 1).padStart(4, '0');
  return `FL-${year}-${sequence}`;
};

// Get all financial lines with filters
export const getFinancialLines = async (req: Request, res: Response) => {
  try {
    const { status, locationType, contractType, projectId, search } = req.query;
    const query: Record<string, unknown> = {};

    if (status) query.status = status;
    if (locationType) query.locationType = locationType;
    if (contractType) query.contractType = contractType;
    if (projectId) query.projectId = projectId;
    
    if (search) {
      query.$or = [
        { flNo: { $regex: search, $options: 'i' } },
        { flName: { $regex: search, $options: 'i' } }
      ];
    }

    const fls = await FinancialLine.find(query)
      .populate('projectId', 'projectName projectId')
      .populate('customerPOId', 'poNo contractNo poAmount')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: fls });
  } catch (error: unknown) {
    console.error('Failed to fetch financial lines:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch financial lines';
    res.status(500).json({ success: false, message });
  }
};

// Get active financial lines
export const getActiveFinancialLines = async (req: Request, res: Response) => {
  try {
    const fls = await FinancialLine.find({ status: 'Active' })
      .populate('projectId', 'projectName projectId')
      .populate('customerPOId', 'poNo contractNo')
      .sort({ flNo: 1 });
    
    res.json({ success: true, data: fls });
  } catch (error: unknown) {
    console.error('Failed to fetch active financial lines:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch active financial lines';
    res.status(500).json({ success: false, message });
  }
};

// Get financial line by ID
export const getFinancialLineById = async (req: Request, res: Response) => {
  try {
    const fl = await FinancialLine.findById(req.params.id)
      .populate('projectId', 'projectName projectId startDate endDate billingType currency')
      .populate('customerPOId', 'poNo contractNo poAmount poCurrency');
    
    if (!fl) {
      return res.status(404).json({ success: false, message: 'Financial line not found' });
    }
    
    res.json({ success: true, data: fl });
  } catch (error: unknown) {
    console.error('Failed to fetch financial line:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch financial line';
    res.status(500).json({ success: false, message });
  }
};

// Create new financial line
export const createFinancialLine = async (req: Request, res: Response) => {
  try {
    // Generate FL number if not provided
    if (!req.body.flNo) {
      req.body.flNo = await generateFLNumber();
    }

    // Validate project exists
    if (req.body.projectId) {
      const project = await Project.findById(req.body.projectId);
      if (!project) {
        return res.status(400).json({ success: false, message: 'Project not found' });
      }

      // Validate schedule dates within project dates
      if (req.body.scheduleStart && req.body.scheduleEnd) {
        const scheduleStart = new Date(req.body.scheduleStart);
        const scheduleEnd = new Date(req.body.scheduleEnd);
        const projectStart = new Date(project.startDate);
        const projectEnd = new Date(project.endDate);

        if (scheduleStart < projectStart || scheduleStart > projectEnd) {
          return res.status(400).json({
            success: false,
            message: 'Schedule start date must be within project dates'
          });
        }

        if (scheduleEnd < projectStart || scheduleEnd > projectEnd) {
          return res.status(400).json({
            success: false,
            message: 'Schedule end date must be within project dates'
          });
        }
      }

      // Inherit contract type from project if not provided
      if (!req.body.contractType) {
        req.body.contractType = project.billingType;
      }

      // Inherit currency from project if not provided
      if (!req.body.currency) {
        req.body.currency = project.currency;
      }
    }

    // Validate customer PO exists
    if (req.body.customerPOId) {
      const po = await CustomerPO.findById(req.body.customerPOId);
      if (!po) {
        return res.status(400).json({ success: false, message: 'Customer PO not found' });
      }

      // Auto-fill PO details
      req.body.poNo = po.poNo;
      req.body.contractNo = po.contractNo;

      // Calculate funding value
      if (req.body.unitRate && req.body.fundingUnits) {
        req.body.fundingValue = req.body.unitRate * req.body.fundingUnits;

        // Validate funding value doesn't exceed PO amount
        if (req.body.fundingValue > po.poAmount) {
          return res.status(400).json({
            success: false,
            message: 'Funding value exceeds PO amount'
          });
        }
      }
    }

    // Validate payment milestones sum equals funding value
    if (req.body.paymentMilestones && req.body.paymentMilestones.length > 0) {
      const totalMilestoneAmount = req.body.paymentMilestones.reduce(
        (sum: number, m: { milestoneAmount: number }) => sum + m.milestoneAmount,
        0
      );
      
      if (Math.abs(totalMilestoneAmount - req.body.fundingValue) > 0.01) {
        return res.status(400).json({
          success: false,
          message: 'Sum of milestone amounts must equal funding value'
        });
      }
    }

    // Validate revenue planning sum doesn't exceed funding value
    if (req.body.revenuePlanning && req.body.revenuePlanning.length > 0) {
      const totalPlannedRevenue = req.body.revenuePlanning.reduce(
        (sum: number, r: { plannedRevenue: number }) => sum + r.plannedRevenue,
        0
      );
      
      if (totalPlannedRevenue > req.body.fundingValue) {
        return res.status(400).json({
          success: false,
          message: 'Total planned revenue cannot exceed funding value'
        });
      }
    }

    const fl = new FinancialLine(req.body);
    await fl.save();
    
    const populatedFL = await FinancialLine.findById(fl._id)
      .populate('projectId', 'projectName projectId')
      .populate('customerPOId', 'poNo contractNo poAmount');
    
    res.status(201).json({ success: true, data: populatedFL });
  } catch (error: unknown) {
    console.error('Failed to create financial line:', error);
    const message = error instanceof Error ? error.message : 'Failed to create financial line';
    res.status(500).json({ success: false, message });
  }
};

// Update financial line
export const updateFinancialLine = async (req: Request, res: Response) => {
  try {
    // Validate project dates if being updated
    if (req.body.projectId) {
      const project = await Project.findById(req.body.projectId);
      if (!project) {
        return res.status(400).json({ success: false, message: 'Project not found' });
      }

      if (req.body.scheduleStart && req.body.scheduleEnd) {
        const scheduleStart = new Date(req.body.scheduleStart);
        const scheduleEnd = new Date(req.body.scheduleEnd);
        const projectStart = new Date(project.startDate);
        const projectEnd = new Date(project.endDate);

        if (scheduleStart < projectStart || scheduleStart > projectEnd) {
          return res.status(400).json({
            success: false,
            message: 'Schedule start date must be within project dates'
          });
        }

        if (scheduleEnd < projectStart || scheduleEnd > projectEnd) {
          return res.status(400).json({
            success: false,
            message: 'Schedule end date must be within project dates'
          });
        }
      }
    }

    // Recalculate funding value if rates changed
    if (req.body.unitRate && req.body.fundingUnits) {
      req.body.fundingValue = req.body.unitRate * req.body.fundingUnits;
    }

    const fl = await FinancialLine.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('projectId', 'projectName projectId')
      .populate('customerPOId', 'poNo contractNo poAmount');

    if (!fl) {
      return res.status(404).json({ success: false, message: 'Financial line not found' });
    }

    res.json({ success: true, data: fl });
  } catch (error: unknown) {
    console.error('Failed to update financial line:', error);
    const message = error instanceof Error ? error.message : 'Failed to update financial line';
    res.status(500).json({ success: false, message });
  }
};

// Delete financial line
export const deleteFinancialLine = async (req: Request, res: Response) => {
  try {
    const fl = await FinancialLine.findByIdAndDelete(req.params.id);
    
    if (!fl) {
      return res.status(404).json({ success: false, message: 'Financial line not found' });
    }
    
    res.json({ success: true, message: 'Financial line deleted successfully' });
  } catch (error: unknown) {
    console.error('Failed to delete financial line:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete financial line';
    res.status(500).json({ success: false, message });
  }
};

// Get financial line stats
export const getFinancialLineStats = async (req: Request, res: Response) => {
  try {
    const [total, active, draft, closed, totalFunding] = await Promise.all([
      FinancialLine.countDocuments(),
      FinancialLine.countDocuments({ status: 'Active' }),
      FinancialLine.countDocuments({ status: 'Draft' }),
      FinancialLine.countDocuments({ status: 'Closed' }),
      FinancialLine.aggregate([
        { $match: { status: 'Active' } },
        { $group: { _id: null, total: { $sum: '$fundingValue' } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        total,
        active,
        draft,
        closed,
        totalActiveFunding: totalFunding[0]?.total || 0
      }
    });
  } catch (error: unknown) {
    console.error('Failed to fetch financial line stats:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch stats';
    res.status(500).json({ success: false, message });
  }
};
