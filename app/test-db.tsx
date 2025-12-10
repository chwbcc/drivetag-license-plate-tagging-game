import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { trpc } from '@/lib/trpc';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Colors from '@/constants/colors';

export default function TestDatabaseScreen() {
  const [testEmail, setTestEmail] = useState<string>('');
  const [testUsername, setTestUsername] = useState<string>('');
  const [testPassword, setTestPassword] = useState<string>('');
  const [testPlate, setTestPlate] = useState<string>('');
  const [testReason, setTestReason] = useState<string>('');
  const [results, setResults] = useState<string>('');

  const connectionQuery = trpc.testDb.testConnection.useQuery();
  const insertUserMutation = trpc.testDb.testInsertUser.useMutation();
  const insertPelletMutation = trpc.testDb.testInsertPellet.useMutation();
  const getAllDataQuery = trpc.testDb.testGetAllData.useQuery();

  const handleTestConnection = () => {
    connectionQuery.refetch();
    setResults(JSON.stringify(connectionQuery.data, null, 2));
  };

  const handleInsertUser = async () => {
    try {
      const result = await insertUserMutation.mutateAsync({
        email: testEmail || `test${Date.now()}@example.com`,
        username: testUsername || `TestUser${Date.now()}`,
        password: testPassword || 'test123',
      });
      setResults(JSON.stringify(result, null, 2));
    } catch (error: any) {
      setResults(JSON.stringify({ error: error?.message || 'Unknown error' }, null, 2));
    }
  };

  const handleInsertPellet = async () => {
    try {
      const result = await insertPelletMutation.mutateAsync({
        targetLicensePlate: testPlate || 'ABC123',
        createdBy: 'test-user',
        reason: testReason || 'Test pellet',
        type: 'positive',
      });
      setResults(JSON.stringify(result, null, 2));
    } catch (error: any) {
      setResults(JSON.stringify({ error: error?.message || 'Unknown error' }, null, 2));
    }
  };

  const handleGetAllData = () => {
    getAllDataQuery.refetch();
    setResults(JSON.stringify(getAllDataQuery.data, null, 2));
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Database Test',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: '#fff',
        }}
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Supabase Database Test</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Test Connection</Text>
          <Button
            title="Test Connection"
            onPress={handleTestConnection}
            disabled={connectionQuery.isLoading}
          />
          {connectionQuery.isLoading && <ActivityIndicator color={Colors.primary} />}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Insert Test User</Text>
          <Input
            label="Email"
            value={testEmail}
            onChangeText={setTestEmail}
            placeholder="test@example.com"
            keyboardType="email-address"
          />
          <Input
            label="Username"
            value={testUsername}
            onChangeText={setTestUsername}
            placeholder="TestUser"
          />
          <Input
            label="Password"
            value={testPassword}
            onChangeText={setTestPassword}
            placeholder="password123"
            secureTextEntry
          />
          <Button
            title="Insert User"
            onPress={handleInsertUser}
            disabled={insertUserMutation.isPending}
          />
          {insertUserMutation.isPending && <ActivityIndicator color={Colors.primary} />}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Insert Test Pellet</Text>
          <Input
            label="License Plate"
            value={testPlate}
            onChangeText={setTestPlate}
            placeholder="ABC123"
          />
          <Input
            label="Reason"
            value={testReason}
            onChangeText={setTestReason}
            placeholder="Test pellet"
          />
          <Button
            title="Insert Pellet"
            onPress={handleInsertPellet}
            disabled={insertPelletMutation.isPending}
          />
          {insertPelletMutation.isPending && <ActivityIndicator color={Colors.primary} />}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Get All Data</Text>
          <Button
            title="Fetch All Data"
            onPress={handleGetAllData}
            disabled={getAllDataQuery.isLoading}
          />
          {getAllDataQuery.isLoading && <ActivityIndicator color={Colors.primary} />}
        </View>

        {results && (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsTitle}>Results:</Text>
            <ScrollView style={styles.resultsContainer}>
              <Text style={styles.resultsText}>{results}</Text>
            </ScrollView>
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
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: Colors.text,
    marginBottom: 20,
    textAlign: 'center' as const,
  },
  section: {
    marginBottom: 30,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: Colors.text,
    marginBottom: 15,
  },
  resultsSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: Colors.text,
    marginBottom: 10,
  },
  resultsContainer: {
    maxHeight: 300,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
  },
  resultsText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: Colors.text,
  },
});
