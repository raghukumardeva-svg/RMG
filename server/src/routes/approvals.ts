import express, { Request, Response, NextFunction } from 'express';
import HelpdeskTicket from '../models/HelpdeskTicket';
import Employee from '../models/Employee';
import notificationService from '../services/notificationService';

const router = express.Router();

// Middleware to check approver role
const checkApproverRole = (requiredRole: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { approverId } = req.body;
      
      if (!approverId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Approver ID is required' 
        });
      }

      const user = await Employee.findById(approverId);
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'Approver not found' 
        });
      }

      if (user.role !== requiredRole) {
        return res.status(403).json({ 
          success: false, 
          message: `Access denied. ${requiredRole} role required.` 
        });
      }

      req.body.approverName = user.name;
      req.body.approverEmail = user.email;
      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({ success: false, message: 'Authorization error' });
    }
  };
};

// L1 Approval Handler
router.post('/l1/:ticketId', checkApproverRole('L1_APPROVER'), async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const { approverId, approverName, approverEmail, status, comments } = req.body;

    const ticket = await HelpdeskTicket.findById(ticketId);
    
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Validate approval level (NEW ARCHITECTURE: currentApprovalLevel)
    const currentLevel = ticket.currentApprovalLevel || ticket.approvalLevel;
    if (currentLevel !== 'L1') {
      return res.status(400).json({
        success: false,
        message: `Ticket is not at L1 approval stage. Current stage: ${currentLevel}`
      });
    }

    // Check for duplicate approval
    const existingApproval = ticket.approverHistory?.find(
      (h) => h.level === 'L1' && h.approverId === approverId
    );
    
    if (existingApproval) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have already approved/rejected this ticket at L1' 
      });
    }

    // Add to approver history (just push directly, Mongoose handles the array type)
    if (!ticket.approverHistory) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ticket as any).approverHistory = [];
    }
    ticket.approverHistory.push({
      level: 'L1',
      approverId,
      approverName,
      approverEmail,
      status,
      comments,
      timestamp: new Date(),
    });

    // Add to history timeline
    if (!ticket.history) ticket.history = [];

    if (status === 'Approved') {
      // ========== L1 APPROVED → MOVE TO L2 (NEW ARCHITECTURE) ==========
      ticket.currentApprovalLevel = 'L2';
      ticket.approvalLevel = 'L2'; // Backward compatibility
      ticket.status = 'Pending Level-2 Approval';
      ticket.approvalStatus = 'Pending'; // Still pending (not fully approved yet)
      // approvalCompleted remains false
      // CRITICAL: Do NOT set routedTo yet - still in approval chain

      ticket.history.push({
        action: 'L1_approved',
        timestamp: new Date().toISOString(),
        by: approverName,
        performedByRole: 'manager',
        details: `L1 Approved by ${approverName}${comments ? ': ' + comments : ''}`,
        previousStatus: 'Pending Level-1 Approval',
        newStatus: 'Pending Level-2 Approval'
      });

      console.log('✅ L1 APPROVED:', ticket.ticketNumber, '→ Moving to L2, approvalCompleted: false');
    } else {
      // ========== L1 REJECTED (STOP WORKFLOW) ==========
      ticket.approvalStatus = 'Rejected';
      ticket.currentApprovalLevel = 'NONE';
      ticket.approvalLevel = 'NONE'; // Backward compatibility
      ticket.approvalCompleted = false; // Never completed
      ticket.status = 'Rejected';

      ticket.history.push({
        action: 'L1_rejected',
        timestamp: new Date().toISOString(),
        by: approverName,
        performedByRole: 'manager',
        details: `L1 Rejected by ${approverName}${comments ? ': ' + comments : ''}`,
        previousStatus: 'Pending Level-1 Approval',
        newStatus: 'Rejected'
      });

      console.log('❌ L1 REJECTED:', ticket.ticketNumber, '- Workflow stopped');
    }

    await ticket.save();

    // Send notifications for L1 approval
    await notificationService.notifyL1Approval({
      ticketNumber: ticket.ticketNumber,
      userId: ticket.userId,
      userName: ticket.userName,
      subject: ticket.subject,
      highLevelCategory: ticket.highLevelCategory
    }, status, approverName, comments);

    const responseTicket = ticket.toObject();
    responseTicket.id = ticket._id.toString();
    
    res.json({ success: true, data: responseTicket });
  } catch (error) {
    console.error('L1 approval error:', error);
    res.status(500).json({ success: false, message: 'Failed to process L1 approval' });
  }
});

