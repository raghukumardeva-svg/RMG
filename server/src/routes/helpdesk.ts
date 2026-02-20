/**
 * Helpdesk Routes
 * Handles all ticket management operations with proper authentication, validation, and rate limiting
 */

import express, { Request, Response } from 'express';
import { asyncHandler } from '../utils/errorHandler';
import { helpdeskValidation, sanitizeInputs } from '../middleware/validation';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { ticketCreationRateLimiter, messageRateLimiter, generalRateLimiter } from '../middleware/rateLimiter';
import helpdeskService from '../services/helpdeskService';

const router = express.Router();

// Apply general rate limiting and sanitization to all routes
router.use(generalRateLimiter);
router.use(sanitizeInputs);

// ===========================================
// PUBLIC ROUTES (with authentication)
// ===========================================

/**
 * GET /helpdesk
 * Get all tickets with optional filtering
 * Auth: Required (any authenticated user)
 * Rate Limit: General (100/15min)
 */
router.get(
  '/',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { userId, status } = req.query;

    const tickets = await helpdeskService.getAllTickets({
      userId: userId as string,
      status: status as string
    });

    // Map _id to id for frontend compatibility
    const ticketsWithId = tickets.map(ticket => {
      const ticketObj = ticket.toObject();
      return {
        ...ticketObj,
        id: ticket._id.toString()
      };
    });

    res.json({ success: true, data: ticketsWithId });
  })
);

/**
 * GET /helpdesk/user/:userId
 * Get all tickets for a specific user
 * Auth: Required (user can only access own tickets unless admin/manager)
 * Rate Limit: General (100/15min)
 */
router.get(
  '/user/:userId',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    // Authorization: User can only see their own tickets unless they're admin/manager
    if (req.user?.id !== userId &&
        !['IT_ADMIN', 'MANAGER', 'ADMIN'].includes(req.user?.role || '')) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own tickets'
      });
    }

    const tickets = await helpdeskService.getTicketsByUserId(userId);

    const ticketsWithId = tickets.map(ticket => {
      const ticketObj = ticket.toObject();
      return {
        ...ticketObj,
        id: ticket._id.toString()
      };
    });

    res.json({ success: true, data: ticketsWithId });
  })
);

/**
 * GET /helpdesk/:id
 * Get single ticket by ID
 * Auth: Required (ticket owner, assigned specialist, or admin)
 * Rate Limit: General (100/15min)
 */
router.get(
  '/:id',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const ticket = await helpdeskService.getTicketById(req.params.id);

    // Authorization: Only ticket owner, assigned specialist, or admin can view
    const ticketObj = ticket.toObject();
    const isOwner = req.user?.id === ticketObj.userId || req.user?.employeeId === ticketObj.userId;
    const isAssigned = req.user?.employeeId === ticketObj.assignment?.assignedToId;
    const isAdmin = ['IT_ADMIN', 'MANAGER', 'ADMIN'].includes(req.user?.role || '');

    if (!isOwner && !isAssigned && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this ticket'
      });
    }

    res.json({
      success: true,
      data: {
        ...ticketObj,
        id: ticket._id.toString()
      }
    });
  })
);

/**
 * POST /helpdesk/workflow
 * Create new ticket with workflow support
 * Auth: Required (EMPLOYEE or MANAGER)
 * Rate Limit: Ticket Creation (10/hour)
 * Validation: Full ticket validation
 */
router.post(
  '/workflow',
  authenticateToken,
  authorizeRoles('EMPLOYEE', 'MANAGER'),
  ticketCreationRateLimiter,
  helpdeskValidation.createTicket,
  asyncHandler(async (req: Request, res: Response) => {
    // Debug logging for ticket submission
    console.log('📝 [Helpdesk] Creating ticket - Request body:', {
      userId: req.body.userId,
      userName: req.body.userName,
      userEmail: req.body.userEmail,
      highLevelCategory: req.body.highLevelCategory,
      subCategory: req.body.subCategory,
      subject: req.body.subject?.substring(0, 50),
      urgency: req.body.urgency,
      requiresApproval: req.body.requiresApproval
    });

    const ticket = await helpdeskService.createTicket({
      userId: req.body.userId || req.body.requesterId,
      userName: req.body.userName || req.body.requesterName,
      userEmail: req.body.userEmail || req.body.requesterEmail,
      userDepartment: req.body.userDepartment || req.body.department || '',
      highLevelCategory: req.body.highLevelCategory,
      subCategory: req.body.subCategory,
      subject: req.body.subject,
      description: req.body.description,
      urgency: req.body.urgency,
      requiresApproval: req.body.requiresApproval,
      attachments: req.body.attachments
    });

    const responseTicket = ticket.toObject();

    res.status(201).json({
      success: true,
      data: {
        ...responseTicket,
        id: ticket._id.toString()
      }
    });
  })
);

