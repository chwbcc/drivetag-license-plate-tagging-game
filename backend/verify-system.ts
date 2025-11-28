#!/usr/bin/env bun

/**
 * Registration System Verification Script
 * 
 * This script will:
 * 1. Check database connectivity
 * 2. List all registered users
 * 3. Verify admin user status
 * 4. Test creating a new user
 * 5. Generate a detailed report
 */

import { initDatabase, getDatabase } from './database';
import { createUser, getUserByEmail, getAllUsers } from './services/user-service';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

const results: TestResult[] = [];

function addResult(name: string, status: 'pass' | 'fail' | 'warning', message: string, details?: any) {
  results.push({ name, status, message, details });
}

function printResults() {
  console.log('\n' + '='.repeat(60));
  console.log('  REGISTRATION SYSTEM VERIFICATION REPORT');
  console.log('='.repeat(60) + '\n');

  let passed = 0;
  let failed = 0;
  let warnings = 0;

  results.forEach((result, index) => {
    const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
    console.log(`${icon} Test ${index + 1}: ${result.name}`);
    console.log(`   ${result.message}`);
    
    if (result.details) {
      console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
    }
    console.log();

    if (result.status === 'pass') passed++;
    else if (result.status === 'fail') failed++;
    else warnings++;
  });

  console.log('='.repeat(60));
  console.log(`  SUMMARY: ${passed} passed, ${failed} failed, ${warnings} warnings`);
  console.log('='.repeat(60) + '\n');

  if (failed > 0) {
    console.log('❌ Some tests failed. Please check the errors above.');
    process.exit(1);
  } else if (warnings > 0) {
    console.log('⚠️  All tests passed but there are warnings.');
  } else {
    console.log('🎉 All tests passed! Registration system is working correctly.');
  }
}

