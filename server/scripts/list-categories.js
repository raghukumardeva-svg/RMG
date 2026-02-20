/**
 * Script to list all categories and their approval requirements
 */
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rmg-portal';

async function listCategories() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const configs = await mongoose.connection.db
      .collection('subcategoryconfigs')
      .find({})
      .sort({ highLevelCategory: 1, subCategory: 1 })
      .toArray();

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('           HELPDESK CATEGORIES & REQUEST TYPES');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Group by category
    const grouped = {};
    configs.forEach(c => {
      if (!grouped[c.highLevelCategory]) grouped[c.highLevelCategory] = [];
      grouped[c.highLevelCategory].push(c);
    });

    // Summary counters
    let totalRequiresApproval = 0;
    let totalNoApproval = 0;

    Object.keys(grouped).sort().forEach(cat => {
      const icon = cat === 'IT' ? '💻' : cat === 'Facilities' ? '🏢' : '💰';
      console.log(`${icon} ${cat}`);
      console.log('─'.repeat(60));
      
      grouped[cat].forEach(c => {
        const active = c.isActive !== false ? '' : ' [INACTIVE]';
        
        if (c.requiresApproval) {
          totalRequiresApproval++;
          console.log(`  ✅ ${c.subCategory}${active}`);
          console.log(`     └─ REQUIRES APPROVAL`);
          
          if (c.approvalConfig) {
            const levels = [];
            if (c.approvalConfig.l1?.enabled) levels.push('L1');
            if (c.approvalConfig.l2?.enabled) levels.push('L2');
            if (c.approvalConfig.l3?.enabled) levels.push('L3');
            if (levels.length > 0) {
              console.log(`        Flow: ${levels.join(' → ')}`);
            }
          }
        } else {
          totalNoApproval++;
          console.log(`  ❌ ${c.subCategory}${active}`);
          console.log(`     └─ NO APPROVAL REQUIRED`);
        }
        console.log('');
      });
      console.log('');
    });

    // Summary
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                         SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`  Total Categories: ${configs.length}`);
    console.log(`  ✅ Requires Approval: ${totalRequiresApproval}`);
    console.log(`  ❌ No Approval Required: ${totalNoApproval}`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

listCategories();
