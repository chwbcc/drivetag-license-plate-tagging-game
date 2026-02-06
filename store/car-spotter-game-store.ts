import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import useAuthStore from './auth-store';

interface CarSpotting {
  id: string;
  make: string;
  model: string;
  year: string;
  spottedAt: number;
  count: number;
  userId: string;
}

interface CarMake {
  name: string;
  models: string[];
}

const CAR_MAKES: CarMake[] = [
  { 
    name: 'Toyota', 
    models: ['Camry', 'Corolla', 'RAV4', 'Highlander', 'Tacoma', 'Tundra', 'Prius', '4Runner', 'Sienna', 'Avalon']
  },
  { 
    name: 'Honda', 
    models: ['Accord', 'Civic', 'CR-V', 'Pilot', 'Odyssey', 'Ridgeline', 'HR-V', 'Passport', 'Fit', 'Insight']
  },
  { 
    name: 'Ford', 
    models: ['F-150', 'Mustang', 'Explorer', 'Escape', 'Edge', 'Expedition', 'Bronco', 'Ranger', 'Maverick', 'Transit']
  },
  { 
    name: 'Chevrolet', 
    models: ['Silverado', 'Equinox', 'Malibu', 'Traverse', 'Tahoe', 'Suburban', 'Camaro', 'Corvette', 'Colorado', 'Blazer']
  },
  { 
    name: 'Nissan', 
    models: ['Altima', 'Sentra', 'Rogue', 'Pathfinder', 'Frontier', 'Murano', 'Maxima', 'Armada', 'Titan', 'Kicks']
  },
  { 
    name: 'BMW', 
    models: ['3 Series', '5 Series', '7 Series', 'X3', 'X5', 'X7', 'M3', 'M5', 'Z4', 'i4']
  },
  { 
    name: 'Mercedes-Benz', 
    models: ['C-Class', 'E-Class', 'S-Class', 'GLE', 'GLC', 'GLS', 'A-Class', 'CLA', 'G-Class', 'AMG GT']
  },
  { 
    name: 'Tesla', 
    models: ['Model 3', 'Model Y', 'Model S', 'Model X', 'Cybertruck']
  },
  { 
    name: 'Jeep', 
    models: ['Wrangler', 'Grand Cherokee', 'Cherokee', 'Compass', 'Renegade', 'Gladiator', 'Grand Wagoneer', 'Wagoneer']
  },
  { 
    name: 'Ram', 
    models: ['1500', '2500', '3500', 'ProMaster', 'ProMaster City']
  },
  { 
    name: 'Subaru', 
    models: ['Outback', 'Forester', 'Crosstrek', 'Impreza', 'Legacy', 'Ascent', 'WRX', 'BRZ']
  },
  { 
    name: 'Mazda', 
    models: ['CX-5', 'CX-9', 'CX-30', 'Mazda3', 'Mazda6', 'MX-5 Miata', 'CX-50']
  },
  { 
    name: 'Hyundai', 
    models: ['Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Palisade', 'Kona', 'Venue', 'Ioniq 5']
  },
  { 
    name: 'Kia', 
    models: ['Forte', 'Optima', 'Sportage', 'Sorento', 'Telluride', 'Soul', 'Seltos', 'EV6', 'Stinger']
  },
  { 
    name: 'Volkswagen', 
    models: ['Jetta', 'Passat', 'Tiguan', 'Atlas', 'Golf', 'ID.4', 'Taos', 'Arteon']
  },
  { 
    name: 'Audi', 
    models: ['A3', 'A4', 'A6', 'Q3', 'Q5', 'Q7', 'Q8', 'e-tron', 'RS5', 'TT']
  },
  { 
    name: 'Lexus', 
    models: ['ES', 'IS', 'RX', 'NX', 'GX', 'LX', 'UX', 'LS', 'LC', 'RC']
  },
  { 
    name: 'Acura', 
    models: ['TLX', 'Integra', 'MDX', 'RDX', 'NSX', 'ILX']
  },
  { 
    name: 'GMC', 
    models: ['Sierra', 'Terrain', 'Acadia', 'Yukon', 'Canyon', 'Hummer EV']
  },
  { 
    name: 'Dodge', 
    models: ['Challenger', 'Charger', 'Durango', 'Hornet']
  },
];

