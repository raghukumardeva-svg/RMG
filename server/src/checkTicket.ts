import dotenv from 'dotenv';
import HelpdeskTicket from './models/HelpdeskTicket';
import connectDB from './config/database';

dotenv.config();

async function checkTicket() {
  try {
    await connectDB();

    console.log('🔍 Checking ticket assignments...');

    const tickets = await HelpdeskTicket.find({ status: 'Assigned' });
    
    console.log(`\nFound ${tickets.length} assigned ticket(s):`);
    
    tickets.forEach(ticket => {
      console.log(`\n📋 Ticket: ${ticket.ticketNumber}`);
      console.log(`   Subject: ${ticket.subject}`);
      console.log(`   Status: ${ticket.status}`);
      console.log(`   Assignment:`, ticket.assignment);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking tickets:', error);
    process.exit(1);
  }
}

checkTicket();
