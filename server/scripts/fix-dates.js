/**
 * Fix timesheet entry dates in database
 * This script deletes entries for the current week and allows resubmission
 */
require("dotenv").config();
const mongoose = require("mongoose");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/rmg-portal";

async function fixDates() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const TimesheetEntry = mongoose.model(
      "TimesheetEntry",
      new mongoose.Schema({}, { strict: false }),
    );

    // Delete entries for week of Feb 16-22, 2026 (the problematic week)
    const weekStart = new Date(2026, 1, 16); // Feb 16, 2026 (month is 0-indexed)
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(2026, 1, 22); // Feb 22, 2026
    weekEnd.setHours(23, 59, 59, 999);

    console.log(
      "🗑️  Deleting entries between:",
      weekStart.toISOString(),
      "and",
      weekEnd.toISOString(),
    );

    const result = await TimesheetEntry.deleteMany({
      date: {
        $gte: weekStart,
        $lte: weekEnd,
      },
    });

    console.log(`✅ Deleted ${result.deletedCount} entries`);
    console.log("");
    console.log("✨ Database cleaned! Now:");
    console.log('   1. Go to "My Timesheet" tab');
    console.log("   2. Add your tasks and enter hours");
    console.log(
      "   3. Submit the timesheet (creates entries with correct dates)",
    );
    console.log("   4. Then test the revert functionality");

    await mongoose.disconnect();
    console.log("");
    console.log("✅ Done!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

fixDates();
