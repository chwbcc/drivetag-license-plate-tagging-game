import { initDatabase, getDatabase } from './database';

const testUsers = [
  {
    name: 'Luke Skywalker',
    email: 'luke.skywalker@rebellion.com',
    password: 'UseTheForce123!',
    licensePlate: 'JEDI01',
    state: 'CA',
    pelletCount: 150,
    positivePelletCount: 120,
    exp: 2500,
    level: 5,
    role: 'user'
  },
  {
    name: 'Darth Vader',
    email: 'darth.vader@empire.com',
    password: 'DarkSide456!',
    licensePlate: 'SITH01',
    state: 'NY',
    pelletCount: 500,
    positivePelletCount: 50,
    exp: 8000,
    level: 10,
    role: 'user'
  },
  {
    name: 'Princess Leia',
    email: 'leia.organa@rebellion.com',
    password: 'Alderaan789!',
    licensePlate: 'ROYAL1',
    state: 'DC',
    pelletCount: 200,
    positivePelletCount: 180,
    exp: 3500,
    level: 6,
    role: 'moderator'
  },
  {
    name: 'Han Solo',
    email: 'han.solo@smuggler.com',
    password: 'Falcon999!',
    licensePlate: 'MFALCN',
    state: 'TX',
    pelletCount: 100,
    positivePelletCount: 60,
    exp: 1800,
    level: 4,
    role: 'user'
  },
  {
    name: 'Yoda',
    email: 'yoda@jedicouncil.com',
    password: 'DoOrDoNot123!',
    licensePlate: 'MASTER',
    state: 'FL',
    pelletCount: 999,
    positivePelletCount: 999,
    exp: 15000,
    level: 20,
    role: 'admin'
  },
  {
    name: 'Obi-Wan Kenobi',
    email: 'obiwan@jedicouncil.com',
    password: 'HelloThere456!',
    licensePlate: 'HGHRND',
    state: 'AZ',
    pelletCount: 300,
    positivePelletCount: 280,
    exp: 6500,
    level: 9,
    role: 'user'
  },
  {
    name: 'Chewbacca',
    email: 'chewie@wookiee.com',
    password: 'Rrrrrrr789!',
    licensePlate: 'WOOKIE',
    state: 'WA',
    pelletCount: 120,
    positivePelletCount: 100,
    exp: 2200,
    level: 5,
    role: 'user'
  },
  {
    name: 'R2-D2',
    email: 'r2d2@droid.com',
    password: 'BeepBoop123!',
    licensePlate: 'ASTRO1',
    state: 'OR',
    pelletCount: 80,
    positivePelletCount: 75,
    exp: 1500,
    level: 3,
    role: 'user'
  },
  {
    name: 'Padmé Amidala',
    email: 'padme@naboo.com',
    password: 'Senator456!',
    licensePlate: 'QUEEN1',
    state: 'VA',
    pelletCount: 250,
    positivePelletCount: 230,
    exp: 4200,
    level: 7,
    role: 'user'
  },
  {
    name: 'Mace Windu',
    email: 'mace.windu@jedicouncil.com',
    password: 'Purple789!',
    licensePlate: 'MASTER2',
    state: 'IL',
    pelletCount: 400,
    positivePelletCount: 350,
    exp: 7200,
    level: 10,
    role: 'moderator'
  }
];

const addTestUsers = async () => {
  try {
    console.log('[Add Test Users] Starting...');
    console.log('[Add Test Users] Adding', testUsers.length, 'Star Wars character users');
    
    await initDatabase();
    
    const db = getDatabase();
    
    let added = 0;
    let updated = 0;
    
    for (const testUser of testUsers) {
      console.log(`\n[Add Test Users] Processing: ${testUser.name}`);
      
      const existingUser = await db.execute({
        sql: 'SELECT * FROM users WHERE LOWER(email) = ?',
        args: [testUser.email.toLowerCase()]
      });
      
      if (existingUser.rows.length > 0) {
        console.log(`[Add Test Users] User already exists: ${testUser.email}`);
        console.log('[Add Test Users] Updating user data...');
        
        const stats = JSON.stringify({
          pelletCount: testUser.pelletCount,
          positivePelletCount: testUser.positivePelletCount,
          badges: [],
          exp: testUser.exp,
          level: testUser.level,
          name: testUser.name,
          photo: undefined,
          licensePlate: testUser.licensePlate,
          state: testUser.state,
        });
        
        await db.execute({
          sql: 'UPDATE users SET username = ?, stats = ?, role = ? WHERE LOWER(email) = ?',
          args: [testUser.name, stats, testUser.role, testUser.email.toLowerCase()]
        });
        
        updated++;
        console.log(`[Add Test Users] ✓ Updated: ${testUser.name}`);
        continue;
      }
      
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const stats = JSON.stringify({
        pelletCount: testUser.pelletCount,
        positivePelletCount: testUser.positivePelletCount,
        badges: [],
        exp: testUser.exp,
        level: testUser.level,
        name: testUser.name,
        photo: undefined,
        licensePlate: testUser.licensePlate,
        state: testUser.state,
      });
      
      await db.execute({
        sql: 'INSERT INTO users (id, email, username, passwordHash, createdAt, stats, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
        args: [
          userId,
          testUser.email,
          testUser.name,
          testUser.password,
          Date.now(),
          stats,
          testUser.role
        ]
      });
      
      added++;
      console.log(`[Add Test Users] ✓ Created: ${testUser.name}`);
    }
    
    console.log('\n=========================================');
    console.log('         TEST USERS SUMMARY');
    console.log('=========================================');
    console.log(`✓ Added: ${added} users`);
    console.log(`✓ Updated: ${updated} users`);
    console.log(`✓ Total processed: ${testUsers.length} users`);
    console.log('=========================================\n');
    
    console.log('TEST USER CREDENTIALS:');
    console.log('-------------------------------------------');
    testUsers.forEach(user => {
      console.log(`Name: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Password: ${user.password}`);
      console.log(`License Plate: ${user.licensePlate} (${user.state})`);
      console.log(`Role: ${user.role}`);
      console.log(`Level: ${user.level} | EXP: ${user.exp}`);
      console.log(`Pellets: ${user.pelletCount} (${user.positivePelletCount} positive)`);
      console.log('-------------------------------------------');
    });
    
    console.log('\nIMPORTANT: These are test users with simple passwords.');
    console.log('Do not use these in production!');
    
    process.exit(0);
  } catch (error) {
    console.error('[Add Test Users] Error:', error);
    process.exit(1);
  }
};

addTestUsers();
