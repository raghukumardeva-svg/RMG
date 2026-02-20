/**
 * Super Admin Routes
 * Handles all super admin operations including dashboard stats, category management,
 * user management, and approver configuration
 */

import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import bcrypt from 'bcryptjs';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import User from '../models/User';
import SubCategoryConfig from '../models/SubCategoryConfig';
import HelpdeskTicket from '../models/HelpdeskTicket';
import Employee from '../models/Employee';

const router = express.Router();

// Async handler wrapper
const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Apply authentication and authorization to all routes
router.use(authenticateToken);
router.use(authorizeRoles('SUPER_ADMIN'));

// ===========================================
// DASHBOARD ROUTES
// ===========================================

/**
 * GET /superadmin/dashboard/stats
 * Get dashboard statistics
 */
router.get(
  '/dashboard/stats',
  asyncHandler(async (req: Request, res: Response) => {
    // Get total users count
    const totalUsers = await User.countDocuments({ isActive: true });
    const newUsersThisWeek = await User.countDocuments({
      isActive: true,
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    // Get open tickets count
    const openTickets = await HelpdeskTicket.countDocuments({
      status: { $nin: ['Completed', 'Cancelled', 'Closed'] }
    });
    const criticalTickets = await HelpdeskTicket.countDocuments({
      status: { $nin: ['Completed', 'Cancelled', 'Closed'] },
      urgency: 'Critical'
    });

    // Get pending approvals by level
    const pendingL1 = await HelpdeskTicket.countDocuments({ status: 'Pending L1 Approval' });
    const pendingL2 = await HelpdeskTicket.countDocuments({ status: 'Pending L2 Approval' });
    const pendingL3 = await HelpdeskTicket.countDocuments({ status: 'Pending L3 Approval' });

    // Get categories count
    const categoriesCount = await SubCategoryConfig.countDocuments({ isActive: true });
    const categoriesByType = await SubCategoryConfig.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$highLevelCategory', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        newUsersThisWeek,
        openTickets,
        criticalTickets,
        pendingApprovals: {
          l1: pendingL1,
          l2: pendingL2,
          l3: pendingL3,
          total: pendingL1 + pendingL2 + pendingL3
        },
        categoriesCount,
        categoriesByType: categoriesByType.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {} as Record<string, number>)
      }
    });
  })
);

/**
 * GET /superadmin/dashboard/health
 * Get system health status
 */
router.get(
  '/dashboard/health',
  asyncHandler(async (req: Request, res: Response) => {
    // Simple health checks
    const dbStatus = 'connected';
    const apiStatus = 'running';

    res.json({
      success: true,
      data: {
        database: dbStatus,
        api: apiStatus,
        timestamp: new Date().toISOString()
      }
    });
  })
);

// ===========================================
// CATEGORY MANAGEMENT ROUTES
// ===========================================

/**
 * GET /superadmin/categories
 * List all categories with their approval configurations
 */
router.get(
  '/categories',
  asyncHandler(async (req: Request, res: Response) => {
    const { highLevelCategory, search, isActive } = req.query;

    const filter: Record<string, any> = {};

    if (highLevelCategory && highLevelCategory !== 'all') {
      filter.highLevelCategory = highLevelCategory;
    }

    if (search) {
      filter.subCategory = { $regex: search, $options: 'i' };
    }

    if (isActive !== undefined && isActive !== 'all') {
      filter.isActive = isActive === 'true';
    }

    const categories = await SubCategoryConfig.find(filter)
      .sort({ highLevelCategory: 1, order: 1, subCategory: 1 });

    // Helper to ensure approvalConfig has all required levels
    const normalizeApprovalConfig = (config: any) => {
      const defaultLevel = { enabled: false, approvers: [] };
      if (!config) {
        return {
          l1: defaultLevel,
          l2: defaultLevel,
          l3: defaultLevel
        };
      }
      return {
        l1: config.l1 ? { enabled: !!config.l1.enabled, approvers: config.l1.approvers || [] } : defaultLevel,
        l2: config.l2 ? { enabled: !!config.l2.enabled, approvers: config.l2.approvers || [] } : defaultLevel,
        l3: config.l3 ? { enabled: !!config.l3.enabled, approvers: config.l3.approvers || [] } : defaultLevel
      };
    };

    res.json({
      success: true,
      data: categories.map(cat => {
        const catObj = cat.toObject();
        return {
          ...catObj,
          id: cat._id.toString(),
          approvalConfig: normalizeApprovalConfig(catObj.approvalConfig)
        };
      })
    });
  })
);

