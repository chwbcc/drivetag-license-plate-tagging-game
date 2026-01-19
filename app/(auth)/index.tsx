import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import Input from '@/components/Input';
import Button from '@/components/Button';
import useAuthStore from '@/store/auth-store';
import { supabase } from '@/utils/supabase';
import { AdminRole } from '@/types';

const SUPER_ADMIN_EMAIL = 'chwbcc@gmail.com';
const SUPER_ADMIN_ID = 'usr_super_admin_1';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuthStore();

  const handleLogin = async () => {
    if (!email) {
      setError('Please enter your email');
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
        console.log('[Login] Super Admin bypass - checking database first');
        
        const { data: existingSuperAdmin } = await supabase
          .from('users')
          .select('*')
          .ilike('email', SUPER_ADMIN_EMAIL.toLowerCase())
          .single();
        
        if (existingSuperAdmin) {
          console.log('[Login] Super Admin found in database');
          const mappedUser = {
            id: existingSuperAdmin.id as string,
            email: existingSuperAdmin.email as string,
            name: (existingSuperAdmin.name as string) || 'Super Admin',
            photo: existingSuperAdmin.photo as string | undefined,
            licensePlate: (existingSuperAdmin.license_plate as string) || 'ADMIN1',
            state: (existingSuperAdmin.state as string) || 'CA',
            pelletCount: (existingSuperAdmin.negative_pellet_count as number) || 999999,
            positivePelletCount: (existingSuperAdmin.positive_pellet_count as number) || 999999,
            positiveRatingCount: (existingSuperAdmin.positive_rating_count as number) || 0,
            negativeRatingCount: (existingSuperAdmin.negative_rating_count as number) || 0,
            pelletsGivenCount: (existingSuperAdmin.pellets_given_count as number) || 0,
            positivePelletsGivenCount: (existingSuperAdmin.positive_pellets_given_count as number) || 0,
            negativePelletsGivenCount: (existingSuperAdmin.negative_pellets_given_count as number) || 0,
            badges: typeof existingSuperAdmin.badges === 'string' ? JSON.parse(existingSuperAdmin.badges) : (existingSuperAdmin.badges || []),
            exp: (existingSuperAdmin.experience as number) || 100000,
            level: (existingSuperAdmin.level as number) || 15,
            adminRole: 'super_admin' as const,
          };
          login(mappedUser);
          router.replace('/(tabs)/home' as any);
          return;
        } else {
          console.log('[Login] Creating Super Admin in database');
          const superAdminUser = {
            id: SUPER_ADMIN_ID,
            email: SUPER_ADMIN_EMAIL,
            name: 'Super Admin',
            licensePlate: 'ADMIN1',
            state: 'CA',
            pelletCount: 999999,
            positivePelletCount: 999999,
            positiveRatingCount: 0,
            negativeRatingCount: 0,
            pelletsGivenCount: 0,
            positivePelletsGivenCount: 0,
            negativePelletsGivenCount: 0,
            badges: ['first-tag', 'first-positive', 'tag-master'],
            exp: 100000,
            level: 15,
            adminRole: 'super_admin' as const,
          };
          
          await supabase
            .from('users')
            .insert([{
              id: SUPER_ADMIN_ID,
              email: SUPER_ADMIN_EMAIL.toLowerCase(),
              username: 'Super Admin',
              name: 'Super Admin',
              created_at: Date.now(),
              role: 'super_admin',
              license_plate: 'ADMIN1',
              state: 'CA',
              experience: 100000,
              level: 15,
              negative_pellet_count: 999999,
              positive_pellet_count: 999999,
              positive_rating_count: 0,
              negative_rating_count: 0,
              pellets_given_count: 0,
              positive_pellets_given_count: 0,
              negative_pellets_given_count: 0,
              badges: JSON.stringify(['first-tag', 'first-positive', 'tag-master']),
              photo: null,
            }]);
          
          login(superAdminUser);
          router.replace('/(tabs)/home' as any);
          return;
        }
      }
      
      console.log('[Login] Fetching user from database:', email.toLowerCase());
      
      const { data: users, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .ilike('email', email.toLowerCase())
        .limit(1);
      
      if (fetchError) {
        console.error('[Login] Database error:', fetchError);
        throw fetchError;
      }
      
      if (users && users.length > 0) {
        const user = users[0];
        console.log('[Login] User found:', user.email);
        
        const mappedUser = {
          id: user.id as string,
          email: user.email as string,
          name: (user.name as string) || '',
          photo: user.photo as string | undefined,
          licensePlate: (user.license_plate as string) || '',
          state: (user.state as string) || '',
          pelletCount: (user.negative_pellet_count as number) || 0,
          positivePelletCount: (user.positive_pellet_count as number) || 0,
          positiveRatingCount: (user.positive_rating_count as number) || 0,
          negativeRatingCount: (user.negative_rating_count as number) || 0,
          pelletsGivenCount: (user.pellets_given_count as number) || 0,
          positivePelletsGivenCount: (user.positive_pellets_given_count as number) || 0,
          negativePelletsGivenCount: (user.negative_pellets_given_count as number) || 0,
          badges: typeof user.badges === 'string' ? JSON.parse(user.badges) : (user.badges || []),
          exp: (user.experience as number) || 0,
          level: (user.level as number) || 1,
          adminRole: (user.role === 'user' ? null : user.role) as AdminRole,
        };
        
        console.log('[Login] Mapped user:', mappedUser.email, 'Level:', mappedUser.level, 'Exp:', mappedUser.exp);
        
        login(mappedUser);
        router.replace('/(tabs)/home' as any);
      } else {
        console.log('[Login] User not found:', email);
        setError('Invalid email - user not found');
      }
    } catch (error) {
      console.error('[Login] Error:', error);
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
            id="email"
            name="email"
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
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
