import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { CheckCircle, XCircle, AlertCircle, Copy, RefreshCw } from 'lucide-react-native';
import { supabase } from '@/utils/supabase';

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warning' | 'pending';
  message: string;
  details?: string;
}

export default function DatabaseFixScreen() {
  const [checks, setChecks] = useState<CheckResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const sqlScript = `-- Run this in your Supabase SQL Editor

-- Step 1: Drop existing tables (WARNING: This deletes all data)
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS badges CASCADE;
DROP TABLE IF EXISTS pellets CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Step 2: Create users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  passwordHash TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  stats TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  licensePlate TEXT,
  state TEXT,
  resetToken TEXT,
  resetTokenExpiry BIGINT
);

CREATE INDEX idx_users_email ON users(LOWER(email));
CREATE INDEX idx_users_license_plate ON users(LOWER(licensePlate));

-- Step 3: Create pellets table
CREATE TABLE pellets (
  id TEXT PRIMARY KEY,
  targetLicensePlate TEXT NOT NULL,
  targetUserId TEXT,
  createdBy TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  reason TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('negative', 'positive')),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION
);

CREATE INDEX idx_pellets_target_plate ON pellets(LOWER(targetLicensePlate));
CREATE INDEX idx_pellets_created_by ON pellets(createdBy);
CREATE INDEX idx_pellets_created_at ON pellets(created_at DESC);

-- Step 4: Create badges table
CREATE TABLE badges (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  badgeId TEXT NOT NULL,
  earned_at BIGINT NOT NULL,
  UNIQUE(userId, badgeId)
);

CREATE INDEX idx_badges_user_id ON badges(userId);

-- Step 5: Create activities table
CREATE TABLE activities (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  actionType TEXT NOT NULL,
  actionData TEXT NOT NULL,
  created_at BIGINT NOT NULL
);

CREATE INDEX idx_activities_user_id ON activities(userId);
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);

-- Step 6: Verify tables were created
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'pellets', 'badges', 'activities')
ORDER BY table_name, ordinal_position;`;

  const runDiagnostics = async () => {
    setIsRunning(true);
    const results: CheckResult[] = [];

    results.push({
      name: 'Environment Variables',
      status: 'pending',
      message: 'Checking environment configuration...',
    });
    setChecks([...results]);

    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey || supabaseUrl.length < 10) {
      results[0] = {
        name: 'Environment Variables',
        status: 'fail',
        message: 'Missing or invalid Supabase credentials',
        details: `URL: ${supabaseUrl ? '✓' : '✗'}, Key: ${supabaseKey ? '✓' : '✗'}`,
      };
      setChecks([...results]);
      setIsRunning(false);
      return;
    }

    results[0] = {
      name: 'Environment Variables',
      status: 'pass',
      message: 'Supabase credentials configured',
      details: `URL: ${supabaseUrl}`,
    };
    setChecks([...results]);

    results.push({
      name: 'Database Connection',
      status: 'pending',
      message: 'Testing connection to Supabase...',
    });
    setChecks([...results]);

    try {
      const { error } = await supabase.from('users').select('count').limit(1);
      
      if (error) {
        if (error.code === 'PGRST204') {
          results[1] = {
            name: 'Database Connection',
            status: 'warning',
            message: 'Connected, but schema is missing or invalid',
            details: `Error: ${error.message}. You need to run the SQL script below.`,
          };
        } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
          results[1] = {
            name: 'Database Connection',
            status: 'warning',
            message: 'Connected, but tables do not exist',
            details: 'Tables are missing. Run the SQL script below to create them.',
          };
        } else {
          results[1] = {
            name: 'Database Connection',
            status: 'fail',
            message: 'Connection failed',
            details: `Error: ${error.message}`,
          };
        }
      } else {
        results[1] = {
          name: 'Database Connection',
          status: 'pass',
          message: 'Successfully connected to database',
        };
      }
    } catch (error: any) {
      results[1] = {
        name: 'Database Connection',
        status: 'fail',
        message: 'Failed to connect',
        details: error.message || 'Unknown error',
      };
    }

    setChecks([...results]);

    results.push({
      name: 'Schema Verification',
      status: 'pending',
      message: 'Checking database schema...',
    });
    setChecks([...results]);

    const tablesToCheck = ['users', 'pellets', 'badges', 'activities'];
    const missingTables: string[] = [];

    for (const table of tablesToCheck) {
      try {
        const { error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          if (error.message.includes('does not exist') || error.code === 'PGRST204') {
            missingTables.push(table);
          }
        }
      } catch {
        missingTables.push(table);
      }
    }

    if (missingTables.length > 0) {
      results[2] = {
        name: 'Schema Verification',
        status: 'fail',
        message: 'Database schema is incomplete',
        details: `Missing or invalid tables: ${missingTables.join(', ')}. Run the SQL script below.`,
      };
    } else {
      results[2] = {
        name: 'Schema Verification',
        status: 'pass',
        message: 'All required tables exist',
      };
    }

    setChecks([...results]);
    setIsRunning(false);
  };

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(sqlScript);
    Alert.alert('Copied!', 'SQL script copied to clipboard. Paste it in your Supabase SQL Editor.');
  };

  const getStatusIcon = (status: CheckResult['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle size={24} color="#10b981" />;
      case 'fail':
        return <XCircle size={24} color="#ef4444" />;
      case 'warning':
        return <AlertCircle size={24} color="#f59e0b" />;
      case 'pending':
        return <RefreshCw size={24} color="#6b7280" />;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Database Fix',
          headerStyle: { backgroundColor: '#1e293b' },
          headerTintColor: '#fff',
        }}
      />

      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Database Diagnostics</Text>
          <Text style={styles.subtitle}>
            Run diagnostics to identify database issues
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, isRunning && styles.buttonDisabled]}
          onPress={runDiagnostics}
          disabled={isRunning}
        >
          <RefreshCw size={20} color="#fff" />
          <Text style={styles.buttonText}>
            {isRunning ? 'Running Diagnostics...' : 'Run Diagnostics'}
          </Text>
        </TouchableOpacity>

        {checks.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>Diagnostic Results</Text>
            {checks.map((check, index) => (
              <View key={index} style={styles.checkItem}>
                <View style={styles.checkHeader}>
                  {getStatusIcon(check.status)}
                  <Text style={styles.checkName}>{check.name}</Text>
                </View>
                <Text style={styles.checkMessage}>{check.message}</Text>
                {check.details && (
                  <Text style={styles.checkDetails}>{check.details}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {checks.some(c => c.status === 'fail' || c.status === 'warning') && (
          <View style={styles.fixSection}>
            <Text style={styles.fixTitle}>How to Fix</Text>
            <Text style={styles.fixInstructions}>
              1. Go to your Supabase Dashboard{'\n'}
              2. Navigate to SQL Editor{'\n'}
              3. Copy the script below and paste it{'\n'}
              4. Click &quot;Run&quot; to execute{'\n'}
              5. Wait for completion{'\n'}
              6. Run diagnostics again to verify
            </Text>

            <TouchableOpacity
              style={styles.copyButton}
              onPress={copyToClipboard}
            >
              <Copy size={20} color="#3b82f6" />
              <Text style={styles.copyButtonText}>Copy SQL Script</Text>
            </TouchableOpacity>

            <View style={styles.sqlContainer}>
              <ScrollView horizontal>
                <Text style={styles.sqlText}>{sqlScript}</Text>
              </ScrollView>
            </View>

            <View style={styles.warningBox}>
              <AlertCircle size={20} color="#f59e0b" />
              <Text style={styles.warningText}>
                Warning: This will delete all existing data in your database
              </Text>
            </View>
          </View>
        )}

        {checks.length > 0 && checks.every(c => c.status === 'pass') && (
          <View style={styles.successBox}>
            <CheckCircle size={24} color="#10b981" />
            <Text style={styles.successText}>
              All checks passed! Your database is properly configured.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
  },
  button: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  checkItem: {
    marginBottom: 16,
  },
  checkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  checkName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  checkMessage: {
    fontSize: 14,
    color: '#cbd5e1',
    marginLeft: 36,
    marginBottom: 4,
  },
  checkDetails: {
    fontSize: 12,
    color: '#94a3b8',
    marginLeft: 36,
    fontFamily: 'monospace' as any,
  },
  fixSection: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  fixTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  fixInstructions: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 22,
    marginBottom: 16,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1e40af',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  copyButtonText: {
    color: '#93c5fd',
    fontSize: 14,
    fontWeight: '600',
  },
  sqlContainer: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    maxHeight: 300,
  },
  sqlText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontFamily: 'monospace' as any,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#422006',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  warningText: {
    flex: 1,
    color: '#fbbf24',
    fontSize: 14,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#022c22',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  successText: {
    flex: 1,
    color: '#34d399',
    fontSize: 16,
    fontWeight: '600',
  },
});
