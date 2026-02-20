import mongoose from 'mongoose';
import Employee from './models/Employee';
import User from './models/User';
import ITSpecialist from './models/ITSpecialist';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rmg-portal';

async function migrateToUnifiedEmployeeModel() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB Connected:', mongoose.connection.host);
    console.log('📊 Database:', mongoose.connection.name);
    console.log('\n🔄 Starting migration to unified Employee model...\n');

    // Step 1: Get all existing users with login credentials
    const users = await User.find({}).lean();
    console.log(`📋 Found ${users.length} users in User collection`);

    // Step 2: Get all existing employees
    const employees = await Employee.find({}).lean();
    console.log(`📋 Found ${employees.length} employees in Employee collection`);

    // Step 3: Get all IT specialists
    const itSpecialists = await ITSpecialist.find({}).lean();
    console.log(`📋 Found ${itSpecialists.length} IT specialists\n`);

    // Step 4: Create a map of users by email
    const userMap = new Map();
    users.forEach(user => {
      userMap.set(user.email.toLowerCase(), user);
    });

    // Step 5: Create a map of IT specialists by email
    const specialistMap = new Map();
    itSpecialists.forEach(specialist => {
      specialistMap.set(specialist.email.toLowerCase(), specialist);
    });

    // Step 6: Update existing employees with user data
    let updatedCount = 0;
    let createdCount = 0;

    console.log('🔄 Merging user credentials into employee records...\n');

    for (const employee of employees) {
      const user = userMap.get(employee.email.toLowerCase());
      
      if (user) {
        // Employee has login credentials
        await Employee.updateOne(
          { employeeId: employee.employeeId },
          {
            $set: {
              password: user.password,
              role: user.role,
              hasLoginAccess: true,
              isActive: user.isActive !== undefined ? user.isActive : true,
            }
          }
        );
        console.log(`✅ Updated employee ${employee.employeeId} (${employee.name}) with ${user.role} role`);
        updatedCount++;
        userMap.delete(employee.email.toLowerCase());
      } else {
        // Employee without login credentials - keep as EMPLOYEE
        await Employee.updateOne(
          { employeeId: employee.employeeId },
          {
            $set: {
              role: employee.role || 'EMPLOYEE',
              hasLoginAccess: false,
              isActive: true,
            }
          }
        );
      }

      // Check if employee is IT specialist
      const specialist = specialistMap.get(employee.email.toLowerCase());
      if (specialist) {
        await Employee.updateOne(
          { employeeId: employee.employeeId },
          {
            $set: {
              role: 'IT_EMPLOYEE',
              specializations: specialist.specializations,
              team: specialist.team,
              activeTicketCount: specialist.activeTicketCount || 0,
              maxCapacity: specialist.maxCapacity || 10,
              hasLoginAccess: true,
            }
          }
        );
        console.log(`✅ Merged IT specialist data for ${employee.name}`);
        specialistMap.delete(employee.email.toLowerCase());
      }
    }

    // Step 7: Create employee records for users without employee records
    console.log('\n🔄 Creating employee records for users without employee data...\n');

    for (const [, user] of userMap) {
      const newEmployee = new Employee({
        employeeId: user.employeeId || `EMP${Date.now()}`,
        name: user.name,
        email: user.email,
        password: user.password,
        role: user.role,
        department: user.department || 'General',
        designation: user.designation || user.role,
        hasLoginAccess: true,
        isActive: user.isActive !== undefined ? user.isActive : true,
        status: 'active',
        dateOfJoining: new Date().toISOString().split('T')[0],
      });

      await newEmployee.save();
      console.log(`✅ Created employee record for ${user.name} (${user.role})`);
      createdCount++;
    }

    // Step 8: Create employee records for IT specialists without employee records
    console.log('\n🔄 Creating employee records for IT specialists...\n');

    for (const [, specialist] of specialistMap) {
      const newEmployee = new Employee({
        employeeId: specialist.employeeId,
        name: specialist.name,
        email: specialist.email,
        role: 'IT_EMPLOYEE',
        department: 'IT',
        designation: 'IT Specialist',
        specializations: specialist.specializations,
        team: specialist.team,
        activeTicketCount: specialist.activeTicketCount || 0,
        maxCapacity: specialist.maxCapacity || 10,
        hasLoginAccess: true,
        isActive: true,
        status: 'active',
        dateOfJoining: new Date().toISOString().split('T')[0],
      });

      await newEmployee.save();
      console.log(`✅ Created employee record for IT specialist ${specialist.name}`);
      createdCount++;
    }

    // Summary
    console.log('\n' + '─'.repeat(60));
    console.log('✅ Migration completed successfully!');
    console.log('─'.repeat(60));
    console.log(`📊 Updated employees: ${updatedCount}`);
    console.log(`📊 Created employees: ${createdCount}`);
    console.log(`📊 Total employees: ${await Employee.countDocuments()}`);
    console.log('\n📋 Employee breakdown by role:');
    
    const roleCounts = await Employee.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    roleCounts.forEach(({ _id, count }) => {
      console.log(`   ${_id}: ${count}`);
    });

    console.log('\n📋 Login access breakdown:');
    const loginCount = await Employee.countDocuments({ hasLoginAccess: true });
    const noLoginCount = await Employee.countDocuments({ hasLoginAccess: false });
    console.log(`   Has login access: ${loginCount}`);
    console.log(`   No login access: ${noLoginCount}`);

    console.log('\n✅ All users are now unified in the Employee collection!');
    console.log('\n⚠️  Note: User and ITSpecialist collections are still intact.');
    console.log('   You can safely remove them after verifying the migration.\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Database connection closed');
  }
}

// Run migration
migrateToUnifiedEmployeeModel();
