import { Request, Response } from 'express';
import Customer from '../models/Customer';
import logger from '../config/logger';

// Get all customers with optional filters
export const getCustomers = async (req: Request, res: Response) => {
  try {
    const { status, region, search } = req.query;
    const query: Record<string, unknown> = {};

    if (status) query.status = status;
    if (region) query.region = region;
    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { customerNo: { $regex: search, $options: 'i' } }
      ];
    }

    const customers = await Customer.find(query).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: customers,
      count: customers.length
    });
  } catch (error: unknown) {
    logger.error('Failed to fetch customers:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch customers';
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers',
      error: message
    });
  }
};

// Get customer by ID
export const getCustomerById = async (req: Request, res: Response) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      data: customer
    });
  } catch (error: unknown) {
    logger.error('Failed to fetch customer:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch customer';
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer',
      error: message
    });
  }
};

// Create new customer
export const createCustomer = async (req: Request, res: Response) => {
  try {
    const { customerNo, customerName, hubspotRecordId, industry, region, regionHead, status } = req.body;

    // Validate required fields
    if (!customerNo || !customerName || !industry || !region) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: customerNo, customerName, industry, region'
      });
    }

    // Check if customer number already exists
    const existingCustomer = await Customer.findOne({ customerNo });
    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: 'Customer number already exists'
      });
    }

    const customer = new Customer({
      customerNo,
      customerName,
      hubspotRecordId,
      industry,
      region,
      regionHead,
      status: status || 'Active'
    });

    await customer.save();

    logger.info(`Customer created: ${customerName} (${customerNo})`);

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer
    });
  } catch (error: unknown) {
    logger.error('Failed to create customer:', error);
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Customer number already exists'
      });
    }

    const message = error instanceof Error ? error.message : 'Failed to create customer';
    res.status(500).json({
      success: false,
      message: 'Failed to create customer',
      error: message
    });
  }
};

// Update customer
export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const { customerName, hubspotRecordId, industry, region, regionHead, status } = req.body;

    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Update fields
    if (customerName) customer.customerName = customerName;
    if (hubspotRecordId !== undefined) customer.hubspotRecordId = hubspotRecordId;
    if (industry) customer.industry = industry;
    if (region) customer.region = region;
    if (regionHead !== undefined) customer.regionHead = regionHead;
    if (status) customer.status = status;

    await customer.save();

    logger.info(`Customer updated: ${customer.customerName} (${customer.customerNo})`);

    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: customer
    });
  } catch (error: unknown) {
    logger.error('Failed to update customer:', error);
    const message = error instanceof Error ? error.message : 'Failed to update customer';
    res.status(500).json({
      success: false,
      message: 'Failed to update customer',
      error: message
    });
  }
};

// Delete customer
export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // TODO: Check if customer has associated projects before deleting
    // const projectCount = await Project.countDocuments({ customerId: req.params.id });
    // if (projectCount > 0) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Cannot delete customer with associated projects'
    //   });
    // }

    await Customer.findByIdAndDelete(req.params.id);

    logger.info(`Customer deleted: ${customer.customerName} (${customer.customerNo})`);

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error: unknown) {
    logger.error('Failed to delete customer:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete customer';
    res.status(500).json({
      success: false,
      message: 'Failed to delete customer',
      error: message
    });
  }
};

// Get customer statistics
export const getCustomerStats = async (req: Request, res: Response) => {
  try {
    const totalCustomers = await Customer.countDocuments();
    const activeCustomers = await Customer.countDocuments({ status: 'Active' });
    const inactiveCustomers = await Customer.countDocuments({ status: 'Inactive' });
    
    const customersByRegion = await Customer.aggregate([
      {
        $group: {
          _id: '$region',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        total: totalCustomers,
        active: activeCustomers,
        inactive: inactiveCustomers,
        byRegion: customersByRegion
      }
    });
  } catch (error: unknown) {
    logger.error('Failed to fetch customer statistics:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch customer statistics';
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer statistics',
      error: message
    });
  }
};
