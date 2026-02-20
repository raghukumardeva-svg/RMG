/**
 * Check recent timesheet entries
 */
require("dotenv").config();
const mongoose = require("mongoose");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/rmg-portal";

async function checkRecent() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const TimesheetEntry = mongoose.model(
      "TimesheetEntry",
      new mongoose.Schema({}, { strict: false }),
    );

    // Check for entries from the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const recentEntries = await TimesheetEntry.find({
      createdAt: { $gte: oneHourAgo },
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    console.log(
      "\n📊 Found",
      recentEntries.length,
      "entries created in last hour:",
    );
    console.log("");

    recentEntries.forEach((entry, idx) => {
      console.log(
        `${idx + 1}. Employee: ${entry.employeeId}`,
        `| Date: ${new Date(entry.date).toLocaleDateString()}`,
        `| Project: ${entry.projectId}`,
        `| UDA: ${String(entry.udaId).substring(0, 12)}`,
        `| Status: ${entry.approvalStatus || "pending"}`,
        `| Reason: ${entry.rejectedReason || "null"}`,
      );
    });

    // Also check specific entries mentioned in error
    console.log("\n🔍 Checking specific entries:");
    const specific = await TimesheetEntry.find({
      projectId: { $in: ["PRJ-2002", "PRJ-1001", "IPD0002"] },
      employeeId: "RMG001",
    })
      .sort({ date: 1 })
      .lean();

    console.log(
      "\n📋 Found",
      specific.length,
      "entries for projects PRJ-2002, PRJ-1001, IPD0002:",
    );
    specific.forEach((entry, idx) => {
      const dateObj = new Date(entry.date);
      console.log(
        `${idx + 1}. Date: ${dateObj.toISOString().split("T")[0]}`,
        `(${dateObj.toLocaleDateString("en-US", { weekday: "short" })})`,
        `| Project: ${entry.projectId}`,
        `| UDA: ${String(entry.udaId).substring(0, 12)}`,
        `| Approval: ${entry.approvalStatus || "pending"}`,
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

checkRecent();
