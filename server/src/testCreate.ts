import dotenv from 'dotenv';
import Employee from './models/Employee';
import connectDB from './config/database';

dotenv.config();

async function testCreateWithId() {
  try {
    await connectDB();

    console.log('🧪 Testing Employee.create() with custom _id...\n');

    const testData = {
      _id: 'CUSTOM123',
      employeeId: 'CUSTOM123',
      name: 'Custom ID Test',
      email: 'customid@test.com',
      role: 'EMPLOYEE',
      department: 'Test',
      designation: 'Tester',
      password: 'Test@123',
      hasLoginAccess: true,
      isActive: true,
      status: 'active',
      dateOfJoining: '2024-01-01'
    };

    console.log('Input data _id:', testData._id);
    
    const created = await Employee.create(testData);
    
    console.log('\nCreated employee _id:', created._id);
    console.log('Type:', typeof created._id);
    console.log('toString():', created._id.toString());

    // Retrieve it back
    const found = await Employee.findOne({ email: 'customid@test.com' });
    console.log('\nFound employee _id:', found?._id);

    // Clean up
    await Employee.deleteOne({ email: 'customid@test.com' });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testCreateWithId();
