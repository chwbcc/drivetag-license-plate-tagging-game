import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { UserPlus } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Input from '@/components/Input';
import Button from '@/components/Button';
import useAuthStore from '@/store/auth-store';
import { trpcClient } from '@/lib/trpc';

// List of US states for dropdown
const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [state, setState] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const register = useAuthStore((state) => state.register);

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
      
      if (!email.includes('@')) {
        setError('Invalid email format');
        setIsLoading(false);
        return;
      }
      
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const result = await trpcClient.auth.register.mutate({
        id: userId,
        email,
        password,
        name: name || undefined,
        licensePlate: licensePlate.toUpperCase(),
        state,
      });
      
      if (result.success && result.user) {
        console.log('[Register] Registration successful, logging in user');
        
        const userWithPellets = {
          ...result.user,
          pelletCount: 10,
          positivePelletCount: 5,
        };
        
        await trpcClient.auth.syncUser.mutate({
          pelletCount: 10,
          positivePelletCount: 5,
        });
        
        register(userWithPellets);
        router.replace('/(tabs)');
      } else {
        console.log('[Register] Registration failed:', result.message);
        setError(result.message);
      }
    } catch (error) {
      console.error('[Register] Error during registration:', error);
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
              onPress={() => router.push('/')}
              style={styles.loginButton}
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
});