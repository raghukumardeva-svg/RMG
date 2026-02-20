import dotenv from 'dotenv';
import Employee from './models/Employee';
import ITSpecialist from './models/ITSpecialist';
import connectDB from './config/database';

dotenv.config();

async function checkEmilyChen() {
  try {
    await connectDB();

    console.log('🔍 Checking Emily Chen records...\n');

    const employee = await Employee.findOne({ email: 'emily.chen@company.com' });
    console.log('Employee record:');
    console.log(`  _id: ${employee?._id}`);
    console.log(`  employeeId: ${employee?.employeeId}`);
    console.log(`  name: ${employee?.name}`);
    console.log(`  email: ${employee?.email}`);
    console.log(`  role: ${employee?.role}`);

    const specialist = await ITSpecialist.findOne({ email: 'emily.chen@company.com' });
    console.log('\nITSpecialist record:');
    console.log(`  _id: ${specialist?._id}`);
    console.log(`  employeeId: ${specialist?.employeeId}`);
    console.log(`  name: ${specialist?.name}`);
    console.log(`  email: ${specialist?.email}`);
    console.log(`  role: ${specialist?.role}`);

    console.log('\n✅ IDs match:', employee?._id?.toString() === specialist?._id?.toString());

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkEmilyChen();
