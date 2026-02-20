const mongoose = require('mongoose');

async function auditAuthAndRBAC() {
  try {
    await mongoose.connect('mongodb://localhost:27017/rmg-portal');
    
    console.log('\n✅ AUTHENTICATION & RBAC AUDIT');
    console.log('='.repeat(60));
    
    const Employee = mongoose.model('Employee', new mongoose.Schema({}, { strict: false }));
    const employees = await Employee.find({}).lean();
    
    console.log(`\n📊 Total Employees: ${employees.length}`);
    
    // Role Distribution
    const roles = {};
    employees.forEach(e => {
      const role = e.role || 'NO_ROLE';
      roles[role] = (roles[role] || 0) + 1;
    });
    
    console.log('\n👥 Role Distribution:');
    Object.entries(roles).sort((a, b) => b[1] - a[1]).forEach(([role, count]) => {
      console.log(`   ${role}: ${count}`);
    });
    
    // Login Access
    const loginEnabled = employees.filter(e => e.hasLoginAccess).length;
    const activeUsers = employees.filter(e => e.isActive).length;
    const loginAndActive = employees.filter(e => e.hasLoginAccess && e.isActive).length;
    
    console.log('\n🔐 Login Access:');
    console.log(`   Has Login Access: ${loginEnabled}`);
    console.log(`   Is Active: ${activeUsers}`);
    console.log(`   Login & Active: ${loginAndActive}`);
    console.log(`   No Login Access: ${employees.length - loginEnabled}`);
    
    // Check for users with passwords
    const withPasswords = employees.filter(e => e.password).length;
    console.log(`   With Password Hash: ${withPasswords}`);
    
    // Security Issues
    console.log('\n⚠️ Security Check:');
    const issues = [];
    
    // Check for employees with login but no password
    const noPassword = employees.filter(e => e.hasLoginAccess && !e.password);
    if (noPassword.length > 0) {
      issues.push(`${noPassword.length} users have login access but no password`);
      console.log(`   ⚠️  ${noPassword.length} users with login but no password`);
    }
    
    // Check for employees with no role
    const noRole = employees.filter(e => !e.role);
    if (noRole.length > 0) {
      issues.push(`${noRole.length} users have no role assigned`);
      console.log(`   ⚠️  ${noRole.length} users with no role assigned`);
    }
    
    // Check for inactive users with login access
    const inactiveWithLogin = employees.filter(e => e.hasLoginAccess && !e.isActive);
    if (inactiveWithLogin.length > 0) {
      issues.push(`${inactiveWithLogin.length} inactive users still have login access`);
      console.log(`   ⚠️  ${inactiveWithLogin.length} inactive users with login access`);
    }
    
    if (issues.length === 0) {
      console.log('   ✅ No security issues found');
    }
    
    // Role-based capabilities
    console.log('\n🛡️ Role-Based Capabilities:');
    const roleCapabilities = {
      'EMPLOYEE': 'Can create tickets, view own tickets',
      'MANAGER': 'Can approve tickets (L1/L2/L3)',
      'HR': 'Can manage leave, access HR functions',
      'RMG': 'Can access RMG dashboard',
      'IT_ADMIN': 'Can assign tickets to IT employees',
      'IT_EMPLOYEE': 'Can work on assigned tickets',
      'L1_APPROVER': 'Can approve L1 tickets',
      'L2_APPROVER': 'Can approve L2 tickets',
      'L3_APPROVER': 'Can approve L3 tickets'
    };
    
    Object.entries(roleCapabilities).forEach(([role, capability]) => {
      const count = roles[role] || 0;
      if (count > 0) {
        console.log(`   ${role} (${count}): ${capability}`);
      }
    });
    
    // Sample login users
    console.log('\n👤 Sample Login Users:');
    const loginUsers = employees.filter(e => e.hasLoginAccess && e.isActive).slice(0, 5);
    loginUsers.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - ${user.role}`);
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ AUDIT COMPLETE\n');
    
    process.exit(0);
  } catch (error) {
    console.error('Audit failed:', error);
    process.exit(1);
  }
}

auditAuthAndRBAC();