/**
 * POST /helpdesk (Legacy endpoint - kept for backward compatibility)
 * Create new ticket (simplified)
 * Auth: Required (EMPLOYEE or MANAGER)
 * Rate Limit: Ticket Creation (10/hour)
 */
router.post(
  '/',
  authenticateToken,
  authorizeRoles('EMPLOYEE', 'MANAGER'),
  ticketCreationRateLimiter,
  helpdeskValidation.createTicket,
  asyncHandler(async (req: Request, res: Response) => {
    const ticket = await helpdeskService.createTicket({
      userId: req.body.userId,
      userName: req.body.userName,
      userEmail: req.body.userEmail,
      userDepartment: req.body.userDepartment,
      highLevelCategory: req.body.highLevelCategory,
      subCategory: req.body.subCategory,
      subject: req.body.subject,
      description: req.body.description,
      urgency: req.body.urgency,
      requiresApproval: req.body.requiresApproval || false,
      attachments: req.body.attachments
    });

    res.status(201).json({ success: true, data: ticket });
  })
);

/**
 * PUT /helpdesk/:id
 * Update ticket (generic update)
 * Auth: Required (IT_ADMIN only)
 * Rate Limit: General (100/15min)
 */
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('IT_ADMIN', 'ADMIN'),
  helpdeskValidation.updateTicket,
  asyncHandler(async (req: Request, res: Response) => {
    // For now, redirect to status update if status is being changed
    if (req.body.status) {
      const ticket = await helpdeskService.updateTicketStatus(
        req.params.id,
        req.body.status,
        req.user?.id || 'system'
      );

      res.json({ success: true, data: ticket });
    } else {
      res.status(400).json({
        success: false,
        message: 'Please use specific endpoints for ticket updates'
      });
    }
  })
);

/**
 * PATCH /helpdesk/:id/status
 * Update ticket status
 * Auth: Required (ticket owner for cancellation, admin for others)
 * Rate Limit: General (100/15min)
 */
router.patch(
  '/:id/status',
  authenticateToken,
  helpdeskValidation.updateTicket,
  asyncHandler(async (req: Request, res: Response) => {
    const { status, cancelledBy } = req.body;

    // Authorization: Only ticket owner can cancel, only admin can change other statuses
    const ticket = await helpdeskService.getTicketById(req.params.id);
    const ticketObj = ticket.toObject();

    if (status === 'Cancelled') {
      if (req.user?.id !== ticketObj.userId && !['IT_ADMIN', 'ADMIN'].includes(req.user?.role || '')) {
        return res.status(403).json({
          success: false,
          message: 'Only ticket owner can cancel tickets'
        });
      }
    } else {
      if (!['IT_ADMIN', 'ADMIN'].includes(req.user?.role || '')) {
        return res.status(403).json({
          success: false,
          message: 'Only administrators can change ticket status'
        });
      }
    }

    const updatedTicket = await helpdeskService.updateTicketStatus(
      req.params.id,
      status,
      cancelledBy || req.user?.id || 'system'
    );

    const responseTicket = updatedTicket.toObject();

    res.json({
      success: true,
      data: {
        ...responseTicket,
        id: updatedTicket._id.toString()
      }
    });
  })
);

/**
 * POST /helpdesk/:id/message
 * Add message to ticket conversation
 * Auth: Required (ticket owner, assigned specialist, or admin)
 * Rate Limit: Message (30/10min)
 */
router.post(
  '/:id/message',
  authenticateToken,
  messageRateLimiter,
  helpdeskValidation.addMessage,
  asyncHandler(async (req: Request, res: Response) => {
    // Authorization: Only ticket participants can add messages
    const ticket = await helpdeskService.getTicketById(req.params.id);
    const ticketObj = ticket.toObject();

    const isOwner = req.user?.id === ticketObj.userId || req.user?.employeeId === ticketObj.userId;
    const isAssigned = req.user?.employeeId === ticketObj.assignment?.assignedToId;
    const isAdmin = ['IT_ADMIN', 'MANAGER', 'ADMIN'].includes(req.user?.role || '');

    if (!isOwner && !isAssigned && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You cannot add messages to this ticket'
      });
    }

    const updatedTicket = await helpdeskService.addMessage(req.params.id, {
      sender: req.body.sender,
      senderName: req.body.senderName,
      message: req.body.message,
      attachments: req.body.attachments
    });

    const responseTicket = updatedTicket.toObject();

    res.json({
      success: true,
      data: {
        ...responseTicket,
        id: updatedTicket._id.toString()
      }
    });
  })
);

