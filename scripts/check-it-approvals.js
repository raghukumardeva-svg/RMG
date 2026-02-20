// Script to check IT categories that require approval
const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017/rmg-portal';

async function checkITApprovals() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('rmg-portal');
    const collection = db.collection('subcategoryconfigs');
    
    // Find IT categories that require approval
    const itCategories = await collection.find({
      highLevelCategory: 'IT',
      requiresApproval: true
    }).toArray();
    
    console.log(`\n=== IT Categories Requiring Approval (${itCategories.length}) ===\n`);
    
    for (const cat of itCategories) {
      console.log(`📁 ${cat.subCategory}`);
      console.log(`   ID: ${cat._id}`);
      console.log(`   requiresApproval: ${cat.requiresApproval}`);
      console.log(`   isActive: ${cat.isActive}`);
      console.log(`   approvalConfig:`, JSON.stringify(cat.approvalConfig, null, 2));
      console.log('');
    }
    
    // Check if approvalConfig structure exists
    console.log('\n=== Analysis ===');
    const withApprovalConfig = itCategories.filter(c => c.approvalConfig);
    const withL1Enabled = itCategories.filter(c => c.approvalConfig?.l1?.enabled);
    const withL1Approvers = itCategories.filter(c => c.approvalConfig?.l1?.approvers?.length > 0);
    
    console.log(`Categories with approvalConfig field: ${withApprovalConfig.length}`);
    console.log(`Categories with L1 enabled: ${withL1Enabled.length}`);
    console.log(`Categories with L1 approvers: ${withL1Approvers.length}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

checkITApprovals();
