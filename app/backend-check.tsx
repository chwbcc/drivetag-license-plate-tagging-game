import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BackendCheckScreen() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const backendUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;

  const runTests = async () => {
    setLoading(true);
    const testResults: any = {
      timestamp: new Date().toISOString(),
      backendUrl,
      tests: {},
    };

    try {
      const rootResponse = await fetch(`${backendUrl}/`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      testResults.tests.root = {
        success: rootResponse.ok,
        status: rootResponse.status,
        data: await rootResponse.json(),
      };
    } catch (error: any) {
      testResults.tests.root = {
        success: false,
        error: error.message,
      };
    }

    try {
      const healthResponse = await fetch(`${backendUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      testResults.tests.health = {
        success: healthResponse.ok,
        status: healthResponse.status,
        data: await healthResponse.json(),
      };
    } catch (error: any) {
      testResults.tests.health = {
        success: false,
        error: error.message,
      };
    }

    try {
      const testResponse = await fetch(`${backendUrl}/test`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      testResults.tests.test = {
        success: testResponse.ok,
        status: testResponse.status,
        data: await testResponse.json(),
      };
    } catch (error: any) {
      testResults.tests.test = {
        success: false,
        error: error.message,
      };
    }

    setResults(testResults);
    setLoading(false);
  };

  const StatusIcon = ({ success }: { success: boolean }) => {
    if (success) {
      return <CheckCircle size={20} color="#10b981" />;
    }
    return <XCircle size={20} color="#ef4444" />;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Backend Connectivity Check</Text>
        
        <View style={styles.urlCard}>
          <Text style={styles.label}>Backend URL:</Text>
          <Text style={styles.urlText}>{backendUrl || 'Not configured'}</Text>
          {!backendUrl && (
            <View style={styles.errorBox}>
              <AlertCircle size={16} color="#ef4444" />
              <Text style={styles.errorText}>
                Backend URL is not set. The backend may not be deployed yet.
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={runTests}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <RefreshCw size={20} color="#fff" />
              <Text style={styles.buttonText}>Run Tests</Text>
            </>
          )}
        </TouchableOpacity>

        {results && (
          <View style={styles.resultsCard}>
            <Text style={styles.sectionTitle}>Test Results</Text>
            
            {Object.entries(results.tests).map(([testName, result]: [string, any]) => (
              <View key={testName} style={styles.testResult}>
                <View style={styles.testHeader}>
                  <StatusIcon success={result.success} />
                  <Text style={styles.testName}>{testName}</Text>
                </View>
                
                {result.success ? (
                  <View style={styles.successBox}>
                    <Text style={styles.statusText}>Status: {result.status}</Text>
                    <Text style={styles.dataText}>
                      {JSON.stringify(result.data, null, 2)}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>Error: {result.error}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Common Issues:</Text>
          <Text style={styles.infoText}>
            • Backend not deployed - Deploy your backend first{'\n'}
            • Wrong backend URL - Check EXPO_PUBLIC_RORK_API_BASE_URL{'\n'}
            • Network issues - Check your internet connection{'\n'}
            • CORS issues - Backend must allow your origin
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 20,
  },
  urlCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 8,
  },
  urlText: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'monospace' as any,
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  testResult: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  testName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'uppercase',
  },
  successBox: {
    backgroundColor: '#064e3b',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#10b981',
    marginBottom: 8,
  },
  dataText: {
    fontSize: 12,
    color: '#6ee7b7',
    fontFamily: 'monospace' as any,
  },
  errorBox: {
    backgroundColor: '#7f1d1d',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    flexDirection: 'row',
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#fca5a5',
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 22,
  },
});
