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
import { ThumbsUp, ThumbsDown, ChevronDown } from 'lucide-react-native';
import * as Location from 'expo-location';
import Colors from '@/constants/colors';
import Input from '@/components/Input';
import Button from '@/components/Button';
import useAuthStore from '@/store/auth-store';
import useBadgeStore from '@/store/badge-store';
import { supabase } from '@/utils/supabase';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { generatePelletId } from '@/utils/generate-id';

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
  DETAILED_REASON_BONUS: 10,
};

const EXP_LEVELS = [
  0, 100, 250, 500, 1000, 2000, 3500, 5000, 7500, 10000, 15000, 20000, 30000, 50000, 75000,
];

const calculateLevel = (exp: number): number => {
  let level = 1;
  for (let i = 1; i < EXP_LEVELS.length; i++) {
    if (exp >= EXP_LEVELS[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  return level;
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
  const initialPelletType = (params.type as 'negative' | 'positive') || 'negative';
  
  const [pelletType, setPelletType] = useState<'negative' | 'positive'>(initialPelletType);
  const [licensePlate, setLicensePlate] = useState('');
  const [state, setState] = useState('');
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [reason, setReason] = useState('');
  const [showReasonPicker, setShowReasonPicker] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { user: localUser, updateUser } = useAuthStore();
  const { checkAndAwardBadges } = useBadgeStore();
  const queryClient = useQueryClient();
  
  const { data: dbUserCounts } = useQuery({
    queryKey: ['userPelletCounts', localUser?.id],
    queryFn: async () => {
      if (!localUser?.id) return null;
      console.log('[TagDriver] Fetching current pellet counts from database');
      const { data, error } = await supabase
        .from('users')
        .select('negative_pellet_count, positive_pellet_count, experience, level, pellets_given_count, positive_pellets_given_count, negative_pellets_given_count')
        .eq('id', localUser.id)
        .single();
      
      if (error) {
        console.error('[TagDriver] Error fetching user counts:', error);
        throw error;
      }
      
      return {
        negativePelletCount: (data?.negative_pellet_count as number) || 0,
        positivePelletCount: (data?.positive_pellet_count as number) || 0,
        experience: (data?.experience as number) || 0,
        level: (data?.level as number) || 1,
        pelletsGivenCount: (data?.pellets_given_count as number) || 0,
        positivePelletsGivenCount: (data?.positive_pellets_given_count as number) || 0,
        negativePelletsGivenCount: (data?.negative_pellets_given_count as number) || 0,
      };
    },
    enabled: !!localUser?.id,
    staleTime: 5000,
  });
  
  const isPositive = pelletType === 'positive';
  const reasons = isPositive ? POSITIVE_REASONS : NEGATIVE_REASONS;
  
  const currentPelletCount = isPositive 
    ? (dbUserCounts?.positivePelletCount ?? localUser?.positivePelletCount ?? 0)
    : (dbUserCounts?.negativePelletCount ?? localUser?.pelletCount ?? 0);
  
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
    return plate.length >= 3 && plate.length <= 8;
  };
  
  const handleSubmit = async () => {
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
    const userLicensePlate = localUser?.licensePlate || '';
    const userLicensePlateWithState = localUser?.state && userLicensePlate && !userLicensePlate.includes('-') 
      ? `${localUser.state}-${userLicensePlate}` 
      : userLicensePlate;
    
    if (userLicensePlateWithState?.toLowerCase() === fullLicensePlate.toLowerCase()) {
      setError("You can't tag your own vehicle");
      return;
    }
    
    if (!localUser || currentPelletCount <= 0) {
      setError(`You don't have any ${isPositive ? 'positive' : 'negative'} pellets left. Purchase more in the shop.`);
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const pelletId = generatePelletId();
      const createdAt = Date.now();
      
      console.log('[TagDriver] Step 1: Looking up target user by license plate...');
      let targetUserId: string | null = null;
      try {
        const { data: targetUserData, error: userError } = await supabase
          .from('users')
          .select('id')
          .ilike('license_plate', fullLicensePlate.toLowerCase())
          .single();
        
        if (!userError && targetUserData) {
          targetUserId = targetUserData.id;
          console.log('[TagDriver] Found target user:', targetUserId);
        } else {
          console.log('[TagDriver] No user found for license plate:', fullLicensePlate);
        }
      } catch (err) {
        console.log('[TagDriver] Error looking up user by license plate:', err);
      }
      
      console.log('[TagDriver] Step 2: Creating pellet in database...');
      const { error: pelletError } = await supabase
        .from('pellets')
        .insert([{
          id: pelletId,
          license_plate: fullLicensePlate,
          targetuserid: targetUserId,
          created_by: localUser.id,
          created_at: createdAt,
          notes: reason,
          type: pelletType,
          latitude: location?.coords.latitude || null,
          longitude: location?.coords.longitude || null,
        }]);
      
      if (pelletError) {
        console.error('[TagDriver] Error creating pellet:', pelletError);
        throw new Error(`Failed to create pellet: ${pelletError.message}`);
      }
      console.log('[TagDriver] Pellet created successfully');
      
      console.log('[TagDriver] Step 3: Updating target user rating count...');
      if (targetUserId) {
        const ratingColumn = isPositive ? 'positive_rating_count' : 'negative_rating_count';
        
        const { data: targetUser, error: fetchError } = await supabase
          .from('users')
          .select('positive_rating_count, negative_rating_count')
          .eq('id', targetUserId)
          .single();
        
        if (!fetchError && targetUser) {
          const currentRatingCount = isPositive 
            ? ((targetUser.positive_rating_count as number) || 0)
            : ((targetUser.negative_rating_count as number) || 0);
          
          const { error: ratingUpdateError } = await supabase
            .from('users')
            .update({ [ratingColumn]: currentRatingCount + 1 })
            .eq('id', targetUserId);
          
          if (ratingUpdateError) {
            console.error('[TagDriver] Error updating target user rating:', ratingUpdateError);
          } else {
            console.log('[TagDriver] Target user rating updated successfully');
          }
        }
      }
      
      console.log('[TagDriver] Step 4: Updating tagger user stats...');
      let expGained = isPositive ? EXP_REWARDS.POSITIVE_TAG : EXP_REWARDS.TAG_DRIVER;
      if (location) {
        expGained += EXP_REWARDS.LOCATION_BONUS;
      }
      if (reason.length > 20) {
        expGained += EXP_REWARDS.DETAILED_REASON_BONUS;
      }
      
      const currentExp = dbUserCounts?.experience ?? localUser.exp ?? 0;
      const currentNegativePellets = dbUserCounts?.negativePelletCount ?? localUser.pelletCount ?? 0;
      const currentPositivePellets = dbUserCounts?.positivePelletCount ?? localUser.positivePelletCount ?? 0;
      const currentPelletsGiven = dbUserCounts?.pelletsGivenCount ?? 0;
      const currentPositiveGiven = dbUserCounts?.positivePelletsGivenCount ?? 0;
      const currentNegativeGiven = dbUserCounts?.negativePelletsGivenCount ?? 0;
      
      const newExp = currentExp + expGained;
      const newLevel = calculateLevel(newExp);
      const leveledUp = newLevel > (dbUserCounts?.level ?? localUser.level ?? 1);
      
      const updateData: Record<string, number> = {
        experience: newExp,
        level: newLevel,
        pellets_given_count: currentPelletsGiven + 1,
      };
      
      if (isPositive) {
        updateData.positive_pellet_count = Math.max(0, currentPositivePellets - 1);
        updateData.positive_pellets_given_count = currentPositiveGiven + 1;
      } else {
        updateData.negative_pellet_count = Math.max(0, currentNegativePellets - 1);
        updateData.negative_pellets_given_count = currentNegativeGiven + 1;
      }
      
      console.log('[TagDriver] Update data for tagger:', updateData);
      
      const { error: userUpdateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', localUser.id);
      
      if (userUpdateError) {
        console.error('[TagDriver] Error updating user stats:', userUpdateError);
        throw new Error(`Failed to update user stats: ${userUpdateError.message}`);
      }
      console.log('[TagDriver] User stats updated successfully');
      
      updateUser({
        pelletCount: isPositive ? currentNegativePellets : Math.max(0, currentNegativePellets - 1),
        positivePelletCount: isPositive ? Math.max(0, currentPositivePellets - 1) : currentPositivePellets,
        exp: newExp,
        level: newLevel,
        pelletsGivenCount: currentPelletsGiven + 1,
        positivePelletsGivenCount: isPositive ? currentPositiveGiven + 1 : currentPositiveGiven,
        negativePelletsGivenCount: isPositive ? currentNegativeGiven : currentNegativeGiven + 1,
      });
      
      console.log('[TagDriver] Step 5: Checking for new badges...');
      const newBadges = checkAndAwardBadges(localUser.id, {
        negativePelletsReceived: 0,
        positivePelletsReceived: 0,
        pelletsGiven: currentPelletsGiven + 1,
        positivePelletsGiven: isPositive ? currentPositiveGiven + 1 : currentPositiveGiven,
        expEarned: newExp,
      });
      
      if (newBadges.length > 0) {
        console.log('[TagDriver] New badges earned:', newBadges);
        const { data: userData } = await supabase
          .from('users')
          .select('badges')
          .eq('id', localUser.id)
          .single();
        
        const currentBadges = typeof userData?.badges === 'string' 
          ? JSON.parse(userData.badges) 
          : (userData?.badges || []);
        const updatedBadges = [...new Set([...currentBadges, ...newBadges])];
        
        await supabase
          .from('users')
          .update({ badges: JSON.stringify(updatedBadges) })
          .eq('id', localUser.id);
        
        setTimeout(() => {
          Alert.alert(
            'New Badges Earned!',
            `Congratulations! You've earned ${newBadges.length} new badge${newBadges.length > 1 ? 's' : ''}.`,
            [{ text: 'View', onPress: () => router.push('/(tabs)/badges') }]
          );
        }, 1000);
      }
      
      console.log('[TagDriver] Step 6: Invalidating queries...');
      await queryClient.invalidateQueries({ queryKey: ['pellets'] });
      await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      await queryClient.invalidateQueries({ queryKey: ['userStats'] });
      await queryClient.invalidateQueries({ queryKey: ['userPelletCounts'] });
      await queryClient.invalidateQueries({ queryKey: ['userCounts'] });
      await queryClient.invalidateQueries({ queryKey: ['pelletsActivity'] });
      await queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      
      console.log('[TagDriver] Tag submitted successfully!');
      
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
    } catch (error: any) {
      console.error('[TagDriver] Error submitting tag:', error);
      const errorMessage = error?.message || 'Failed to submit tag. Please try again.';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
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
          <View style={[
            styles.iconContainer,
            isPositive && styles.positiveIconContainer
          ]}>
            {isPositive ? (
              <ThumbsUp size={32} color={Colors.success} />
            ) : (
              <ThumbsDown size={32} color={Colors.error} />
            )}
          </View>
          <Text style={styles.title}>Tag a Driver</Text>
          <Text style={styles.subtitle}>
            Report driver behavior - positive or negative
          </Text>
        </View>
        
        <View style={styles.feedbackTypeContainer}>
          <TouchableOpacity
            style={[
              styles.feedbackTypeButton,
              !isPositive && styles.feedbackTypeButtonActive,
            ]}
            onPress={() => {
              setPelletType('negative');
              setReason('');
            }}
          >
            <ThumbsDown size={20} color={!isPositive ? '#FFFFFF' : Colors.error} />
            <Text style={[
              styles.feedbackTypeText,
              !isPositive && styles.feedbackTypeTextActive,
            ]}>
              Negative
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.feedbackTypeButton,
              isPositive && styles.feedbackTypeButtonActive,
              isPositive && styles.positiveFeedbackTypeButton,
            ]}
            onPress={() => {
              setPelletType('positive');
              setReason('');
            }}
          >
            <ThumbsUp size={20} color={isPositive ? '#FFFFFF' : Colors.success} />
            <Text style={[
              styles.feedbackTypeText,
              isPositive && styles.feedbackTypeTextActive,
            ]}>
              Positive
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={[
          styles.pelletInfo,
          isPositive && styles.positivePelletInfo
        ]}>
          <Text style={[
            styles.pelletInfoText,
            isPositive && styles.positivePelletInfoText
          ]}>
            This will use 1 {isPositive ? 'positive' : 'negative'} pellet. You have {currentPelletCount} pellets remaining.
          </Text>
        </View>
        
        <View style={styles.form}>
          {Boolean(error) && <Text style={styles.errorText}>{error}</Text>}
          
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
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Reason *</Text>
            <TouchableOpacity
              style={styles.reasonSelector}
              onPress={() => setShowReasonPicker(true)}
            >
              <Text style={[styles.reasonSelectorText, !reason && styles.placeholderText]}>
                {reason || `Select ${isPositive ? 'positive' : 'negative'} feedback`}
              </Text>
              <ChevronDown size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.expInfo}>
            <Text style={styles.expInfoTitle}>Experience Rewards:</Text>
            <Text style={styles.expInfoText}>• Base: +{isPositive ? EXP_REWARDS.POSITIVE_TAG : EXP_REWARDS.TAG_DRIVER} EXP</Text>
            <Text style={styles.expInfoText}>• Location Bonus: +{EXP_REWARDS.LOCATION_BONUS} EXP {location ? '✓' : '✗'}</Text>
          </View>
          
          {currentPelletCount <= 0 && (
            <View style={styles.noPelletsNotice}>
              <Text style={styles.noPelletsText}>
                You don&apos;t have any {isPositive ? 'positive' : 'negative'} pellets.
              </Text>
              <TouchableOpacity
                style={styles.goToShopButton}
                onPress={() => router.push('/(tabs)/shop')}
              >
                <Text style={styles.goToShopText}>Go to Shop</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <Button
            title={isPositive ? "Submit Praise" : "Submit Tag"}
            onPress={handleSubmit}
            loading={isLoading}
            style={[
              styles.submitButton,
              isPositive && styles.positiveSubmitButton
            ]}
            disabled={currentPelletCount <= 0}
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
      
      <Modal
        visible={showReasonPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReasonPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Select {isPositive ? 'Positive' : 'Negative'} Feedback
              </Text>
              <TouchableOpacity onPress={() => setShowReasonPicker(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.reasonList}>
              {reasons.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.reasonOption,
                    reason === item && styles.reasonOptionSelected,
                    reason === item && isPositive && styles.reasonOptionSelectedPositive,
                  ]}
                  onPress={() => {
                    setReason(item);
                    setShowReasonPicker(false);
                  }}
                >
                  <Text style={[
                    styles.reasonOptionText,
                    reason === item && styles.reasonOptionTextSelected
                  ]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
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
    backgroundColor: Colors.primary + '15',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
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
  feedbackTypeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  feedbackTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.error,
  },
  positiveFeedbackTypeButton: {
    borderColor: Colors.success,
  },
  feedbackTypeButtonActive: {
    backgroundColor: Colors.error,
    borderColor: Colors.error,
  },
  feedbackTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.error,
  },
  feedbackTypeTextActive: {
    color: '#FFFFFF',
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
  reasonSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 16,
    minHeight: 56,
  },
  reasonSelectorText: {
    fontSize: 16,
    color: Colors.text,
    flex: 1,
    marginRight: 8,
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
  reasonList: {
    padding: 16,
  },
  reasonOption: {
    padding: 16,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  reasonOptionSelected: {
    backgroundColor: Colors.error,
    borderColor: Colors.error,
  },
  reasonOptionSelectedPositive: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  reasonOptionText: {
    fontSize: 16,
    color: Colors.text,
  },
  reasonOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  noPelletsNotice: {
    backgroundColor: Colors.primary + '15',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    alignItems: 'center',
  },
  noPelletsText: {
    fontSize: 14,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  goToShopButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  goToShopText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