// L2 Approval Handler
router.post('/l2/:ticketId', checkApproverRole('L2_APPROVER'), async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const { approverId, approverName, approverEmail, status, comments } = req.body;

    const ticket = await HelpdeskTicket.findById(ticketId);
    
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Validate approval level (NEW ARCHITECTURE: currentApprovalLevel)
    const currentLevel = ticket.currentApprovalLevel || ticket.approvalLevel;
    if (currentLevel !== 'L2') {
      return res.status(400).json({
        success: false,
        message: `Ticket is not at L2 approval stage. Current stage: ${currentLevel}`
      });
    }

    // Check for duplicate approval
    const existingApproval = ticket.approverHistory?.find(
      (h) => h.level === 'L2' && h.approverId === approverId
    );
    
    if (existingApproval) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have already approved/rejected this ticket at L2' 
      });
    }

    // Add to approver history (just push directly, Mongoose handles the array type)
    if (!ticket.approverHistory) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ticket as any).approverHistory = [];
    }
    ticket.approverHistory.push({
      level: 'L2',
      approverId,
      approverName,
      approverEmail,
      status,
      comments,
      timestamp: new Date(),
    });

    // Add to history timeline
    if (!ticket.history) ticket.history = [];

    if (status === 'Approved') {
      // ========== L2 APPROVED → MOVE TO L3 (NEW ARCHITECTURE) ==========
      ticket.currentApprovalLevel = 'L3';
      ticket.approvalLevel = 'L3'; // Backward compatibility
      ticket.status = 'Pending Level-3 Approval';
      ticket.approvalStatus = 'Pending'; // Still pending (not fully approved yet)
      // approvalCompleted remains false
      // CRITICAL: Do NOT set routedTo yet - still in approval chain

      ticket.history.push({
        action: 'L2_approved',
        timestamp: new Date().toISOString(),
        by: approverName,
        performedByRole: 'manager',
        details: `L2 Approved by ${approverName}${comments ? ': ' + comments : ''}`,
        previousStatus: 'Pending Level-2 Approval',
        newStatus: 'Pending Level-3 Approval'
      });

      console.log('✅ L2 APPROVED:', ticket.ticketNumber, '→ Moving to L3, approvalCompleted: false');
    } else {
      // ========== L2 REJECTED (STOP WORKFLOW) ==========
      ticket.approvalStatus = 'Rejected';
      ticket.currentApprovalLevel = 'NONE';
      ticket.approvalLevel = 'NONE'; // Backward compatibility
      ticket.approvalCompleted = false; // Never completed
      ticket.status = 'Rejected';

      ticket.history.push({
        action: 'L2_rejected',
        timestamp: new Date().toISOString(),
        by: approverName,
        performedByRole: 'manager',
        details: `L2 Rejected by ${approverName}${comments ? ': ' + comments : ''}`,
        previousStatus: 'Pending Level-2 Approval',
        newStatus: 'Rejected'
      });

      console.log('❌ L2 REJECTED:', ticket.ticketNumber, '- Workflow stopped');
    }

    await ticket.save();

    // Send notifications for L2 approval
    await notificationService.notifyL2Approval({
      ticketNumber: ticket.ticketNumber,
      userId: ticket.userId,
      userName: ticket.userName,
      subject: ticket.subject,
      highLevelCategory: ticket.highLevelCategory
    }, status, approverName, comments);

    const responseTicket = ticket.toObject();
    responseTicket.id = ticket._id.toString();
    
    res.json({ success: true, data: responseTicket });
  } catch (error) {
    console.error('L2 approval error:', error);
    res.status(500).json({ success: false, message: 'Failed to process L2 approval' });
  }
});