const YEAR_RANGES = [
  '2024-2025',
  '2020-2023',
  '2015-2019',
  '2010-2014',
  '2005-2009',
  '2000-2004',
  '1990s',
  '1980s',
  'Pre-1980',
];

const STORAGE_KEY = '@car_spotter_game';

const generateCarList = () => {
  const cars: { id: string; make: string; model: string; yearRange: string }[] = [];
  CAR_MAKES.forEach((make) => {
    make.models.forEach((model) => {
      const id = `${make.name}-${model}`.toLowerCase().replace(/\s+/g, '-');
      cars.push({ id, make: make.name, model, yearRange: '' });
    });
  });
  return cars;
};

export const [CarSpotterGameProvider, useCarSpotterGame] = createContextHook(() => {
  const { user } = useAuthStore();
  const [spottedCars, setSpottedCars] = useState<Record<string, CarSpotting>>({});
  const [isLoading, setIsLoading] = useState(true);
  const carList = generateCarList();

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      try {
        const userKey = `${STORAGE_KEY}_${user.id}`;
        const stored = await AsyncStorage.getItem(userKey);
        if (stored) {
          setSpottedCars(JSON.parse(stored));
        } else {
          setSpottedCars({});
        }
      } catch (error) {
        console.error('Failed to load car spottings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    load();
  }, [user]);

  const saveSpottings = useCallback(async (spottings: Record<string, CarSpotting>) => {
    if (!user) return;
    
    try {
      const userKey = `${STORAGE_KEY}_${user.id}`;
      await AsyncStorage.setItem(userKey, JSON.stringify(spottings));
    } catch (error) {
      console.error('Failed to save car spottings:', error);
    }
  }, [user]);

  const spotCar = useCallback((make: string, model: string, yearRange: string) => {
    if (!user) {
      console.warn('Cannot spot car without logged in user');
      return;
    }
    
    const carId = `${make}-${model}-${yearRange}`.toLowerCase().replace(/\s+/g, '-');
    const now = Date.now();
    
    setSpottedCars((prev) => {
      const existing = prev[carId];
      const updated = {
        ...prev,
        [carId]: {
          id: carId,
          make,
          model,
          year: yearRange,
          spottedAt: now,
          count: existing ? existing.count + 1 : 1,
          userId: user.id,
        },
      };
      saveSpottings(updated);
      return updated;
    });
  }, [user, saveSpottings]);

  const unspotCar = useCallback((carId: string) => {
    setSpottedCars((prev) => {
      const updated = { ...prev };
      delete updated[carId];
      saveSpottings(updated);
      return updated;
    });
  }, [saveSpottings]);

  const resetGame = useCallback(async () => {
    if (!user) return;
    
    setSpottedCars({});
    try {
      const userKey = `${STORAGE_KEY}_${user.id}`;
      await AsyncStorage.removeItem(userKey);
    } catch (error) {
      console.error('Failed to reset game:', error);
    }
  }, [user]);

  const isCarSpotted = useCallback((carId: string) => {
    return carId in spottedCars;
  }, [spottedCars]);

  const getSpottedCount = useCallback(() => {
    return Object.keys(spottedCars).length;
  }, [spottedCars]);

  const getProgress = useCallback(() => {
    const count = Object.keys(spottedCars).length;
    return (count / carList.length) * 100;
  }, [spottedCars, carList.length]);

  const getSpottedCarsByMake = useCallback(() => {
    const byMake: Record<string, number> = {};
    Object.values(spottedCars).forEach((car) => {
      byMake[car.make] = (byMake[car.make] || 0) + 1;
    });
    return byMake;
  }, [spottedCars]);

  return {
    spottedCars,
    carMakes: CAR_MAKES,
    yearRanges: YEAR_RANGES,
    carList,
    spotCar,
    unspotCar,
    resetGame,
    isCarSpotted,
    getSpottedCount,
    getProgress,
    getSpottedCarsByMake,
    isLoading,
    totalCars: carList.length,
  };
});
