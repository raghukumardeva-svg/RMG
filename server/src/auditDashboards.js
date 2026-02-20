const mongoose = require('mongoose');

// MongoDB Connection
const MONGODB_URI = 'mongodb://localhost:27017/rmg-portal';

async function auditDashboards() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('\n✅ DYNAMIC DASHBOARDS AUDIT');
    console.log('============================================================');

    const db = mongoose.connection.db;
    
    // Get all collections
    const employees = await db.collection('employees').find({}).toArray();
    const tickets = await db.collection('helpdesktickets').find({}).toArray();
    const leaves = await db.collection('leaves').find({}).toArray();
    const projects = await db.collection('projects').find({}).toArray();
    const announcements = await db.collection('announcements').find({}).toArray();
    
    console.log('\n📊 Data Sources:');
    console.log(`   Employees: ${employees.length}`);
    console.log(`   Helpdesk Tickets: ${tickets.length}`);
    console.log(`   Leave Requests: ${leaves.length}`);
    console.log(`   Projects: ${projects.length}`);
    console.log(`   Announcements: ${announcements.length}`);

    // Role distribution for dashboard access
    const roleDistribution = employees.reduce((acc, emp) => {
      const role = emp.role || 'No Role';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});

    console.log('\n👥 Dashboard Access by Role:');
    Object.entries(roleDistribution).forEach(([role, count]) => {
      console.log(`   ${role}: ${count} users`);
    });

    // Employee Dashboard Data
    console.log('\n📱 Employee Dashboard:');
    const activeEmployees = employees.filter(e => e.status === 'Active').length;
    const employeesWithLogin = employees.filter(e => e.email && e.password).length;
    console.log(`   ${activeEmployees > 0 ? '✅' : '⚠️'} Active Employees: ${activeEmployees}`);
    console.log(`   ${employeesWithLogin > 0 ? '✅' : '⚠️'} Employees with Login: ${employeesWithLogin}`);
    console.log(`   ${tickets.length > 0 ? '✅' : '⚠️'} Helpdesk Tickets Available: ${tickets.length}`);
    console.log(`   ${leaves.length > 0 ? '✅' : '⚠️'} Leave History Available: ${leaves.length}`);
    console.log(`   ${announcements.length > 0 ? '✅' : '⚠️'} Announcements Available: ${announcements.length}`);

    // Manager Dashboard Data
    console.log('\n👔 Manager Dashboard:');
    const managers = employees.filter(e => e.role === 'MANAGER');
    const employeesWithManagers = employees.filter(e => e.managerId || e.manager).length;
    const teamTickets = tickets.filter(t => t.requesterId);
    const teamLeaves = leaves.filter(l => l.employeeId);
    
    console.log(`   ${managers.length > 0 ? '✅' : '⚠️'} Managers: ${managers.length}`);
    console.log(`   ${employeesWithManagers > 0 ? '✅' : '⚠️'} Team Members Assigned: ${employeesWithManagers}`);
    console.log(`   ${teamTickets.length > 0 ? '✅' : '⚠️'} Team Tickets Trackable: ${teamTickets.length}`);
    console.log(`   ${teamLeaves.length > 0 ? '✅' : '⚠️'} Team Leave Requests: ${teamLeaves.length}`);

    // HR Dashboard Data
    console.log('\n👥 HR Dashboard:');
    const hrUsers = employees.filter(e => e.role === 'HR');
    const pendingLeaves = leaves.filter(l => l.status === 'pending').length;
    const approvedLeaves = leaves.filter(l => l.status === 'approved').length;
    const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];
    
    console.log(`   ${hrUsers.length > 0 ? '✅' : '⚠️'} HR Users: ${hrUsers.length}`);
    console.log(`   ${departments.length > 0 ? '✅' : '⚠️'} Departments: ${departments.length}`);
    console.log(`   ${leaves.length > 0 ? '✅' : '⚠️'} Total Leave Requests: ${leaves.length}`);
    console.log(`     Pending: ${pendingLeaves}`);
    console.log(`     Approved: ${approvedLeaves}`);

    // IT Admin Dashboard Data
    console.log('\n🔧 IT Admin Dashboard:');
    const itAdmins = employees.filter(e => e.role === 'IT_ADMIN');
    const itEmployees = employees.filter(e => e.role === 'IT_EMPLOYEE');
    const pendingTickets = tickets.filter(t => t.status === 'Open' || t.status === 'Pending Approval').length;
    const assignedTickets = tickets.filter(t => t.assignedTo).length;
    const resolvedTickets = tickets.filter(t => t.status === 'Work Completed' || t.status === 'Confirmed').length;
    
    console.log(`   ${itAdmins.length > 0 ? '✅' : '⚠️'} IT Admins: ${itAdmins.length}`);
    console.log(`   ${itEmployees.length > 0 ? '✅' : '⚠️'} IT Employees: ${itEmployees.length}`);
    console.log(`   ${tickets.length > 0 ? '✅' : '⚠️'} Total Tickets: ${tickets.length}`);
    console.log(`     Pending Assignment: ${pendingTickets}`);
    console.log(`     Assigned: ${assignedTickets}`);
    console.log(`     Resolved: ${resolvedTickets}`);

    // RMG Dashboard Data
    console.log('\n📊 RMG Dashboard:');
    const rmgUsers = employees.filter(e => e.role === 'RMG');
    console.log(`   ${rmgUsers.length > 0 ? '✅' : '⚠️'} RMG Users: ${rmgUsers.length}`);
    console.log(`   ${employees.length > 0 ? '✅' : '⚠️'} Employee Records: ${employees.length}`);
    console.log(`   ${projects.length > 0 ? '✅' : '⚠️'} Projects: ${projects.length}`);
    console.log(`   ${departments.length > 0 ? '✅' : '⚠️'} Departments: ${departments.length}`);

    // Data Consistency Checks
    console.log('\n🔍 Data Consistency:');
    
    // Check for orphaned tickets
    const ticketsWithInvalidRequester = tickets.filter(t => {
      return t.requesterId && !employees.find(e => e.email === t.requesterId);
    });
    console.log(`   ${ticketsWithInvalidRequester.length === 0 ? '✅' : '⚠️'} Orphaned Tickets: ${ticketsWithInvalidRequester.length}`);
    
    // Check for orphaned leaves
    const leavesWithInvalidEmployee = leaves.filter(l => {
      return l.employeeId && !employees.find(e => e.email === l.employeeId || e.id === l.employeeId);
    });
    console.log(`   ${leavesWithInvalidEmployee.length === 0 ? '✅' : '⚠️'} Orphaned Leave Requests: ${leavesWithInvalidEmployee.length}`);
    
    // Check for employees without email
    const employeesWithoutEmail = employees.filter(e => !e.email).length;
    console.log(`   ${employeesWithoutEmail === 0 ? '✅' : '⚠️'} Employees without Email: ${employeesWithoutEmail}`);

    // Widget Functionality Checks
    console.log('\n🎯 Widget Functionality:');
    
    // Quick Stats Widget
    const hasQuickStats = employees.length > 0 && tickets.length >= 0 && leaves.length >= 0;
    console.log(`   ${hasQuickStats ? '✅' : '⚠️'} Quick Stats Widget Data Available`);
    
    // Recent Activity Widget
    const hasRecentActivity = tickets.length > 0 || leaves.length > 0;
    console.log(`   ${hasRecentActivity ? '✅' : '⚠️'} Recent Activity Data Available`);
    
    // Team Performance Widget
    const hasTeamData = employeesWithManagers > 0;
    console.log(`   ${hasTeamData ? '✅' : '⚠️'} Team Performance Data Available`);
    
    // Announcements Widget
    console.log(`   ${announcements.length > 0 ? '✅' : '⚠️'} Announcements Widget Data Available`);

    // Recommendations
    console.log('\n💡 Recommendations:');
    
    if (employeesWithManagers < employees.length * 0.5) {
      console.log('   ⚠️ Complete manager assignments for better team dashboards');
    }
    
    if (projects.length === 0) {
      console.log('   ⚠️ Add project data for RMG dashboard functionality');
    }
    
    if (announcements.length === 0) {
      console.log('   ⚠️ Add announcements for communication features');
    }
    
    if (ticketsWithInvalidRequester.length > 0) {
      console.log('   ⚠️ Clean up orphaned ticket references');
    }
    
    if (leavesWithInvalidEmployee.length > 0) {
      console.log('   ⚠️ Clean up orphaned leave request references');
    }

    if (employeesWithManagers >= employees.length * 0.5 && 
        projects.length > 0 && 
        announcements.length > 0 &&
        ticketsWithInvalidRequester.length === 0 &&
        leavesWithInvalidEmployee.length === 0) {
      console.log('   ✅ All dashboard data sources are well-configured');
    }

    console.log('\n============================================================');
    console.log('✅ AUDIT COMPLETE\n');

  } catch (error) {
    console.error('❌ Audit failed:', error);
  } finally {
    await mongoose.connection.close();
  }
}

auditDashboards();
