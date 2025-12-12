import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import Colors from '@/constants/colors';
import Button from '@/components/Button';


export default function BackendStatusScreen() {
  const [checking, setChecking] = useState(true);
  const [backendUrl, setBackendUrl] = useState<string>('');
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [healthError, setHealthError] = useState<string>('');
  const [trpcStatus, setTrpcStatus] = useState<any>(null);
  const [trpcError, setTrpcError] = useState<string>('');

  const checkBackend = async () => {
    setChecking(true);
    setHealthError('');
    setTrpcError('');
    setHealthStatus(null);
    setTrpcStatus(null);

    const url = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
    setBackendUrl(url || 'NOT SET');

    if (!url) {
      setHealthError('EXPO_PUBLIC_RORK_API_BASE_URL is not set');
      setChecking(false);
      return;
    }

    try {
      console.log('[Backend Status] Checking health endpoint:', `${url}/api/health`);
      const healthResponse = await fetch(`${url}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const healthData = await healthResponse.json();
      console.log('[Backend Status] Health response:', healthData);
      setHealthStatus(healthData);
    } catch (error: any) {
      console.error('[Backend Status] Health check error:', error);
      setHealthError(error.message || 'Failed to connect to backend');
    }

    try {
      console.log('[Backend Status] Checking tRPC endpoint:', `${url}/api/trpc/example.hi`);
      const trpcResponse = await fetch(`${url}/api/trpc/example.hi`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      
      const trpcData = await trpcResponse.json();
      console.log('[Backend Status] tRPC response:', trpcData);
      setTrpcStatus({ status: trpcResponse.status, data: trpcData });
    } catch (error: any) {
      console.error('[Backend Status] tRPC check error:', error);
      setTrpcError(error.message || 'Failed to connect to tRPC');
    }

    setChecking(false);
  };

  useEffect(() => {
    checkBackend();
  }, []);

  const renderStatus = (label: string, value: any, error?: string) => {
    if (error) {
      return (
        <View style={styles.statusItem}>
          <Text style={styles.label}>{label}</Text>
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        </View>
      );
    }

    if (!value) {
      return (
        <View style={styles.statusItem}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value}>Not checked yet</Text>
        </View>
      );
    }

    return (
      <View style={styles.statusItem}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.successBox}>
          <Text style={styles.successText}>{JSON.stringify(value, null, 2)}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Backend Status',
          headerBackTitle: 'Back',
        }} 
      />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Backend Connection Status</Text>
          <Text style={styles.subtitle}>Diagnostic information for troubleshooting</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuration</Text>
          <View style={styles.statusItem}>
            <Text style={styles.label}>Backend URL</Text>
            <Text style={[styles.value, !backendUrl && styles.errorText]}>
              {backendUrl || 'NOT SET'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health Check</Text>
          {checking && !healthStatus && !healthError ? (
            <ActivityIndicator size="large" color={Colors.primary} />
          ) : (
            renderStatus('Health Endpoint', healthStatus, healthError)
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>tRPC Check</Text>
          {checking && !trpcStatus && !trpcError ? (
            <ActivityIndicator size="large" color={Colors.primary} />
          ) : (
            renderStatus('tRPC Endpoint', trpcStatus, trpcError)
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Troubleshooting</Text>
          <View style={styles.troubleshootBox}>
            <Text style={styles.troubleshootTitle}>If you see errors:</Text>
            <Text style={styles.troubleshootText}>
              1. Ensure the backend server is running
            </Text>
            <Text style={styles.troubleshootText}>
              2. Check that EXPO_PUBLIC_RORK_API_BASE_URL is configured
            </Text>
            <Text style={styles.troubleshootText}>
              3. Verify your network connection
            </Text>
            <Text style={styles.troubleshootText}>
              4. Check the console logs for detailed errors
            </Text>
          </View>
        </View>

        <Button
          title="Refresh Status"
          onPress={checkBackend}
          loading={checking}
          style={styles.button}
        />

        <Button
          title="Back to Register"
          variant="outline"
          onPress={() => router.back()}
          style={styles.button}
        />
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
    marginBottom: 24,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  statusItem: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: 'monospace' as any,
  },
  errorBox: {
    backgroundColor: Colors.error + '15',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.error + '30',
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
  },
  successBox: {
    backgroundColor: Colors.success + '15',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.success + '30',
  },
  successText: {
    color: Colors.success,
    fontSize: 12,
    fontFamily: 'monospace' as any,
  },
  troubleshootBox: {
    backgroundColor: Colors.secondary + '30',
    padding: 12,
    borderRadius: 8,
  },
  troubleshootTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  troubleshootText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  button: {
    marginBottom: 12,
  },
});
