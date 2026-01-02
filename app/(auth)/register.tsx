import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router, Link } from 'expo-router';

import Colors from '@/constants/colors';
import Input from '@/components/Input';
import Button from '@/components/Button';
import useAuthStore from '@/store/auth-store';
import { supabase } from '@/utils/supabase';
import { hashPassword } from '@/utils/hash';



export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [state, setState] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [backendUrl, setBackendUrl] = useState<string>('');
  
  const register = useAuthStore((state) => state.register);

  React.useEffect(() => {
    const url = process.env.EXPO_PUBLIC_RORK_API_BASE_URL || 'Not configured';
    setBackendUrl(url);
    console.log('[Register] Backend URL from env:', url);
  }, []);

  const validateLicensePlate = (plate: string) => {
    // This is a simple validation - in a real app, you'd want to validate based on your region's format
    return plate.length >= 3 && plate.length <= 8;
  };

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword || !licensePlate) {
      setError('Please fill in all required fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (!validateLicensePlate(licensePlate)) {
      setError('Please enter a valid license plate number');
      return;
    }
    
    if (!state) {
      setError('Please select a state for your license plate');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      console.log('[Register] Attempting registration for:', email);
      console.log('[Register] Backend URL:', process.env.EXPO_PUBLIC_RORK_API_BASE_URL);
      
      if (!email.includes('@')) {
        setError('Invalid email format');
        setIsLoading(false);
        return;
      }
      
      const passwordHash = await hashPassword(password);
      
      console.log('[Register] Checking if user already exists...');
      const { data: existingUser } = await supabase
        .from('user_roles')
        .select('email')
        .eq('email', email.toLowerCase())
        .single();
      
      if (existingUser) {
        setError('An account with this email already exists');
        setIsLoading(false);
        return;
      }
      
      console.log('[Register] Creating user in Supabase...');
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const stats = JSON.stringify({
        pelletCount: 10,
        positivePelletCount: 5,
        badges: [],
        exp: 0,
        level: 1,
        name: name || 'Anonymous',
        photo: null,
        licensePlate: licensePlate.toUpperCase(),
        state,
      });
      
      console.log('[Register] Inserting into user_roles...');
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert([{
          id: userId,
          email: email.toLowerCase(),
          role: 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }]);
      
      if (roleError) {
        console.error('[Register] Error creating user role:', roleError);
        throw roleError;
      }
      
      console.log('[Register] Inserting into users...');
      const { data, error } = await supabase
        .from('users')
        .insert([{
          id: userId,
          email: email.toLowerCase(),
          username: name || 'Anonymous',
          passwordHash: passwordHash,
          created_at: Date.now(),
          stats,
          role: 'user',
          licensePlate: licensePlate.toUpperCase(),
          state,
        }])
        .select()
        .single();
      
      if (error) {
        console.error('[Register] Supabase error:', error);
        await supabase.from('user_roles').delete().eq('id', userId);
        throw error;
      }
      
      console.log('[Register] Registration successful');
      
      const userStats = JSON.parse(data.stats as string);
      
      const newUser = {
        id: data.id,
        email: data.email,
        name: userStats.name || '',
        licensePlate: data.licensePlate || userStats.licensePlate || '',
        state: data.state || userStats.state || '',
        pelletCount: userStats.pelletCount || 10,
        positivePelletCount: userStats.positivePelletCount || 5,
        badges: userStats.badges || [],
        exp: userStats.exp || 0,
        level: userStats.level || 1,
        adminRole: data.role === 'user' ? null : data.role,
      };
      
      register(newUser);
      router.replace('/(tabs)/home');
    } catch (error: any) {
      console.error('[Register] Error during registration:', error);
      console.error('[Register] Error details:', {
        message: error?.message,
        cause: error?.cause,
        stack: error?.stack,
        data: error?.data,
      });
      
      let errorMessage = error?.message || 'An error occurred. Please try again.';
      
      if (errorMessage.includes('Failed to fetch')) {
        errorMessage = `Cannot connect to backend server.\n\nBackend URL: ${backendUrl || 'Not configured'}\n\nPlease ensure:\n1. Backend server is running\n2. URL is correct\n3. No network issues`;
      }
      
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
            <Text style={styles.logoEmoji}>🎯</Text>
          </View>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join the community of responsible drivers</Text>
        </View>
        
        <View style={styles.form}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          
          <Input
            label="Name"
            placeholder="Enter your name"
            value={name}
            onChangeText={setName}
          />
          
          <Input
            label="Email *"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          
          <Input
            label="License Plate *"
            placeholder="Enter your license plate"
            value={licensePlate}
            onChangeText={(text) => setLicensePlate(text.toUpperCase())}
            autoCapitalize="characters"
          />
          
          <Input
            label="State *"
            placeholder="Enter state (e.g., CA, NY)"
            value={state}
            onChangeText={(text) => setState(text.toUpperCase())}
            autoCapitalize="characters"
            maxLength={2}
          />
          
          <Input
            label="Password *"
            placeholder="Create a password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          
          <Input
            label="Confirm Password *"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
          
          <Button
            title="Create Account"
            onPress={handleRegister}
            loading={isLoading}
            style={styles.button}
          />
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <Button
              title="Login"
              variant="outline"
              onPress={() => router.push('/(auth)')}
              style={styles.loginButton}
            />
          </View>
          
          <View style={styles.freeInfo}>
            <Text style={styles.freeInfoText}>
              New users get 10 negative pellets and 5 positive pellets to start tagging!
            </Text>
          </View>
          
          {error.includes('Cannot connect') && (
            <View style={styles.debugInfo}>
              <Text style={styles.debugText}>Backend URL:</Text>
              <Text style={styles.debugUrl}>{backendUrl}</Text>
              <Link href="/backend-status" asChild>
                <Button
                  title="Check Backend Status"
                  variant="outline"
                  style={styles.debugButton}
                />
              </Link>
              <Link href="/connection-test" asChild>
                <Button
                  title="Test Connection"
                  variant="outline"
                  style={[styles.debugButton, { marginTop: 8 }]}
                />
              </Link>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    backgroundColor: Colors.secondary,
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
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  errorText: {
    color: Colors.error,
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
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  loginButton: {
    width: '100%',
  },
  freeInfo: {
    marginTop: 32,
    padding: 16,
    backgroundColor: Colors.success + '15', // 15% opacity
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.success + '30', // 30% opacity
  },
  freeInfoText: {
    fontSize: 14,
    color: Colors.success,
    textAlign: 'center',
    fontWeight: '500',
  },
  debugInfo: {
    marginTop: 16,
    alignItems: 'center',
  },
  debugText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  debugButton: {
    width: '100%',
  },
  debugUrl: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 12,
    padding: 8,
    backgroundColor: Colors.card,
    borderRadius: 4,
  },
});