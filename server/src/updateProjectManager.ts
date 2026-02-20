import dotenv from 'dotenv';
import Project from './models/Project';
import Employee from './models/Employee';
import connectDB from './config/database';

dotenv.config();

async function updateProjectManager() {
    try {
        await connectDB();

        console.log('🔄 Updating Project Manager for all projects...');

        // First, find the RMG001 employee to get their name
        const rmgEmployee = await Employee.findOne({ employeeId: 'RMG001' });

        let managerName = 'Manager'; // Default fallback
        if (rmgEmployee) {
            managerName = rmgEmployee.name;
            console.log(`✅ Found RMG001 employee: ${managerName}`);
        } else {
            console.log('⚠️  RMG001 employee not found, using default name');
        }

        // Update all projects to have projectManager.employeeId = "RMG001"
        const result = await Project.updateMany(
            {}, // Update all projects
            {
                $set: {
                    'projectManager.employeeId': 'RMG001',
                    'projectManager.name': managerName
                }
            }
        );

        console.log('\n✅ Project Manager update completed!');
        console.log(`   Projects updated: ${result.modifiedCount}`);
        console.log(`   Project Manager Employee ID: RMG001`);
        console.log(`   Project Manager Name: ${managerName}`);

        // Show some sample projects
        const sampleProjects = await Project.find({}).limit(5).select('projectId projectName projectManager');
        console.log('\n📋 Sample updated projects:');
        sampleProjects.forEach((project) => {
            console.log(`   - ${project.projectId} (${project.projectName})`);
            console.log(`     Manager: ${project.projectManager?.name} (${project.projectManager?.employeeId})`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error updating project manager:', error);
        process.exit(1);
    }
}

updateProjectManager();
