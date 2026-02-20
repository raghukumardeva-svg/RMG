const { MongoClient } = require('mongodb');

async function main() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('rmg-portal');

  // Fix 1: Update EMP001's reporting manager to MGR001
  const result1 = await db.collection('employees').updateOne(
    { employeeId: 'EMP001' },
    {
      $set: {
        reportingManagerId: 'MGR001',
        reportingManager: { id: 'MGR001', name: 'Rajesh Kumar' }
      }
    }
  );
  console.log('Updated EMP001 reporting manager:', result1.modifiedCount);

  // Fix 2: Update the leave request's managerId from MANAGER001 to MGR001
  const result2 = await db.collection('leaves').updateMany(
    { managerId: 'MANAGER001' },
    { $set: { managerId: 'MGR001' } }
  );
  console.log('Updated leave requests managerId:', result2.modifiedCount);

  // Verify the changes
  const emp = await db.collection('employees').findOne({ employeeId: 'EMP001' });
  console.log('\nEMP001 now has reportingManagerId:', emp.reportingManagerId);

  const leaves = await db.collection('leaves').find({ employeeId: 'EMP001' }).toArray();
  console.log('Leaves for EMP001:', leaves.map(l => ({ id: l._id, managerId: l.managerId, status: l.status })));

  await client.close();
}

main().catch(console.error);
