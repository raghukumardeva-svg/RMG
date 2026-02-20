/**
 * Script to create a Super Admin user
 * Run: node scripts/create-super-admin.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rmg-portal';

// Use the Employee collection (same as auth uses)
const employeeSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, select: false },
  name: String,
  role: { 
    type: String, 
    enum: ['EMPLOYEE', 'RMG', 'HR', 'IT_ADMIN', 'SUPER_ADMIN'],
    default: 'EMPLOYEE'
  },
  department: String,
  designation: String,
  employeeId: { type: String, required: true, unique: true },
  avatar: String,
  profilePhoto: String,
  phone: String,
  location: String,
  isActive: { type: Boolean, default: true },
  hasLoginAccess: { type: Boolean, default: false }
}, { timestamps: true });

const Employee = mongoose.model('Employee', employeeSchema);

async function createSuperAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if super admin already exists in Employee collection
    const existing = await Employee.findOne({ email: 'superadmin@acuvate.com' });
    if (existing) {
      console.log('⚠️ Super Admin user already exists!');
      console.log('Email: superadmin@acuvate.com');
      
      // Update role and hasLoginAccess if needed
      const updates = {};
      if (existing.role !== 'SUPER_ADMIN') {
        updates.role = 'SUPER_ADMIN';
      }
      if (!existing.hasLoginAccess) {
        updates.hasLoginAccess = true;
      }
      
      if (Object.keys(updates).length > 0) {
        await Employee.updateOne(
          { email: 'superadmin@acuvate.com' },
          { $set: updates }
        );
        console.log('✅ Updated user settings');
      }
      
      await mongoose.disconnect();
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('SuperAdmin@123', 10);

    // Create super admin in Employee collection
    const superAdmin = new Employee({
      email: 'superadmin@acuvate.com',
      password: hashedPassword,
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      department: 'Administration',
      designation: 'System Administrator',
      employeeId: 'ADMIN001',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SuperAdmin',
      isActive: true,
      hasLoginAccess: true
    });

    await superAdmin.save();

    console.log('✅ Super Admin user created successfully!');
    console.log('');
    console.log('=================================');
    console.log('🔐 LOGIN CREDENTIALS');
    console.log('=================================');
    console.log('Email:    superadmin@acuvate.com');
    console.log('Password: SuperAdmin@123');
    console.log('Role:     SUPER_ADMIN');
    console.log('=================================');
    console.log('');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createSuperAdmin();
