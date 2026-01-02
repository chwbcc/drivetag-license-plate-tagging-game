import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { initDatabase, getDatabase } from '@/backend/database';
import { hashPassword } from '@/utils/hash';

export default function AddSuperAdminScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  const addSuperAdmin = async () => {
    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      console.log('[AddSuperAdmin] Initializing database...');
      await initDatabase();
      const db = getDatabase();

      const email = 'chwbcc@gmail.com';
      const password = 'Admin';
      
      console.log('[AddSuperAdmin] Checking if user already exists...');
      const { data: existingUser } = await db
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (existingUser) {
        setError('Super admin user already exists!');
        setIsLoading(false);
        return;
      }

      console.log('[AddSuperAdmin] Hashing password...');
      const hashedPassword = await hashPassword(password);

      const userId = `super-admin-${Date.now()}`;
      
      const stats = JSON.stringify({
        pelletCount: 1000,
        positivePelletCount: 1000,
        badges: [],
        exp: 0,
        level: 1,
        name: 'Super Admin',
        photo: undefined,
        licensePlate: 'ADMIN',
        state: 'CA',
      });

      console.log('[AddSuperAdmin] Creating super admin user...');
      const { error: insertError } = await db
        .from('users')
        .insert({
          id: userId,
          email: email,
          username: 'Super Admin',
          passwordHash: hashedPassword,
          created_at: Date.now(),
          stats: stats,
          role: 'super_admin',
          licensePlate: 'ADMIN',
          state: 'CA',
        });

      if (insertError) {
        console.error('[AddSuperAdmin] Insert error:', insertError);
        setError(`Failed to create super admin: ${insertError.message}`);
        setIsLoading(false);
        return;
      }

      console.log('[AddSuperAdmin] Super admin created successfully!');
      setMessage(`✅ Super admin created successfully!\n\nEmail: ${email}\nPassword: ${password}\n\nYou can now log in with these credentials`);
    } catch (err: any) {
      console.error('[AddSuperAdmin] Error:', err);
      setError(`Error: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Add Super Admin</Text>
          <Text style={styles.description}>
            This will create a super admin account with the following credentials:
          </Text>
          
          <View style={styles.credentialsBox}>
            <Text style={styles.credentialLabel}>Email:</Text>
            <Text style={styles.credentialValue}>chwbcc@gmail.com</Text>
            
            <Text style={[styles.credentialLabel, styles.credentialLabelMargin]}>Password:</Text>
            <Text style={styles.credentialValue}>Admin</Text>
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={addSuperAdmin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create Super Admin</Text>
            )}
          </TouchableOpacity>

          {message && (
            <View style={styles.messageBox}>
              <Text style={styles.messageText}>{message}</Text>
            </View>
          )}

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    lineHeight: 24,
  },
  credentialsBox: {
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 12,
    marginBottom: 32,
  },
  credentialLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  credentialLabelMargin: {
    marginTop: 16,
  },
  credentialValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
  messageBox: {
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
    borderWidth: 1,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  messageText: {
    color: '#155724',
    fontSize: 14,
    lineHeight: 20,
  },
  errorBox: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
    borderWidth: 1,
    padding: 16,
    borderRadius: 8,
  },
  errorText: {
    color: '#721c24',
    fontSize: 14,
    lineHeight: 20,
  },
});
