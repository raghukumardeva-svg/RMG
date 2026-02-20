import mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rmg-portal';

// Define schemas
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  name: String,
  role: String,
  department: String,
  designation: String,
  employeeId: String,
  avatar: String,
}, { timestamps: true, strict: false });

const employeeSchema = new mongoose.Schema({
  employeeId: String,
  id: String,
  name: String,
  email: String,
  phone: String,
  department: String,
  designation: String,
  dateOfJoining: String,
  reportingManager: mongoose.Schema.Types.Mixed,
  location: String,
  status: String,
  avatar: String,
  skills: [String],
  experience: Number,
  education: String,
  address: mongoose.Schema.Types.Mixed,
  emergencyContact: mongoose.Schema.Types.Mixed,
}, { timestamps: true, strict: false });

const attendanceSchema = new mongoose.Schema({
  employeeId: String,
  date: String,
  status: String,
  checkIn: String,
  checkOut: String,
  workHours: Number,
  notes: String,
}, { timestamps: true, strict: false });

const leaveSchema = new mongoose.Schema({
  employeeId: String,
  employeeName: String,
  leaveType: String,
  startDate: String,
  endDate: String,
  days: Number,
  reason: String,
  status: String,
  appliedOn: String,
  approvedBy: String,
  approvedOn: String,
  remarks: String,
}, { timestamps: true, strict: false });

const holidaySchema = new mongoose.Schema({
  name: String,
  date: String,
  type: String,
  description: String,
}, { timestamps: true, strict: false });

const announcementSchema = new mongoose.Schema({
  title: String,
  content: String,
  priority: String,
  category: String,
  publishedBy: String,
  publishedOn: String,
  expiresOn: String,
  targetAudience: [String],
  attachments: [String],
}, { timestamps: true, strict: false });

const celebrationSchema = new mongoose.Schema({
  type: String,
  employeeId: String,
  name: String,
  date: String,
  message: String,
  avatar: String,
}, { timestamps: true });

const newJoinerSchema = new mongoose.Schema({
  employeeId: String,
  name: String,
  designation: String,
  department: String,
  joiningDate: String,
  avatar: String,
}, { timestamps: true });

const projectSchema = new mongoose.Schema({
  projectId: String,
  id: String,
  name: String,
  client: String,
  status: String,
  startDate: String,
  endDate: String,
  budget: Number,
  spent: Number,
  resources: [mongoose.Schema.Types.Mixed],
  description: String,
}, { timestamps: true, strict: false });

const allocationSchema = new mongoose.Schema({
  employeeId: String,
  employeeName: String,
  projectId: String,
  projectName: String,
  allocation: Number,
  startDate: String,
  endDate: String,
  role: String,
  billable: Boolean,
}, { timestamps: true, strict: false });

const payrollSchema = new mongoose.Schema({
  employeeId: String,
  employeeName: String,
  month: String,
  year: Number,
  basicSalary: Number,
  hra: Number,
  allowances: Number,
  deductions: Number,
  netSalary: Number,
  status: String,
  paymentDate: String,
}, { timestamps: true, strict: false });

const helpdeskTicketSchema = new mongoose.Schema({
  ticketNumber: String,
  id: String,
  userId: String,
  userName: String,
  userEmail: String,
  userDepartment: String,
  highLevelCategory: String,
  subCategory: String,
  subject: String,
  description: String,
  urgency: String,
  status: String,
  approval: mongoose.Schema.Types.Mixed,
  processing: mongoose.Schema.Types.Mixed,
  assignment: mongoose.Schema.Types.Mixed,
  conversation: [mongoose.Schema.Types.Mixed],
  attachments: [String],
  history: [mongoose.Schema.Types.Mixed],
  sla: mongoose.Schema.Types.Mixed,
  createdAt: String,
  updatedAt: String,
}, { timestamps: true, strict: false });

