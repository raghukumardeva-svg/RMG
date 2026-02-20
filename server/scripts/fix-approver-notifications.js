const mongoose = require('mongoose');

async function fixApproverNotifications() {
  try {
    await mongoose.connect('mongodb://localhost:27017/rmg-portal');
    console.log('Connected to MongoDB');
    
    // Update all approver notifications to use /approver link
    const result = await mongoose.connection.db.collection('notifications').updateMany(
      { role: { $regex: /APPROVER/ } },
      { $set: { 'meta.actionUrl': '/approver' } }
    );
    
    console.log('Updated', result.modifiedCount, 'approver notifications');
    
    // Verify the update
    const notifications = await mongoose.connection.db.collection('notifications').find({
      role: { $regex: /APPROVER/ }
    }).toArray();
    
    console.log('\nCurrent approver notifications:');
    notifications.forEach(n => {
      console.log(`  - Role: ${n.role}, actionUrl: ${n.meta?.actionUrl || 'none'}`);
    });
    
    await mongoose.disconnect();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixApproverNotifications();
