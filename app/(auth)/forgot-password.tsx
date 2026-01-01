import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { vanillaClient } from '@/lib/trpc';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');

  const handleRequestReset = async () => {
    if (!email) {
      setError('Please enter your email');
      return;
    }
    
    if (!email.includes('@')) {
      setError('Invalid email format');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      console.log('[ForgotPassword] Requesting reset for:', email);
      
      const result = await vanillaClient.auth.requestReset.mutate({
        email,
      });
      
      console.log('[ForgotPassword] Reset result:', result);
      
      if (result.success) {
        setSuccess(result.message);
        
        if (result.resetToken) {
          setResetToken(result.resetToken);
          console.log('[ForgotPassword] Reset token:', result.resetToken);
        }
        
        setTimeout(() => {
          router.push({
            pathname: '/(auth)/reset-password',
            params: { email },
          });
        }, 2000);
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error('[ForgotPassword] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred. Please try again.';
      setError(errorMessage);
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
            <Text style={styles.logoEmoji}>🔑</Text>
          </View>
          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>Enter your email to receive a reset code</Text>
        </View>
        
        <View style={styles.form}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {success ? <Text style={styles.successText}>{success}</Text> : null}
          {resetToken ? (
            <View style={styles.tokenContainer}>
              <Text style={styles.tokenLabel}>Your reset code:</Text>
              <Text style={styles.tokenText}>{resetToken}</Text>
              <Text style={styles.tokenNote}>Save this code, you will need it on the next screen</Text>
            </View>
          ) : null}
          
          <Input
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          
          <Button
            title="Request Reset Code"
            onPress={handleRequestReset}
            loading={isLoading}
            style={styles.button}
          />
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>Remember your password?</Text>
            <Button
              title="Back to Login"
              variant="outline"
              onPress={() => router.push('/(auth)')}
              style={styles.loginButton}
            />
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
    backgroundColor: '#8B5CF6',
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
  successText: {
    color: '#10B981',
    marginBottom: 16,
    textAlign: 'center',
  },
  tokenContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  tokenLabel: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 8,
  },
  tokenText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#8B5CF6',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 4,
  },
  tokenNote: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    fontStyle: 'italic',
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
  loginButton: {
    width: '100%',
  },
});
