import { initDatabase, getDatabase } from './database';

async function checkUsers() {
  try {
    console.log('Initializing database connection...');
    await initDatabase();
    console.log('Database initialized successfully\n');
    
    const db = getDatabase();
    
    console.log('Checking users table...');
    const usersResult = await db.execute('SELECT COUNT(*) as count FROM users');
    console.log('Total users in database:', usersResult.rows[0].count);
    
    console.log('\nFetching all users...');
    const allUsersResult = await db.execute('SELECT id, email, username, licensePlate, state, role, createdAt FROM users');
    
    if (allUsersResult.rows.length === 0) {
      console.log('❌ No users found in database');
    } else {
      console.log('\n✅ Found', allUsersResult.rows.length, 'user(s):\n');
      allUsersResult.rows.forEach((user, index) => {
        console.log(`User ${index + 1}:`);
        console.log('  ID:', user.id);
        console.log('  Email:', user.email);
        console.log('  Username:', user.username);
        console.log('  License Plate:', user.licensePlate || 'Not set');
        console.log('  State:', user.state || 'Not set');
        console.log('  Role:', user.role);
        console.log('  Created:', new Date(user.createdAt as number).toLocaleString());
        console.log('');
      });
    }
    
    console.log('\nChecking pellets table...');
    const pelletsResult = await db.execute('SELECT COUNT(*) as count FROM pellets');
    console.log('Total pellets:', pelletsResult.rows[0].count);
    
    console.log('\nChecking badges table...');
    const badgesResult = await db.execute('SELECT COUNT(*) as count FROM badges');
    console.log('Total badges:', badgesResult.rows[0].count);
    
    console.log('\nChecking activities table...');
    const activitiesResult = await db.execute('SELECT COUNT(*) as count FROM activities');
    console.log('Total activities:', activitiesResult.rows[0].count);
    
    console.log('\n✅ Database check completed successfully');
    
  } catch (error) {
    console.error('\n❌ Error checking database:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
  }
}

checkUsers();
