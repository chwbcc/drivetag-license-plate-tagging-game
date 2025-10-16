import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  Alert,
  TouchableOpacity,
  Modal,
  FlatList
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Target, ThumbsUp, ChevronDown } from 'lucide-react-native';
import * as Location from 'expo-location';
import Colors from '@/constants/colors';
import Input from '@/components/Input';
import Button from '@/components/Button';
import useAuthStore from '@/store/auth-store';
import usePelletStore from '@/store/pellet-store';
import useBadgeStore from '@/store/badge-store';

// Experience points awarded for different actions
const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC'
];

const EXP_REWARDS = {
  TAG_DRIVER: 25,
  POSITIVE_TAG: 30,
  LOCATION_BONUS: 5,
  DETAILED_REASON_BONUS: 10, // For longer, more detailed reasons
};

const NEGATIVE_REASONS = [
  'Cutting off other drivers',
  'Not using turn signals',
  'Tailgating',
  'Speeding',
  'Illegal parking',
  'Blocking traffic',
  'Running red light',
  'Texting while driving',
  'Other'
];

const POSITIVE_REASONS = [
  'Letting me merge',
  'Yielding right of way',
  'Courteous driving',
  'Helping in traffic',
  'Following rules',
  'Safe driving',
  'Proper signaling',
  'Patient driving',
  'Other'
];

