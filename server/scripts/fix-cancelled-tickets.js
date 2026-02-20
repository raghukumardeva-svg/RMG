/**
 * Script to update existing tickets that were cancelled by users
 * but have status "Closed" instead of "Cancelled"
 *
 * Run with: node server/scripts/fix-cancelled-tickets.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const HelpdeskTicketSchema = new mongoose.Schema({}, { strict: false });
const HelpdeskTicket = mongoose.model('HelpdeskTicket', HelpdeskTicketSchema);

async function fixCancelledTickets() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rmg-portal');
    console.log('Connected to MongoDB');

    // Find tickets that were closed by users (not IT staff)
    // These are tickets with:
    // - status: "Closed"
    // - closingReason is undefined or set by user action (not IT Specialist Closure)
    // - history contains user cancellation action

    const tickets = await HelpdeskTicket.find({
      status: 'Closed',
      $or: [
        { closingReason: { $exists: false } },
        { closingReason: { $ne: 'IT Specialist Closure' } }
      ]
    });

    console.log(`Found ${tickets.length} tickets with "Closed" status that might be user cancellations`);

    let updatedCount = 0;
    for (const ticket of tickets) {
      // Check if this was a user cancellation by looking at the workflow
      // User cancelled tickets typically don't go through the full workflow
      const wasUserCancelled =
        !ticket.assignment?.assignedToId && // Not assigned to IT
        ticket.status === 'Closed' &&
        (!ticket.closingReason || ticket.closingReason !== 'IT Specialist Closure');

      if (wasUserCancelled) {
        console.log(`Updating ticket ${ticket.ticketNumber} from "Closed" to "Cancelled"`);

        ticket.status = 'Cancelled';
        ticket.closingReason = 'User Cancellation';

        // Update history if it exists
        if (ticket.history) {
          const closeHistoryIndex = ticket.history.findIndex(h => h.action === 'closed');
          if (closeHistoryIndex !== -1) {
            ticket.history[closeHistoryIndex].action = 'cancelled';
            ticket.history[closeHistoryIndex].details = ticket.history[closeHistoryIndex].details?.replace('closed', 'cancelled');
          }
        }

        await ticket.save();
        updatedCount++;
      }
    }

    console.log(`\nSuccessfully updated ${updatedCount} tickets from "Closed" to "Cancelled"`);

  } catch (error) {
    console.error('Error fixing cancelled tickets:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

fixCancelledTickets();
