#!/usr/bin/env bun

/**
 * Environment Verification Script
 * 
 * This script checks if your environment variables are properly configured.
 * Run this before trying to register users to ensure everything is set up correctly.
 */

console.log('='.repeat(60));
console.log('ENVIRONMENT VERIFICATION');
console.log('='.repeat(60));
console.log('');

// Check for .env file
console.log('Checking environment variables...');
console.log('');

const requiredVars = [
  'TURSO_DB_URL',
  'TURSO_AUTH_TOKEN',
];

let hasAllVars = true;

for (const varName of requiredVars) {
  const value = process.env[varName];
  const status = value ? '✓ SET' : '✗ NOT SET';
  console.log(`${varName}: ${status}`);
  
  if (value) {
    if (varName === 'TURSO_DB_URL') {
      if (!value.startsWith('libsql://')) {
        console.log(`  ⚠️  Warning: URL should start with 'libsql://'`);
        console.log(`  Current value: ${value.substring(0, 30)}...`);
      }
    }
    if (varName === 'TURSO_AUTH_TOKEN') {
      if (!value.startsWith('eyJ')) {
        console.log(`  ⚠️  Warning: Token should start with 'eyJ' (JWT format)`);
      }
      console.log(`  Token length: ${value.length} characters`);
    }
  } else {
    hasAllVars = false;
  }
}

console.log('');
console.log('='.repeat(60));

if (hasAllVars) {
  console.log('✓ All required environment variables are set!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Restart your development server');
  console.log('2. Try registering a user');
  console.log('3. Check server logs for any database connection errors');
} else {
  console.log('✗ Some environment variables are missing!');
  console.log('');
  console.log('What to do:');
  console.log('1. Create a .env file in your project root if it doesn\'t exist');
  console.log('2. Add the missing variables to your .env file:');
  console.log('');
  console.log('   TURSO_DB_URL=libsql://your-database.turso.io');
  console.log('   TURSO_AUTH_TOKEN=your-auth-token');
  console.log('');
  console.log('3. Get your credentials by running:');
  console.log('   turso db show pellet-app');
  console.log('   turso db tokens create pellet-app');
  console.log('');
  console.log('4. Restart your development server after updating .env');
}

console.log('='.repeat(60));
console.log('');

// Test database connection if variables are set
if (hasAllVars) {
  console.log('Testing database connection...');
  console.log('');
  
  try {
    const { initDatabase, closeDatabase } = await import('./database');
    
    await initDatabase();
    console.log('✓ Database connection successful!');
    console.log('✓ Tables verified successfully!');
    
    await closeDatabase();
  } catch (error: any) {
    console.error('✗ Database connection failed!');
    console.error('');
    console.error('Error:', error.message);
    console.error('');
    console.error('Possible causes:');
    console.error('- Invalid database URL');
    console.error('- Invalid or expired auth token');
    console.error('- Database does not exist');
    console.error('- Network connectivity issues');
    console.error('');
    console.error('Try running: turso db show pellet-app');
    process.exit(1);
  }
}

console.log('Done!');
