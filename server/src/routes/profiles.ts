import express, { Request, Response } from 'express';
import Employee from '../models/Employee';
import { employeeValidation } from '../middleware/validation';

const router = express.Router();
// Profile routes for employee profiles

// Get profile by employee ID
router.get('/:employeeId', async (req: Request, res: Response) => {
  try {
    const employee = await Employee.findOne({
      $or: [
        { employeeId: req.params.employeeId },
        { id: req.params.employeeId }
      ]
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Build profile from employee data - use toObject() to get all fields
    const employeeObj = employee.toObject() as Record<string, unknown>;

    // Ensure all required fields have default values
    // Use profilePhoto as primary source, fallback to avatar
    const photoValue = employee.profilePhoto || employee.avatar;
    const profile = {
      ...employeeObj,
      employeeId: employee.employeeId || employee.id,
      name: employee.name,
      email: employee.email,
      phone: employee.phone || '',
      department: employee.department,
      designation: employee.designation,
      reportingManager: employee.reportingManager || null,
      dottedLineManager: employeeObj.dottedLineManager || null,
      status: employee.status || 'Active',
      avatar: photoValue,
      photo: photoValue,
      profilePhoto: photoValue,
      skills: employee.skills || [],
      dateOfJoining: employeeObj.dateOfJoining || '',
      location: employeeObj.location || '',
      dateOfBirth: employeeObj.dateOfBirth || '',
      businessUnit: employeeObj.businessUnit || 'Corporate',

      // Contact information
      personalEmail: employeeObj.personalEmail || '',
      workPhone: employeeObj.workPhone || '',
      emergencyContact: typeof employeeObj.emergencyContact === 'string'
        ? employeeObj.emergencyContact
        : (employeeObj.emergencyContact as Record<string, unknown>)?.phone || '',

      // Primary details
      gender: employeeObj.gender || 'Not specified',
      maritalStatus: employeeObj.maritalStatus || 'Not specified',
      bloodGroup: employeeObj.bloodGroup || 'Not specified',
      nationality: employeeObj.nationality || 'Indian',

      // Identity information
      panNumber: employeeObj.panNumber || '',
      aadharNumber: employeeObj.aadharNumber || '',
      passportNumber: employeeObj.passportNumber || '',

      // Address information
      currentAddress: employeeObj.currentAddress || {
        street: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India'
      },
      permanentAddress: employeeObj.permanentAddress || {
        street: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India'
      },

      // Work history
      previousExperience: Array.isArray(employeeObj.previousExperience)
        ? employeeObj.previousExperience
        : [],

      // Projects
      projects: Array.isArray(employeeObj.projects)
        ? employeeObj.projects
        : [],

      // Job details
      employmentType: employeeObj.employmentType || 'Full-Time',
      probationEndDate: employeeObj.probationEndDate || '',
      confirmationDate: employeeObj.confirmationDate || '',
      noticePeriod: employeeObj.noticePeriod || '30 days',

      // Timeline
      timeline: Array.isArray(employeeObj.timeline)
        ? employeeObj.timeline
        : [
            {
              date: employeeObj.dateOfJoining || new Date().toISOString(),
              event: 'Joined Company',
              type: 'joining',
              description: `Started as ${employee.designation} in ${employee.department}`
            }
          ],

      // Assets
      assets: Array.isArray(employeeObj.assets)
        ? employeeObj.assets
        : [],

      // Summary
      summary: employeeObj.summary || `${employee.name} is a ${employee.designation} in the ${employee.department} department.`,

      // Bank details
      bankDetails: employeeObj.bankDetails || undefined
    };

    res.json({ success: true, data: profile });
  } catch (error) {
    console.error('Failed to read profile:', error);
    res.status(500).json({ success: false, message: 'Failed to read profile' });
  }
});

// Update profile
router.put('/:employeeId', employeeValidation.update, async (req: Request, res: Response) => {
  try {
    const employee = await Employee.findOneAndUpdate(
      {
        $or: [
          { employeeId: req.params.employeeId },
          { id: req.params.employeeId }
        ]
      },
      req.body,
      { new: true, runValidators: true }
    );

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.json({ success: true, data: employee });
  } catch (error) {
    console.error('Failed to update profile:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

// Update specific profile section (PATCH)
router.patch('/:employeeId/:section', async (req: Request, res: Response) => {
  try {
    const { employeeId, section } = req.params;
    const updateData = req.body;

    const employee = await Employee.findOneAndUpdate(
      {
        $or: [
          { employeeId },
          { id: employeeId }
        ]
      },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Handle photo updates
    if (section === 'photo' && updateData.photo) {
      // Update both avatar and profilePhoto fields
      employee.avatar = updateData.photo;
      employee.profilePhoto = updateData.photo;
      await employee.save();
    }

    res.json({ success: true, data: employee });
  } catch (error) {
    console.error('Failed to update profile section:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile section' });
  }
});

export default router;

