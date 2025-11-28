import { initDatabase, getDatabase } from './database';

async function pullDatabaseInfo() {
  console.log('\n=== Pulling Turso Database Information ===\n');
  
  try {
    console.log('Initializing database...');
    await initDatabase();
    console.log('✓ Database initialized successfully\n');
    
    const db = getDatabase();
    
    console.log('📊 DATABASE STATISTICS\n');
    console.log('─'.repeat(60));
    
    const usersResult = await db.execute('SELECT COUNT(*) as count FROM users');
    const usersCount = usersResult.rows[0].count;
    console.log(`👥 Total Users: ${usersCount}`);
    
    const pelletsResult = await db.execute('SELECT COUNT(*) as count FROM pellets');
    const pelletsCount = pelletsResult.rows[0].count;
    console.log(`🎯 Total Pellets: ${pelletsCount}`);
    
    const badgesResult = await db.execute('SELECT COUNT(*) as count FROM badges');
    const badgesCount = badgesResult.rows[0].count;
    console.log(`🏆 Total Badges: ${badgesCount}`);
    
    const activitiesResult = await db.execute('SELECT COUNT(*) as count FROM activities');
    const activitiesCount = activitiesResult.rows[0].count;
    console.log(`📈 Total Activities: ${activitiesCount}`);
    
    console.log('─'.repeat(60));
    
    console.log('\n\n👥 USERS DATA\n');
    console.log('─'.repeat(60));
    const users = await db.execute('SELECT id, email, username, role, createdAt, stats FROM users ORDER BY createdAt DESC');
    
    if (users.rows.length === 0) {
      console.log('No users found in database');
    } else {
      users.rows.forEach((user, index) => {
        console.log(`\nUser ${index + 1}:`);
        console.log(`  ID: ${user.id}`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Username: ${user.username}`);
        console.log(`  Role: ${user.role}`);
        console.log(`  Created: ${new Date(user.createdAt as number).toLocaleString()}`);
        
        try {
          const stats = JSON.parse(user.stats as string);
          console.log(`  Stats: Level ${stats.level}, XP: ${stats.xp}, Pellets Given: ${stats.pelletsGiven}`);
        } catch (e) {
          console.log(`  Stats: ${user.stats}`);
        }
      });
    }
    
    console.log('\n\n🎯 PELLETS DATA\n');
    console.log('─'.repeat(60));
    const pellets = await db.execute('SELECT * FROM pellets ORDER BY createdAt DESC LIMIT 20');
    
    if (pellets.rows.length === 0) {
      console.log('No pellets found in database');
    } else {
      pellets.rows.forEach((pellet, index) => {
        console.log(`\nPellet ${index + 1}:`);
        console.log(`  ID: ${pellet.id}`);
        console.log(`  Target License Plate: ${pellet.targetLicensePlate}`);
        console.log(`  Type: ${pellet.type}`);
        console.log(`  Reason: ${pellet.reason}`);
        console.log(`  Created By: ${pellet.createdBy}`);
        console.log(`  Created: ${new Date(pellet.createdAt as number).toLocaleString()}`);
        if (pellet.latitude && pellet.longitude) {
          console.log(`  Location: ${pellet.latitude}, ${pellet.longitude}`);
        }
      });
    }
    
    console.log('\n\n🏆 BADGES DATA\n');
    console.log('─'.repeat(60));
    const badges = await db.execute('SELECT * FROM badges ORDER BY earnedAt DESC LIMIT 20');
    
    if (badges.rows.length === 0) {
      console.log('No badges found in database');
    } else {
      badges.rows.forEach((badge, index) => {
        console.log(`\nBadge ${index + 1}:`);
        console.log(`  ID: ${badge.id}`);
        console.log(`  Badge ID: ${badge.badgeId}`);
        console.log(`  User ID: ${badge.userId}`);
        console.log(`  Earned At: ${new Date(badge.earnedAt as number).toLocaleString()}`);
      });
    }
    
    console.log('\n\n📈 ACTIVITIES DATA\n');
    console.log('─'.repeat(60));
    const activities = await db.execute('SELECT * FROM activities ORDER BY createdAt DESC LIMIT 20');
    
    if (activities.rows.length === 0) {
      console.log('No activities found in database');
    } else {
      activities.rows.forEach((activity, index) => {
        console.log(`\nActivity ${index + 1}:`);
        console.log(`  ID: ${activity.id}`);
        console.log(`  User ID: ${activity.userId}`);
        console.log(`  Action Type: ${activity.actionType}`);
        try {
          const actionData = JSON.parse(activity.actionData as string);
          console.log(`  Action Data:`, actionData);
        } catch (e) {
          console.log(`  Action Data: ${activity.actionData}`);
        }
        console.log(`  Created: ${new Date(activity.createdAt as number).toLocaleString()}`);
      });
    }
    
    console.log('\n\n✅ Database information pulled successfully!\n');
    
  } catch (error) {
    console.error('\n❌ Error pulling database information:', error);
    console.log('\nTroubleshooting:');
    console.log('1. Ensure your .env file exists in the project root');
    console.log('2. Verify TURSO_DB_URL and TURSO_AUTH_TOKEN are set correctly');
    console.log('3. Check your database connection\n');
  }
}

pullDatabaseInfo();
