const mongoose = require('mongoose');

async function fixUsersWithoutRoles() {
  try {
    await mongoose.connect('mongodb://localhost:27017/rmg-portal');
    console.log('Connected to MongoDB');

    // Find users without roles
    const usersWithoutRoles = await mongoose.connection.db.collection('employees')
      .find({ role: { $exists: false }, hasLoginAccess: true })
      .toArray();
    
    console.log(`Found ${usersWithoutRoles.length} users without roles`);
    
    if (usersWithoutRoles.length > 0) {
      console.log('Users without roles:');
      usersWithoutRoles.forEach(u => console.log(`  - ${u.name} (${u.employeeId})`));
    }

    // Update users without roles
    const result = await mongoose.connection.db.collection('employees').updateMany(
      { role: { $exists: false }, hasLoginAccess: true },
      { $set: { role: 'EMPLOYEE' } }
    );

    console.log(`Updated ${result.modifiedCount} users to have 'EMPLOYEE' role`);

    // Verify
    const remaining = await mongoose.connection.db.collection('employees')
      .countDocuments({ role: { $exists: false }, hasLoginAccess: true });
    
    console.log(`Remaining users without roles: ${remaining}`);

    await mongoose.disconnect();
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixUsersWithoutRoles();
