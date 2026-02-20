import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rmg-portal';

// Define Employee schema
const employeeSchema = new mongoose.Schema({}, { strict: false });
const Employee = mongoose.model('Employee', employeeSchema);

async function fixEmployeeData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Fix EMP001 - Sai Nikhil Bomma
    console.log('Updating EMP001 - Sai Nikhil Bomma...');
    await Employee.findOneAndUpdate(
      { employeeId: 'EMP001' },
      {
        $set: {
          name: 'Sai Nikhil Bomma',
          email: 'sainikhil.bomma@acuvate.com',
          phone: '+91-9876543210',
          designation: 'Senior Developer',
          department: 'Engineering',
          location: 'Hyderabad',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SaiNikhil',
          profilePhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SaiNikhil',
          dateOfBirth: '1995-01-15',
          dateOfJoining: '2020-03-15',
          businessUnit: 'Engineering',
          status: 'active'
        }
      },
      { upsert: true }
    );

    // Fix RMG001 - Mohan Reddy
    console.log('Updating RMG001 - Mohan Reddy...');
    await Employee.findOneAndUpdate(
      { employeeId: 'RMG001' },
      {
        $set: {
          name: 'Mohan Reddy',
          email: 'mohan.reddy@acuvate.com',
          phone: '+91-9876543211',
          designation: 'Resource Manager',
          department: 'Resource Management',
          location: 'Hyderabad',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mohan',
          profilePhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mohan',
          dateOfBirth: '1988-05-20',
          dateOfJoining: '2018-01-10',
          businessUnit: 'Resource Management',
          status: 'active'
        }
      },
      { upsert: true }
    );

    // Fix HR001 - HR User
    console.log('Updating HR001 - HR User...');
    await Employee.findOneAndUpdate(
      { employeeId: 'HR001' },
      {
        $set: {
          name: 'HR Admin',
          email: 'hr@acuvate.com',
          phone: '+91-9876543212',
          designation: 'HR Manager',
          department: 'Human Resources',
          location: 'Hyderabad',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=HR',
          profilePhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=HR',
          dateOfBirth: '1987-08-25',
          dateOfJoining: '2017-06-15',
          businessUnit: 'Human Resources',
          status: 'active'
        }
      },
      { upsert: true }
    );

    // Fix MGR001 - Rajesh Kumar
    console.log('Updating MGR001 - Rajesh Kumar...');
    await Employee.findOneAndUpdate(
      { employeeId: 'MGR001' },
      {
        $set: {
          name: 'Rajesh Kumar',
          email: 'rajesh.kumar@acuvate.com',
          phone: '+91-9876543213',
          designation: 'Engineering Manager',
          department: 'Engineering',
          location: 'Hyderabad',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rajesh',
          profilePhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rajesh',
          dateOfBirth: '1985-03-10',
          dateOfJoining: '2016-09-01',
          businessUnit: 'Engineering',
          status: 'active'
        }
      },
      { upsert: true }
    );

    // Fix IT001 - Priya Sharma
    console.log('Updating IT001 - Priya Sharma...');
    await Employee.findOneAndUpdate(
      { employeeId: 'IT001' },
      {
        $set: {
          name: 'Priya Sharma',
          email: 'priya.sharma@acuvate.com',
          phone: '+91-9876543214',
          designation: 'IT Administrator',
          department: 'IT Support',
          location: 'Hyderabad',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
          profilePhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
          dateOfBirth: '1992-11-30',
          dateOfJoining: '2019-04-20',
          businessUnit: 'IT Support',
          status: 'active'
        }
      },
      { upsert: true }
    );

    console.log('\n✅ All employee records updated successfully!');
    console.log('\nUpdated employees:');
    console.log('  - EMP001: Sai Nikhil Bomma');
    console.log('  - RMG001: Mohan Reddy');
    console.log('  - HR001: HR Admin');
    console.log('  - MGR001: Rajesh Kumar');
    console.log('  - IT001: Priya Sharma');

  } catch (error) {
    console.error('❌ Error updating employee data:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

fixEmployeeData();
