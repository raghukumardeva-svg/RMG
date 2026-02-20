import dotenv from 'dotenv';
import ITSpecialist from './models/ITSpecialist';
import connectDB from './config/database';

dotenv.config();

const itSpecialistsData = [
  {
    employeeId: 'IT002',
    name: 'David Smith',
    email: 'david.smith@company.com',
    role: 'IT_EMPLOYEE' as const,
    specializations: ['Hardware', 'New Equipment Request'],
    team: 'Hardware Team',
    status: 'active' as const,
    activeTicketCount: 0,
    maxCapacity: 5,
    phone: '+1234567801',
    designation: 'Hardware Support Specialist',
  },
  {
    employeeId: 'IT003',
    name: 'Emily Chen',
    email: 'emily.chen@company.com',
    role: 'IT_EMPLOYEE' as const,
    specializations: ['Software', 'Other'],
    team: 'Software Team',
    status: 'active' as const,
    activeTicketCount: 0,
    maxCapacity: 6,
    phone: '+1234567802',
    designation: 'Software Support Engineer',
  },
  {
    employeeId: 'IT004',
    name: 'Michael Johnson',
    email: 'michael.johnson@company.com',
    role: 'IT_EMPLOYEE' as const,
    specializations: ['Network / Connectivity', 'Other'],
    team: 'Network Team',
    status: 'active' as const,
    activeTicketCount: 0,
    maxCapacity: 5,
    phone: '+1234567803',
    designation: 'Network Administrator',
  },
  {
    employeeId: 'IT005',
    name: 'Sarah Williams',
    email: 'sarah.williams@company.com',
    role: 'IT_EMPLOYEE' as const,
    specializations: ['Account / Login Problem', 'Access Request'],
    team: 'Identity Team',
    status: 'active' as const,
    activeTicketCount: 0,
    maxCapacity: 7,
    phone: '+1234567804',
    designation: 'Identity & Access Specialist',
  },
  {
    employeeId: 'IT006',
    name: 'James Anderson',
    email: 'james.anderson@company.com',
    role: 'IT_EMPLOYEE' as const,
    specializations: ['Hardware', 'New Equipment Request'],
    team: 'Hardware Team',
    status: 'active' as const,
    activeTicketCount: 0,
    maxCapacity: 5,
    phone: '+1234567805',
    designation: 'Hardware Support Technician',
  },
  {
    employeeId: 'IT007',
    name: 'Lisa Martinez',
    email: 'lisa.martinez@company.com',
    role: 'IT_EMPLOYEE' as const,
    specializations: ['Software', 'Other'],
    team: 'Software Team',
    status: 'active' as const,
    activeTicketCount: 0,
    maxCapacity: 6,
    phone: '+1234567806',
    designation: 'Application Support Specialist',
  },
  {
    employeeId: 'IT008',
    name: 'Robert Taylor',
    email: 'robert.taylor@company.com',
    role: 'IT_EMPLOYEE' as const,
    specializations: ['Network / Connectivity', 'Other'],
    team: 'Network Team',
    status: 'active' as const,
    activeTicketCount: 0,
    maxCapacity: 5,
    phone: '+1234567807',
    designation: 'Network Support Engineer',
  },
  {
    employeeId: 'IT009',
    name: 'Jennifer Brown',
    email: 'jennifer.brown@company.com',
    role: 'IT_EMPLOYEE' as const,
    specializations: ['Account / Login Problem', 'Access Request'],
    team: 'Identity Team',
    status: 'active' as const,
    activeTicketCount: 0,
    maxCapacity: 7,
    phone: '+1234567808',
    designation: 'Access Management Specialist',
  },
  {
    employeeId: 'IT010',
    name: 'William Davis',
    email: 'william.davis@company.com',
    role: 'IT_EMPLOYEE' as const,
    specializations: ['Access Request', 'Other'],
    team: 'Security Team',
    status: 'active' as const,
    activeTicketCount: 0,
    maxCapacity: 4,
    phone: '+1234567809',
    designation: 'Security Analyst',
  },
  {
    employeeId: 'IT011',
    name: 'Amanda Wilson',
    email: 'amanda.wilson@company.com',
    role: 'IT_EMPLOYEE' as const,
    specializations: ['Software', 'Other'],
    team: 'Software Team',
    status: 'active' as const,
    activeTicketCount: 0,
    maxCapacity: 6,
    phone: '+1234567810',
    designation: 'Collaboration Tools Specialist',
  },
];

async function seedITSpecialists() {
  try {
    await connectDB();

    console.log('🌱 Seeding IT Specialists...');

    // Clear existing specialists
    await ITSpecialist.deleteMany({});
    console.log('✅ Cleared existing IT specialists');

    // Insert new specialists
    const specialists = await ITSpecialist.insertMany(itSpecialistsData);
    console.log(`✅ Created ${specialists.length} IT specialists`);

    console.log('\n📊 IT Specialists Summary:');
    specialists.forEach((specialist) => {
      console.log(`  - ${specialist.name} (${specialist.employeeId}) - ${specialist.team}`);
      console.log(`    Specializations: ${specialist.specializations.join(', ')}`);
    });

    console.log('\n✅ Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding IT specialists:', error);
    process.exit(1);
  }
}

seedITSpecialists();
