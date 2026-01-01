import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import Colors from '@/constants/colors';
import Button from '@/components/Button';

export default function DebugBackendScreen() {
  const [results, setResults] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);

  const log = (message: string) => {
    console.log(message);
    setResults(prev => [...prev, message]);
  };

  const testBackend = async () => {
    setTesting(true);
    setResults([]);

    const baseUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
    log(`Base URL: ${baseUrl || 'NOT SET'}`);

    if (!baseUrl) {
      log('ERROR: EXPO_PUBLIC_RORK_API_BASE_URL is not set');
      setTesting(false);
      return;
    }

    log('\n--- Testing Root Endpoint ---');
    try {
      const response = await fetch(baseUrl, { method: 'GET' });
      log(`Status: ${response.status}`);
      const data = await response.text();
      log(`Response: ${data.substring(0, 200)}`);
    } catch (error: any) {
      log(`ERROR: ${error.message}`);
    }

    log('\n--- Testing Health Endpoint ---');
    try {
      const response = await fetch(`${baseUrl}/health`, { method: 'GET' });
      log(`Status: ${response.status}`);
      const data = await response.text();
      log(`Response: ${data.substring(0, 200)}`);
    } catch (error: any) {
      log(`ERROR: ${error.message}`);
    }

    log('\n--- Testing tRPC Endpoint ---');
    try {
      const response = await fetch(`${baseUrl}/api/trpc/example.hi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      log(`Status: ${response.status}`);
      const data = await response.text();
      log(`Response: ${data.substring(0, 200)}`);
    } catch (error: any) {
      log(`ERROR: ${error.message}`);
    }

    log('\n--- Testing Auth Register Endpoint ---');
    try {
      const response = await fetch(`${baseUrl}/api/trpc/auth.register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'test_id',
          email: 'test@example.com',
          password: 'testpass',
          licensePlate: 'TEST123',
        }),
      });
      log(`Status: ${response.status}`);
      const data = await response.text();
      log(`Response: ${data.substring(0, 300)}`);
    } catch (error: any) {
      log(`ERROR: ${error.message}`);
    }

    setTesting(false);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Backend Debug' }} />
      
      <View style={styles.header}>
        <Text style={styles.title}>Backend Diagnostics</Text>
        <Button
          title="Run Tests"
          onPress={testBackend}
          loading={testing}
        />
      </View>

      <ScrollView style={styles.scrollView}>
        {results.map((result, index) => (
          <Text key={index} style={styles.logText}>
            {result}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  logText: {
    fontSize: 12,
    color: Colors.text,
    fontFamily: 'monospace' as any,
    marginBottom: 4,
  },
});
