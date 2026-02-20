import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rmg-portal';

const employeeSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const Employee = mongoose.model('Employee', employeeSchema, 'employees');

const loginUsers = [
    {
        employeeId: 'RMG001',
        name: 'Mohan Reddy',
        email: 'mohan.reddy@acuvate.com',
        password: 'Mohan@123',
        role: 'RMG',
        department: 'Resource Management',
        designation: 'Resource Manager',
        location: 'Hyderabad',
        dateOfJoining: '2020-01-15',
        businessUnit: 'RMG',
        profilePhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mohan',
        status: 'active',
        hasLoginAccess: true,
        isActive: true
    },
    {
        employeeId: 'EMP001',
        name: 'Sai Nikhil Bomma',
        email: 'sainikhil.bomma@acuvate.com',
        password: 'Nikhil@123',
        role: 'EMPLOYEE',
        department: 'Engineering',
        designation: 'Senior Developer',
        location: 'Hyderabad',
        dateOfJoining: '2021-01-15',
        businessUnit: 'Engineering',
        profilePhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nikhil',
        status: 'active',
        hasLoginAccess: true,
        isActive: true
    },
    {
        employeeId: 'HR001',
        name: 'HR Admin',
        email: 'hr@acuvate.com',
        password: 'Hr@123',
        role: 'HR',
        department: 'Human Resources',
        designation: 'HR Manager',
        location: 'Hyderabad',
        dateOfJoining: '2019-01-10',
        businessUnit: 'Human Resources',
        profilePhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=HR',
        status: 'active',
        hasLoginAccess: true,
        isActive: true
    },
    {
        employeeId: 'FIN001',
        name: 'Finance Admin',
        email: 'finance@acuvate.com',
        password: 'Finance@123',
        role: 'FINANCE_ADMIN',
        department: 'Finance',
        designation: 'Finance Manager',
        location: 'Hyderabad',
        dateOfJoining: '2019-05-01',
        businessUnit: 'Finance',
        profilePhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Finance',
        status: 'active',
        hasLoginAccess: true,
        isActive: true
    },
    {
        employeeId: 'FAC001',
        name: 'Facilities Admin',
        email: 'facilities@acuvate.com',
        password: 'Facilities@123',
        role: 'FACILITIES_ADMIN',
        department: 'Facilities',
        designation: 'Facilities Manager',
        location: 'Hyderabad',
        dateOfJoining: '2019-06-01',
        businessUnit: 'Facilities',
        profilePhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Facilities',
        status: 'active',
        hasLoginAccess: true,
        isActive: true
    }
];

async function seedLoginUsers() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        for (const userData of loginUsers) {
            const { email, password, ...rest } = userData;

            // Check if user already exists
            const existing = await Employee.findOne({ email: email.toLowerCase() });

            if (existing) {
                console.log(`⚠️  User ${email} already exists, updating...`);
                // Update existing user with login credentials
                await Employee.updateOne(
                    { email: email.toLowerCase() },
                    {
                        $set: {
                            ...rest,
                            email: email.toLowerCase(),
                            password: password, // Plain text - will be hashed on first login
                            hasLoginAccess: true,
                            isActive: true
                        }
                    }
                );
                console.log(`✅ Updated user ${email}`);
            } else {
                console.log(`➕ Creating new user ${email}...`);
                // Create new user
                await Employee.create({
                    ...rest,
                    email: email.toLowerCase(),
                    password: password, // Plain text - will be hashed on first login
                    hasLoginAccess: true,
                    isActive: true
                });
                console.log(`✅ Created user ${email}`);
            }
        }

        console.log('\n✅ All login users seeded successfully!');
        console.log('\n📝 Login Credentials:');
        loginUsers.forEach(user => {
            console.log(`   Email: ${user.email}`);
            console.log(`   Password: ${user.password}`);
            console.log(`   Role: ${user.role}\n`);
        });

    } catch (error) {
        console.error('❌ Error seeding login users:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected from MongoDB');
    }
}

seedLoginUsers();
