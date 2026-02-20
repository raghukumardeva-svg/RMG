import dotenv from 'dotenv';
import Employee from './models/Employee';
import connectDB from './config/database';

dotenv.config();

async function testCustomId() {
  try {
    await connectDB();

    console.log('🧪 Testing custom _id for Employee model...\n');

    // Try to create a test employee with custom _id
    const testEmployee = new Employee({
      _id: 'TEST001',
      employeeId: 'TEST001',
      name: 'Test Employee',
      email: 'test@company.com',
      role: 'EMPLOYEE',
      department: 'Test',
      designation: 'Tester',
      password: 'Test@123',
      hasLoginAccess: true,
      isActive: true,
      status: 'active',
      dateOfJoining: '2024-01-01'
    });

    await testEmployee.save();
    console.log('✅ Created test employee with custom _id');
    console.log(`   _id: ${testEmployee._id}`);
    console.log(`   employeeId: ${testEmployee.employeeId}`);

    // Clean up
    await Employee.deleteOne({ _id: 'TEST001' });
    console.log('\n✅ Test passed! Employee model accepts custom string _id');

    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testCustomId();