// L3 Approval Handler (Final)
router.post('/l3/:ticketId', checkApproverRole('L3_APPROVER'), async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const { approverId, approverName, approverEmail, status, comments } = req.body;

    const ticket = await HelpdeskTicket.findById(ticketId);
    
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Validate approval level (NEW ARCHITECTURE: currentApprovalLevel)
    const currentLevel = ticket.currentApprovalLevel || ticket.approvalLevel;
    if (currentLevel !== 'L3') {
      return res.status(400).json({
        success: false,
        message: `Ticket is not at L3 approval stage. Current stage: ${currentLevel}`
      });
    }

    // Check for duplicate approval
    const existingApproval = ticket.approverHistory?.find(
      (h) => h.level === 'L3' && h.approverId === approverId
    );
    
    if (existingApproval) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have already approved/rejected this ticket at L3' 
      });
    }

    // Add to approver history (just push directly, Mongoose handles the array type)
    if (!ticket.approverHistory) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ticket as any).approverHistory = [];
    }
    ticket.approverHistory.push({
      level: 'L3',
      approverId,
      approverName,
      approverEmail,
      status,
      comments,
      timestamp: new Date(),
    });

    // Add to history timeline
    if (!ticket.history) ticket.history = [];

    if (status === 'Approved') {
      // ========== L3 APPROVED (FINAL) → ROUTE TO MODULE ADMIN (NEW ARCHITECTURE) ==========
      ticket.currentApprovalLevel = 'NONE';
      ticket.approvalLevel = 'NONE'; // Backward compatibility
      ticket.approvalCompleted = true; // KEY: Now admin can see it
      ticket.approvalStatus = 'Approved';
      ticket.status = 'Routed';

      // CRITICAL: Set routedTo to make ticket visible to module-specific admin
      const module = ticket.module || ticket.highLevelCategory;
      ticket.routedTo = module; // 'IT', 'Facilities', or 'Finance'

      ticket.history.push({
        action: 'L3_approved',
        timestamp: new Date().toISOString(),
        by: approverName,
        performedByRole: 'manager',
        details: `L3 Approved by ${approverName}${comments ? ': ' + comments : ''}`,
        previousStatus: 'Pending Level-3 Approval',
        newStatus: 'Routed'
      });

      ticket.history.push({
        action: 'routed',
        timestamp: new Date().toISOString(),
        by: 'System',
        performedByRole: 'system',
        details: `Ticket routed to ${module} admin`,
        previousStatus: 'Routed',
        newStatus: 'Routed'
      });

      console.log('✅✅ L3 APPROVED (FINAL):', ticket.ticketNumber, '→ approvalCompleted: TRUE → Routed to', module, 'Admin → NOW VISIBLE');
    } else {
      // ========== L3 REJECTED (STOP WORKFLOW) ==========
      ticket.approvalStatus = 'Rejected';
      ticket.currentApprovalLevel = 'NONE';
      ticket.approvalLevel = 'NONE'; // Backward compatibility
      ticket.approvalCompleted = false; // Never completed
      ticket.status = 'Rejected';

      ticket.history.push({
        action: 'L3_rejected',
        timestamp: new Date().toISOString(),
        by: approverName,
        performedByRole: 'manager',
        details: `L3 Rejected by ${approverName}${comments ? ': ' + comments : ''}`,
        previousStatus: 'Pending Level-3 Approval',
        newStatus: 'Rejected'
      });

      console.log('❌ L3 REJECTED:', ticket.ticketNumber, '- Workflow stopped');
    }

    await ticket.save();

    // Send notifications for L3 (final) approval
    await notificationService.notifyL3Approval({
      ticketNumber: ticket.ticketNumber,
      userId: ticket.userId,
      userName: ticket.userName,
      subject: ticket.subject,
      highLevelCategory: ticket.highLevelCategory
    }, status, approverName, comments);

    const responseTicket = ticket.toObject();
    responseTicket.id = ticket._id.toString();
    
    res.json({ success: true, data: responseTicket });
  } catch (error) {
    console.error('L3 approval error:', error);
    res.status(500).json({ success: false, message: 'Failed to process L3 approval' });
  }
});

