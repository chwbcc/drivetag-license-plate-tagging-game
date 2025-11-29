import { getDatabase, initDatabase } from './database';

async function migrateDatabase() {
  console.log('[Migration] Starting database migration...');
  
  try {
    await initDatabase();
    const db = getDatabase();
    
    console.log('[Migration] Checking for targetUserId column in pellets table...');
    
    try {
      const result = await db.execute('PRAGMA table_info(pellets)');
      const columns = result.rows.map(row => row.name as string);
      
      if (!columns.includes('targetUserId')) {
        console.log('[Migration] Adding targetUserId column to pellets table...');
        await db.execute('ALTER TABLE pellets ADD COLUMN targetUserId TEXT');
        console.log('[Migration] targetUserId column added successfully');
      } else {
        console.log('[Migration] targetUserId column already exists');
      }
    } catch (error) {
      console.error('[Migration] Error checking/adding targetUserId column:', error);
    }
    
    console.log('[Migration] Migration completed successfully');
  } catch (error) {
    console.error('[Migration] Migration failed:', error);
    throw error;
  }
}

migrateDatabase().catch(console.error);