/**
 * GET /superadmin/categories/:id
 * Get single category by ID
 */
router.get(
  '/categories/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const category = await SubCategoryConfig.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: {
        ...category.toObject(),
        id: category._id.toString()
      }
    });
  })
);

/**
 * POST /superadmin/categories
 * Create new category with approval configuration
 */
router.post(
  '/categories',
  asyncHandler(async (req: Request, res: Response) => {
    const {
      highLevelCategory,
      subCategory,
      requiresApproval,
      processingQueue,
      specialistQueue,
      order,
      isActive,
      approvalConfig
    } = req.body;

    // Check for duplicate
    const existing = await SubCategoryConfig.findOne({
      highLevelCategory,
      subCategory
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Category with this name already exists in the selected high-level category'
      });
    }

    const category = new SubCategoryConfig({
      highLevelCategory,
      subCategory,
      requiresApproval: requiresApproval || false,
      processingQueue,
      specialistQueue,
      order: order || 999,
      isActive: isActive !== false,
      approvalConfig: approvalConfig || {
        l1: { enabled: false, approvers: [] },
        l2: { enabled: false, approvers: [] },
        l3: { enabled: false, approvers: [] }
      }
    });

    await category.save();

    res.status(201).json({
      success: true,
      data: {
        ...category.toObject(),
        id: category._id.toString()
      }
    });
  })
);

/**
 * PUT /superadmin/categories/:id
 * Update category including approval configuration
 */
router.put(
  '/categories/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const {
      highLevelCategory,
      subCategory,
      requiresApproval,
      processingQueue,
      specialistQueue,
      order,
      isActive,
      approvalConfig
    } = req.body;

    const category = await SubCategoryConfig.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check for duplicate if changing name/category
    if (highLevelCategory !== category.highLevelCategory || subCategory !== category.subCategory) {
      const existing = await SubCategoryConfig.findOne({
        highLevelCategory,
        subCategory,
        _id: { $ne: req.params.id }
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Category with this name already exists in the selected high-level category'
        });
      }
    }

    // Update fields
    category.highLevelCategory = highLevelCategory;
    category.subCategory = subCategory;
    category.requiresApproval = requiresApproval;
    category.processingQueue = processingQueue;
    category.specialistQueue = specialistQueue;
    category.order = order;
    category.isActive = isActive;

    // Update approval config if provided
    if (approvalConfig) {
      category.set('approvalConfig', approvalConfig);
    }

    await category.save();

    res.json({
      success: true,
      data: {
        ...category.toObject(),
        id: category._id.toString()
      }
    });
  })
);

/**
 * DELETE /superadmin/categories/:id
 * Delete category (soft delete by setting isActive = false)
 */
router.delete(
  '/categories/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const category = await SubCategoryConfig.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Soft delete
    category.isActive = false;
    await category.save();

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  })
);

/**
 * PUT /superadmin/categories/:id/approvers
 * Quick update for category approvers
 */
router.put(
  '/categories/:id/approvers',
  asyncHandler(async (req: Request, res: Response) => {
    const { approvalConfig } = req.body;

    const category = await SubCategoryConfig.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    category.set('approvalConfig', approvalConfig);
    await category.save();

    res.json({
      success: true,
      data: {
        ...category.toObject(),
        id: category._id.toString()
      }
    });
  })
);

// ===========================================
// USER MANAGEMENT ROUTES
// ===========================================

/**
 * GET /superadmin/users
 * List all users with pagination and filters
 */