// Get pending approvals for a specific approver (PARALLEL VISIBILITY)
router.get('/pending/:approverId', async (req: Request, res: Response) => {
  try {
    const { approverId } = req.params;

    const user = await Employee.findById(approverId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Approver not found' });
    }

    let approverLevel = '';
    if (user.role === 'L1_APPROVER') approverLevel = 'L1';
    else if (user.role === 'L2_APPROVER') approverLevel = 'L2';
    else if (user.role === 'L3_APPROVER') approverLevel = 'L3';
    else {
      return res.status(403).json({
        success: false,
        message: 'User is not an approver'
      });
    }

    console.log('🔍 FETCHING APPROVALS (PARALLEL VISIBILITY) for', user.role);

    // ========== PARALLEL VISIBILITY IMPLEMENTATION ==========
    // Show ALL tickets requiring approval (L1, L2, L3)
    // User can VIEW all, but can ACT only when currentApprovalLevel matches their role
    const allApprovalTickets = await HelpdeskTicket.find({
      requiresApproval: true,
      approvalCompleted: false,  // Not yet fully approved
      approvalStatus: 'Pending',  // Still in approval chain
    }).sort({ createdAt: -1 });

    console.log('📋 Found', allApprovalTickets.length, 'tickets in approval workflow');
    console.log('🔎 Query:', { requiresApproval: true, approvalCompleted: false, approvalStatus: 'Pending' });

    // Add metadata to indicate if user can act on each ticket
    const ticketsWithMetadata = allApprovalTickets.map(ticket => {
      const ticketObj = ticket.toObject();
      ticketObj.id = ticket._id.toString();

      const currentLevel = ticket.currentApprovalLevel || ticket.approvalLevel;
      const canAct = currentLevel === approverLevel;

      // Add metadata for frontend
      ticketObj.canApprove = canAct;
      ticketObj.canReject = canAct;
      ticketObj.viewOnly = !canAct;

      const statusIcon = canAct ? '✅ CAN ACT' : '👁️ VIEW ONLY';
      console.log('  ', statusIcon, ticket.ticketNumber,
        '- Current Level:', currentLevel,
        '- User Level:', approverLevel,
        '- Status:', ticket.status);

      return ticketObj;
    });

    console.log(`\n✅ PARALLEL VISIBILITY: ${user.role} sees ${allApprovalTickets.length} tickets`);
    console.log(`   - Can ACT on: ${ticketsWithMetadata.filter(t => t.canApprove).length} tickets`);
    console.log(`   - VIEW ONLY: ${ticketsWithMetadata.filter(t => t.viewOnly).length} tickets\n`);

    res.json({ success: true, data: ticketsWithMetadata });
  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch pending approvals' });
  }
});

// Get ALL tickets visible to approver (both active and historical)
router.get('/all/:approverId', async (req: Request, res: Response) => {
  try {
    const { approverId } = req.params;

    const user = await Employee.findById(approverId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Approver not found' });
    }

    let approverLevel = '';
    if (user.role === 'L1_APPROVER') approverLevel = 'L1';
    else if (user.role === 'L2_APPROVER') approverLevel = 'L2';
    else if (user.role === 'L3_APPROVER') approverLevel = 'L3';
    else {
      return res.status(403).json({
        success: false,
        message: 'User is not an approver'
      });
    }

    console.log('🔍 FETCHING ALL TICKETS (ACTIVE + HISTORY) for', user.role);

    // ========== FETCH ALL TICKETS REQUIRING APPROVAL ==========
    // This includes:
    // 1. Active approval tickets (approvalCompleted: false)
    // 2. Historical tickets (approvalCompleted: true, OR approvalStatus: Rejected)
    const allTickets = await HelpdeskTicket.find({
      requiresApproval: true,
    }).sort({ createdAt: -1 });

    console.log('📋 Found', allTickets.length, 'total tickets requiring approval');

    // Add metadata to indicate if user can act on each ticket
    const ticketsWithMetadata = allTickets.map(ticket => {
      const ticketObj = ticket.toObject();
      ticketObj.id = ticket._id.toString();

      const currentLevel = ticket.currentApprovalLevel || ticket.approvalLevel;
      const isCompleted = ticket.approvalCompleted || false;
      const isRejected = ticket.approvalStatus === 'Rejected';
      const isHistorical = isCompleted || isRejected;

      const canAct = !isHistorical && currentLevel === approverLevel;

      // Add metadata for frontend
      ticketObj.canApprove = canAct;
      ticketObj.canReject = canAct;
      ticketObj.viewOnly = !canAct;
      ticketObj.isHistorical = isHistorical;

      return ticketObj;
    });

    const activeCount = ticketsWithMetadata.filter(t => !t.isHistorical).length;
    const historyCount = ticketsWithMetadata.filter(t => t.isHistorical).length;

    console.log(`\n✅ ALL TICKETS FOR ${user.role}:`);
    console.log(`   - Active: ${activeCount} tickets`);
    console.log(`   - History: ${historyCount} tickets`);
    console.log(`   - Total: ${allTickets.length} tickets\n`);

    res.json({ success: true, data: ticketsWithMetadata });
  } catch (error) {
    console.error('Get all approver tickets error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch approver tickets' });
  }
});

// Get approval history for a ticket
router.get('/history/:ticketId', async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;

    const ticket = await HelpdeskTicket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    res.json({
      success: true,
      data: {
        approverHistory: ticket.approverHistory || [],
        approvalLevel: ticket.approvalLevel,
        approvalStatus: ticket.approvalStatus,
        requiresApproval: ticket.requiresApproval,
      }
    });
  } catch (error) {
    console.error('Get approval history error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch approval history' });
  }
});

export default router;

