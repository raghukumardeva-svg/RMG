import mongoose from 'mongoose';
import HelpdeskTicket from './models/HelpdeskTicket';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rmg-portal';

async function deleteTicket(ticketId: string) {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const result = await HelpdeskTicket.findByIdAndDelete(ticketId);
    
    if (result) {
      console.log('✅ Ticket deleted successfully:', result.ticketNumber);
    } else {
      console.log('❌ Ticket not found with ID:', ticketId);
    }

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Get ticket ID from command line argument
const ticketId = process.argv[2];

if (!ticketId) {
  console.error('❌ Please provide a ticket ID');
  console.log('Usage: npx ts-node src/deleteTicket.ts <TICKET_ID>');
  process.exit(1);
}

deleteTicket(ticketId);
