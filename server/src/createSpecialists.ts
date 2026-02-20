import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Employee from './models/Employee';
import connectDB from './config/database';

dotenv.config();

async function createSpecialists() {
  try {
    await connectDB();

    console.log('🔄 Creating Finance and Facilities Specialist users...\n');

    // Finance Specialist credentials
    const financeSpec1Email = 'finance.specialist1@acuvate.com';
    const financeSpec1Password = 'Finance@123';
    const financeSpec1HashedPassword = await bcrypt.hash(financeSpec1Password, 10);

    const financeSpec2Email = 'finance.specialist2@acuvate.com';
    const financeSpec2Password = 'Finance@123';
    const financeSpec2HashedPassword = await bcrypt.hash(financeSpec2Password, 10);

    // Facilities Specialist credentials
    const facilitiesSpec1Email = 'facilities.specialist1@acuvate.com';
    const facilitiesSpec1Password = 'Facilities@123';
    const facilitiesSpec1HashedPassword = await bcrypt.hash(facilitiesSpec1Password, 10);

    const facilitiesSpec2Email = 'facilities.specialist2@acuvate.com';
    const facilitiesSpec2Password = 'Facilities@123';
    const facilitiesSpec2HashedPassword = await bcrypt.hash(facilitiesSpec2Password, 10);

    // Create Finance Specialist 1
    const financeSpec1 = await Employee.findOneAndUpdate(
      { employeeId: 'FINS001' },
      {
        $set: {
          employeeId: 'FINS001',
          name: 'Rajesh Kumar',
          email: financeSpec1Email,
          password: financeSpec1HashedPassword,
          phone: '+91-9876543221',
          designation: 'Finance Specialist',
          department: 'Finance',
          location: 'Hyderabad',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=RajeshKumar',
          profilePhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=RajeshKumar',
          dateOfBirth: '1990-03-15',
          dateOfJoining: '2019-05-20',
          businessUnit: 'Finance',
          status: 'active',
          role: 'EMPLOYEE',
          hasLoginAccess: true,
          isActive: true,
        }
      },
      { new: true, upsert: true }
    );

    console.log('✅ Finance Specialist 1 created/updated successfully!');
    console.log('  Employee ID:', financeSpec1.employeeId);
    console.log('  Name:       ', financeSpec1.name);
    console.log('  Email:      ', financeSpec1Email);
    console.log('  Password:   ', financeSpec1Password);
    console.log('  Department: ', financeSpec1.department);
    console.log();

    // Create Finance Specialist 2
    const financeSpec2 = await Employee.findOneAndUpdate(
      { employeeId: 'FINS002' },
      {
        $set: {
          employeeId: 'FINS002',
          name: 'Priya Sharma',
          email: financeSpec2Email,
          password: financeSpec2HashedPassword,
          phone: '+91-9876543222',
          designation: 'Finance Specialist',
          department: 'Finance',
          location: 'Hyderabad',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PriyaSharma',
          profilePhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PriyaSharma',
          dateOfBirth: '1992-07-22',
          dateOfJoining: '2020-02-10',
          businessUnit: 'Finance',
          status: 'active',
          role: 'EMPLOYEE',
          hasLoginAccess: true,
          isActive: true,
        }
      },
      { new: true, upsert: true }
    );

    console.log('✅ Finance Specialist 2 created/updated successfully!');
    console.log('  Employee ID:', financeSpec2.employeeId);
    console.log('  Name:       ', financeSpec2.name);
    console.log('  Email:      ', financeSpec2Email);
    console.log('  Password:   ', financeSpec2Password);
    console.log('  Department: ', financeSpec2.department);
    console.log();

    // Create Facilities Specialist 1
    const facilitiesSpec1 = await Employee.findOneAndUpdate(
      { employeeId: 'FACS001' },
      {
        $set: {
          employeeId: 'FACS001',
          name: 'Arun Reddy',
          email: facilitiesSpec1Email,
          password: facilitiesSpec1HashedPassword,
          phone: '+91-9876543223',
          designation: 'Facilities Specialist',
          department: 'Facilities',
          location: 'Hyderabad',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ArunReddy',
          profilePhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ArunReddy',
          dateOfBirth: '1988-11-10',
          dateOfJoining: '2018-08-15',
          businessUnit: 'Facilities',
          status: 'active',
          role: 'EMPLOYEE',
          hasLoginAccess: true,
          isActive: true,
        }
      },
      { new: true, upsert: true }
    );

    console.log('✅ Facilities Specialist 1 created/updated successfully!');
    console.log('  Employee ID:', facilitiesSpec1.employeeId);
    console.log('  Name:       ', facilitiesSpec1.name);
    console.log('  Email:      ', facilitiesSpec1Email);
    console.log('  Password:   ', facilitiesSpec1Password);
    console.log('  Department: ', facilitiesSpec1.department);
    console.log();

    // Create Facilities Specialist 2
    const facilitiesSpec2 = await Employee.findOneAndUpdate(
      { employeeId: 'FACS002' },
      {
        $set: {
          employeeId: 'FACS002',
          name: 'Meena Patel',
          email: facilitiesSpec2Email,
          password: facilitiesSpec2HashedPassword,
          phone: '+91-9876543224',
          designation: 'Facilities Specialist',
          department: 'Facilities',
          location: 'Hyderabad',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MeenaPatel',
          profilePhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MeenaPatel',
          dateOfBirth: '1991-04-18',
          dateOfJoining: '2019-11-25',
          businessUnit: 'Facilities',
          status: 'active',
          role: 'EMPLOYEE',
          hasLoginAccess: true,
          isActive: true,
        }
      },
      { new: true, upsert: true }
    );

    console.log('✅ Facilities Specialist 2 created/updated successfully!');
    console.log('  Employee ID:', facilitiesSpec2.employeeId);
    console.log('  Name:       ', facilitiesSpec2.name);
    console.log('  Email:      ', facilitiesSpec2Email);
    console.log('  Password:   ', facilitiesSpec2Password);
    console.log('  Department: ', facilitiesSpec2.department);
    console.log();

    console.log('═══════════════════════════════════════════════════════════');
    console.log('📝 SUMMARY - New Specialist Login Credentials:');
    console.log('═══════════════════════════════════════════════════════════');
    console.log();
    console.log('💰 FINANCE SPECIALISTS:');
    console.log('   1. Rajesh Kumar (FINS001)');
    console.log('      Email:    finance.specialist1@acuvate.com');
    console.log('      Password: Finance@123');
    console.log();
    console.log('   2. Priya Sharma (FINS002)');
    console.log('      Email:    finance.specialist2@acuvate.com');
    console.log('      Password: Finance@123');
    console.log();
    console.log('🏢 FACILITIES SPECIALISTS:');
    console.log('   1. Arun Reddy (FACS001)');
    console.log('      Email:    facilities.specialist1@acuvate.com');
    console.log('      Password: Facilities@123');
    console.log();
    console.log('   2. Meena Patel (FACS002)');
    console.log('      Email:    facilities.specialist2@acuvate.com');
    console.log('      Password: Facilities@123');
    console.log();
    console.log('═══════════════════════════════════════════════════════════');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating specialist users:', error);
    process.exit(1);
  }
}

createSpecialists();
