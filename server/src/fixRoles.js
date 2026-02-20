const mongoose = require('mongoose');

async function fixUsersWithoutRoles() {
  try {
    await mongoose.connect('mongodb://localhost:27017/rmg-portal');
    
    console.log('\n🔧 FIXING USERS WITHOUT ROLES');
    console.log('='.repeat(60));
    
    const Employee = mongoose.model('Employee', new mongoose.Schema({}, { strict: false }));
    
    // Find users without roles
    const noRoleUsers = await Employee.find({ role: { $exists: false } }).lean();
    
    console.log(`\n📋 Users without roles: ${noRoleUsers.length}`);
    noRoleUsers.forEach(u => {
      console.log(`   - ${u.name} (${u.email}) - hasLoginAccess: ${u.hasLoginAccess || false}`);
    });
    
    if (noRoleUsers.length === 0) {
      console.log('\n✅ No users without roles found!');
      process.exit(0);
    }
    
    // Update users with login access
    const result = await Employee.updateMany(
      { role: { $exists: false }, hasLoginAccess: true },
      { $set: { role: 'EMPLOYEE' } }
    );
    
    console.log(`\n✅ Updated ${result.modifiedCount} users with login access to EMPLOYEE role`);
    
    // Update remaining users without role (no login access)
    const stillNoRole = await Employee.updateMany(
      { role: { $exists: false } },
      { $set: { role: 'EMPLOYEE' } }
    );
    
    console.log(`✅ Updated ${stillNoRole.modifiedCount} remaining users to EMPLOYEE role`);
    
    // Verify fix
    const remaining = await Employee.find({ role: { $exists: false } }).countDocuments();
    console.log(`\n📊 Verification: ${remaining} users still without roles`);
    
    if (remaining === 0) {
      console.log('✅ All users now have roles assigned!');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ FIX COMPLETE\n');
    
    process.exit(0);
  } catch (error) {
    console.error('Fix failed:', error);
    process.exit(1);
  }
}

fixUsersWithoutRoles();