export default function TagDriverScreen() {
  const params = useLocalSearchParams();
  const pelletType = (params.type as 'negative' | 'positive') || 'negative';
  
  const [licensePlate, setLicensePlate] = useState('');
  const [state, setState] = useState('');
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [reason, setReason] = useState('');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { user, removePellets, addExp } = useAuthStore();
  const { addPellet } = usePelletStore();
  const { checkAndAwardBadges } = useBadgeStore();
  
  const isPositive = pelletType === 'positive';
  const reasons = isPositive ? POSITIVE_REASONS : NEGATIVE_REASONS;
  
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const currentLocation = await Location.getCurrentPositionAsync({});
          setLocation(currentLocation);
        }
      } catch (err) {
        console.log('Error getting location:', err);
      }
    })();
  }, []);
  
  const validateLicensePlate = (plate: string) => {
    // This is a simple validation - in a real app, you'd want to validate based on your region's format
    return plate.length >= 3 && plate.length <= 8;
  };
  
  const handleSubmit = () => {
    if (!state) {
      setError('Please select a state');
      return;
    }
    
    if (!licensePlate) {
      setError('Please enter a license plate number');
      return;
    }
    
    if (!validateLicensePlate(licensePlate)) {
      setError('Please enter a valid license plate number');
      return;
    }
    
    if (!reason) {
      setError('Please provide a reason');
      return;
    }
    
    const fullLicensePlate = `${state}-${licensePlate.toUpperCase()}`;
    const userLicensePlateWithState = user?.state && !user.licensePlate.includes('-') 
      ? `${user.state}-${user.licensePlate}` 
      : user?.licensePlate;
    
    if (userLicensePlateWithState?.toLowerCase() === fullLicensePlate.toLowerCase()) {
      setError("You can't tag your own vehicle");
      return;
    }
    
    const pelletCount = isPositive 
      ? (user?.positivePelletCount || 0) 
      : (user?.pelletCount || 0);
    
    if (!user || pelletCount <= 0) {
      setError(`You don't have any ${isPositive ? 'positive' : 'negative'} pellets left. Purchase more in the shop.`);
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    // Create a new pellet
    const newPellet = {
      id: Date.now().toString(),
      targetLicensePlate: fullLicensePlate,
      createdBy: user?.id || 'anonymous',
      createdAt: Date.now(),
      reason,
      type: pelletType,
      location: location ? {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      } : undefined,
    };
    
    // Deduct a pellet from the user's count
    const success = removePellets(1, pelletType);
    
    if (success) {
      // Add the pellet to the store
      addPellet(newPellet);
      
      // Calculate and award experience points
      let expGained = isPositive ? EXP_REWARDS.POSITIVE_TAG : EXP_REWARDS.TAG_DRIVER;
      
      // Bonus for including location
      if (location) {
        expGained += EXP_REWARDS.LOCATION_BONUS;
      }
      
      // Bonus for detailed reason (more than 20 characters)
      if (reason.length > 20) {
        expGained += EXP_REWARDS.DETAILED_REASON_BONUS;
      }
      
      // Add experience to user
      const leveledUp = addExp(expGained);
      
      // Check for new badges
      if (user) {
        const newBadges = checkAndAwardBadges(user.id);
        
        if (newBadges.length > 0) {
          // Show badge notification after the tag success message
          setTimeout(() => {
            Alert.alert(
              'New Badges Earned!',
              `Congratulations! You've earned ${newBadges.length} new badge${newBadges.length > 1 ? 's' : ''}.`,
              [{ text: 'View', onPress: () => router.push('/(tabs)/badges') }]
            );
          }, 1000);
        }
      }
      
      // Show success message with exp gained
      Alert.alert(
        'Success',
        `Driver ${isPositive ? 'praised' : 'tagged'} successfully!\n\n+${expGained} EXP${leveledUp ? '\n\nLevel Up!' : ''}`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      setError(`Failed to use pellet. You may not have enough ${isPositive ? 'positive' : 'negative'} pellets.`);
    }
    
    setIsLoading(false);
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
          <View style={[
            styles.iconContainer,
            isPositive && styles.positiveIconContainer
          ]}>
            {isPositive ? (
              <ThumbsUp size={32} color={Colors.success} />
            ) : (
              <Target size={32} color={Colors.primary} />
            )}
          </View>
          <Text style={styles.title}>
            {isPositive ? 'Praise a Driver' : 'Tag a Driver'}
          </Text>
          <Text style={styles.subtitle}>
            {isPositive 
              ? 'Recognize courteous and safe driving' 
              : 'Report unsafe or inconsiderate driving'}
          </Text>
        </View>
        
        <View style={[
          styles.pelletInfo,
          isPositive && styles.positivePelletInfo
        ]}>
          <Text style={[
            styles.pelletInfoText,
            isPositive && styles.positivePelletInfoText
          ]}>
            {`This will use 1 ${isPositive ? 'positive' : 'negative'} pellet. You have ${isPositive ? user?.positivePelletCount || 0 : user?.pelletCount || 0} pellets remaining.`}
          </Text>
        </View>
        
        <View style={styles.expInfo}>
          <Text style={styles.expInfoTitle}>Experience Rewards:</Text>
          <Text style={styles.expInfoText}>• Base: +{isPositive ? EXP_REWARDS.POSITIVE_TAG : EXP_REWARDS.TAG_DRIVER} EXP</Text>
          <Text style={styles.expInfoText}>• Location Bonus: +{EXP_REWARDS.LOCATION_BONUS} EXP</Text>
          <Text style={styles.expInfoText}>• Detailed Reason: +{EXP_REWARDS.DETAILED_REASON_BONUS} EXP</Text>
        </View>
        
        <View style={styles.form}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>State *</Text>
            <TouchableOpacity
              style={styles.stateSelector}
              onPress={() => setShowStatePicker(true)}
            >
              <Text style={[styles.stateSelectorText, !state && styles.placeholderText]}>
                {state || 'Select State'}
              </Text>
              <ChevronDown size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <Input
            label="License Plate *"
            placeholder="Enter license plate number"
            value={licensePlate}
            onChangeText={(text) => setLicensePlate(text.toUpperCase())}
            autoCapitalize="characters"
          />
          
          <Input
            label="Reason"
            placeholder={`Why are you ${isPositive ? 'praising' : 'tagging'} this driver?`}
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={4}
            style={styles.reasonInput}
          />
          
          <View style={styles.reasonSuggestions}>
            <Text style={styles.suggestionsTitle}>Suggested reasons:</Text>
            <View style={styles.suggestionsContainer}>
              {reasons.map((item) => (
                <Button
                  key={item}
                  title={item}
                  variant="outline"
                  onPress={() => setReason(item)}
                  style={[
                    styles.suggestionButton,
                    isPositive && styles.positiveSuggestionButton
                  ]}
                  textStyle={[
                    styles.suggestionText,
                    isPositive && styles.positiveSuggestionText
                  ]}
                />
              ))}
            </View>
          </View>
          
          <View style={styles.locationInfo}>
            <Text style={styles.locationText}>
              {location ? '📍 Location will be recorded (+5 EXP)' : '📍 Location not available'}
            </Text>
          </View>
          
          <Button
            title={isPositive ? "Submit Praise" : "Submit Tag"}
            onPress={handleSubmit}
            loading={isLoading}
            style={[
              styles.submitButton,
              isPositive && styles.positiveSubmitButton
            ]}
            disabled={(isPositive ? (user?.positivePelletCount || 0) : (user?.pelletCount || 0)) <= 0}
          />
          
          <Button
            title="Cancel"
            variant="outline"
            onPress={() => router.back()}
            style={styles.cancelButton}
          />
        </View>
      </ScrollView>
      
      <Modal
        visible={showStatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select State</Text>
              <TouchableOpacity onPress={() => setShowStatePicker(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={US_STATES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.stateOption,
                    state === item && styles.stateOptionSelected
                  ]}
                  onPress={() => {
                    setState(item);
                    setShowStatePicker(false);
                  }}
                >
                  <Text style={[
                    styles.stateOptionText,
                    state === item && styles.stateOptionTextSelected
                  ]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
              numColumns={5}
              contentContainerStyle={styles.stateList}
            />
          </View>
        </View>
      </Modal>
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
    marginBottom: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  positiveIconContainer: {
    borderColor: Colors.success + '50',
    backgroundColor: Colors.success + '10',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  pelletInfo: {
    backgroundColor: Colors.primary + '15', // 15% opacity
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '30', // 30% opacity
  },
  positivePelletInfo: {
    backgroundColor: Colors.success + '15',
    borderColor: Colors.success + '30',
  },
  pelletInfoText: {
    fontSize: 14,
    color: Colors.primary,
    textAlign: 'center',
  },
  positivePelletInfoText: {
    color: Colors.success,
  },
  expInfo: {
    backgroundColor: Colors.secondary + '15',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.secondary + '30',
  },
  expInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 4,
  },
  expInfoText: {
    fontSize: 12,
    color: Colors.text,
    marginBottom: 2,
  },
  form: {
    width: '100%',
  },
  errorText: {
    color: Colors.error,
    marginBottom: 16,
    textAlign: 'center',
  },
  reasonInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  reasonSuggestions: {
    marginBottom: 24,
  },
  suggestionsTitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  positiveSuggestionButton: {
    borderColor: Colors.success,
  },
  suggestionText: {
    fontSize: 12,
  },
  positiveSuggestionText: {
    color: Colors.success,
  },
  locationInfo: {
    marginBottom: 24,
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  submitButton: {
    marginBottom: 12,
  },
  positiveSubmitButton: {
    backgroundColor: Colors.success,
  },
  cancelButton: {},
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  stateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 16,
  },
  stateSelectorText: {
    fontSize: 16,
    color: Colors.text,
  },
  placeholderText: {
    color: Colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  modalClose: {
    fontSize: 24,
    color: Colors.textSecondary,
  },
  stateList: {
    padding: 16,
  },
  stateOption: {
    flex: 1,
    margin: 4,
    padding: 12,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    minWidth: 60,
  },
  stateOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stateOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  stateOptionTextSelected: {
    color: '#FFFFFF',
  },
});