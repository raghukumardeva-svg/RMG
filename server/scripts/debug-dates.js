/**
 * Debug date comparison issue
 */
require("dotenv").config();
const mongoose = require("mongoose");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/rmg-portal";

async function debugDates() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    const TimesheetEntry = mongoose.model(
      "TimesheetEntry",
      new mongoose.Schema({}, { strict: false }),
    );

    // Get the entry submitted for Feb 16, 2026
    const entries = await TimesheetEntry.find({
      employeeId: "RMG001",
      projectId: "PRJ-1001",
      udaId: "6981fa5b9fe4a66eb1fc9152",
    }).lean();

    console.log("📋 Found", entries.length, "entries:\n");

    entries.forEach((entry, idx) => {
      const date = entry.date;
      console.log(`Entry ${idx + 1}:`);
      console.log("  - date field type:", typeof date);
      console.log("  - date value:", date);
      console.log("  - date constructor:", date.constructor.name);
      if (date instanceof Date) {
        console.log("  - toISOString():", date.toISOString());
        console.log("  - toLocaleDateString():", date.toLocaleDateString());
        console.log("  - getFullYear():", date.getFullYear());
        console.log(
          "  - getMonth():",
          date.getMonth(),
          `(${date.getMonth() + 1})`,
        );
        console.log("  - getDate():", date.getDate());
        console.log("  - getHours():", date.getHours());
      }
      console.log("  - approvalStatus:", entry.approvalStatus);
      console.log("  - rejectedReason:", entry.rejectedReason);
      console.log("");
    });

    // Now test the filter that should match
    console.log("\n🔍 Testing filter matching:\n");

    const [year, month, day] = "2026-02-16".split("-").map(Number);
    const testDate1 = new Date(year, month - 1, day + 0); // Monday
    testDate1.setHours(0, 0, 0, 0);

    console.log("Filter date (method 1 - current code):");
    console.log("  - testDate1:", testDate1);
    console.log("  - toISOString():", testDate1.toISOString());
    console.log("");

    const match1 = await TimesheetEntry.findOne({
      employeeId: "RMG001",
      projectId: "PRJ-1001",
      udaId: "6981fa5b9fe4a66eb1fc9152",
      date: testDate1,
      status: "submitted",
    });

    console.log("Match with testDate1:", match1 ? "✅ FOUND" : "❌ NOT FOUND");

    // Test alternative method
    const testDate2 = new Date("2026-02-16T00:00:00.000");
    console.log("\nFilter date (method 2 - ISO string without timezone):");
    console.log("  - testDate2:", testDate2);
    console.log("  - toISOString():", testDate2.toISOString());

    const match2 = await TimesheetEntry.findOne({
      employeeId: "RMG001",
      projectId: "PRJ-1001",
      udaId: "6981fa5b9fe4a66eb1fc9152",
      date: testDate2,
      status: "submitted",
    });

    console.log("Match with testDate2:", match2 ? "✅ FOUND" : "❌ NOT FOUND");

    // Test with date range
    const startOfDay = new Date(year, month - 1, day);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(year, month - 1, day);
    endOfDay.setHours(23, 59, 59, 999);

    console.log("\nFilter date (method 3 - date range):");
    console.log("  - startOfDay:", startOfDay.toISOString());
    console.log("  - endOfDay:", endOfDay.toISOString());

    const match3 = await TimesheetEntry.findOne({
      employeeId: "RMG001",
      projectId: "PRJ-1001",
      udaId: "6981fa5b9fe4a66eb1fc9152",
      date: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
      status: "submitted",
    });

    console.log("Match with date range:", match3 ? "✅ FOUND" : "❌ NOT FOUND");
    if (match3) {
      console.log("  - Matched date:", match3.date);
      console.log("  - approvalStatus:", match3.approvalStatus);
    }

    await mongoose.disconnect();
    console.log("\n✅ Done!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

debugDates();
