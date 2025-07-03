import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { 
  Edit, 
  LogOut, 
  Trophy, 
  Target, 
  ThumbsUp, 
  Star,
  Database,
  Settings,
  User,
  Mail,
  Car,
  MapPin,
} from 'lucide-react-native';
import useAuthStore from '@/store/auth-store';
import usePelletStore from '@/store/pellet-store';
import useBadgeStore from '@/store/badge-store';
import ExperienceBar from '@/components/ExperienceBar';
import colors from '@/constants/colors';

export default function ProfileScreen() {
  const { user, logout, getExpForNextLevel } = useAuthStore();
  const { getPelletsByLicensePlate, getPelletsCreatedByUser } = usePelletStore();
  const { getUserBadges } = useBadgeStore();

  if (!user) {
    return null;
  }

  const userBadges = getUserBadges(user.id);
  const pelletsReceived = getPelletsByLicensePlate(user.licensePlate);
  const negativePelletsReceived = getPelletsByLicensePlate(user.licensePlate, 'negative');
  const positivePelletsReceived = getPelletsByLicensePlate(user.licensePlate, 'positive');
  const pelletsGiven = getPelletsCreatedByUser(user.id);
  const expInfo = getExpForNextLevel();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/(auth)');
          }
        },
      ]
    );
  };

  const stats = [
    {
      icon: Target,
      label: 'Pellets Given',
      value: pelletsGiven.length,
      color: colors.primary,
    },
    {
      icon: ThumbsUp,
      label: 'Positive Given',
      value: pelletsGiven.filter(p => p.type === 'positive').length,
      color: colors.success,
    },
    {
      icon: Trophy,
      label: 'Badges Earned',
      value: userBadges.length,
      color: colors.warning,
    },
    {
      icon: Star,
      label: 'Experience',
      value: user.exp || 0,
      color: colors.secondary,
    },
  ];

  const pelletStats = [
    {
      label: 'Negative Received',
      value: negativePelletsReceived.length,
      color: colors.error,
    },
    {
      label: 'Positive Received',
      value: positivePelletsReceived.length,
      color: colors.success,
    },
    {
      label: 'Total Received',
      value: pelletsReceived.length,
      color: colors.textSecondary,
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen
        options={{
          title: 'Profile',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/sql-export')}
              style={{ marginRight: 8 }}
            >
              <Database size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        {/* Profile Header */}
        <View style={{
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 24,
          alignItems: 'center',
          marginBottom: 24,
        }}>
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: colors.primary + '20',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}>
            {user.photo ? (
              <Image 
                source={{ uri: user.photo }} 
                style={{ width: 80, height: 80, borderRadius: 40 }}
              />
            ) : (
              <User size={40} color={colors.primary} />
            )}
          </View>
          
          <Text style={{
            fontSize: 24,
            fontWeight: '700',
            color: colors.text,
            marginBottom: 4,
          }}>
            {user.name || 'Anonymous Driver'}
          </Text>
          
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 8,
          }}>
            <Mail size={16} color={colors.textSecondary} />
            <Text style={{
              fontSize: 16,
              color: colors.textSecondary,
              marginLeft: 6,
            }}>
              {user.email}
            </Text>
          </View>
          
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 16,
          }}>
            <Car size={16} color={colors.textSecondary} />
            <Text style={{
              fontSize: 16,
              color: colors.textSecondary,
              marginLeft: 6,
            }}>
              {user.licensePlate}
            </Text>
            {user.state && (
              <>
                <MapPin size={14} color={colors.textSecondary} style={{ marginLeft: 8 }} />
                <Text style={{
                  fontSize: 16,
                  color: colors.textSecondary,
                  marginLeft: 4,
                }}>
                  {user.state}
                </Text>
              </>
            )}
          </View>
          
          <TouchableOpacity
            onPress={() => router.push('/edit-profile')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.primary,
              borderRadius: 8,
              paddingHorizontal: 16,
              paddingVertical: 8,
            }}
          >
            <Edit size={16} color="white" />
            <Text style={{
              color: 'white',
              fontSize: 14,
              fontWeight: '600',
              marginLeft: 6,
            }}>
              Edit Profile
            </Text>
          </TouchableOpacity>
        </View>

        {/* Experience Section */}
        <View style={{
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 20,
          marginBottom: 24,
        }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: colors.text,
            marginBottom: 16,
          }}>
            Experience & Level
          </Text>
          
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}>
            <Text style={{
              fontSize: 32,
              fontWeight: '700',
              color: colors.primary,
            }}>
              Level {user.level}
            </Text>
            <Text style={{
              fontSize: 16,
              color: colors.textSecondary,
            }}>
              {expInfo.current} / {expInfo.next} EXP
            </Text>
          </View>
          
          <ExperienceBar 
            level={user.level}
            currentExp={expInfo.current}
            nextLevelExp={expInfo.next}
            progress={expInfo.progress}
          />
          
          <Text style={{
            fontSize: 14,
            color: colors.textSecondary,
            textAlign: 'center',
            marginTop: 8,
          }}>
            {expInfo.progress}% to next level
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={{
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 20,
          marginBottom: 24,
        }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: colors.text,
            marginBottom: 16,
          }}>
            Activity Stats
          </Text>
          
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 12,
          }}>
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <View
                  key={index}
                  style={{
                    backgroundColor: colors.background,
                    borderRadius: 12,
                    padding: 16,
                    flex: 1,
                    minWidth: '45%',
                    alignItems: 'center',
                  }}
                >
                  <Icon size={24} color={stat.color} />
                  <Text style={{
                    fontSize: 24,
                    fontWeight: '700',
                    color: colors.text,
                    marginTop: 8,
                    marginBottom: 4,
                  }}>
                    {stat.value}
                  </Text>
                  <Text style={{
                    fontSize: 12,
                    color: colors.textSecondary,
                    textAlign: 'center',
                  }}>
                    {stat.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Pellets Received */}
        <View style={{
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 20,
          marginBottom: 24,
        }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: colors.text,
            marginBottom: 16,
          }}>
            Pellets Received
          </Text>
          
          <View style={{
            flexDirection: 'row',
            gap: 12,
          }}>
            {pelletStats.map((stat, index) => (
              <View
                key={index}
                style={{
                  backgroundColor: colors.background,
                  borderRadius: 12,
                  padding: 16,
                  flex: 1,
                  alignItems: 'center',
                }}
              >
                <Text style={{
                  fontSize: 20,
                  fontWeight: '700',
                  color: stat.color,
                  marginBottom: 4,
                }}>
                  {stat.value}
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: colors.textSecondary,
                  textAlign: 'center',
                }}>
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Badges */}
        {userBadges.length > 0 && (
          <View style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: colors.text,
              marginBottom: 16,
            }}>
              Recent Badges
            </Text>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {userBadges.slice(0, 5).map((badge) => (
                  <View
                    key={badge.id}
                    style={{
                      backgroundColor: colors.background,
                      borderRadius: 12,
                      padding: 16,
                      alignItems: 'center',
                      width: 100,
                    }}
                  >
                    <Text style={{ fontSize: 24, marginBottom: 8 }}>
                      {badge.icon}
                    </Text>
                    <Text style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: colors.text,
                      textAlign: 'center',
                    }}>
                      {badge.name}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
            
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/badges')}
              style={{
                marginTop: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{
                color: colors.primary,
                fontSize: 14,
                fontWeight: '600',
              }}>
                View All Badges
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Logout Button */}
        <TouchableOpacity
          onPress={handleLogout}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.error,
            borderRadius: 12,
            padding: 16,
            marginBottom: 40,
          }}
        >
          <LogOut size={20} color="white" />
          <Text style={{
            color: 'white',
            fontSize: 16,
            fontWeight: '600',
            marginLeft: 8,
          }}>
            Logout
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}