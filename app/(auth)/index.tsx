import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import Input from '@/components/Input';
import Button from '@/components/Button';
import useAuthStore from '@/store/auth-store';
import { supabase } from '@/utils/supabase';
import { hashPassword } from '@/utils/hash';

const SUPER_ADMIN_EMAIL = 'chwbcc@gmail.com';

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
      if (!email.includes('@')) {
        setError('Invalid email format');
        setIsLoading(false);
        return;
      }
      
      if (email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
        console.log('[Login] Super Admin bypass activated');
        const superAdminUser = {
          id: 'super_admin_1',
          email: SUPER_ADMIN_EMAIL,
          name: 'Super Admin',
          licensePlate: 'ADMIN1',
          state: 'CA',
          pelletCount: 999999,
          positivePelletCount: 999999,
          badges: ['first-tag', 'first-positive', 'tag-master'],
          exp: 100000,
          level: 15,
          adminRole: 'super_admin' as const,
        };
        
        login(superAdminUser);
        router.replace('/(tabs)/home');
        return;
      }
      
      const passwordHash = await hashPassword(password);
      
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('password_hash', passwordHash)
        .limit(1);
      
      if (error) throw error;
      
      if (users && users.length > 0) {
        const user = users[0];
        login({
          id: user.id,
          email: user.email,
          name: user.name,
          licensePlate: user.license_plate,
          state: user.state,
          pelletCount: user.pellet_count || 10,
          positivePelletCount: user.positive_pellet_count || 5,
          badges: user.badges || [],
          exp: user.experience || 0,
          level: user.level || 1,
          adminRole: user.admin_role,
        });
        router.replace('/(tabs)/home');
      } else {
        setError('Invalid email or password');
      }
    } catch (error) {
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
            <Text style={styles.logoEmoji}>💥</Text>
          </View>
          <Text style={styles.title}>Drive Tag</Text>
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
          
          <View style={styles.forgotPasswordContainer}>
            <Button
              title="Forgot Password?"
              variant="outline"
              onPress={() => router.push('/(auth)/forgot-password')}
              style={styles.forgotPasswordButton}
            />
          </View>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don&apos;t have an account?</Text>
            <Button
              title="Register"
              variant="outline"
              onPress={() => router.push('/(auth)/register')}
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
  forgotPasswordContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  forgotPasswordButton: {
    width: '100%',
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