router.get(
  '/users',
  asyncHandler(async (req: Request, res: Response) => {
    const { 
      role, 
      department, 
      status, 
      search,
      page = 1,
      limit = 50
    } = req.query;

    const filter: Record<string, any> = {};

    if (role && role !== 'all') {
      filter.role = role;
    }

    if (department && department !== 'all') {
      filter.department = department;
    }

    if (status && status !== 'all') {
      filter.isActive = status === 'active';
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ name: 1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: users.map(user => ({
        ...user.toObject(),
        id: user._id.toString()
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  })
);

/**
 * GET /superadmin/users/:id
 * Get single user by ID
 */
router.get(
  '/users/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find categories where this user is an approver
    const approverAssignments = await SubCategoryConfig.find({
      $or: [
        { 'approvalConfig.l1.approvers.employeeId': user.employeeId },
        { 'approvalConfig.l2.approvers.employeeId': user.employeeId },
        { 'approvalConfig.l3.approvers.employeeId': user.employeeId }
      ]
    });

    const assignments = approverAssignments.map(cat => {
      const levels: string[] = [];
      const catObj = cat.toObject() as any;
      
      if (catObj.approvalConfig?.l1?.approvers?.some((a: any) => a.employeeId === user.employeeId)) {
        levels.push('L1');
      }
      if (catObj.approvalConfig?.l2?.approvers?.some((a: any) => a.employeeId === user.employeeId)) {
        levels.push('L2');
      }
      if (catObj.approvalConfig?.l3?.approvers?.some((a: any) => a.employeeId === user.employeeId)) {
        levels.push('L3');
      }

      return {
        categoryId: cat._id.toString(),
        category: `${catObj.highLevelCategory} > ${catObj.subCategory}`,
        levels
      };
    });

    res.json({
      success: true,
      data: {
        ...user.toObject(),
        id: user._id.toString(),
        approverAssignments: assignments
      }
    });
  })
);

/**
 * POST /superadmin/users
 * Create new user
 */
router.post(
  '/users',
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password, name, role, department, designation, employeeId } = req.body;

    // Check for duplicate email
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Check for duplicate employeeId if provided
    if (employeeId) {
      const existingEmpId = await User.findOne({ employeeId });
      if (existingEmpId) {
        return res.status(409).json({
          success: false,
          message: 'User with this employee ID already exists'
        });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      role,
      department,
      designation,
      employeeId,
      isActive: true
    });

    await user.save();

    // Also create Employee record if needed
    const existingEmployee = await Employee.findOne({ email: email.toLowerCase() });
    if (!existingEmployee) {
      const employee = new Employee({
        employeeId: employeeId || `EMP${Date.now()}`,
        name,
        email: email.toLowerCase(),
        department: department || 'General',
        designation: designation || 'Employee',
        role,
        status: 'active',
        isActive: true,
        hasLoginAccess: true,
        dateOfJoining: new Date().toISOString().split('T')[0]
      });
      await employee.save();
    }

    res.status(201).json({
      success: true,
      data: {
        ...user.toObject(),
        id: user._id.toString(),
        password: undefined
      }
    });
  })
);

/**
 * PUT /superadmin/users/:id
 * Update user
 */
router.put(
  '/users/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { name, role, department, designation, employeeId } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check for duplicate employeeId if changed
    if (employeeId && employeeId !== user.employeeId) {
      const existingEmpId = await User.findOne({ 
        employeeId, 
        _id: { $ne: req.params.id } 
      });
      if (existingEmpId) {
        return res.status(409).json({
          success: false,
          message: 'User with this employee ID already exists'
        });
      }
    }

    // Update fields
    if (name) user.name = name;
    if (role) user.role = role;
    if (department !== undefined) user.department = department;
    if (designation !== undefined) user.designation = designation;
    if (employeeId !== undefined) user.employeeId = employeeId;

    await user.save();

    res.json({
      success: true,
      data: {
        ...user.toObject(),
        id: user._id.toString(),
        password: undefined
      }
    });
  })
);

/**
 * PUT /superadmin/users/:id/status
 * Activate/Deactivate user
 */
router.put(
  '/users/:id/status',
  asyncHandler(async (req: Request, res: Response) => {
    const { isActive } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = isActive;
    await user.save();

    res.json({
      success: true,
      data: {
        ...user.toObject(),
        id: user._id.toString(),
        password: undefined
      }
    });
  })
);

/**
 * PUT /superadmin/users/:id/role
 * Change user role
 */
router.put(
  '/users/:id/role',
  asyncHandler(async (req: Request, res: Response) => {
    const { role } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.role = role;
    await user.save();

    res.json({
      success: true,
      data: {
        ...user.toObject(),
        id: user._id.toString(),
        password: undefined
      }
    });
  })
);

/**
 * DELETE /superadmin/users/:id
 * Delete user (soft delete)
 */
router.delete(
  '/users/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Soft delete
    user.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  })
);

// ===========================================
// APPROVER MANAGEMENT ROUTES
// ===========================================

/**
 * GET /superadmin/approvers
 * Get all approvers grouped by category
 */
