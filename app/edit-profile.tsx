import React, { useState, useEffect } from 'react';
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
import { Camera, Save, X, Moon, Sun } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import Colors from '@/constants/colors';
import Input from '@/components/Input';
import Button from '@/components/Button';
import useAuthStore from '@/store/auth-store';
import { useTheme } from '@/store/theme-store';
import { darkMode } from '@/constants/styles';

// List of US states for dropdown
const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

export default function EditProfileScreen() {
  const { user, updateUser, changeLicensePlate } = useAuthStore();
  const { isDark, toggleTheme } = useTheme();
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [photo, setPhoto] = useState(user?.photo || '');
  const [newLicensePlate, setNewLicensePlate] = useState('');
  const [state, setState] = useState(user?.state || '');
  const [error, setError] = useState('');
  
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
              icon={<Camera size={16} color={Colors.primary} style={{ marginRight: 8 }} />}
            />
          </View>
          
          {error ? <Text style={[styles.errorText, { color: Colors.error }]}>{error}</Text> : null}
          
          <View style={styles.form}>
            <Input
              label="Name"
              placeholder="Enter your name"
              value={name}
              onChangeText={setName}
            />
            
            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            
            <View style={styles.currentPlateContainer}>
              <Text style={[styles.currentPlateLabel, { color: textSecondary }]}>Current License Plate:</Text>
              <Text style={[styles.currentPlateValue, { color: textColor }]}>
                {user?.licensePlate || 'N/A'} {user?.state ? `(${user.state})` : ''}
              </Text>
            </View>
            
            <View style={[styles.divider, { backgroundColor: borderColor }]} />
            
            <Text style={[styles.sectionTitle, { color: textColor }]}>Update License Plate</Text>
            <Text style={[styles.sectionSubtitle, { color: textSecondary }]}>
              You can update your license plate information here
            </Text>
            
            <Input
              label="New License Plate"
              placeholder="Enter new license plate"
              value={newLicensePlate}
              onChangeText={(text) => setNewLicensePlate(text.toUpperCase())}
              autoCapitalize="characters"
            />
            
            <Input
              label="State"
              placeholder="Select state (e.g., CA, NY)"
              value={state}
              onChangeText={(text) => setState(text.toUpperCase())}
              autoCapitalize="characters"
              maxLength={2}
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
  }
});