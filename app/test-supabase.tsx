import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack, router } from 'expo-router';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import { trpc } from '@/lib/trpc';

export default function TestSupabaseScreen() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const testConnectionMutation = trpc.testDb.testConnection.useQuery(undefined, {
    enabled: false,
  });

  const testInsertUserMutation = trpc.testDb.testInsertUser.useMutation();
  const testGetAllDataQuery = trpc.testDb.testGetAllData.useQuery(undefined, {
    enabled: false,
  });

  const runTests = async () => {
    setTesting(true);
    setResults(null);

    const testResults: any = {
      timestamp: new Date().toISOString(),
      tests: [],
    };

    console.log('[Supabase Test] Starting tests...');

    try {
      console.log('[Supabase Test] Test 1: Database Connection');
      const connectionResult = await testConnectionMutation.refetch();
      
      if (connectionResult.data) {
        testResults.tests.push({
          name: 'Database Connection',
          status: connectionResult.data.success ? 'PASSED' : 'FAILED',
          message: connectionResult.data.message,
          details: JSON.stringify(connectionResult.data, null, 2),
        });
      }
    } catch (error: any) {
      console.error('[Supabase Test] Connection test failed:', error);
      testResults.tests.push({
        name: 'Database Connection',
        status: 'FAILED',
        message: 'Failed to test connection',
        details: error.message,
      });
    }

    try {
      console.log('[Supabase Test] Test 2: Insert Test User');
      const timestamp = Date.now();
      const testEmail = `test-${timestamp}@example.com`;
      
      const insertResult = await testInsertUserMutation.mutateAsync({
        email: testEmail,
        username: `TestUser${timestamp}`,
        password: 'test123456',
      });

      testResults.tests.push({
        name: 'Insert Test User',
        status: insertResult.success ? 'PASSED' : 'FAILED',
        message: insertResult.success 
          ? `User created successfully! Email: ${testEmail}` 
          : insertResult.message,
        details: JSON.stringify(insertResult, null, 2),
      });
    } catch (error: any) {
      console.error('[Supabase Test] Insert user test failed:', error);
      testResults.tests.push({
        name: 'Insert Test User',
        status: 'FAILED',
        message: 'Failed to insert user',
        details: error.message,
      });
    }

    try {
      console.log('[Supabase Test] Test 3: Fetch All Data');
      const dataResult = await testGetAllDataQuery.refetch();
      
      if (dataResult.data) {
        const usersCount = dataResult.data.data?.users?.count || 0;
        const pelletsCount = dataResult.data.data?.pellets?.count || 0;
        
        testResults.tests.push({
          name: 'Fetch All Data',
          status: dataResult.data.success ? 'PASSED' : 'FAILED',
          message: `Found ${usersCount} users, ${pelletsCount} pellets`,
          details: JSON.stringify(dataResult.data, null, 2),
        });
      }
    } catch (error: any) {
      console.error('[Supabase Test] Fetch data test failed:', error);
      testResults.tests.push({
        name: 'Fetch All Data',
        status: 'FAILED',
        message: 'Failed to fetch data',
        details: error.message,
      });
    }

    setResults(testResults);
    setTesting(false);
    console.log('[Supabase Test] All tests completed');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASSED':
        return Colors.success;
      case 'FAILED':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  const allTestsPassed = results?.tests.every((t: any) => t.status === 'PASSED');

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Supabase Test',
          headerBackTitle: 'Back',
        }} 
      />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Supabase Database Test</Text>
          <Text style={styles.subtitle}>
            Test if your app can connect and add data to your Supabase database
          </Text>
        </View>

        {results && (
          <View style={styles.summaryBox}>
            <Text style={[
              styles.summaryText,
              { color: allTestsPassed ? Colors.success : Colors.error }
            ]}>
              {allTestsPassed 
                ? '✅ All tests passed! Your app can add data to Supabase.' 
                : '❌ Some tests failed. Check the details below.'}
            </Text>
          </View>
        )}

        {results?.tests.map((test: any, index: number) => (
          <View key={index} style={styles.section}>
            <View style={styles.testHeader}>
              <Text style={styles.testName}>{test.name}</Text>
              <Text style={[styles.testStatus, { color: getStatusColor(test.status) }]}>
                {test.status}
              </Text>
            </View>
            <Text style={styles.testMessage}>{test.message}</Text>
            {test.details && (
              <View style={[
                styles.detailsBox,
                { borderColor: getStatusColor(test.status) + '30' }
              ]}>
                <ScrollView horizontal>
                  <Text style={styles.detailsText}>{test.details}</Text>
                </ScrollView>
              </View>
            )}
          </View>
        ))}

        <View style={styles.buttonContainer}>
          <Button
            title={testing ? "Running Tests..." : results ? "Run Tests Again" : "Run Supabase Tests"}
            onPress={runTests}
            loading={testing}
            style={styles.button}
          />

          <Button
            title="Back"
            variant="outline"
            onPress={() => router.back()}
            style={styles.button}
          />
        </View>

        {results && !allTestsPassed && (
          <View style={styles.troubleshootBox}>
            <Text style={styles.troubleshootTitle}>If tests failed:</Text>
            <Text style={styles.troubleshootText}>
              1. Check that your backend server is running
            </Text>
            <Text style={styles.troubleshootText}>
              2. Verify SUPABASE_URL and SUPABASE_ANON_KEY are set correctly
            </Text>
            <Text style={styles.troubleshootText}>
              3. Ensure tables exist in your Supabase database (users, pellets, badges, activities)
            </Text>
            <Text style={styles.troubleshootText}>
              4. Check that EXPO_PUBLIC_RORK_API_BASE_URL points to your running backend
            </Text>
            <Text style={styles.troubleshootText}>
              5. Review the console logs for detailed error messages
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  summaryBox: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  section: {
    marginBottom: 16,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  testName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  testStatus: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  testMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  detailsBox: {
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  detailsText: {
    fontSize: 12,
    color: Colors.text,
    fontFamily: 'monospace' as any,
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  button: {
    marginBottom: 12,
  },
  troubleshootBox: {
    backgroundColor: Colors.error + '15',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.error + '30',
    marginBottom: 24,
  },
  troubleshootTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.error,
    marginBottom: 12,
  },
  troubleshootText: {
    fontSize: 13,
    color: Colors.text,
    marginBottom: 4,
  },
});
