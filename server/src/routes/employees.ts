import express, { Request, Response } from 'express';
import Employee from '../models/Employee';
import { employeeValidation } from '../middleware/validation';

const router = express.Router();

// Helper to normalize employee data - ensures profilePhoto is always set
const normalizeEmployee = (emp: any) => {
  const obj = emp.toObject ? emp.toObject() : emp;
  // Ensure profilePhoto is set - use avatar as fallback
  if (!obj.profilePhoto && obj.avatar) {
    obj.profilePhoto = obj.avatar;
  }
  // Also sync avatar from profilePhoto if needed
  if (!obj.avatar && obj.profilePhoto) {
    obj.avatar = obj.profilePhoto;
  }
  return obj;
};

// Get all employees
router.get('/', async (_req: Request, res: Response) => {
  try {
    const employees = await Employee.find();
    const normalizedEmployees = employees.map(normalizeEmployee);
    res.json({ success: true, data: normalizedEmployees });
  } catch (_error) {
    console.error('Failed to read employees:', _error);
    res.status(500).json({ success: false, message: 'Failed to read employees' });
  }
});

// Get active employees
router.get('/active', async (_req: Request, res: Response) => {
  try {
    const employees = await Employee.find({ status: 'active' });
    const normalizedEmployees = employees.map(normalizeEmployee);
    res.json({ success: true, data: normalizedEmployees });
  } catch (error) {
    console.error('Failed to read active employees:', error);
    res.status(500).json({ success: false, message: 'Failed to read active employees' });
  }
});

// Search employees by name or ID
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      return res.json([]);
    }

    const employees = await Employee.find({
      $or: [
        { employeeId: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ],
      isActive: true
    })
      .select('employeeId name email department designation')
      .limit(10);

    const results = employees.map(emp => ({
      id: emp._id.toString(),
      employeeId: emp.employeeId,
      name: emp.name,
      email: emp.email,
      department: emp.department,
      designation: emp.designation
    }));

    res.json(results);
  } catch (error) {
    console.error('Failed to search employees:', error);
    res.status(500).json({ success: false, message: 'Failed to search employees' });
  }
});

// Get next employee ID
router.get('/utils/next-id', async (_req: Request, res: Response) => {
  try {
    const employees = await Employee.find();
    let maxId = 0;
    employees.forEach((emp) => {
      const empId = emp.employeeId || emp.id;
      if (empId) {
        const idNum = parseInt(empId.replace('EMP', ''));
        if (idNum > maxId) maxId = idNum;
      }
    });
    const nextId = `EMP${String(maxId + 1).padStart(3, '0')}`;
    res.json({ success: true, data: nextId });
  } catch (error) {
    console.error('Failed to generate next ID:', error);
    res.status(500).json({ success: false, message: 'Failed to generate next ID' });
  }
});

// Get employee by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const employee = await Employee.findOne({
      $or: [{ id: req.params.id }, { employeeId: req.params.id }]
    });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    res.json({ success: true, data: normalizeEmployee(employee) });
  } catch (error) {
    console.error('Failed to read employee:', error);
    res.status(500).json({ success: false, message: 'Failed to read employee' });
  }
});

// Add employee
router.post('/', employeeValidation.create, async (req: Request, res: Response) => {
  try {
    const newEmployee = new Employee(req.body);
    await newEmployee.save();
    res.status(201).json({ success: true, data: newEmployee });
  } catch (error) {
    console.error('Failed to add employee:', error);
    res.status(500).json({ success: false, message: 'Failed to add employee' });
  }
});

// Update employee
router.put('/:id', employeeValidation.update, async (req: Request, res: Response) => {
  try {
    const employee = await Employee.findOneAndUpdate(
      { $or: [{ id: req.params.id }, { employeeId: req.params.id }] },
      req.body,
      { new: true, runValidators: true }
    );
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    res.json({ success: true, data: employee });
  } catch (error) {
    console.error('Failed to update employee:', error);
    res.status(500).json({ success: false, message: 'Failed to update employee' });
  }
});

// Delete employee
router.delete('/:id', employeeValidation.delete, async (req: Request, res: Response) => {
  try {
    const employee = await Employee.findOneAndDelete({
      $or: [{ id: req.params.id }, { employeeId: req.params.id }]
    });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    res.json({ success: true, message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Failed to delete employee:', error);
    res.status(500).json({ success: false, message: 'Failed to delete employee' });
  }
});

// Bulk upload
router.post('/bulk', async (req: Request, res: Response) => {
  try {
    const employees = req.body.employees || [];
    const result = await Employee.insertMany(employees);
    res.status(201).json({ success: true, data: result, count: result.length });
  } catch (error) {
    console.error('Failed to bulk upload employees:', error);
    res.status(500).json({ success: false, message: 'Failed to bulk upload employees' });
  }
});

export default router;

