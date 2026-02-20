const { MongoClient, ObjectId } = require("mongodb");

const uri = "mongodb://localhost:27017";
const dbName = "rmg-portal";

const projects = [
  {
    _id: new ObjectId("6985eb80ca282c98ec037b5e"),
    projectId: "P001",
    projectCode: "P001",
    projectName: "Suntory Bot",
    customerId: "CUST-001",
    accountName: "Suntory",
    legalEntity: "Suntory Ltd",
    billingType: "Billable",
    practiceUnit: "Development",
    region: "APAC",
    projectManager: "Project Manager",
    projectManagerEmployeeId: "RMG001",
    industry: "Technology",
    clientType: "Enterprise",
    revenueType: "Time & Materials",
    projectStartDate: "2026-01-01",
    projectEndDate: "2026-12-31",
    projectCurrency: "USD",
    estimatedValue: 100000,
    status: "Active",
    description: "Suntory Bot Development",
    utilization: 0.7,
    teamSize: 5,
    allocationPercentage: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: new ObjectId("6989a479efb1de2d2ba2b558"),
    projectId: "P002",
    projectCode: "P002",
    projectName: "Acuvate Test Project-1",
    customerId: "CUST-002",
    accountName: "Acuvate Software",
    legalEntity: "Acuvate Software Pvt Ltd",
    billingType: "Billable",
    practiceUnit: "Development",
    region: "APAC",
    projectManager: "Test Manager",
    projectManagerEmployeeId: "RMG001",
    industry: "Technology",
    clientType: "Enterprise",
    revenueType: "Time & Materials",
    projectStartDate: "2026-01-01",
    projectEndDate: "2026-12-31",
    projectCurrency: "USD",
    estimatedValue: 150000,
    status: "Active",
    description: "Acuvate Test Project",
    utilization: 0.8,
    teamSize: 8,
    allocationPercentage: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: new ObjectId("699000000000000000000002"),
    projectId: "BENCH",
    projectCode: "BENCH",
    projectName: "Bench",
    customerId: "INTERNAL",
    accountName: "Internal",
    legalEntity: "RMG",
    billingType: "Non-Billable",
    practiceUnit: "Internal",
    region: "APAC",
    projectManager: "HR Manager",
    projectManagerEmployeeId: "RMG001",
    industry: "Internal",
    clientType: "Internal",
    revenueType: "Fixed",
    projectStartDate: "2025-01-01",
    projectEndDate: "2027-12-31",
    projectCurrency: "USD",
    estimatedValue: 0,
    status: "Active",
    description: "Employee Bench Time",
    utilization: 0,
    teamSize: 0,
    allocationPercentage: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

async function insertProjects() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const projectsCollection = db.collection("projects");

    // Delete existing projects with these IDs (if any)
    await projectsCollection.deleteMany({
      _id: {
        $in: projects.map((p) => p._id),
      },
    });

    // Insert new projects
    const result = await projectsCollection.insertMany(projects);
    console.log(`✅ Inserted ${result.insertedCount} projects:`);

    projects.forEach((p) => {
      console.log(`  - ${p.projectId} (${p.projectName}) with _id: ${p._id}`);
    });
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
    console.log("✅ Database connection closed");
  }
}

insertProjects();