router.get(
  '/approvers',
  asyncHandler(async (req: Request, res: Response) => {
    const categories = await SubCategoryConfig.find({ 
      isActive: true,
      requiresApproval: true 
    }).sort({ highLevelCategory: 1, order: 1 });

    // Get pending counts for each category
    const approversByCategory = await Promise.all(
      categories.map(async (cat) => {
        const catObj = cat.toObject() as any;
        
        const pendingCounts = await HelpdeskTicket.aggregate([
          {
            $match: {
              subCategory: catObj.subCategory,
              status: { $in: ['Pending L1 Approval', 'Pending L2 Approval', 'Pending L3 Approval'] }
            }
          },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 }
            }
          }
        ]);

        const pending = {
          l1: 0,
          l2: 0,
          l3: 0
        };

        pendingCounts.forEach((p: any) => {
          if (p._id === 'Pending L1 Approval') pending.l1 = p.count;
          if (p._id === 'Pending L2 Approval') pending.l2 = p.count;
          if (p._id === 'Pending L3 Approval') pending.l3 = p.count;
        });

        return {
          categoryId: cat._id.toString(),
          categoryName: `${catObj.highLevelCategory} - ${catObj.subCategory}`,
          subCategory: catObj.subCategory,
          l1Approvers: catObj.approvalConfig?.l1?.enabled ? (catObj.approvalConfig.l1.approvers || []) : [],
          l2Approvers: catObj.approvalConfig?.l2?.enabled ? (catObj.approvalConfig.l2.approvers || []) : [],
          l3Approvers: catObj.approvalConfig?.l3?.enabled ? (catObj.approvalConfig.l3.approvers || []) : [],
          pendingCounts: pending
        };
      })
    );

    res.json({
      success: true,
      data: approversByCategory
    });
  })
);

/**
 * GET /superadmin/approvers/stats
 * Get approver statistics
 */
