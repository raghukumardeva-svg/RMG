import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import connectDB from './config/database';
import logger from './config/logger';
import { generalRateLimiter } from './middleware/rateLimiter';

// Import routes
import authRoutes from './routes/auth';
import employeeRoutes from './routes/employees';
import helpdeskRoutes from './routes/helpdesk';
import leaveRoutes from './routes/leaves';
import notificationRoutes from './routes/notifications';
import approvalRoutes from './routes/approvals';
import profileRoutes from './routes/profiles';
import projectRoutes from './routes/projects';
import timesheetRoutes from './routes/timesheets';
import timesheetEntryRoutes from './routes/timesheetEntries';
import attendanceRoutes from './routes/attendance';
import payrollRoutes from './routes/payroll';
import holidayRoutes from './routes/holidays';
import itSpecialistRoutes from './routes/itSpecialists';
import celebrationRoutes from './routes/celebrations';
import announcementRoutes from './routes/announcements';
import newJoinerRoutes from './routes/newJoiners';
import analyticsRoutes from './routes/analytics';
import rmgAnalyticsRoutes from './routes/rmgAnalytics';
import superAdminRoutes from './routes/superAdmin';
import customerRoutes from './routes/customers';
import customerPORoutes from './routes/customerPOs';
import allocationRoutes from './routes/allocations';
import flresourceRoutes from './routes/flresources';
import financialLineRoutes from './routes/financialLines';
import employeeHoursReportRoutes from './routes/employeeHoursReport';
import ctcMasterRoutes from './routes/ctcMaster';
import udaConfigurationRoutes from './routes/udaConfigurations';
import subCategoryConfigRoutes from './routes/subCategoryConfig';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:5173',
    'http://localhost:3000'
];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            logger.warn(`CORS blocked origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiter
app.use(generalRateLimiter);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/helpdesk', helpdeskRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/timesheets', timesheetRoutes);
app.use('/api/timesheet-entries', timesheetEntryRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/it-specialists', itSpecialistRoutes);
app.use('/api/celebrations', celebrationRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/new-joiners', newJoinerRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/rmg-analytics', rmgAnalyticsRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/customer-pos', customerPORoutes);
app.use('/api/allocations', allocationRoutes);
app.use('/api/flresources', flresourceRoutes);
app.use('/api/financial-lines', financialLineRoutes);
app.use('/api/employee-hours-report', employeeHoursReportRoutes);
app.use('/api/ctc-master', ctcMasterRoutes);
app.use('/api/uda-configurations', udaConfigurationRoutes);
app.use('/api/sub-category-config', subCategoryConfigRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: any) => {
    logger.error('Server error:', err);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Start server
const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDB();

        // Start listening
        app.listen(PORT, () => {
            logger.info(`🚀 Server running on port ${PORT}`);
            logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
            logger.info(`🌍 CORS enabled for: ${allowedOrigins.join(', ')}`);
        });
    } catch (error) {
        logger.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Start the application
startServer();
