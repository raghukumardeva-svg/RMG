/**
 * Fix Ticket Counter Script
 * 
 * This script syncs the TicketCounter sequence with the highest existing ticket number.
 * Run this when you get "ticketNumber already exists" errors.
 * 
 * Usage: node scripts/fix-ticket-counter.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rmg_portal';

// Define schemas inline for the script
const ticketCounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  sequence: { type: Number, required: true, default: 0 }
});

const helpdeskTicketSchema = new mongoose.Schema({
  ticketNumber: { type: String, required: true }
});

async function fixTicketCounter() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const TicketCounter = mongoose.model('TicketCounter', ticketCounterSchema);
    const HelpdeskTicket = mongoose.model('HelpdeskTicket', helpdeskTicketSchema);

    // Find the highest ticket number
    const tickets = await HelpdeskTicket.find({})
      .select('ticketNumber')
      .sort({ ticketNumber: -1 })
      .limit(10);

    console.log('\n📋 Latest tickets in database:');
    tickets.forEach(t => console.log(`   - ${t.ticketNumber}`));

    // Extract the highest number
    let highestNumber = 0;
    for (const ticket of tickets) {
      const match = ticket.ticketNumber?.match(/TKT(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > highestNumber) {
          highestNumber = num;
        }
      }
    }

    console.log(`\n📊 Highest ticket number found: TKT${String(highestNumber).padStart(4, '0')}`);

    // Get current counter value
    const currentCounter = await TicketCounter.findById('ticketNumber');
    console.log(`📊 Current counter value: ${currentCounter?.sequence || 'NOT SET'}`);

    if (!currentCounter || currentCounter.sequence <= highestNumber) {
      // Update counter to be higher than the highest ticket number
      const newSequence = highestNumber + 1;
      
      await TicketCounter.findOneAndUpdate(
        { _id: 'ticketNumber' },
        { sequence: newSequence },
        { upsert: true, new: true }
      );

      console.log(`\n✅ Counter updated! Next ticket will be: TKT${String(newSequence).padStart(4, '0')}`);
    } else {
      console.log(`\n✅ Counter is already correct (${currentCounter.sequence}). No update needed.`);
    }

    // Verify the fix
    const updatedCounter = await TicketCounter.findById('ticketNumber');
    console.log(`\n📊 Verified counter value: ${updatedCounter?.sequence}`);
    console.log(`📊 Next ticket will be: TKT${String(updatedCounter?.sequence || 1).padStart(4, '0')}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

fixTicketCounter();
