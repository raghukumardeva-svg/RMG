import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Employee from './models/Employee';
import connectDB from './config/database';

dotenv.config();

const approversData = [
  {
    name: 'L1 Approver',
    email: 'l1.approver@company.com',
    password: 'L1Approver@123',
    role: 'L1_APPROVER',
    designation: 'Team Lead',
    department: 'Management',
    employeeId: 'L1001',
    isActive: true,
    hasLoginAccess: true,
    status: 'active',
    dateOfJoining: '2024-01-01',
    phone: '+1-555-0101',
    location: 'Headquarters'
  },
  {
    name: 'L2 Approver',
    email: 'l2.approver@company.com',
    password: 'L2Approver@123',
    role: 'L2_APPROVER',
    designation: 'Manager',
    department: 'Management',
    employeeId: 'L2001',
    isActive: true,
    hasLoginAccess: true,
    status: 'active',
    dateOfJoining: '2024-01-01',
    phone: '+1-555-0201',
    location: 'Headquarters'
  },
  {
    name: 'L3 Approver',
    email: 'l3.approver@company.com',
    password: 'L3Approver@123',
    role: 'L3_APPROVER',
    designation: 'Director',
    department: 'Management',
    employeeId: 'L3001',
    isActive: true,
    hasLoginAccess: true,
    status: 'active',
    dateOfJoining: '2024-01-01',
    phone: '+1-555-0301',
    location: 'Headquarters'
  },
];

async function seedApprovers() {
  try {
    await connectDB();

    console.log('🌱 Seeding Approver Employees...');

    // Remove existing approvers
    await Employee.deleteMany({ 
      role: { $in: ['L1_APPROVER', 'L2_APPROVER', 'L3_APPROVER'] } 
    });
    console.log('✅ Cleared existing approver employees');

    // Hash passwords and insert approvers
    const approvers = await Promise.all(
      approversData.map(async (approver) => {
        const hashedPassword = await bcrypt.hash(approver.password, 10);
        return {
          ...approver,
          password: hashedPassword,
        };
      })
    );

    const createdApprovers = await Employee.insertMany(approvers);
    console.log(`✅ Created ${createdApprovers.length} approver employees`);

    console.log('\n📊 Approver Employees Summary:');
    console.log('─'.repeat(60));
    approversData.forEach((approver) => {
      console.log(`  ${approver.role}`);
      console.log(`    Name:        ${approver.name}`);
      console.log(`    Email:       ${approver.email}`);
      console.log(`    Password:    ${approver.password}`);
      console.log(`    Designation: ${approver.designation}`);
      console.log(`    Employee ID: ${approver.employeeId}`);
      console.log('');
    });
    console.log('─'.repeat(60));

    console.log('\n✅ Seeding completed successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('  L1: l1.approver@company.com / L1Approver@123');
    console.log('  L2: l2.approver@company.com / L2Approver@123');
    console.log('  L3: l3.approver@company.com / L3Approver@123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding approvers:', error);
    process.exit(1);
  }
}

seedApprovers();