// ===========================================
// ADMIN/SPECIALIST ROUTES
// ===========================================

/**
 * POST /helpdesk/:id/assign
 * Assign ticket to specialist
 * Auth: Required (IT_ADMIN, FINANCE_ADMIN, FACILITIES_ADMIN, or ADMIN)
 * Rate Limit: General (100/15min)
 */
router.post(
  '/:id/assign',
  authenticateToken,
  authorizeRoles('IT_ADMIN', 'FINANCE_ADMIN', 'FACILITIES_ADMIN', 'ADMIN'),
  helpdeskValidation.assignTicket,
  asyncHandler(async (req: Request, res: Response) => {
    const updatedTicket = await helpdeskService.assignTicket(req.params.id, {
      employeeId: req.body.employeeId,
      employeeName: req.body.employeeName,
      assignedById: req.body.assignedById,
      assignedByName: req.body.assignedByName,
      notes: req.body.notes
    });

    const responseTicket = updatedTicket.toObject();

    res.json({
      success: true,
      data: {
        ...responseTicket,
        id: updatedTicket._id.toString()
      }
    });
  })
);

/**
 * PUT /helpdesk/:id/reassign
 * Reassign ticket to a different specialist
 */
router.put(
  '/:id/reassign',
  authenticateToken,
  authorizeRoles('IT_ADMIN', 'FINANCE_ADMIN', 'FACILITIES_ADMIN', 'ADMIN'),
  // helpdeskValidation.reassignTicket, // TODO: Add validation
  asyncHandler(async (req: Request, res: Response) => {
    const updatedTicket = await helpdeskService.reassignTicket(req.params.id, {
      newEmployeeId: req.body.newEmployeeId,
      newEmployeeName: req.body.newEmployeeName,
      reassignedById: req.body.reassignedById,
      reassignedByName: req.body.reassignedByName,
      reason: req.body.reason
    });

    const responseTicket = updatedTicket.toObject();
    delete responseTicket._id;
    delete responseTicket.__v;

    res.json({
      success: true,
      data: {
        ...responseTicket,
        id: updatedTicket._id.toString()
      }
    });
  })
);

/**
 * PATCH /helpdesk/:id/progress
 * Update ticket progress
 * Auth: Required (assigned specialist or admin)
 * Rate Limit: General (100/15min)
 */
router.patch(
  '/:id/progress',
  authenticateToken,
  helpdeskValidation.updateProgress,
  asyncHandler(async (req: Request, res: Response) => {
    // Authorization: Only assigned specialist or admin can update progress
    const ticket = await helpdeskService.getTicketById(req.params.id);
    const ticketObj = ticket.toObject();

    // Check if user is assigned specialist (compare employeeId)
    const isAssigned = req.user?.employeeId === ticketObj.assignment?.assignedToId;
    const isAdmin = ['IT_ADMIN', 'ADMIN'].includes(req.user?.role || '');

    if (!isAssigned && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only assigned specialist can update progress'
      });
    }

    // Get the specialist's name for history logging
    const specialistName = ticketObj.assignment?.assignedToName || req.user?.email || 'IT Specialist';

    const updatedTicket = await helpdeskService.updateProgress(
      req.params.id,
      req.body.progressStatus,
      req.body.notes,
      specialistName
    );

    const responseTicket = updatedTicket.toObject();

    res.json({
      success: true,
      data: {
        ...responseTicket,
        id: updatedTicket._id.toString()
      }
    });
  })
);

/**
 * POST /helpdesk/:id/complete
 * Mark work as complete
 * Auth: Required (assigned specialist or admin)
 * Rate Limit: General (100/15min)
 */
router.post(
  '/:id/complete',
  authenticateToken,
  helpdeskValidation.completeWork,
  asyncHandler(async (req: Request, res: Response) => {
    // Authorization: Only assigned specialist or admin
    const ticket = await helpdeskService.getTicketById(req.params.id);
    const ticketObj = ticket.toObject();

    // Check if user is assigned specialist (compare employeeId)
    const isAssigned = req.user?.employeeId === ticketObj.assignment?.assignedToId;
    const isAdmin = ['IT_ADMIN', 'ADMIN'].includes(req.user?.role || '');

    if (!isAssigned && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only assigned specialist can complete work'
      });
    }

    const updatedTicket = await helpdeskService.completeWork(
      req.params.id,
      req.body.resolutionNotes,
      req.body.completedBy
    );

    const responseTicket = updatedTicket.toObject();

    res.json({
      success: true,
      data: {
        ...responseTicket,
        id: updatedTicket._id.toString()
      }
    });
  })
);

