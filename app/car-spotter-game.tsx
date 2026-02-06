import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
  FlatList,
} from 'react-native';
import { Car, Trophy, RotateCcw, ChevronLeft, Plus, ChevronDown } from 'lucide-react-native';
import { Stack, router } from 'expo-router';
import Colors from '@/constants/colors';
import { useCarSpotterGame } from '@/store/car-spotter-game-store';
import { useTheme } from '@/store/theme-store';
import { darkMode } from '@/constants/styles';
import Button from '@/components/Button';

export default function CarSpotterGameScreen() {
  const { isDark } = useTheme();
  const {
    spottedCars,
    carMakes,
    yearRanges,
    spotCar,
    unspotCar,
    resetGame,
    getSpottedCount,
    getProgress,
    getSpottedCarsByMake,
    totalCars,
  } = useCarSpotterGame();

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [showMakePicker, setShowMakePicker] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);

  const handleResetGame = () => {
    Alert.alert(
      'Reset Game',
      'Are you sure you want to reset all spotted cars? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: resetGame,
        },
      ]
    );
  };

  const handleAddCar = () => {
    if (!selectedMake || !selectedModel || !selectedYear) {
      Alert.alert('Error', 'Please select make, model, and year range');
      return;
    }

    spotCar(selectedMake, selectedModel, selectedYear);
    setShowAddModal(false);
    setSelectedMake('');
    setSelectedModel('');
    setSelectedYear('');
  };

  const handleRemoveCar = (carId: string, make: string, model: string, year: string) => {
    Alert.alert(
      'Remove Car',
      `Remove ${make} ${model} (${year}) from spotted cars?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => unspotCar(carId),
        },
      ]
    );
  };

  const bgColor = isDark ? darkMode.background : Colors.background;
  const cardColor = isDark ? darkMode.card : Colors.card;
  const textColor = isDark ? darkMode.text : Colors.text;
  const textSecondary = isDark ? darkMode.textSecondary : Colors.textSecondary;
  const borderColor = isDark ? darkMode.border : Colors.border;

  const spottedCarsByMake = getSpottedCarsByMake();
  const spottedCarsArray = Object.values(spottedCars).sort((a, b) => b.spottedAt - a.spottedAt);

  const availableModels = selectedMake
    ? carMakes.find((m) => m.name === selectedMake)?.models || []
    : [];

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <Stack.Screen
        options={{
          title: 'Car Spotter',
          headerStyle: {
            backgroundColor: bgColor,
          },
          headerTintColor: textColor,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 8 }}>
              <ChevronLeft size={28} color={textColor} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]}>Car Spotter</Text>
          <TouchableOpacity
            onPress={handleResetGame}
            style={[styles.resetButton, { backgroundColor: cardColor, borderColor }]}
          >
            <RotateCcw size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.statsCard, { backgroundColor: cardColor }]}>
          <View style={styles.statItem}>
            <Car size={24} color={Colors.success} />
            <Text style={[styles.statValue, { color: textColor }]}>{getSpottedCount()}</Text>
            <Text style={[styles.statLabel, { color: textSecondary }]}>Cars Spotted</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Trophy size={24} color={Colors.secondary} />
            <Text style={[styles.statValue, { color: textColor }]}>
              {getProgress().toFixed(1)}%
            </Text>
            <Text style={[styles.statLabel, { color: textSecondary }]}>Progress</Text>
          </View>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${getProgress()}%`, backgroundColor: Colors.success },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: textSecondary }]}>
            {getSpottedCount()} of {totalCars} possible combinations
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: Colors.success }]}
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={20} color="#fff" />
          <Text style={styles.addButtonText}>Spot a Car</Text>
        </TouchableOpacity>

        {Object.keys(spottedCarsByMake).length > 0 && (
          <View style={[styles.makeStatsCard, { backgroundColor: cardColor }]}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Spotted by Make</Text>
            <View style={styles.makeStatsList}>
              {Object.entries(spottedCarsByMake)
                .sort(([, a], [, b]) => b - a)
                .map(([make, count]) => (
                  <View key={make} style={styles.makeStatRow}>
                    <Text style={[styles.makeStatName, { color: textColor }]}>{make}</Text>
                    <Text style={[styles.makeStatCount, { color: textSecondary }]}>
                      {count}
                    </Text>
                  </View>
                ))}
            </View>
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: textColor, marginTop: 8 }]}>
          Recently Spotted
        </Text>
        {spottedCarsArray.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: cardColor }]}>
            <Car size={48} color={textSecondary} />
            <Text style={[styles.emptyStateText, { color: textSecondary }]}>
              No cars spotted yet
            </Text>
            <Text style={[styles.emptyStateSubtext, { color: textSecondary }]}>
              Tap &quot;Spot a Car&quot; to start tracking
            </Text>
          </View>
        ) : (
          <View style={styles.carsList}>
            {spottedCarsArray.map((car) => (
              <TouchableOpacity
                key={car.id}
                style={[styles.carCard, { backgroundColor: cardColor, borderColor }]}
                onPress={() => handleRemoveCar(car.id, car.make, car.model, car.year)}
                activeOpacity={0.7}
              >
                <View style={styles.carCardContent}>
                  <View style={styles.carInfo}>
                    <Text style={[styles.carMake, { color: textColor }]}>{car.make}</Text>
                    <Text style={[styles.carModel, { color: textSecondary }]}>{car.model}</Text>
                    <Text style={[styles.carYear, { color: textSecondary }]}>{car.year}</Text>
                  </View>
                  {car.count > 1 && (
                    <View style={styles.countBadge}>
                      <Text style={styles.countText}>×{car.count}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardColor }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textColor }]}>Spot a Car</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={[styles.modalClose, { color: textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={[styles.inputLabel, { color: textColor }]}>Make *</Text>
              <TouchableOpacity
                style={[styles.picker, { backgroundColor: bgColor, borderColor }]}
                onPress={() => setShowMakePicker(true)}
              >
                <Text style={[styles.pickerText, { color: selectedMake ? textColor : textSecondary }]}>
                  {selectedMake || 'Select Make'}
                </Text>
                <ChevronDown size={20} color={textSecondary} />
              </TouchableOpacity>

              <Text style={[styles.inputLabel, { color: textColor }]}>Model *</Text>
              <TouchableOpacity
                style={[styles.picker, { backgroundColor: bgColor, borderColor }]}
                onPress={() => {
                  if (!selectedMake) {
                    Alert.alert('Error', 'Please select a make first');
                    return;
                  }
                  setShowModelPicker(true);
                }}
              >
                <Text style={[styles.pickerText, { color: selectedModel ? textColor : textSecondary }]}>
                  {selectedModel || 'Select Model'}
                </Text>
                <ChevronDown size={20} color={textSecondary} />
              </TouchableOpacity>

              <Text style={[styles.inputLabel, { color: textColor }]}>Year Range *</Text>
              <TouchableOpacity
                style={[styles.picker, { backgroundColor: bgColor, borderColor }]}
                onPress={() => setShowYearPicker(true)}
              >
                <Text style={[styles.pickerText, { color: selectedYear ? textColor : textSecondary }]}>
                  {selectedYear || 'Select Year Range'}
                </Text>
                <ChevronDown size={20} color={textSecondary} />
              </TouchableOpacity>

              <Button
                title="Add Car"
                onPress={handleAddCar}
                style={[styles.submitButton, { backgroundColor: Colors.success }]}
              />
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setShowAddModal(false)}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showMakePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMakePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.pickerModal, { backgroundColor: cardColor }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textColor }]}>Select Make</Text>
              <TouchableOpacity onPress={() => setShowMakePicker(false)}>
                <Text style={[styles.modalClose, { color: textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={carMakes}
              keyExtractor={(item) => item.name}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.pickerItem,
                    { backgroundColor: bgColor },
                    selectedMake === item.name && { backgroundColor: Colors.success + '20' },
                  ]}
                  onPress={() => {
                    setSelectedMake(item.name);
                    setSelectedModel('');
                    setShowMakePicker(false);
                  }}
                >
                  <Text style={[styles.pickerItemText, { color: textColor }]}>{item.name}</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.pickerList}
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={showModelPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModelPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.pickerModal, { backgroundColor: cardColor }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textColor }]}>Select Model</Text>
              <TouchableOpacity onPress={() => setShowModelPicker(false)}>
                <Text style={[styles.modalClose, { color: textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={availableModels}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.pickerItem,
                    { backgroundColor: bgColor },
                    selectedModel === item && { backgroundColor: Colors.success + '20' },
                  ]}
                  onPress={() => {
                    setSelectedModel(item);
                    setShowModelPicker(false);
                  }}
                >
                  <Text style={[styles.pickerItemText, { color: textColor }]}>{item}</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.pickerList}
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={showYearPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowYearPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.pickerModal, { backgroundColor: cardColor }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textColor }]}>Select Year Range</Text>
              <TouchableOpacity onPress={() => setShowYearPicker(false)}>
                <Text style={[styles.modalClose, { color: textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={yearRanges}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.pickerItem,
                    { backgroundColor: bgColor },
                    selectedYear === item && { backgroundColor: Colors.success + '20' },
                  ]}
                  onPress={() => {
                    setSelectedYear(item);
                    setShowYearPicker(false);
                  }}
                >
                  <Text style={[styles.pickerItemText, { color: textColor }]}>{item}</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.pickerList}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold' as const,
    flex: 1,
  },
  resetButton: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  statsCard: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    marginTop: 6,
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  progressBarContainer: {
    marginBottom: 14,
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressText: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 6,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold' as const,
  },
  makeStatsCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    marginBottom: 10,
  },
  makeStatsList: {
    gap: 8,
  },
  makeStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  makeStatName: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  makeStatCount: {
    fontSize: 14,
    fontWeight: 'bold' as const,
  },
  carsList: {
    gap: 8,
    marginBottom: 20,
  },
  carCard: {
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
  },
  carCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  carInfo: {
    flex: 1,
  },
  carMake: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    marginBottom: 2,
  },
  carModel: {
    fontSize: 14,
    marginBottom: 2,
  },
  carYear: {
    fontSize: 12,
  },
  countBadge: {
    backgroundColor: Colors.success,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold' as const,
  },
  emptyState: {
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
  },
  modalClose: {
    fontSize: 24,
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 8,
    marginTop: 8,
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  pickerText: {
    fontSize: 15,
  },
  submitButton: {
    marginTop: 12,
    marginBottom: 8,
  },
  pickerModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  pickerList: {
    padding: 8,
  },
  pickerItem: {
    padding: 14,
    borderRadius: 8,
    marginVertical: 3,
  },
  pickerItemText: {
    fontSize: 15,
  },
});
