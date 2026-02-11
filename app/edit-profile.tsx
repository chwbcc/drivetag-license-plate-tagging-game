import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  Alert,
  Image,
  TouchableOpacity,
  Switch
} from 'react-native';
import { router, Stack } from 'expo-router';
import { Camera, Save, X, Moon, Sun, Lock, Eye, EyeOff } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import Colors from '@/constants/colors';
import Input from '@/components/Input';
import Button from '@/components/Button';
import useAuthStore from '@/store/auth-store';
import { supabase } from '@/utils/supabase';
import { hashPassword } from '@/utils/hash';
import { useTheme } from '@/store/theme-store';
import { darkMode } from '@/constants/styles';

export default function EditProfileScreen() {
  const { user, updateUser, changeLicensePlate } = useAuthStore();
  const { isDark, toggleTheme } = useTheme();
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [photo, setPhoto] = useState(user?.photo || '');
  const [newLicensePlate, setNewLicensePlate] = useState('');
  const [state, setState] = useState(user?.state || '');
  const [error, setError] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const validateLicensePlate = (plate: string) => {
    // This is a simple validation - in a real app, you'd want to validate based on your region's format
    return plate.length >= 3 && plate.length <= 8;
  };
  
  const handleSave = () => {
    if (!email) {
      setError('Email is required');
      return;
    }
    
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    
    // Update user profile
    updateUser({
      name,
      email,
      photo,
      state
    });
    
    // If license plate was changed, update it too
    if (newLicensePlate && validateLicensePlate(newLicensePlate) && 
        (user?.licensePlate.toLowerCase() !== newLicensePlate.toLowerCase() || 
         user?.state !== state)) {
      changeLicensePlate(newLicensePlate.toUpperCase(), state);
    }
    
    Alert.alert('Success', 'Profile updated successfully!', [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      setPasswordError('Please enter your current password');
      return;
    }
    if (!newPassword) {
      setPasswordError('Please enter a new password');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordError('New password must be different from current password');
      return;
    }

    setIsChangingPassword(true);
    try {
      const currentHash = await hashPassword(currentPassword);
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('password_hash')
        .eq('id', user?.id)
        .single();

      if (fetchError || !userData) {
        setPasswordError('Unable to verify current password. Please try again.');
        setIsChangingPassword(false);
        return;
      }

      if (userData.password_hash !== currentHash) {
        setPasswordError('Current password is incorrect');
        setIsChangingPassword(false);
        return;
      }

      const newHash = await hashPassword(newPassword);
      const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash: newHash })
        .eq('id', user?.id);

      if (updateError) {
        setPasswordError('Failed to update password. Please try again.');
        setIsChangingPassword(false);
        return;
      }

      setPasswordSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (err) {
      console.log('[EditProfile] Password change error:', err);
      setPasswordError('An error occurred. Please try again.');
    } finally {
      setIsChangingPassword(false);
    }
  };
  
  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to select a profile picture.');
        return;
      }
      
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.log('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };
  
  const removePhoto = () => {
    setPhoto('');
  };
  


  const bgColor = isDark ? darkMode.background : Colors.background;
  const cardColor = isDark ? darkMode.card : Colors.card;
  const textColor = isDark ? darkMode.text : Colors.text;
  const textSecondary = isDark ? darkMode.textSecondary : Colors.textSecondary;
  const borderColor = isDark ? darkMode.border : Colors.border;

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Edit Profile',
          headerRight: () => (
            <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
              <Save size={20} color={Colors.primary} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: bgColor }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 40}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.settingsSection, { backgroundColor: cardColor, borderColor }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconContainer, { backgroundColor: isDark ? '#3a3a4f' : Colors.primary + '20' }]}>
                  {isDark ? (
                    <Moon size={20} color={Colors.primary} />
                  ) : (
                    <Sun size={20} color={Colors.primary} />
                  )}
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingTitle, { color: textColor }]}>Dark Mode</Text>
                  <Text style={[styles.settingSubtitle, { color: textSecondary }]}>
                    {isDark ? 'Dark theme enabled' : 'Light theme enabled'}
                  </Text>
                </View>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: '#767577', true: Colors.primary + '60' }}
                thumbColor={isDark ? Colors.primary : '#f4f3f4'}
                ios_backgroundColor="#767577"
              />
            </View>
          </View>

          <View style={styles.photoContainer}>
            {photo ? (
              <View style={styles.photoWrapper}>
                <Image source={{ uri: photo }} style={styles.photo} />
                <TouchableOpacity style={styles.removePhotoButton} onPress={removePhoto}>
                  <X size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.photoPlaceholder, { backgroundColor: Colors.primary }]}>
                <Text style={[styles.photoPlaceholderText, { color: '#fff' }]}>
                  {name ? name.charAt(0).toUpperCase() : 
                   email ? email.charAt(0).toUpperCase() : '?'}
                </Text>
              </View>
            )}
            
            <Button
              title="Change Photo"
              variant="outline"
              onPress={pickImage}
              style={styles.photoButton}
              icon={Camera}
            />
          </View>
          
          {Boolean(error) && <Text style={[styles.errorText, { color: Colors.error }]}>{error}</Text>}
          
          <View style={styles.form}>
            <Input
              id="name"
              name="name"
              label="Name"
              placeholder="Enter your name"
              value={name}
              onChangeText={setName}
              autoComplete="name"
            />
            
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
            
            <View style={styles.currentPlateContainer}>
              <Text style={[styles.currentPlateLabel, { color: textSecondary }]}>Current License Plate:</Text>
              <Text style={[styles.currentPlateValue, { color: textColor }]}>
                {user?.licensePlate || 'N/A'}{user?.state ? ` (${user.state})` : ''}
              </Text>
            </View>
            
            <View style={[styles.divider, { backgroundColor: borderColor }]} />
            
            <Text style={[styles.sectionTitle, { color: textColor }]}>Update License Plate</Text>
            <Text style={[styles.sectionSubtitle, { color: textSecondary }]}>
              You can update your license plate information here
            </Text>
            
            <Input
              id="newLicensePlate"
              name="newLicensePlate"
              label="New License Plate"
              placeholder="Enter new license plate"
              value={newLicensePlate}
              onChangeText={(text) => setNewLicensePlate(text.toUpperCase())}
              autoCapitalize="characters"
            />
            
            <Input
              id="state"
              name="state"
              label="State"
              placeholder="Select state (e.g., CA, NY)"
              value={state}
              onChangeText={(text) => setState(text.toUpperCase())}
              autoCapitalize="characters"
              maxLength={2}
            />

          </View>

          <View style={[styles.divider, { backgroundColor: borderColor }]} />

          <View style={styles.form}>
            <View style={styles.passwordSectionHeader}>
              <View style={[styles.passwordIconContainer, { backgroundColor: isDark ? '#3a3a4f' : '#FFF3E0' }]}> 
                <Lock size={20} color="#F57C00" />
              </View>
              <View style={styles.passwordHeaderText}>
                <Text style={[styles.sectionTitle, { color: textColor, marginBottom: 0 }]}>Change Password</Text>
                <Text style={[styles.sectionSubtitle, { color: textSecondary, marginBottom: 0 }]}>Update your account password</Text>
              </View>
            </View>

            {Boolean(passwordError) && (
              <View style={[styles.passwordMessage, { backgroundColor: '#FFEBEE' }]}>
                <Text style={styles.passwordErrorText}>{passwordError}</Text>
              </View>
            )}
            {Boolean(passwordSuccess) && (
              <View style={[styles.passwordMessage, { backgroundColor: '#E8F5E9' }]}>
                <Text style={styles.passwordSuccessText}>{passwordSuccess}</Text>
              </View>
            )}

            <View style={styles.passwordInputWrapper}>
              <Input
                id="currentPassword"
                name="currentPassword"
                label="Current Password"
                placeholder="Enter current password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={!showCurrentPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? (
                  <EyeOff size={18} color={textSecondary} />
                ) : (
                  <Eye size={18} color={textSecondary} />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.passwordInputWrapper}>
              <Input
                id="newPassword"
                name="newPassword"
                label="New Password"
                placeholder="Enter new password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOff size={18} color={textSecondary} />
                ) : (
                  <Eye size={18} color={textSecondary} />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.passwordInputWrapper}>
              <Input
                id="confirmNewPassword"
                name="confirmNewPassword"
                label="Confirm New Password"
                placeholder="Confirm new password"
                value={confirmNewPassword}
                onChangeText={setConfirmNewPassword}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff size={18} color={textSecondary} />
                ) : (
                  <Eye size={18} color={textSecondary} />
                )}
              </TouchableOpacity>
            </View>

            <Button
              title={isChangingPassword ? 'Updating...' : 'Update Password'}
              onPress={handleChangePassword}
              disabled={isChangingPassword}
              style={styles.changePasswordButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  settingsSection: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
  },
  saveButton: {
    padding: 8,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  photoWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  removePhotoButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: Colors.error,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  photoPlaceholderText: {
    fontSize: 36,
    fontWeight: 'bold' as const,
  },
  photoButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  errorText: {
    marginBottom: 16,
    textAlign: 'center' as const,
  },
  form: {
    width: '100%',
  },
  currentPlateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  currentPlateLabel: {
    fontSize: 14,
    marginRight: 4,
  },
  currentPlateValue: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  divider: {
    height: 1,
    marginVertical: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  changePasswordButton: {
    marginTop: 12,
    marginBottom: 32,
  },
  passwordSectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  passwordIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 12,
  },
  passwordHeaderText: {
    flex: 1,
  },
  passwordMessage: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  passwordErrorText: {
    color: '#D32F2F',
    fontSize: 13,
    fontWeight: '500' as const,
  },
  passwordSuccessText: {
    color: '#2E7D32',
    fontSize: 13,
    fontWeight: '500' as const,
  },
  passwordInputWrapper: {
    position: 'relative' as const,
  },
  eyeButton: {
    position: 'absolute' as const,
    right: 12,
    top: 34,
    padding: 4,
  }
});