/**
 * POST /helpdesk/:id/confirm-completion
 * User confirms work completion
 * Auth: Required (ticket owner only)
 * Rate Limit: General (100/15min)
 */
router.post(
  '/:id/confirm-completion',
  authenticateToken,
  helpdeskValidation.confirmCompletion,
  asyncHandler(async (req: Request, res: Response) => {
    // Authorization: Only ticket owner can confirm
    const ticket = await helpdeskService.getTicketById(req.params.id);
    const ticketObj = ticket.toObject();

    if (req.user?.id !== ticketObj.userId) {
      return res.status(403).json({
        success: false,
        message: 'Only ticket owner can confirm completion'
      });
    }

    const updatedTicket = await helpdeskService.confirmCompletion(
      req.params.id,
      req.body.confirmedBy,
      req.body.feedback
    );

    const responseTicket = updatedTicket.toObject();

    res.json({
      success: true,
      data: {
        ...responseTicket,
        id: updatedTicket._id.toString()
      }
    });
  })
);

/**
 * POST /helpdesk/:id/pause
 * Pause ticket
 * Auth: Required (assigned specialist or admin)
 * Rate Limit: General (100/15min)
 */
router.post(
  '/:id/pause',
  authenticateToken,
  helpdeskValidation.pauseTicket,
  asyncHandler(async (req: Request, res: Response) => {
    // Authorization: Only assigned specialist or admin
    const ticket = await helpdeskService.getTicketById(req.params.id);
    const ticketObj = ticket.toObject();

    const isAssigned = req.user?.employeeId === ticketObj.assignment?.assignedToId;
    const isAdmin = ['IT_ADMIN', 'ADMIN'].includes(req.user?.role || '');

    if (!isAssigned && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only assigned specialist can pause ticket'
      });
    }

    const updatedTicket = await helpdeskService.pauseTicket(
      req.params.id,
      req.body.pausedBy,
      req.body.reason
    );

    const responseTicket = updatedTicket.toObject();

    res.json({
      success: true,
      data: {
        ...responseTicket,
        id: updatedTicket._id.toString()
      }
    });
  })
);

/**
 * POST /helpdesk/:id/resume
 * Resume paused ticket
 * Auth: Required (assigned specialist or admin)
 * Rate Limit: General (100/15min)
 */
router.post(
  '/:id/resume',
  authenticateToken,
  helpdeskValidation.resumeTicket,
  asyncHandler(async (req: Request, res: Response) => {
    // Authorization: Only assigned specialist or admin
    const ticket = await helpdeskService.getTicketById(req.params.id);
    const ticketObj = ticket.toObject();

    const isAssigned = req.user?.employeeId === ticketObj.assignment?.assignedToId;
    const isAdmin = ['IT_ADMIN', 'ADMIN'].includes(req.user?.role || '');

    if (!isAssigned && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only assigned specialist can resume ticket'
      });
    }

    const updatedTicket = await helpdeskService.resumeTicket(
      req.params.id,
      req.body.resumedBy
    );

    const responseTicket = updatedTicket.toObject();

    res.json({
      success: true,
      data: {
        ...responseTicket,
        id: updatedTicket._id.toString()
      }
    });
  })
);

/**
 * POST /helpdesk/:id/close
 * Close ticket (IT Specialist)
 * Auth: Required (assigned specialist or admin)
 * Rate Limit: General (100/15min)
 */
router.post(
  '/:id/close',
  authenticateToken,
  helpdeskValidation.closeTicket,
  asyncHandler(async (req: Request, res: Response) => {
    // Authorization: Only assigned specialist or admin
    const ticket = await helpdeskService.getTicketById(req.params.id);
    const ticketObj = ticket.toObject();

    // Compare employeeId (e.g., "IT001") not MongoDB _id
    const isAssigned = req.user?.employeeId === ticketObj.assignment?.assignedToId;
    const isAdmin = ['IT_ADMIN', 'ADMIN'].includes(req.user?.role || '');

    if (!isAssigned && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only assigned specialist can close ticket'
      });
    }

    const updatedTicket = await helpdeskService.closeTicket(
      req.params.id,
      req.body.closedBy,
      req.body.closingNotes
    );

    const responseTicket = updatedTicket.toObject();

    res.json({
      success: true,
      data: {
        ...responseTicket,
        id: updatedTicket._id.toString()
      }
    });
  })
);

