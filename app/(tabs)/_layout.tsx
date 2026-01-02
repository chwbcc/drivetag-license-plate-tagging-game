import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { User, Trophy, ShoppingCart, Play, Target, Shield } from 'lucide-react-native';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Colors from '@/constants/colors';
import { useTheme } from '@/store/theme-store';
import { darkMode } from '@/constants/styles';
import useAuthStore from '@/store/auth-store';

function CenterTabButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity
      style={styles.centerButton}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.centerButtonInner}>
        <Target size={32} color="#fff" strokeWidth={2.5} />
      </View>
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  const router = useRouter();
  const { isDark } = useTheme();
  const user = useAuthStore((state) => state.user);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: isDark ? darkMode.textSecondary : Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: isDark ? darkMode.card : Colors.card,
          borderTopColor: isDark ? darkMode.border : Colors.border,
          height: Platform.OS === 'ios' ? 88 : 70,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
        },
        headerStyle: {
          backgroundColor: isDark ? darkMode.background : Colors.background,
        },
        headerTintColor: isDark ? darkMode.text : Colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerRight: user?.adminRole ? () => (
          <TouchableOpacity
            onPress={() => router.push('/admin' as any)}
            style={{
              marginRight: 16,
              backgroundColor: '#FFD700' + '20',
              borderRadius: 8,
              padding: 8,
            }}
          >
            <Shield size={22} color="#FFD700" />
          </TouchableOpacity>
        ) : undefined,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: "Leaderboard",
          tabBarIcon: ({ color }) => <Trophy size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Tag Driver",
          tabBarButton: (props) => (
            <CenterTabButton onPress={() => router.push('/tag-driver' as any)} />
          ),
        }}
      />
      <Tabs.Screen
        name="badges"
        options={{
          title: "Let's Play",
          tabBarIcon: ({ color }) => <Play size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: "Shop",
          tabBarIcon: ({ color }) => <ShoppingCart size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  centerButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    top: -20,
  },
  centerButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
});