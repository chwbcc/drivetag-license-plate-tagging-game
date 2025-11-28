import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import Input from '@/components/Input';
import Button from '@/components/Button';
import useAuthStore from '@/store/auth-store';
import { trpcClient } from '@/lib/trpc';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      console.log('[Login] Attempting login for:', email);
      
      if (!email.includes('@')) {
        setError('Invalid email format');
        setIsLoading(false);
        return;
      }
      
      const result = await trpcClient.auth.login.mutate({
        email,
        password,
      });
      
      if (result.success && result.user) {
        console.log('[Login] Login successful, user adminRole:', result.user.adminRole);
        login(result.user);
        router.replace('/(tabs)');
      } else {
        console.log('[Login] Login failed:', result.message);
        setError(result.message);
      }
    } catch (error) {
      console.error('[Login] Error during login:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoEmoji}>💥</Text>
          </View>
          <Text style={styles.title}>Stupid Pellets</Text>
          <Text style={styles.subtitle}>Tag bad drivers, praise good ones</Text>
        </View>
        
        <View style={styles.form}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          
          <Input
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          
          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          
          <Button
            title="Login"
            onPress={handleLogin}
            loading={isLoading}
            style={styles.button}
          />
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don&apos;t have an account?</Text>
            <Button
              title="Register"
              variant="outline"
              onPress={() => router.push('/register')}
              style={styles.registerButton}
            />
          </View>
          
          <View style={styles.freeInfo}>
            <Text style={styles.freeInfoText}>
              New users get 10 negative pellets and 5 positive pellets to start tagging!
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F97316',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoEmoji: {
    fontSize: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  errorText: {
    color: '#EF4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    marginTop: 8,
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 12,
  },
  registerButton: {
    width: '100%',
  },
  freeInfo: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#10B98120',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10B98140',
  },
  freeInfoText: {
    fontSize: 14,
    color: '#10B981',
    textAlign: 'center',
    fontWeight: '500',
  },
});