/**
 * DELETE /helpdesk/:id
 * Delete ticket (ADMIN only - use with caution)
 * Auth: Required (ADMIN only)
 * Rate Limit: General (100/15min)
 */
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    await helpdeskService.deleteTicket(req.params.id);

    res.json({
      success: true,
      message: 'Ticket deleted successfully'
    });
  })
);

/**
 * POST /helpdesk/:id/reopen
 * Reopen a closed ticket (ticket owner only, unlimited)
 * Auth: Required (ticket owner)
 * Rate Limit: General (100/15min)
 */
router.post(
  '/:id/reopen',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Reopen reason is required'
      });
    }

    // Get the ticket
    const ticket = await helpdeskService.getTicketById(req.params.id);
    const ticketObj = ticket.toObject();

    // Authorization: Only ticket owner can reopen
    // ticketObj.userId contains MongoDB _id (string like "69399e9a01cd13ea153c6086")
    // req.user has either employeeId ("EMP001") or id (MongoDB _id)
    const userMongoId = req.user?.id; // MongoDB _id from JWT
    const userEmployeeId = req.user?.employeeId; // EMP001 from JWT
    const ticketUserId = ticketObj.userId?.toString(); // Ticket owner's MongoDB _id
    
    // Debug logging
    console.log('[REOPEN] User MongoDB ID:', userMongoId);
    console.log('[REOPEN] User Employee ID:', userEmployeeId);
    console.log('[REOPEN] Ticket userId:', ticketUserId);
    console.log('[REOPEN] Match (by MongoDB ID):', userMongoId === ticketUserId);
    
    // Check if user's MongoDB ID matches ticket's userId
    if (userMongoId !== ticketUserId) {
      return res.status(403).json({
        success: false,
        message: 'Only ticket owner can reopen tickets'
      });
    }

    // Check if ticket is closed or completed
    if (ticketObj.status !== 'Closed' && ticketObj.status !== 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Only closed or completed tickets can be reopened'
      });
    }

    // Unlimited reopening allowed - no time window restrictions

    // Add reopen message to conversation
    const reopenMessage = {
      id: `msg-${Date.now()}`,
      sender: 'employee',
      senderName: ticketObj.userName,
      message: `Ticket reopened. Reason: ${reason}`,
      timestamp: new Date().toISOString(),
      type: 'status_update'
    };

    // Add history entry for reopen action
    const historyEntry = {
      action: 'Reopened',
      by: ticketObj.userName,
      performedByRole: 'employee',
      timestamp: new Date().toISOString(),
      details: `Ticket reopened by ${ticketObj.userName}. Reason: ${reason}`,
      previousStatus: ticketObj.status,
      newStatus: 'Reopened'
    };

    // Save previous assignment to history before clearing
    const assignmentHistoryEntry = ticketObj.assignment?.assignedToId ? {
      action: 'Assignment Cleared for Reopen',
      by: ticketObj.userName,
      performedByRole: 'employee',
      timestamp: new Date().toISOString(),
      details: `Previous assignment to ${ticketObj.assignment.assignedToName} (${ticketObj.assignment.assignedToId}) cleared. Ticket returned to unassigned queue.`,
      previousStatus: ticketObj.status,
      newStatus: 'Reopened'
    } : null;

    // Update ticket - set to Reopened status and reset assignment
    ticket.status = 'Reopened';
    ticket.closedAt = undefined;
    ticket.closedBy = undefined;
    ticket.closingReason = undefined;
    ticket.closingNote = undefined;
    
    // Clear assignment so ticket goes back to unassigned queue
    ticket.assignment = {
      assignedToId: undefined,
      assignedToName: undefined,
      assignedById: undefined,
      assignedByName: undefined,
      assignedByRole: undefined,
      assignedAt: undefined,
      assignmentNotes: undefined
    };
    
    ticket.conversation = [...(ticketObj.conversation || []), reopenMessage];
    ticket.history = [
      ...(ticketObj.history || []),
      ...(assignmentHistoryEntry ? [assignmentHistoryEntry] : []),
      historyEntry
    ];
    ticket.updatedAt = new Date();

    await ticket.save();

    const responseTicket = ticket.toObject();

    res.json({
      success: true,
      data: {
        ...responseTicket,
        id: responseTicket._id?.toString() || responseTicket.id,
      },
      message: 'Ticket reopened successfully'
    });
  })
);

export default router;
