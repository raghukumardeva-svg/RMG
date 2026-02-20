/**
 * Check what dates exist in timesheet entries
 */
require("dotenv").config();
const mongoose = require("mongoose");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/rmg-portal";

async function checkDates() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const TimesheetEntry = mongoose.model(
      "TimesheetEntry",
      new mongoose.Schema({}, { strict: false }),
    );

    const entries = await TimesheetEntry.find({
      employeeId: "RMG001",
      status: "submitted",
    })
      .sort({ date: 1 })
      .limit(20)
      .lean();

    console.log("\n📊 Found", entries.length, "submitted entries for RMG001:");
    console.log("");

    entries.forEach((entry, idx) => {
      console.log(
        `${idx + 1}. Date: ${entry.date}`,
        `| Project: ${entry.projectId}`,
        `| UDA: ${entry.udaId?.toString().substring(0, 8)}`,
        `| Status: ${entry.approvalStatus || "pending"}`,
        `| Reason: ${entry.rejectedReason || "null"}`,
      );
    });

    await mongoose.disconnect();
    console.log("\n✅ Done!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkDates();