async function verifyRegistrationSystem() {
  console.log('🚀 Starting Registration System Verification...\n');

  try {
    // Test 1: Database Connection
    console.log('Testing database connection...');
    try {
      await initDatabase();
      const db = getDatabase();
      await db.execute('SELECT 1');
      addResult('Database Connection', 'pass', 'Successfully connected to Turso database');
    } catch (error: any) {
      addResult('Database Connection', 'fail', `Failed to connect: ${error.message}`);
      throw error;
    }

    // Test 2: Database Schema
    console.log('Checking database schema...');
    try {
      const db = getDatabase();
      
      const tables = ['users', 'badges', 'pellets', 'activities'];
      const missingTables = [];
      
      for (const table of tables) {
        const result = await db.execute(`SELECT name FROM sqlite_master WHERE type='table' AND name='${table}'`);
        if (result.rows.length === 0) {
          missingTables.push(table);
        }
      }
      
      if (missingTables.length === 0) {
        addResult('Database Schema', 'pass', 'All required tables exist', { tables });
      } else {
        addResult('Database Schema', 'fail', 'Some tables are missing', { missingTables });
      }
    } catch (error: any) {
      addResult('Database Schema', 'fail', `Schema check failed: ${error.message}`);
    }

    // Test 3: List Current Users
    console.log('Listing current users...');
    try {
      const users = await getAllUsers();
      addResult('User Listing', 'pass', `Found ${users.length} users in database`, {
        count: users.length,
        users: users.map(u => ({
          email: u.email,
          name: u.name || 'No name',
          licensePlate: u.licensePlate || 'None',
          role: u.adminRole || 'user',
          createdAt: u.createdAt,
        }))
      });
    } catch (error: any) {
      addResult('User Listing', 'fail', `Failed to list users: ${error.message}`);
    }

    // Test 4: Check Admin User
    console.log('Checking admin user (chwbcc@gmail.com)...');
    try {
      const adminUser = await getUserByEmail('chwbcc@gmail.com');
      
      if (adminUser) {
        if (adminUser.adminRole === 'super_admin') {
          addResult('Admin User', 'pass', 'Admin user exists with correct super_admin role', {
            email: adminUser.email,
            name: adminUser.name,
            role: adminUser.adminRole,
          });
        } else {
          addResult('Admin User', 'warning', `Admin user exists but role is '${adminUser.adminRole}' instead of 'super_admin'`, {
            email: adminUser.email,
            currentRole: adminUser.adminRole,
            expectedRole: 'super_admin',
          });
        }
      } else {
        addResult('Admin User', 'warning', 'Admin user (chwbcc@gmail.com) not registered yet', {
          message: 'Register through the app with chwbcc@gmail.com to create admin account'
        });
      }
    } catch (error: any) {
      addResult('Admin User', 'fail', `Failed to check admin user: ${error.message}`);
    }

    // Test 5: Test User Creation
    console.log('Testing user creation...');
    try {
      const testEmail = `test_verification_${Date.now()}@example.com`;
      const testUser = {
        id: `verify_${Date.now()}`,
        email: testEmail,
        password: 'VerifyTest123!',
        name: 'Verification Test User',
        licensePlate: 'VERIFY1',
        state: 'CA',
        adminRole: null as any,
      };

      const createdUser = await createUser(testUser);
      
      if (createdUser && createdUser.id === testUser.id) {
        addResult('User Creation', 'pass', 'Successfully created test user', {
          email: createdUser.email,
          pelletCount: createdUser.pelletCount,
          positivePelletCount: createdUser.positivePelletCount,
        });

        // Verify user can be retrieved
        const retrievedUser = await getUserByEmail(testEmail);
        if (retrievedUser && retrievedUser.id === createdUser.id) {
          addResult('User Retrieval', 'pass', 'Successfully retrieved created user');
        } else {
          addResult('User Retrieval', 'fail', 'Created user could not be retrieved');
        }
      } else {
        addResult('User Creation', 'fail', 'User creation returned unexpected result');
      }
    } catch (error: any) {
      addResult('User Creation', 'fail', `Failed to create test user: ${error.message}`, {
        error: error.message,
        stack: error.stack,
      });
    }

    // Test 6: Check Default Pellet Counts
    console.log('Verifying default pellet counts...');
    try {
      const testEmail = `pellet_test_${Date.now()}@example.com`;
      const user = await createUser({
        id: `pellet_test_${Date.now()}`,
        email: testEmail,
        password: 'test',
        name: 'Pellet Test',
        licensePlate: 'PELLET1',
        state: 'NY',
        adminRole: null as any,
      });

      if (user.pelletCount === 10 && user.positivePelletCount === 5) {
        addResult('Default Pellets', 'pass', 'New users receive correct starting pellets', {
          negativePellets: user.pelletCount,
          positivePellets: user.positivePelletCount,
        });
      } else {
        addResult('Default Pellets', 'fail', 'Incorrect pellet counts for new users', {
          expected: { negative: 10, positive: 5 },
          actual: { negative: user.pelletCount, positive: user.positivePelletCount },
        });
      }
    } catch (error: any) {
      addResult('Default Pellets', 'fail', `Failed to verify pellets: ${error.message}`);
    }

    // Test 7: Environment Variables
    console.log('Checking environment configuration...');
    const hasDbUrl = !!process.env.TURSO_DB_URL;
    const hasAuthToken = !!process.env.TURSO_AUTH_TOKEN;
    
    if (hasDbUrl && hasAuthToken) {
      addResult('Environment Config', 'pass', 'All required environment variables are set', {
        TURSO_DB_URL: hasDbUrl ? '✓ Set' : '✗ Missing',
        TURSO_AUTH_TOKEN: hasAuthToken ? '✓ Set' : '✗ Missing',
      });
    } else {
      addResult('Environment Config', 'fail', 'Missing required environment variables', {
        TURSO_DB_URL: hasDbUrl ? '✓ Set' : '✗ Missing',
        TURSO_AUTH_TOKEN: hasAuthToken ? '✓ Set' : '✗ Missing',
      });
    }

  } catch (error: any) {
    console.error('\n❌ Critical error during verification:');
    console.error(error);
    addResult('Critical Error', 'fail', error.message);
  }

  printResults();
}

// Run verification
verifyRegistrationSystem();
