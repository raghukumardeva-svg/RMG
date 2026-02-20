const mongoose = require('mongoose');
require('dotenv').config();

const HelpdeskTicketSchema = new mongoose.Schema({}, { strict: false });
const HelpdeskTicket = mongoose.model('HelpdeskTicket', HelpdeskTicketSchema);

async function updateTicket() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rmg-portal');
    console.log('Connected to MongoDB');

    // Update TKT0006 to Cancelled
    const result = await HelpdeskTicket.updateOne(
      { ticketNumber: 'TKT0006' },
      {
        $set: {
          status: 'Cancelled',
          closingReason: 'User Cancellation'
        }
      }
    );

    console.log('Update result:', result);

    // Verify the update
    const updated = await HelpdeskTicket.findOne({ ticketNumber: 'TKT0006' });
    console.log('\nVerification:');
    console.log('Ticket Number:', updated?.ticketNumber);
    console.log('New Status:', updated?.status);
    console.log('Closing Reason:', updated?.closingReason);

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateTicket();
