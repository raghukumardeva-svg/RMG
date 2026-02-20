const { MongoClient } = require('mongodb');

async function fixLeaveBalanceIndex() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('rmg-portal');
    const collection = db.collection('leavebalances');
    
    // List current indexes
    const indexes = await collection.indexes();
    console.log('\nCurrent indexes:');
    indexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });
    
    // Drop the employeeId_1 unique index if it exists
    const hasEmployeeIdIndex = indexes.some(idx => idx.name === 'employeeId_1');
    if (hasEmployeeIdIndex) {
      await collection.dropIndex('employeeId_1');
      console.log('\n✓ Dropped employeeId_1 index');
    } else {
      console.log('\n✓ employeeId_1 index does not exist');
    }
    
    // Verify compound index exists
    const hasCompoundIndex = indexes.some(idx => idx.name === 'employeeId_1_year_1');
    if (hasCompoundIndex) {
      console.log('✓ Compound index (employeeId + year) exists');
    } else {
      console.log('Creating compound index...');
      await collection.createIndex({ employeeId: 1, year: 1 }, { unique: true });
      console.log('✓ Created compound index (employeeId + year)');
    }
    
    // List updated indexes
    const updatedIndexes = await collection.indexes();
    console.log('\nUpdated indexes:');
    updatedIndexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });
    
    console.log('\n✓ Done!');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.close();
  }
}

fixLeaveBalanceIndex();
