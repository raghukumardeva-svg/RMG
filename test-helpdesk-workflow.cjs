/**
 * End-to-End Helpdesk Workflow Test
 * Tests the complete ticket lifecycle from submission to closure
 *
 * Workflow Stages:
 * 1. Submitted
 * 2. L1/L2/L3 Approvals (conditional)
 * 3. Routed to Department (IT/Facilities/Finance)
 * 4. Assigned to Specialist
 * 5. In Progress (with pause/resume)
 * 6. Work Completed (with resolution notes)
 * 7. User Confirmation
 * 8. IT Closure
 * 9. Closed
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test Data - will be populated from actual database
let testData = {
  requester: null,
  l1Approver: null,
  l2Approver: null,
  l3Approver: null,
  itSpecialist: null,
  ticketId: null,
  ticketNumber: null
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStage(stage, title) {
  console.log('\n' + '='.repeat(80));
  log(`STAGE ${stage}: ${title}`, 'cyan');
  console.log('='.repeat(80));
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Fetch required test users from database
async function setupTestData() {
  logStage(0, 'SETUP - Fetching Test Data');

  try {
    // Get all employees
    const employeesRes = await axios.get(`${BASE_URL}/employees`);
    const employees = employeesRes.data.data;

    // Find requester (regular employee)
    testData.requester = employees.find(e => e.role === 'EMPLOYEE' && e.employeeId === 'EMP001');
    if (!testData.requester) {
      testData.requester = employees.find(e => e.role === 'EMPLOYEE');
    }

    // Find approvers
    testData.l1Approver = employees.find(e => e.role === 'L1_APPROVER');
    testData.l2Approver = employees.find(e => e.role === 'L2_APPROVER');
    testData.l3Approver = employees.find(e => e.role === 'L3_APPROVER');

    // Get IT specialists
    const specialistsRes = await axios.get(`${BASE_URL}/it-specialists?status=active`);
    const specialists = specialistsRes.data.data;
    testData.itSpecialist = specialists.find(s => s.specializations.includes('Software'));

    // Log found users
    logInfo(`Requester: ${testData.requester ? testData.requester.name + ' (' + testData.requester.employeeId + ')' : 'NOT FOUND'}`);
    logInfo(`L1 Approver: ${testData.l1Approver ? testData.l1Approver.name + ' (' + testData.l1Approver.employeeId + ')' : 'NOT FOUND'}`);
    logInfo(`L2 Approver: ${testData.l2Approver ? testData.l2Approver.name + ' (' + testData.l2Approver.employeeId + ')' : 'NOT FOUND'}`);
    logInfo(`L3 Approver: ${testData.l3Approver ? testData.l3Approver.name + ' (' + testData.l3Approver.employeeId + ')' : 'NOT FOUND'}`);
    logInfo(`IT Specialist: ${testData.itSpecialist ? testData.itSpecialist.name + ' (' + testData.itSpecialist.employeeId + ')' : 'NOT FOUND'}`);

    if (!testData.requester) {
      throw new Error('No employee found to create ticket. Please run employee seed script.');
    }

    if (!testData.itSpecialist) {
      throw new Error('No IT specialist found. Please run IT specialist seed script.');
    }

    if (!testData.l1Approver && !testData.l2Approver && !testData.l3Approver) {
      logWarning('No approvers found. Will test bypass approval workflow.');
      logWarning('For full approval workflow test, please run approver seed script.');
    }

    logSuccess('Test data setup complete');

  } catch (error) {
    logError(`Failed to setup test data: ${error.message}`);
    throw error;
  }
}

// STAGE 1: Submit Ticket
async function stage1_submitTicket() {
  logStage(1, 'SUBMIT TICKET');

  try {
    const ticketData = {
      highLevelCategory: 'IT',
      subCategory: 'Software',
      subject: 'E2E Test: Software Installation Request',
      description: '<p>This is an end-to-end test ticket for workflow validation. Please install Visual Studio Code on my laptop.</p>',
      urgency: 'medium',
      userId: testData.requester._id,
      userName: testData.requester.name,
      userEmail: testData.requester.email,
      userDepartment: testData.requester.department || 'Engineering',
      requiresApproval: testData.l1Approver ? true : false, // Test approval workflow if approvers exist
      attachments: [],
      notifyUsers: []
    };

    logInfo(`Creating ticket for: ${ticketData.userName}`);
    logInfo(`Category: ${ticketData.highLevelCategory} > ${ticketData.subCategory}`);
    logInfo(`Requires Approval: ${ticketData.requiresApproval}`);

    const response = await axios.post(`${BASE_URL}/helpdesk/workflow`, ticketData);

    if (response.data.success) {
      const ticket = response.data.data;
      testData.ticketId = ticket._id || ticket.id;
      testData.ticketNumber = ticket.ticketNumber;

      logSuccess(`Ticket created: ${ticket.ticketNumber}`);
      logSuccess(`Ticket ID: ${testData.ticketId}`);
      logSuccess(`Status: ${ticket.status}`);

      // Verify initial status
      if (ticketData.requiresApproval) {
        if (ticket.status === 'Pending Approval L1' || ticket.status === 'Pending Level-1 Approval') {
          logSuccess('✓ Ticket correctly set to pending L1 approval');
        } else {
          logWarning(`Expected 'Pending Level-1 Approval', got '${ticket.status}'`);
        }

        if (ticket.routedTo === null || ticket.routedTo === undefined) {
          logSuccess('✓ Ticket correctly NOT routed yet (waiting for approval)');
        } else {
          logError(`Expected routedTo to be null, got '${ticket.routedTo}'`);
        }
      } else {
        if (ticket.status === 'Routed' || ticket.status === 'In Queue') {
          logSuccess('✓ Ticket correctly routed (no approval required)');
        }

        if (ticket.routedTo === ticketData.highLevelCategory) {
          logSuccess(`✓ Ticket correctly routed to ${ticket.routedTo}`);
        }
      }

      return ticket;
    } else {
      throw new Error('Ticket creation failed');
    }

  } catch (error) {
    logError(`Stage 1 failed: ${error.response?.data?.message || error.message}`);
    throw error;
  }
}

// STAGE 2: L1 Approval
async function stage2_l1Approval() {
  logStage(2, 'L1 APPROVAL');

  if (!testData.l1Approver) {
    logWarning('Skipping L1 approval - no L1 approver found');
    return null;
  }

  try {
    const approvalData = {
      approverId: testData.l1Approver._id,
      approverName: testData.l1Approver.name,
      action: 'Approved',
      status: 'Approved',
      comments: 'L1 Approval: Approved for software installation'
    };

    logInfo(`L1 Approver: ${approvalData.approverName}`);
    logInfo(`Action: ${approvalData.action}`);

    const response = await axios.post(
      `${BASE_URL}/approvals/l1/${testData.ticketId}`,
      approvalData
    );

    if (response.data.success) {
      const ticket = response.data.data;
      logSuccess(`L1 Approval successful`);
      logSuccess(`New Status: ${ticket.status}`);

      // Verify status change
      if (testData.l2Approver) {
        if (ticket.status === 'Pending Approval L2' || ticket.status === 'Pending Level-2 Approval') {
          logSuccess('✓ Ticket correctly moved to L2 approval');
        } else {
          logWarning(`Expected 'Pending Level-2 Approval', got '${ticket.status}'`);
        }
      } else if (testData.l3Approver) {
        if (ticket.status === 'Pending Approval L3' || ticket.status === 'Pending Level-3 Approval') {
          logSuccess('✓ Ticket correctly moved to L3 approval');
        }
      } else {
        if (ticket.status === 'Routed' || ticket.status === 'Approved') {
          logSuccess('✓ Ticket approved and routed to department');
        }
        if (ticket.routedTo === 'IT') {
          logSuccess(`✓ Ticket correctly routed to ${ticket.routedTo}`);
        }
      }

      return ticket;
    }

  } catch (error) {
    logError(`L1 Approval failed: ${error.response?.data?.message || error.message}`);
    throw error;
  }
}

// STAGE 2: L2 Approval
async function stage2_l2Approval() {
  logStage('2b', 'L2 APPROVAL');

  if (!testData.l2Approver) {
    logWarning('Skipping L2 approval - no L2 approver found');
    return null;
  }

  try {
    const approvalData = {
      approverId: testData.l2Approver._id,
      approverName: testData.l2Approver.name,
      action: 'Approved',
      status: 'Approved',
      comments: 'L2 Approval: Approved for software installation'
    };

    logInfo(`L2 Approver: ${approvalData.approverName}`);

    const response = await axios.post(
      `${BASE_URL}/approvals/l2/${testData.ticketId}`,
      approvalData
    );

    if (response.data.success) {
      const ticket = response.data.data;
      logSuccess(`L2 Approval successful`);
      logSuccess(`New Status: ${ticket.status}`);

      if (testData.l3Approver) {
        if (ticket.status.includes('L3') || ticket.status.includes('Level-3')) {
          logSuccess('✓ Ticket correctly moved to L3 approval');
        }
      } else {
        if (ticket.status === 'Routed' || ticket.status === 'Approved') {
          logSuccess('✓ Ticket approved and routed to department');
        }
        if (ticket.routedTo === 'IT') {
          logSuccess(`✓ Ticket correctly routed to IT`);
        }
      }

      return ticket;
    }

  } catch (error) {
    logError(`L2 Approval failed: ${error.response?.data?.message || error.message}`);
    throw error;
  }
}

// STAGE 2: L3 Approval
async function stage2_l3Approval() {
  logStage('2c', 'L3 APPROVAL');

  if (!testData.l3Approver) {
    logWarning('Skipping L3 approval - no L3 approver found');
    return null;
  }

  try {
    const approvalData = {
      approverId: testData.l3Approver._id,
      approverName: testData.l3Approver.name,
      action: 'Approved',
      status: 'Approved',
      comments: 'L3 Final Approval: Approved for software installation'
    };

    logInfo(`L3 Approver: ${approvalData.approverName}`);

    const response = await axios.post(
      `${BASE_URL}/approvals/l3/${testData.ticketId}`,
      approvalData
    );

    if (response.data.success) {
      const ticket = response.data.data;
      logSuccess(`L3 Final Approval successful`);
      logSuccess(`New Status: ${ticket.status}`);

      if (ticket.status === 'Routed' || ticket.status === 'Approved') {
        logSuccess('✓ Ticket approved and routed to department');
      }
      if (ticket.routedTo === 'IT') {
        logSuccess(`✓ Ticket correctly routed to IT`);
      }

      return ticket;
    }

  } catch (error) {
    logError(`L3 Approval failed: ${error.response?.data?.message || error.message}`);
    throw error;
  }
}

// STAGE 3: Verify Routing
async function stage3_verifyRouting() {
  logStage(3, 'VERIFY ROUTING TO DEPARTMENT');

  try {
    const response = await axios.get(`${BASE_URL}/helpdesk/${testData.ticketId}`);
    const ticket = response.data.data;

    logInfo(`Current Status: ${ticket.status}`);
    logInfo(`Routed To: ${ticket.routedTo || 'NOT ROUTED'}`);

    if (ticket.routedTo === 'IT') {
      logSuccess('✓ Ticket successfully routed to IT department');
      logSuccess('✓ Ticket should now be visible in IT specialist queue');
    } else {
      logError(`Expected routedTo='IT', got '${ticket.routedTo}'`);
    }

    return ticket;

  } catch (error) {
    logError(`Stage 3 failed: ${error.response?.data?.message || error.message}`);
    throw error;
  }
}

// STAGE 4: Assign to Specialist
async function stage4_assignToSpecialist() {
  logStage(4, 'ASSIGN TO SPECIALIST');

  try {
    const assignmentData = {
      employeeId: testData.itSpecialist.employeeId,
      employeeName: testData.itSpecialist.name,
      assignedById: 'IT_ADMIN_001',
      assignedByName: 'System Admin',
      notes: 'Assigned for software installation'
    };

    logInfo(`Assigning to: ${assignmentData.assignedToName} (${assignmentData.assignedTo})`);
    logInfo(`Queue: ${assignmentData.queue}`);

    const response = await axios.post(
      `${BASE_URL}/helpdesk/${testData.ticketId}/assign`,
      assignmentData
    );

    if (response.data.success) {
      const ticket = response.data.data;
      logSuccess(`Assignment successful`);
      logSuccess(`Assigned to: ${ticket.assignment.assignedToName}`);
      logSuccess(`New Status: ${ticket.status}`);

      if (ticket.status === 'Assigned') {
        logSuccess('✓ Ticket status correctly updated to Assigned');
      } else {
        logWarning(`Expected status 'Assigned', got '${ticket.status}'`);
      }

      if (ticket.assignment.assignedToId === testData.itSpecialist._id) {
        logSuccess('✓ Ticket correctly assigned to specialist');
      }

      return ticket;
    }

  } catch (error) {
    logError(`Stage 4 failed: ${error.response?.data?.message || error.message}`);
    throw error;
  }
}

// STAGE 5: Start Work
async function stage5_startWork() {
  logStage(5, 'START WORK & PROGRESS TRACKING');

  try {
    // Start work
    logInfo('Starting work on ticket...');
    let response = await axios.patch(
      `${BASE_URL}/helpdesk/${testData.ticketId}/progress`,
      {
        progressStatus: 'In Progress',
        notes: 'Started working on software installation',
        updatedBy: testData.itSpecialist.name
      }
    );

    if (response.data.success) {
      let ticket = response.data.data;
      logSuccess(`Work started`);
      logSuccess(`Status: ${ticket.status}`);

      if (ticket.status === 'In Progress') {
        logSuccess('✓ Ticket status correctly updated to In Progress');
      }
    }

    await delay(1000);

    // Pause work
    logInfo('Pausing work...');
    response = await axios.post(
      `${BASE_URL}/helpdesk/${testData.ticketId}/pause`,
      {
        reason: 'Waiting for software license approval',
        pausedBy: testData.itSpecialist.name
      }
    );

    if (response.data.success) {
      let ticket = response.data.data;
      logSuccess(`Work paused`);
      logSuccess(`Status: ${ticket.status}`);

      if (ticket.status === 'Paused') {
        logSuccess('✓ Ticket status correctly updated to Paused');
      }
    }

    await delay(1000);

    // Resume work
    logInfo('Resuming work...');
    response = await axios.post(
      `${BASE_URL}/helpdesk/${testData.ticketId}/resume`,
      {
        notes: 'License approved, resuming installation',
        resumedBy: testData.itSpecialist.name
      }
    );

    if (response.data.success) {
      let ticket = response.data.data;
      logSuccess(`Work resumed`);
      logSuccess(`Status: ${ticket.status}`);

      if (ticket.status === 'In Progress') {
        logSuccess('✓ Ticket status correctly updated back to In Progress');
      }

      return ticket;
    }

  } catch (error) {
    logError(`Stage 5 failed: ${error.response?.data?.message || error.message}`);
    throw error;
  }
}

// STAGE 6: Complete Work
async function stage6_completeWork() {
  logStage(6, 'COMPLETE WORK WITH RESOLUTION');

  try {
    const completionData = {
      resolutionNotes: 'Successfully installed Visual Studio Code version 1.85.0. Configured with required extensions: ESLint, Prettier, GitLens. Tested and verified working correctly.',
      resolvedBy: testData.itSpecialist.name,
      resolvedById: testData.itSpecialist._id
    };

    logInfo(`Completing work with resolution notes...`);
    logInfo(`Resolved By: ${completionData.resolvedBy}`);

    const response = await axios.post(
      `${BASE_URL}/helpdesk/${testData.ticketId}/complete`,
      completionData
    );

    if (response.data.success) {
      const ticket = response.data.data;
      logSuccess(`Work completed successfully`);
      logSuccess(`Status: ${ticket.status}`);
      logSuccess(`Resolution: ${ticket.resolution?.notes?.substring(0, 50)}...`);

      if (ticket.status === 'Work Completed' || ticket.status === 'Completed') {
        logSuccess('✓ Ticket status correctly updated to Work Completed');
      }

      if (ticket.resolution && ticket.resolution.notes) {
        logSuccess('✓ Resolution notes saved correctly');
      } else {
        logError('Resolution notes not found in ticket');
      }

      return ticket;
    }

  } catch (error) {
    logError(`Stage 6 failed: ${error.response?.data?.message || error.message}`);
    throw error;
  }
}

// STAGE 7: User Confirmation
async function stage7_userConfirmation() {
  logStage(7, 'USER CONFIRMATION');

  try {
    const confirmationData = {
      userId: testData.requester._id,
      userName: testData.requester.name,
      feedback: 'VS Code is working perfectly. Thank you for the quick installation and setup!',
      rating: 5
    };

    logInfo(`User confirming work completion...`);
    logInfo(`User: ${confirmationData.userName}`);
    logInfo(`Feedback: ${confirmationData.feedback}`);

    const response = await axios.post(
      `${BASE_URL}/helpdesk/${testData.ticketId}/confirm-completion`,
      confirmationData
    );

    if (response.data.success) {
      const ticket = response.data.data;
      logSuccess(`User confirmation received`);
      logSuccess(`Status: ${ticket.status}`);

      if (ticket.status === 'Completed - Awaiting IT Closure' || ticket.status === 'Confirmed') {
        logSuccess('✓ Ticket status correctly updated to awaiting IT closure');
      }

      if (ticket.userConfirmedAt) {
        logSuccess('✓ User confirmation timestamp recorded');
      }

      return ticket;
    }

  } catch (error) {
    logError(`Stage 7 failed: ${error.response?.data?.message || error.message}`);
    throw error;
  }
}

// STAGE 8: IT Closure
async function stage8_itClosure() {
  logStage(8, 'IT ADMIN CLOSURE');

  try {
    const closureData = {
      closedBy: 'IT Admin',
      closedById: testData.itSpecialist._id,
      closingReason: 'User confirmed successful installation. Ticket closed.',
      closingNotes: 'All requirements met. User satisfied with the resolution.'
    };

    logInfo(`Closing ticket...`);
    logInfo(`Closed By: ${closureData.closedBy}`);

    const response = await axios.post(
      `${BASE_URL}/helpdesk/${testData.ticketId}/close`,
      closureData
    );

    if (response.data.success) {
      const ticket = response.data.data;
      logSuccess(`Ticket closed successfully`);
      logSuccess(`Final Status: ${ticket.status}`);

      if (ticket.status === 'Closed') {
        logSuccess('✓ Ticket status correctly updated to Closed');
      }

      if (ticket.closedAt) {
        logSuccess('✓ Closure timestamp recorded');
      }

      if (ticket.closedBy) {
        logSuccess('✓ Closed by information recorded');
      }

      return ticket;
    }

  } catch (error) {
    logError(`Stage 8 failed: ${error.response?.data?.message || error.message}`);
    throw error;
  }
}

// STAGE 9: Final Verification
async function stage9_finalVerification() {
  logStage(9, 'FINAL VERIFICATION');

  try {
    const response = await axios.get(`${BASE_URL}/helpdesk/${testData.ticketId}`);
    const ticket = response.data.data;

    log('\n📋 TICKET SUMMARY', 'bright');
    console.log('─'.repeat(80));
    logInfo(`Ticket Number: ${ticket.ticketNumber}`);
    logInfo(`Subject: ${ticket.subject}`);
    logInfo(`Category: ${ticket.highLevelCategory} > ${ticket.subCategory}`);
    logInfo(`Requester: ${ticket.userName}`);
    logInfo(`Final Status: ${ticket.status}`);

    console.log('\n📊 LIFECYCLE TIMELINE:');
    console.log('─'.repeat(80));
    logInfo(`Created: ${new Date(ticket.createdAt).toLocaleString()}`);
    if (ticket.approval?.required) {
      logInfo(`Approvals: Required (${ticket.approval.currentLevel} levels)`);
    }
    if (ticket.routedTo) {
      logInfo(`Routed to: ${ticket.routedTo}`);
    }
    if (ticket.assignment?.assignedToName) {
      logInfo(`Assigned to: ${ticket.assignment.assignedToName}`);
    }
    if (ticket.resolution?.resolvedAt) {
      logInfo(`Resolved: ${new Date(ticket.resolution.resolvedAt).toLocaleString()}`);
    }
    if (ticket.userConfirmedAt) {
      logInfo(`User Confirmed: ${new Date(ticket.userConfirmedAt).toLocaleString()}`);
    }
    if (ticket.closedAt) {
      logInfo(`Closed: ${new Date(ticket.closedAt).toLocaleString()}`);
    }

    console.log('\n📝 HISTORY ENTRIES:');
    console.log('─'.repeat(80));
    if (ticket.history && ticket.history.length > 0) {
      ticket.history.slice(-10).forEach((entry, index) => {
        logInfo(`${index + 1}. [${entry.action}] ${entry.description || ''} - ${entry.performedByName || entry.by || 'System'}`);
      });
      logSuccess(`✓ ${ticket.history.length} history entries recorded`);
    }

    // Verify completeness
    console.log('\n✅ VERIFICATION CHECKLIST:');
    console.log('─'.repeat(80));

    const checks = [
      { name: 'Ticket created', pass: ticket.ticketNumber !== undefined },
      { name: 'Routed to department', pass: ticket.routedTo === 'IT' },
      { name: 'Assigned to specialist', pass: ticket.assignment?.assignedToId !== undefined },
      { name: 'Work completed', pass: ticket.resolution !== undefined },
      { name: 'User confirmed', pass: ticket.userConfirmedAt !== undefined },
      { name: 'Ticket closed', pass: ticket.status === 'Closed' },
      { name: 'History logged', pass: ticket.history && ticket.history.length > 0 }
    ];

    const passedChecks = checks.filter(c => c.pass).length;
    checks.forEach(check => {
      if (check.pass) {
        logSuccess(check.name);
      } else {
        logError(check.name);
      }
    });

    console.log('\n' + '='.repeat(80));
    if (passedChecks === checks.length) {
      log('🎉 ALL TESTS PASSED! Workflow completed successfully!', 'green');
    } else {
      log(`⚠️  ${passedChecks}/${checks.length} checks passed`, 'yellow');
    }
    console.log('='.repeat(80) + '\n');

    return ticket;

  } catch (error) {
    logError(`Final verification failed: ${error.response?.data?.message || error.message}`);
    throw error;
  }
}

// Main test runner
async function runWorkflowTest() {
  log('\n🚀 STARTING END-TO-END HELPDESK WORKFLOW TEST', 'bright');
  log('Testing complete ticket lifecycle from submission to closure\n', 'cyan');

  const startTime = Date.now();

  try {
    // Setup
    await setupTestData();
    await delay(1000);

    // Stage 1: Submit
    await stage1_submitTicket();
    await delay(1500);

    // Stage 2: Approvals (if approvers exist)
    if (testData.l1Approver) {
      await stage2_l1Approval();
      await delay(1500);
    }

    if (testData.l2Approver) {
      await stage2_l2Approval();
      await delay(1500);
    }

    if (testData.l3Approver) {
      await stage2_l3Approval();
      await delay(1500);
    }

    // Stage 3: Verify routing
    await stage3_verifyRouting();
    await delay(1000);

    // Stage 4: Assign
    await stage4_assignToSpecialist();
    await delay(1500);

    // Stage 5: Work progress
    await stage5_startWork();
    await delay(1500);

    // Stage 6: Complete
    await stage6_completeWork();
    await delay(1500);

    // Stage 7: User confirmation
    await stage7_userConfirmation();
    await delay(1500);

    // Stage 8: IT closure
    await stage8_itClosure();
    await delay(1000);

    // Stage 9: Final verification
    await stage9_finalVerification();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    log(`\n✅ Test completed in ${duration} seconds`, 'green');

  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    log(`\n❌ Test failed after ${duration} seconds`, 'red');
    logError(`Error: ${error.message}`);
    if (error.response?.data) {
      logError(`Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    process.exit(1);
  }
}

// Run the test
runWorkflowTest().catch(error => {
  logError(`Unhandled error: ${error.message}`);
  process.exit(1);
});
