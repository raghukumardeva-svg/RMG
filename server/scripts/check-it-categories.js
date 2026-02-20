const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/rmg-portal').then(async () => {
  const cats = await mongoose.connection.db
    .collection('subcategoryconfigs')
    .find({ highLevelCategory: 'IT', requiresApproval: true })
    .toArray();
  
  console.log('IT Categories with requiresApproval=true:\n');
  cats.forEach(c => {
    console.log(`Category: ${c.subCategory}`);
    console.log(`  requiresApproval: ${c.requiresApproval}`);
    console.log(`  approvalConfig: ${JSON.stringify(c.approvalConfig, null, 4)}`);
    console.log(`  approvers (old field): ${JSON.stringify(c.approvers, null, 4)}`);
    console.log('---');
  });
  
  mongoose.disconnect();
});
