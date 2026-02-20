const mongoose = require('mongoose');

// MongoDB Connection
const MONGODB_URI = 'mongodb://localhost:27017/rmg-portal';

async function auditTeamMapping() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('\n✅ TEAM MAPPING AUDIT');
    console.log('============================================================');

    const db = mongoose.connection.db;
    const employees = await db.collection('employees').find({}).toArray();
    
    console.log(`\n📊 Total Employees: ${employees.length}`);
    
    // Check manager relationships
    const withManager = employees.filter(e => e.managerId || e.manager);
    const withoutManager = employees.filter(e => !e.managerId && !e.manager);
    const managers = employees.filter(e => e.role === 'MANAGER');
    
    console.log('\n👥 Manager Relationships:');
    console.log(`   Employees with Manager: ${withManager.length} (${((withManager.length/employees.length)*100).toFixed(1)}%)`);
    console.log(`   Employees without Manager: ${withoutManager.length} (${((withoutManager.length/employees.length)*100).toFixed(1)}%)`);
    console.log(`   Total Managers: ${managers.length}`);
    
    // List employees without managers
    if (withoutManager.length > 0) {
      console.log('\n⚠️  Employees without Manager Assignment:');
      withoutManager.forEach(emp => {
        console.log(`     - ${emp.name || 'Unknown'} (${emp.email || 'No Email'}) - ${emp.department || 'No Department'}`);
      });
    }
    
    // Check team sizes
    if (withManager.length > 0) {
      console.log('\n📈 Team Structure:');
      const managerTeams = {};
      
      withManager.forEach(emp => {
        const managerId = emp.managerId || emp.manager;
        if (!managerTeams[managerId]) {
          managerTeams[managerId] = [];
        }
        managerTeams[managerId].push(emp);
      });
      
      Object.entries(managerTeams).forEach(([managerId, team]) => {
        const manager = employees.find(e => 
          e.id === managerId || 
          e.email === managerId || 
          e._id?.toString() === managerId
        );
        const managerName = manager ? manager.name : managerId;
        console.log(`   ${managerName}: ${team.length} team members`);
        team.forEach(member => {
          console.log(`     - ${member.name || 'Unknown'} (${member.department || 'No Dept'})`);
        });
      });
    }
    
    // Department distribution
    console.log('\n🏢 Department Distribution:');
    const deptMap = {};
    employees.forEach(emp => {
      const dept = emp.department || 'Unassigned';
      deptMap[dept] = (deptMap[dept] || 0) + 1;
    });
    
    Object.entries(deptMap)
      .sort((a, b) => b[1] - a[1])
      .forEach(([dept, count]) => {
        console.log(`   ${dept}: ${count} employees`);
      });
    
    // Reporting hierarchy depth
    console.log('\n🔄 Reporting Hierarchy:');
    
    function getReportingChain(employee, visited = new Set()) {
      if (!employee || visited.has(employee.email)) return 0;
      visited.add(employee.email);
      
      const managerId = employee.managerId || employee.manager;
      if (!managerId) return 0;
      
      const manager = employees.find(e => 
        e.id === managerId || 
        e.email === managerId || 
        e._id?.toString() === managerId
      );
      
      return manager ? 1 + getReportingChain(manager, visited) : 0;
    }
    
    const chainLengths = employees.map(emp => getReportingChain(emp));
    const maxDepth = Math.max(...chainLengths);
    const avgDepth = chainLengths.reduce((a, b) => a + b, 0) / chainLengths.length;
    
    console.log(`   Maximum Depth: ${maxDepth} levels`);
    console.log(`   Average Depth: ${avgDepth.toFixed(2)} levels`);
    console.log(`   Employees at Top Level: ${chainLengths.filter(d => d === 0).length}`);
    
    // Check for circular references
    console.log('\n🔍 Data Integrity:');
    
    let circularRefs = 0;
    employees.forEach(emp => {
      const visited = new Set();
      let current = emp;
      
      while (current) {
        if (visited.has(current.email)) {
          circularRefs++;
          break;
        }
        visited.add(current.email);
        
        const managerId = current.managerId || current.manager;
        if (!managerId) break;
        
        current = employees.find(e => 
          e.id === managerId || 
          e.email === managerId || 
          e._id?.toString() === managerId
        );
      }
    });
    
    console.log(`   ${circularRefs === 0 ? '✅' : '⚠️'} Circular References: ${circularRefs}`);
    
    // Check for invalid manager references
    const invalidRefs = withManager.filter(emp => {
      const managerId = emp.managerId || emp.manager;
      return !employees.find(e => 
        e.id === managerId || 
        e.email === managerId || 
        e._id?.toString() === managerId
      );
    });
    
    console.log(`   ${invalidRefs.length === 0 ? '✅' : '⚠️'} Invalid Manager References: ${invalidRefs.length}`);
    
    if (invalidRefs.length > 0) {
      console.log('\n   Employees with invalid manager references:');
      invalidRefs.forEach(emp => {
        console.log(`     - ${emp.name} -> ${emp.managerId || emp.manager} (not found)`);
      });
    }
    
    // Recommendations
    console.log('\n💡 Recommendations:');
    
    if (withoutManager.length > employees.length * 0.5) {
      console.log(`   ⚠️ ${withoutManager.length} employees need manager assignment`);
      console.log('      This affects team dashboards and approval workflows');
    }
    
    if (invalidRefs.length > 0) {
      console.log(`   ⚠️ Fix ${invalidRefs.length} invalid manager references`);
    }
    
    if (circularRefs > 0) {
      console.log(`   ⚠️ Fix ${circularRefs} circular reporting relationships`);
    }
    
    if (managers.length === 0) {
      console.log('   ⚠️ No employees with MANAGER role assigned');
    }
    
    if (maxDepth > 5) {
      console.log(`   ⚠️ Reporting hierarchy is ${maxDepth} levels deep - consider flattening`);
    }
    
    if (withoutManager.length === 0 && invalidRefs.length === 0 && circularRefs === 0) {
      console.log('   ✅ Team mapping is complete and well-structured');
    }

    console.log('\n============================================================');
    console.log('✅ AUDIT COMPLETE\n');

  } catch (error) {
    console.error('❌ Audit failed:', error);
  } finally {
    await mongoose.connection.close();
  }
}

auditTeamMapping();
