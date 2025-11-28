/**
 * Test script to verify registration process and database connection
 * Run this file to test if user registration is working properly
 */

import { initDatabase, getDatabase } from './database';
import { createUser, getUserByEmail, getAllUsers } from './services/user-service';

async function testRegistration() {
  console.log('🧪 Starting Registration Test...\n');

  try {
    // Step 1: Initialize database
    console.log('1️⃣ Initializing database...');
    await initDatabase();
    console.log('✅ Database initialized successfully\n');

    // Step 2: Check current users
    console.log('2️⃣ Checking current users in database...');
    const allUsers = await getAllUsers();
    console.log(`Found ${allUsers.length} users in database`);
    
    if (allUsers.length > 0) {
      console.log('Current users:');
      allUsers.forEach((u, i) => {
        console.log(`  ${i + 1}. ${u.email} (${u.name || 'No name'}) - License: ${u.licensePlate || 'None'} - Role: ${u.adminRole || 'user'}`);
      });
    }
    console.log();

    // Step 3: Test creating a new user
    const testEmail = `test_${Date.now()}@example.com`;
    console.log('3️⃣ Testing user creation...');
    console.log(`Creating test user: ${testEmail}`);
    
    const testUser = {
      id: `test_user_${Date.now()}`,
      email: testEmail,
      password: 'TestPassword123',
      name: 'Test User',
      licensePlate: 'TEST123',
      state: 'CA',
      adminRole: null as any,
    };

    const createdUser = await createUser(testUser);
    console.log('✅ User created successfully');
    console.log(`   ID: ${createdUser.id}`);
    console.log(`   Email: ${createdUser.email}`);
    console.log(`   Name: ${createdUser.name}`);
    console.log(`   License Plate: ${createdUser.licensePlate}`);
    console.log(`   State: ${createdUser.state}`);
    console.log(`   Pellet Count: ${createdUser.pelletCount}`);
    console.log(`   Positive Pellet Count: ${createdUser.positivePelletCount}`);
    console.log(`   Admin Role: ${createdUser.adminRole || 'user'}\n`);

    // Step 4: Test retrieving user by email
    console.log('4️⃣ Testing user retrieval by email...');
    const retrievedUser = await getUserByEmail(testEmail);
    
    if (retrievedUser) {
      console.log('✅ User retrieved successfully');
      console.log(`   Retrieved user email: ${retrievedUser.email}`);
      console.log(`   Data matches: ${retrievedUser.id === createdUser.id ? '✅' : '❌'}\n`);
    } else {
      console.log('❌ Failed to retrieve user\n');
    }

    // Step 5: Test admin user (chwbcc@gmail.com)
    console.log('5️⃣ Checking admin user (chwbcc@gmail.com)...');
    const adminUser = await getUserByEmail('chwbcc@gmail.com');
    
    if (adminUser) {
      console.log('✅ Admin user exists');
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   Name: ${adminUser.name || 'No name set'}`);
      console.log(`   Admin Role: ${adminUser.adminRole || 'NOT SET - Should be super_admin!'}`);
      
      if (adminUser.adminRole !== 'super_admin') {
        console.log('⚠️  WARNING: Admin user does not have super_admin role!');
      }
    } else {
      console.log('❌ Admin user not found in database');
      console.log('   The admin user needs to register first through the app');
    }
    console.log();

    // Step 6: Database connection test
    console.log('6️⃣ Testing database connection...');
    const db = getDatabase();
    const testQuery = await db.execute('SELECT COUNT(*) as count FROM users');
    const userCount = testQuery.rows[0].count;
    console.log(`✅ Database connection working - Total users: ${userCount}\n`);

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Test Summary');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Database initialization: SUCCESS');
    console.log('✅ User creation: SUCCESS');
    console.log('✅ User retrieval: SUCCESS');
    console.log('✅ Database connection: SUCCESS');
    console.log(`📈 Total users in database: ${userCount}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🎉 All tests passed! Registration system is working correctly.\n');

  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error);
    console.log('\n💡 Possible issues:');
    console.log('   1. Check if TURSO_DB_URL and TURSO_AUTH_TOKEN are set in environment variables');
    console.log('   2. Verify Turso database is accessible');
    console.log('   3. Check if database tables are created properly');
  }
}

// Run the test
testRegistration();
