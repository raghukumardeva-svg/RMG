import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/database';

dotenv.config();

async function migrateWorkCompletedStatus() {
  try {
    await connectDB();

    console.log('🔄 Starting migration: Work Completed → Closed');
    console.log('   Also migrating: Completed - Awaiting IT Closure → Closed');

    // Find all tickets with "Work Completed" or "Completed - Awaiting IT Closure" status
    // Using direct MongoDB query to bypass TypeScript type checking
    const HelpdeskTicketModel = mongoose.connection.collection('helpdesktickets');
    
    const ticketsToMigrate = await HelpdeskTicketModel.find({
      status: { $in: ['Work Completed', 'Completed - Awaiting IT Closure'] }
    }).toArray();

    console.log(`\nFound ${ticketsToMigrate.length} tickets to migrate:`);
    
    const workCompletedCount = ticketsToMigrate.filter(t => t.status === 'Work Completed').length;
    const awaitingClosureCount = ticketsToMigrate.filter(t => t.status === 'Completed - Awaiting IT Closure').length;
    
    console.log(`   - Work Completed: ${workCompletedCount}`);
    console.log(`   - Completed - Awaiting IT Closure: ${awaitingClosureCount}`);

    if (ticketsToMigrate.length === 0) {
      console.log('\n✅ No tickets to migrate. All done!');
      process.exit(0);
    }

    // Update each ticket
    let successCount = 0;
    let errorCount = 0;

    for (const ticket of ticketsToMigrate) {
      try {
        const oldStatus = ticket.status;
        
        // Add history entry
        const historyEntry = {
          action: 'Status Changed',
          performedBy: 'System Migration',
          performedByName: 'System Migration',
          timestamp: new Date(),
          details: `Status migrated from "${oldStatus}" to "Closed" due to workflow simplification`,
          oldValue: oldStatus,
          newValue: 'Closed',
        };

        // Update the ticket
        await HelpdeskTicketModel.updateOne(
          { _id: ticket._id },
          {
            $set: { status: 'Closed', updatedAt: new Date() },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            $push: { history: historyEntry } as any
          }
        );

        successCount++;
        console.log(`✅ Migrated ticket ${ticket.ticketNumber} (${oldStatus} → Closed)`);
      } catch (error: unknown) {
        errorCount++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ Error migrating ticket ${ticket.ticketNumber}:`, errorMessage);
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   Total tickets found: ${ticketsToMigrate.length}`);
    console.log(`   Successfully migrated: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);
    
    if (errorCount === 0) {
      console.log('\n✅ Migration completed successfully!');
    } else {
      console.log('\n⚠️  Migration completed with errors. Please review.');
    }

    process.exit(0);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : 'No stack trace available';
    console.error('❌ Migration failed:', errorMessage);
    console.error('Stack trace:', errorStack);
    process.exit(1);
  }
}

// Run the migration
migrateWorkCompletedStatus();