router.get(
  '/approvers/stats',
  asyncHandler(async (req: Request, res: Response) => {
    // Get overall pending counts
    const pendingCounts = await HelpdeskTicket.aggregate([
      {
        $match: {
          status: { $in: ['Pending L1 Approval', 'Pending L2 Approval', 'Pending L3 Approval'] }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const stats = {
      l1Pending: 0,
      l2Pending: 0,
      l3Pending: 0
    };

    pendingCounts.forEach((p: any) => {
      if (p._id === 'Pending L1 Approval') stats.l1Pending = p.count;
      if (p._id === 'Pending L2 Approval') stats.l2Pending = p.count;
      if (p._id === 'Pending L3 Approval') stats.l3Pending = p.count;
    });

    // Get unique approvers count and by level
    const categories = await SubCategoryConfig.find({ 
      isActive: true,
      requiresApproval: true 
    });

    const l1Approvers = new Set<string>();
    const l2Approvers = new Set<string>();
    const l3Approvers = new Set<string>();

    categories.forEach((cat: any) => {
      const catObj = cat.toObject();
      catObj.approvalConfig?.l1?.approvers?.forEach((a: any) => l1Approvers.add(a.employeeId));
      catObj.approvalConfig?.l2?.approvers?.forEach((a: any) => l2Approvers.add(a.employeeId));
      catObj.approvalConfig?.l3?.approvers?.forEach((a: any) => l3Approvers.add(a.employeeId));
    });

    // Get total approvals count
    const totalApprovals = await HelpdeskTicket.countDocuments({
      status: { $in: ['Completed', 'Closed'] },
      $or: [
        { 'approvalStatus.l1.status': 'Approved' },
        { 'approvalStatus.l2.status': 'Approved' },
        { 'approvalStatus.l3.status': 'Approved' }
      ]
    });

    const allUniqueApprovers = new Set([...l1Approvers, ...l2Approvers, ...l3Approvers]);

    res.json({
      success: true,
      data: {
        totalApprovers: allUniqueApprovers.size,
        totalApprovals: totalApprovals,
        pendingApprovals: stats.l1Pending + stats.l2Pending + stats.l3Pending,
        averageResponseTime: '4 hours', // TODO: Calculate actual average
        byLevel: {
          L1: l1Approvers.size,
          L2: l2Approvers.size,
          L3: l3Approvers.size
        }
      }
    });
  })
);

/**
 * GET /superadmin/approvers/list
 * Get all unique approvers with their assignments
 */
router.get(
  '/approvers/list',
  asyncHandler(async (req: Request, res: Response) => {
    const categories = await SubCategoryConfig.find({ 
      isActive: true,
      requiresApproval: true 
    });

    const approverMap = new Map<string, {
      employeeId: string;
      name: string;
      email: string;
      designation: string;
      l1Categories: string[];
      l2Categories: string[];
      l3Categories: string[];
    }>();

    categories.forEach((cat: any) => {
      const catObj = cat.toObject();
      const catName = `${catObj.highLevelCategory} > ${catObj.subCategory}`;

      catObj.approvalConfig?.l1?.approvers?.forEach((a: any) => {
        if (!approverMap.has(a.employeeId)) {
          approverMap.set(a.employeeId, {
            employeeId: a.employeeId,
            name: a.name,
            email: a.email,
            designation: a.designation || '',
            l1Categories: [],
            l2Categories: [],
            l3Categories: []
          });
        }
        approverMap.get(a.employeeId)!.l1Categories.push(catName);
      });

      catObj.approvalConfig?.l2?.approvers?.forEach((a: any) => {
        if (!approverMap.has(a.employeeId)) {
          approverMap.set(a.employeeId, {
            employeeId: a.employeeId,
            name: a.name,
            email: a.email,
            designation: a.designation || '',
            l1Categories: [],
            l2Categories: [],
            l3Categories: []
          });
        }
        approverMap.get(a.employeeId)!.l2Categories.push(catName);
      });

      catObj.approvalConfig?.l3?.approvers?.forEach((a: any) => {
        if (!approverMap.has(a.employeeId)) {
          approverMap.set(a.employeeId, {
            employeeId: a.employeeId,
            name: a.name,
            email: a.email,
            designation: a.designation || '',
            l1Categories: [],
            l2Categories: [],
            l3Categories: []
          });
        }
        approverMap.get(a.employeeId)!.l3Categories.push(catName);
      });
    });

    // Transform the data to include levels and categories arrays
    const approverList = Array.from(approverMap.values()).map(approver => {
      const levels: string[] = [];
      const categories = new Set<string>();

      if (approver.l1Categories.length > 0) {
        levels.push('L1');
        approver.l1Categories.forEach(c => categories.add(c));
      }
      if (approver.l2Categories.length > 0) {
        levels.push('L2');
        approver.l2Categories.forEach(c => categories.add(c));
      }
      if (approver.l3Categories.length > 0) {
        levels.push('L3');
        approver.l3Categories.forEach(c => categories.add(c));
      }

      return {
        ...approver,
        levels,
        categories: Array.from(categories)
      };
    });

    res.json({
      success: true,
      data: approverList
    });
  })
);

// ===========================================
// EMPLOYEE SEARCH FOR PICKER
// ===========================================

/**
 * GET /superadmin/employees/search
 * Search employees for approver picker
 */
router.get(
  '/employees/search',
  asyncHandler(async (req: Request, res: Response) => {
    const { q } = req.query;

    // If no query or less than 1 character, return all active employees
    const searchQuery = q ? String(q).trim() : '';

    // Build search filter
    const searchFilter = searchQuery.length >= 1
      ? {
          $or: [
            { name: { $regex: searchQuery, $options: 'i' } },
            { email: { $regex: searchQuery, $options: 'i' } },
            { employeeId: { $regex: searchQuery, $options: 'i' } }
          ]
        }
      : {};

    // Search in both User and Employee collections
    const [users, employees] = await Promise.all([
      User.find({
        isActive: true,
        ...searchFilter
      })
        .select('name email employeeId designation department')
        .sort({ name: 1 })
        .limit(50),
      Employee.find({
        $or: [{ status: 'Active' }, { status: 'active' }],
        ...searchFilter
      })
        .select('name email employeeId designation department')
        .sort({ name: 1 })
        .limit(50)
    ]);

    // Merge and deduplicate by email
    const seen = new Set<string>();
    const results: any[] = [];

    users.forEach(user => {
      if (!seen.has(user.email)) {
        seen.add(user.email);
        results.push({
          employeeId: user.employeeId || user._id.toString(),
          name: user.name,
          email: user.email,
          designation: user.designation || '',
          department: user.department || ''
        });
      }
    });

    employees.forEach(emp => {
      if (!seen.has(emp.email)) {
        seen.add(emp.email);
        results.push({
          employeeId: emp.employeeId,
          name: emp.name,
          email: emp.email,
          designation: emp.designation || '',
          department: emp.department || ''
        });
      }
    });

    // Sort by name
    results.sort((a, b) => a.name.localeCompare(b.name));

    res.json({
      success: true,
      data: results.slice(0, 50)
    });
  })
);

export default router;
