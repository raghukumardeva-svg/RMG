import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import FLResource from '../models/FLResource';
import Project from '../models/Project';

const router = express.Router();

// DEBUG: Check Projects collection
router.get('/debug/projects', async (req: Request, res: Response) => {
    try {
        const projects = await Project.find({}).limit(10);
        console.log('\n🔍 DEBUG: Projects in database:');
        projects.forEach(p => {
            console.log(`  _id: ${p._id}, projectId: ${p.projectId}, projectName: ${p.projectName}`);
        });
        res.json({ success: true, data: projects });
    } catch (error) {
        console.error('Failed to fetch projects:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch projects' });
    }
});

// Get all FL resources (with optional filters)
router.get('/', async (req: Request, res: Response) => {
    try {
        const { employeeId, projectId } = req.query;
        const query: Record<string, unknown> = {};

        if (employeeId) query.employeeId = employeeId;
        if (projectId) query.projectId = projectId;

        const resources = await FLResource.find(query).sort({ createdAt: -1 });
        res.json({ success: true, data: resources });
    } catch (error) {
        console.error('Failed to fetch FL resources:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch FL resources' });
    }
});

// Get FL resources by employee ID
router.get('/employee/:employeeId', async (req: Request, res: Response) => {
    try {
        console.log(`🔍 Fetching FL resources for employee: ${req.params.employeeId}`);

        // Get FL resources WITHOUT populate first
        const resources = await FLResource.find({
            employeeId: req.params.employeeId
        }).sort({ createdAt: -1 });

        console.log(`\n📊 Found ${resources.length} FL resources (RAW):`);

        // Manually fetch project data for each unique projectId
        const projectOids = [...new Set(resources.map(r => r.projectId).filter(Boolean))];
        console.log(`\n📋 Unique project ObjectIds (${projectOids.length}):`);
        projectOids.forEach((oid, i) => {
            console.log(`  ${i + 1}. ${oid} (Type: ${typeof oid}, IsObjectId: ${oid instanceof mongoose.Types.ObjectId})`);
        });

        // Fetch ALL projects to see what's in the database
        const allProjects = await Project.find({}).limit(5);
        console.log(`\n📚 Sample projects in database (${allProjects.length}):`);
        allProjects.forEach(p => {
            console.log(`  _id: ${p._id} (Type: ${typeof p._id}), projectId: ${p.projectId}, projectName: ${p.projectName}`);
        });

        // Fetch all projects by ObjectId
        const projects = await Project.find({
            _id: { $in: projectOids }
        });

        console.log(`\n✅ Found ${projects.length} matching projects in database`);
        projects.forEach(p => {
            console.log(`  Project: ${p.projectId} (${p.projectName}), ObjectId: ${p._id}`);
        });

        // Create a map of ObjectId -> Project for quick lookup
        const projectMap = new Map();
        projects.forEach(p => {
            projectMap.set(p._id.toString(), p);
        });

        // Debug: Log raw document structure
        if (resources.length > 0) {
            console.log(`\n🔍 RAW Document Structure (First Resource):`);
            console.log(JSON.stringify(resources[0], null, 2));
        }

        // Transform FL resources with project data
        const transformedResources = resources.map((resource, index) => {
            const resourceObj = resource.toObject();
            const projectOid = resourceObj.projectId?.toString();

            console.log(`\n🔄 Processing FL Resource ${index + 1}:`, {
                flNo: resourceObj.flNo,
                flName: resourceObj.flName,
                projectOid: projectOid
            });

            if (projectOid && projectMap.has(projectOid)) {
                const project = projectMap.get(projectOid);
                console.log(`✅ Found matching project: ${project.projectId} (${project.projectName})`);

                // Replace ObjectId with string projectId
                resourceObj.projectId = project.projectId;
                resourceObj.projectOid = projectOid;
                resourceObj.projectName = project.projectName;
            } else {
                console.log(`⚠️ No matching project found for ObjectId: ${projectOid}`);
                // Keep the ObjectId as fallback
                resourceObj.projectOid = projectOid;
                resourceObj.projectId = projectOid;
                resourceObj.projectName = `Unknown Project (${projectOid?.substring(0, 8)}...)`;
            }

            console.log(`📝 Final:`, {
                projectId: resourceObj.projectId,
                projectName: resourceObj.projectName,
                projectOid: resourceObj.projectOid,
                flNo: resourceObj.flNo
            });

            return resourceObj;
        });

        console.log('\n📤 Summary - Returning resources:');
        transformedResources.forEach((r, i) => {
            console.log(`  ${i + 1}. FL: ${r.flNo}, ProjectID: ${r.projectId}, ProjectName: ${r.projectName}`);
        });

        res.json({
            success: true,
            data: transformedResources
        });

    } catch (error) {
        console.error('❌ Failed to fetch employee FL resources:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch employee FL resources' });
    }
});

// Get FL resources by project ID
router.get('/project/:projectId', async (req: Request, res: Response) => {
    try {
        const projectIdString = req.params.projectId;
        console.log('🔍 Querying FL resources for project:', projectIdString);

        // First, find the Project document to get its ObjectId
        const project = await Project.findOne({ projectId: projectIdString });

        if (!project) {
            console.log('⚠️ Project not found:', projectIdString);
            return res.json({ success: true, data: [] });
        }

        console.log('✅ Found project ObjectId:', project._id);

        // Now query FL resources using the Project's ObjectId
        const resources = await FLResource.find({
            projectId: project._id
        })
            .sort({ employeeId: 1 });

        console.log('📊 Found FL resources:', resources.length);
        res.json({ success: true, data: resources });
    } catch (error) {
        console.error('❌ Failed to fetch project FL resources:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch project FL resources' });
    }
});

// Get FL resource by ID
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const resource = await FLResource.findById(req.params.id);
        if (!resource) {
            return res.status(404).json({ success: false, message: 'FL resource not found' });
        }
        res.json({ success: true, data: resource });
    } catch (error) {
        console.error('Failed to fetch FL resource:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch FL resource' });
    }
});

// Create new FL resource
router.post('/', async (req: Request, res: Response) => {
    try {
        const resource = new FLResource(req.body);
        await resource.save();
        res.status(201).json({ success: true, data: resource });
    } catch (error) {
        console.error('Failed to create FL resource:', error);
        res.status(500).json({ success: false, message: 'Failed to create FL resource' });
    }
});

// Update FL resource
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const resource = await FLResource.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!resource) {
            return res.status(404).json({ success: false, message: 'FL resource not found' });
        }
        res.json({ success: true, data: resource });
    } catch (error) {
        console.error('Failed to update FL resource:', error);
        res.status(500).json({ success: false, message: 'Failed to update FL resource' });
    }
});

// Delete FL resource
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const resource = await FLResource.findByIdAndDelete(req.params.id);
        if (!resource) {
            return res.status(404).json({ success: false, message: 'FL resource not found' });
        }
        res.json({ success: true, message: 'FL resource deleted successfully' });
    } catch (error) {
        console.error('Failed to delete FL resource:', error);
        res.status(500).json({ success: false, message: 'Failed to delete FL resource' });
    }
});

export default router;
