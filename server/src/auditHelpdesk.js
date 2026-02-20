const mongoose = require('mongoose');

async function auditHelpdeskSystem() {
  try {
    await mongoose.connect('mongodb://localhost:27017/rmg-portal');
    
    console.log('\n✅ IT HELPDESK TICKET SYSTEM AUDIT');
    console.log('='.repeat(60));
    
    const HelpdeskTicket = mongoose.model('HelpdeskTicket', new mongoose.Schema({}, { strict: false }));
    const tickets = await HelpdeskTicket.find({}).lean();
    
    console.log(`\n📊 Total Tickets: ${tickets.length}`);
    
    // Status Distribution
    const statuses = {};
    tickets.forEach(t => {
      statuses[t.status] = (statuses[t.status] || 0) + 1;
    });
    
    console.log('\n📈 Status Distribution:');
    Object.entries(statuses).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });
    
    // Workflow Components
    console.log('\n✅ Workflow Components:');
    console.log(`   Approval Required: ${tickets.filter(t => t.requiresApproval).length} tickets`);
    console.log(`   No Approval: ${tickets.filter(t => !t.requiresApproval).length} tickets`);
    console.log(`   Assigned: ${tickets.filter(t => t.assignment).length} tickets`);
    console.log(`   With Resolution: ${tickets.filter(t => t.resolution).length} tickets`);
    console.log(`   Confirmed/Closed: ${tickets.filter(t => ['Confirmed', 'Closed'].includes(t.status)).length} tickets`);
    
    // Check data integrity
    console.log('\n🔍 Data Integrity:');
    const workCompletedTickets = tickets.filter(t => t.status === 'Work Completed');
    console.log(`   Work Completed: ${workCompletedTickets.length}`);
    console.log(`   - With Resolution Notes: ${workCompletedTickets.filter(t => t.resolution && t.resolution.notes).length}`);
    console.log(`   - Missing Resolution Notes: ${workCompletedTickets.filter(t => !t.resolution || !t.resolution.notes).length}`);
    
    // Approval workflow check
    const approvalTickets = tickets.filter(t => t.requiresApproval);
    console.log(`\n📋 Approval Workflow:`);
    console.log(`   L1 Pending: ${tickets.filter(t => t.approvalLevel === 'L1' && t.approvalStatus === 'Pending').length}`);
    console.log(`   L2 Pending: ${tickets.filter(t => t.approvalLevel === 'L2' && t.approvalStatus === 'Pending').length}`);
    console.log(`   L3 Pending: ${tickets.filter(t => t.approvalLevel === 'L3' && t.approvalStatus === 'Pending').length}`);
    console.log(`   Fully Approved: ${tickets.filter(t => t.approvalLevel === 'NONE' && t.approvalStatus === 'Approved').length}`);
    console.log(`   Rejected: ${tickets.filter(t => t.approvalStatus === 'Rejected').length}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ AUDIT COMPLETE\n');
    
    process.exit(0);
  } catch (error) {
    console.error('Audit failed:', error);
    process.exit(1);
  }
}

auditHelpdeskSystem();
