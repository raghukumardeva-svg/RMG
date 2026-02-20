import dotenv from 'dotenv';
import HelpdeskTicket from './models/HelpdeskTicket';
import connectDB from './config/database';

dotenv.config();

async function checkAllTickets() {
  try {
    await connectDB();

    console.log('🔍 Checking all IT tickets...\n');

    const tickets = await HelpdeskTicket.find({ highLevelCategory: 'IT' });
    
    console.log(`Found ${tickets.length} IT ticket(s):\n`);
    
    tickets.forEach(ticket => {
      console.log(`📋 ${ticket.ticketNumber}: ${ticket.subject}`);
      console.log(`   Status: ${ticket.status}`);
      console.log(`   SubCategory: ${ticket.subCategory}`);
      console.log(`   ApprovalLevel: ${ticket.approvalLevel || 'NONE'}`);
      console.log(`   ApprovalStatus: ${ticket.approvalStatus || 'N/A'}`);
      if (ticket.assignment) {
        console.log(`   Assigned to: ${ticket.assignment.assignedToName} (${ticket.assignment.assignedToId})`);
      } else {
        console.log(`   Assigned to: Not assigned`);
      }
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking tickets:', error);
    process.exit(1);
  }
}

checkAllTickets();
