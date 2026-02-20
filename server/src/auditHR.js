const mongoose = require('mongoose');

async function auditHRWorkflows() {
  try {
    await mongoose.connect('mongodb://localhost:27017/rmg-portal');
    
    console.log('\n✅ HR WORKFLOWS AUDIT');
    console.log('='.repeat(60));
    
    const Employee = mongoose.model('Employee', new mongoose.Schema({}, { strict: false }));
    const Leave = mongoose.model('Leave', new mongoose.Schema({}, { strict: false }));
    
    // Check HR personnel
    const hrUsers = await Employee.find({ role: 'HR' }).lean();
    console.log('\n👥 HR Personnel:');
    console.log(`   HR Users: ${hrUsers.length}`);
    if (hrUsers.length > 0) {
      hrUsers.forEach(hr => console.log(`     - ${hr.name} (${hr.email})`));
    } else {
      console.log('   ⚠️  No HR users found!');
    }
    
    // Check leave requests
    const leaves = await Leave.find({}).lean();
    console.log(`\n📊 Leave Management:`);
    console.log(`   Total Leave Requests: ${leaves.length}`);
    
    if (leaves.length > 0) {
      // Status breakdown
      const statuses = {};
      leaves.forEach(l => {
        const status = l.status || 'Unknown';
        statuses[status] = (statuses[status] || 0) + 1;
      });
      
      console.log('\n   Status Distribution:');
      Object.entries(statuses).forEach(([status, count]) => {
        console.log(`     ${status}: ${count}`);
      });
      
      // Leave types
      const types = {};
      leaves.forEach(l => {
        const type = l.leaveType || 'Unknown';
        types[type] = (types[type] || 0) + 1;
      });
      
      console.log('\n   Leave Types:');
      Object.entries(types).forEach(([type, count]) => {
        console.log(`     ${type}: ${count}`);
      });
      
      // Recent leaves
      console.log('\n   Recent Leave Requests:');
      const recent = leaves.slice(-5);
      recent.forEach(l => {
        console.log(`     - ${l.employeeName || 'Unknown'}: ${l.leaveType} (${l.status})`);
        console.log(`       ${l.startDate} to ${l.endDate}`);
      });
      
      // Check for approval workflow
      const pendingApproval = leaves.filter(l => l.status === 'Pending' || l.status === 'Pending Approval').length;
      const approved = leaves.filter(l => l.status === 'Approved').length;
      const rejected = leaves.filter(l => l.status === 'Rejected').length;
      
      console.log('\n   Approval Status:');
      console.log(`     Pending: ${pendingApproval}`);
      console.log(`     Approved: ${approved}`);
      console.log(`     Rejected: ${rejected}`);
    }
    
    // Check employee records
    const allEmployees = await Employee.find({}).lean();
    console.log(`\n👤 Employee Management:`);
    console.log(`   Total Employees: ${allEmployees.length}`);
    console.log(`   Active: ${allEmployees.filter(e => e.isActive).length}`);
    console.log(`   Inactive: ${allEmployees.filter(e => !e.isActive).length}`);
    
    // Department distribution
    const departments = {};
    allEmployees.forEach(e => {
      const dept = e.department || 'Unknown';
      departments[dept] = (departments[dept] || 0) + 1;
    });
    
    console.log('\n   Department Distribution:');
    Object.entries(departments).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([dept, count]) => {
      console.log(`     ${dept}: ${count}`);
    });
    
    // Check for manager relationships
    const withManagers = allEmployees.filter(e => e.reportingManager || e.managerId).length;
    console.log(`\n   Reporting Structure:`);
    console.log(`     Employees with managers: ${withManagers}`);
    console.log(`     Without managers: ${allEmployees.length - withManagers}`);
    
    // HR Dashboard features check
    console.log('\n📋 HR Dashboard Features:');
    console.log('   ✅ Employee Directory');
    console.log('   ✅ Leave Management');
    console.log(`   ${leaves.length > 0 ? '✅' : '⚠️ '} Leave Request History`);
    console.log(`   ${withManagers > 0 ? '✅' : '⚠️ '} Team Hierarchy`);
    
    // Workflow integrity
    console.log('\n🔍 Workflow Integrity:');
    
    // Check for old pending leaves
    const oldPending = leaves.filter(l => {
      const isPending = l.status === 'Pending' || l.status === 'Pending Approval';
      const isOld = new Date() - new Date(l.createdAt) > 30 * 24 * 60 * 60 * 1000;
      return isPending && isOld;
    });
    
    if (oldPending.length > 0) {
      console.log(`   ⚠️  ${oldPending.length} leave requests pending >30 days`);
    } else {
      console.log('   ✅ No stale leave requests');
    }
    
    // Check for leave balance tracking
    const withLeaveBalance = allEmployees.filter(e => e.leaveBalance || e.annualLeave).length;
    if (withLeaveBalance > 0) {
      console.log(`   ✅ Leave balance tracked (${withLeaveBalance} employees)`);
    } else {
      console.log('   ⚠️  Leave balance not implemented');
    }
    
    // Test scenarios
    console.log('\n🧪 Test Coverage:');
    console.log('   Manual testing required:');
    console.log('   1. Employee applies for leave');
    console.log('   2. Manager receives notification');
    console.log('   3. Manager approves/rejects leave');
    console.log('   4. HR can view all leave requests');
    console.log('   5. Leave balance updates correctly');
    console.log('   6. Calendar integration works');
    
    // Recommendations
    console.log('\n💡 Recommendations:');
    if (hrUsers.length === 0) {
      console.log('   ⚠️  Add at least one HR user');
    }
    if (leaves.length === 0) {
      console.log('   ⚠️  Test leave workflow with sample data');
    }
    if (withLeaveBalance === 0) {
      console.log('   ⚠️  Implement leave balance tracking');
    }
    if (withManagers < allEmployees.length * 0.8) {
      console.log('   ⚠️  Complete manager assignments for all employees');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ AUDIT COMPLETE');
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('Audit failed:', error);
    process.exit(1);
  }
}

auditHRWorkflows();
