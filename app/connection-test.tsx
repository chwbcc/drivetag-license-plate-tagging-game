import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack, router } from 'expo-router';
import Colors from '@/constants/colors';
import Button from '@/components/Button';

export default function ConnectionTestScreen() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const testConnection = async () => {
    setTesting(true);
    setResults(null);

    const testResults: any = {
      timestamp: new Date().toISOString(),
      backendUrl: process.env.EXPO_PUBLIC_RORK_API_BASE_URL || 'NOT SET',
      tests: [],
    };

    console.log('[Connection Test] Starting diagnostic tests...');
    console.log('[Connection Test] Backend URL:', testResults.backendUrl);

    if (!process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
      testResults.tests.push({
        name: 'Environment Variable Check',
        status: 'FAILED',
        message: 'EXPO_PUBLIC_RORK_API_BASE_URL is not set',
        details: 'The backend URL environment variable is missing. The backend server must be running and the environment variable must be configured.',
      });
      setResults(testResults);
      setTesting(false);
      return;
    }

    const baseUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;

    try {
      console.log('[Connection Test] Testing basic connectivity to:', baseUrl);
      const startTime = Date.now();
      const response = await fetch(`${baseUrl}/test`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const duration = Date.now() - startTime;
      const data = await response.json();

      testResults.tests.push({
        name: 'Basic Connectivity Test',
        status: response.ok ? 'PASSED' : 'FAILED',
        message: response.ok ? `Backend is reachable (${duration}ms)` : `HTTP ${response.status}`,
        details: JSON.stringify(data, null, 2),
      });
    } catch (error: any) {
      console.error('[Connection Test] Basic connectivity failed:', error);
      testResults.tests.push({
        name: 'Basic Connectivity Test',
        status: 'FAILED',
        message: 'Cannot reach backend server',
        details: `Error: ${error.message}\n\nThis usually means:\n1. Backend server is not running\n2. Backend URL is incorrect: ${baseUrl}\n3. Network/firewall blocking the connection`,
      });
    }

    try {
      console.log('[Connection Test] Testing health endpoint');
      const response = await fetch(`${baseUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();

      testResults.tests.push({
        name: 'Health Endpoint Test',
        status: response.ok ? 'PASSED' : 'FAILED',
        message: response.ok ? 'Health endpoint responding' : `HTTP ${response.status}`,
        details: JSON.stringify(data, null, 2),
      });
    } catch (error: any) {
      console.error('[Connection Test] Health check failed:', error);
      testResults.tests.push({
        name: 'Health Endpoint Test',
        status: 'FAILED',
        message: 'Health endpoint not reachable',
        details: error.message,
      });
    }

    try {
      console.log('[Connection Test] Testing tRPC endpoint');
      const response = await fetch(`${baseUrl}/trpc/example.hi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await response.json();

      testResults.tests.push({
        name: 'tRPC Endpoint Test',
        status: response.ok ? 'PASSED' : 'FAILED',
        message: response.ok ? 'tRPC is responding' : `HTTP ${response.status}`,
        details: JSON.stringify(data, null, 2),
      });
    } catch (error: any) {
      console.error('[Connection Test] tRPC test failed:', error);
      testResults.tests.push({
        name: 'tRPC Endpoint Test',
        status: 'FAILED',
        message: 'tRPC endpoint not reachable',
        details: error.message,
      });
    }

    setResults(testResults);
    setTesting(false);
    console.log('[Connection Test] All tests completed');
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

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Connection Test',
          headerBackTitle: 'Back',
        }} 
      />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Backend Connection Diagnostics</Text>
          <Text style={styles.subtitle}>Test the connection between the app and backend</Text>
        </View>

        {results && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Configuration</Text>
            <View style={styles.infoBox}>
              <Text style={styles.label}>Backend URL:</Text>
              <Text style={styles.value}>{results.backendUrl}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.label}>Test Time:</Text>
              <Text style={styles.value}>{new Date(results.timestamp).toLocaleString()}</Text>
            </View>
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
                <Text style={styles.detailsText}>{test.details}</Text>
              </View>
            )}
          </View>
        ))}

        <View style={styles.buttonContainer}>
          <Button
            title={testing ? "Running Tests..." : results ? "Run Tests Again" : "Run Connection Tests"}
            onPress={testConnection}
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

        {results && results.tests.some((t: any) => t.status === 'FAILED') && (
          <View style={styles.troubleshootBox}>
            <Text style={styles.troubleshootTitle}>Troubleshooting Steps:</Text>
            <Text style={styles.troubleshootText}>
              1. Ensure the backend server is running (check your terminal)
            </Text>
            <Text style={styles.troubleshootText}>
              2. Verify EXPO_PUBLIC_RORK_API_BASE_URL is set correctly
            </Text>
            <Text style={styles.troubleshootText}>
              3. Check if your firewall is blocking the connection
            </Text>
            <Text style={styles.troubleshootText}>
              4. Try restarting both the app and backend server
            </Text>
            <Text style={styles.troubleshootText}>
              5. Check the console logs for detailed error messages
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
  section: {
    marginBottom: 16,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  infoBox: {
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: 'monospace' as any,
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
