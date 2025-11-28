import { initDatabase, getDatabase } from './database';

async function checkDatabaseConnection() {
  console.log('\n=== Turso Database Connection Test ===\n');
  
  const dbUrl = process.env.TURSO_DB_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  
  console.log('Environment Variables Check:');
  console.log(`TURSO_DB_URL: ${dbUrl ? '✓ Set' : '✗ Not Set'}`);
  console.log(`TURSO_AUTH_TOKEN: ${authToken ? '✓ Set' : '✗ Not Set'}`);
  
  if (!dbUrl || !authToken) {
    console.log('\n❌ Missing environment variables. Please set TURSO_DB_URL and TURSO_AUTH_TOKEN\n');
    return;
  }
  
  try {
    console.log('\nInitializing database...');
    await initDatabase();
    console.log('✓ Database initialized successfully');
    
    const db = getDatabase();
    
    console.log('\nTesting database queries...');
    
    const usersResult = await db.execute('SELECT COUNT(*) as count FROM users');
    console.log(`✓ Users table: ${usersResult.rows[0].count} records`);
    
    const pelletsResult = await db.execute('SELECT COUNT(*) as count FROM pellets');
    console.log(`✓ Pellets table: ${pelletsResult.rows[0].count} records`);
    
    const badgesResult = await db.execute('SELECT COUNT(*) as count FROM badges');
    console.log(`✓ Badges table: ${badgesResult.rows[0].count} records`);
    
    const activitiesResult = await db.execute('SELECT COUNT(*) as count FROM activities');
    console.log(`✓ Activities table: ${activitiesResult.rows[0].count} records`);
    
    console.log('\n✅ All database tests passed! Your Turso database is working correctly.\n');
  } catch (error) {
    console.error('\n❌ Database connection failed:', error);
    console.log('\nTroubleshooting tips:');
    console.log('1. Verify your TURSO_DB_URL is correct (should start with libsql://)');
    console.log('2. Ensure your TURSO_AUTH_TOKEN is valid and not expired');
    console.log('3. Check your internet connection');
    console.log('4. Try regenerating your auth token: turso db tokens create pellet-app\n');
  }
}

checkDatabaseConnection();