const subCategoryMappingSchema = new mongoose.Schema({
  category: String,
  subcategories: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

// Create models
const User = mongoose.model('User', userSchema);
const Employee = mongoose.model('Employee', employeeSchema);
const Attendance = mongoose.model('Attendance', attendanceSchema);
const Leave = mongoose.model('Leave', leaveSchema);
const Holiday = mongoose.model('Holiday', holidaySchema);
const Announcement = mongoose.model('Announcement', announcementSchema);
const Celebration = mongoose.model('Celebration', celebrationSchema);
const NewJoiner = mongoose.model('NewJoiner', newJoinerSchema);
const Project = mongoose.model('Project', projectSchema);
const Allocation = mongoose.model('Allocation', allocationSchema);
const Payroll = mongoose.model('Payroll', payrollSchema);
const HelpdeskTicket = mongoose.model('HelpdeskTicket', helpdeskTicketSchema);
const SubCategoryMapping = mongoose.model('SubCategoryMapping', subCategoryMappingSchema);

// Read JSON file helper
function readJsonFile(filename: string): Record<string, unknown>[] {
  try {
    const dataPath = path.join(__dirname, '../../src/data', filename);
    const data = fs.readFileSync(dataPath, 'utf-8');
    const jsonData = JSON.parse(data);
    
    // Remove _id field to let MongoDB generate its own
    return jsonData.map((item: Record<string, unknown>) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _id, ...rest } = item;
      return rest;
    });
  } catch (error) {
    console.error(`❌ Error reading JSON file ${filename}:`, error);
    throw new Error(`Failed to parse ${filename}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Seed function
async function seedDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.collection.drop().catch(() => {});
    await Employee.collection.drop().catch(() => {});
    await Attendance.collection.drop().catch(() => {});
    await Leave.collection.drop().catch(() => {});
    await Holiday.collection.drop().catch(() => {});
    await Announcement.collection.drop().catch(() => {});
    await Celebration.collection.drop().catch(() => {});
    await NewJoiner.collection.drop().catch(() => {});
    await Project.collection.drop().catch(() => {});
    await Allocation.collection.drop().catch(() => {});
    await Payroll.collection.drop().catch(() => {});
    await HelpdeskTicket.collection.drop().catch(() => {});
    await SubCategoryMapping.collection.drop().catch(() => {});
    console.log('✅ Cleared existing data');

    // Seed Users
    console.log('📥 Importing users...');
    const users = readJsonFile('users.json');
    await User.insertMany(users);
    console.log(`✅ Imported ${users.length} users`);

    // Seed Employees
    console.log('📥 Importing employees...');
    const employees = readJsonFile('employees.json');
    await Employee.insertMany(employees);
    console.log(`✅ Imported ${employees.length} employees`);

    // Seed Attendance
    console.log('📥 Importing attendance records...');
    const attendance = readJsonFile('attendance.json');
    await Attendance.insertMany(attendance);
    console.log(`✅ Imported ${attendance.length} attendance records`);

    // Seed Leaves
    console.log('📥 Importing leave records...');
    const leaves = readJsonFile('leaves.json');
    await Leave.insertMany(leaves);
    console.log(`✅ Imported ${leaves.length} leave records`);

    // Seed Holidays
    console.log('📥 Importing holidays...');
    const holidays = readJsonFile('holidays.json');
    await Holiday.insertMany(holidays);
    console.log(`✅ Imported ${holidays.length} holidays`);

    // Seed Announcements
    console.log('📥 Importing announcements...');
    const announcements = readJsonFile('announcements.json');
    await Announcement.insertMany(announcements);
    console.log(`✅ Imported ${announcements.length} announcements`);

    // Seed Celebrations
    console.log('📥 Importing celebrations...');
    const celebrations = readJsonFile('celebrations.json');
    await Celebration.insertMany(celebrations);
    console.log(`✅ Imported ${celebrations.length} celebrations`);

    // Seed New Joiners
    console.log('📥 Importing new joiners...');
    const newJoiners = readJsonFile('newJoiners.json');
    await NewJoiner.insertMany(newJoiners);
    console.log(`✅ Imported ${newJoiners.length} new joiners`);

    // Seed Projects
    console.log('📥 Importing projects...');
    const projects = readJsonFile('projects.json');
    await Project.insertMany(projects);
    console.log(`✅ Imported ${projects.length} projects`);

    // Seed Allocations
    console.log('📥 Importing allocations...');
    const allocations = readJsonFile('allocations.json');
    await Allocation.insertMany(allocations);
    console.log(`✅ Imported ${allocations.length} allocations`);

    // Seed Payroll
    console.log('📥 Importing payroll records...');
    const payroll = readJsonFile('payroll.json');
    await Payroll.insertMany(payroll);
    console.log(`✅ Imported ${payroll.length} payroll records`);

    // Seed SubCategory Mapping
    console.log('📥 Importing subcategory mappings...');
    try {
      const subCategoryMappingRaw = fs.readFileSync(
        path.join(__dirname, '../../src/data/subCategoryMapping.json'),
        'utf-8'
      );
      const subCategoryMapping = JSON.parse(subCategoryMappingRaw);
      await SubCategoryMapping.insertMany([{ 
        category: 'all',
        subcategories: subCategoryMapping 
      }]);
      console.log(`✅ Imported subcategory mappings`);
    } catch (error) {
      console.error('❌ Error importing subcategory mappings:', error);
      throw error;
    }

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Users: ${users.length}`);
    console.log(`   Employees: ${employees.length}`);
    console.log(`   Attendance: ${attendance.length}`);
    console.log(`   Leaves: ${leaves.length}`);
    console.log(`   Holidays: ${holidays.length}`);
    console.log(`   Announcements: ${announcements.length}`);
    console.log(`   Celebrations: ${celebrations.length}`);
    console.log(`   New Joiners: ${newJoiners.length}`);
    console.log(`   Projects: ${projects.length}`);
    console.log(`   Allocations: ${allocations.length}`);
    console.log(`   Payroll: ${payroll.length}`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run seeding
seedDatabase();
