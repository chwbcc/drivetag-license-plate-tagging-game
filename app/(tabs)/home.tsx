import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { 
  Edit, 
  LogOut, 
  ThumbsUp, 
  Star,
  User,
  Car,
  Moon,
  Sun,
  Shield,
  Target,
  BarChart3,
} from 'lucide-react-native';
import useAuthStore from '@/store/auth-store';
import useBadgeStore from '@/store/badge-store';
import { useCurrentUser, getUserStats } from '@/hooks/useUserData';
import ExperienceBar from '@/components/ExperienceBar';
import CircularGauge from '@/components/CircularGauge';

import colors from '@/constants/colors';
import { useTheme } from '@/store/theme-store';

const EXP_LEVELS = [
  0, 100, 250, 500, 1000, 2000, 3500, 5000, 7500, 10000, 15000, 20000, 30000, 50000, 75000,
];

const getExpForNextLevel = (exp: number, level: number) => {
  const currentExp = exp || 0;
  const currentLevel = level || 1;
  
  if (currentLevel >= EXP_LEVELS.length) {
    const maxLevelExp = EXP_LEVELS[EXP_LEVELS.length - 1];
    return { current: currentExp - maxLevelExp, next: 0, progress: 100 };
  }
  
  const currentLevelExp = EXP_LEVELS[currentLevel - 1];
  const nextLevelExp = EXP_LEVELS[currentLevel];
  const expNeeded = nextLevelExp - currentLevelExp;
  const expProgress = currentExp - currentLevelExp;
  const progress = Math.min(100, Math.max(0, Math.round((expProgress / expNeeded) * 100)));
  
  return { current: expProgress, next: expNeeded, progress };
};

export default function HomeScreen() {
  const { user: localUser, logout, syncAdminRole } = useAuthStore();
  const { badges: allBadges } = useBadgeStore();
  const { isDark, toggleTheme } = useTheme();
  
  const { data: dbUser, isLoading: userLoading } = useCurrentUser();
  
  const user = dbUser || localUser;
  
  useEffect(() => {
    syncAdminRole();
  }, [syncAdminRole]);

  const userStats = getUserStats(user);

  if (!user) {
    return null;
  }

  const positiveReceived = userStats.positiveReceived;
  const negativeReceived = userStats.negativeReceived;
  const positiveGiven = userStats.positiveGiven;
  const negativeGiven = userStats.negativeGiven;
  const totalGiven = userStats.totalGiven;
  const totalReceived = userStats.totalReceived;
  
  const userBadgeIds = user?.badges || [];
  const userBadges = allBadges.filter(b => userBadgeIds.includes(b.id));
  
  const currentExp = user?.exp ?? 0;
  const currentLevel = user?.level ?? 1;
  const expInfo = getExpForNextLevel(currentExp, currentLevel);

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
            router.replace('/(auth)' as any);
          }
        },
      ]
    );
  };

  const bgColor = isDark ? '#1a1a24' : colors.background;
  const cardColor = isDark ? '#24243a' : colors.card;
  const textColor = isDark ? '#ffffff' : colors.text;
  const textSecondary = isDark ? '#888' : colors.textSecondary;
  const accentGreen = '#00ff9d' as const;
  const accentRed = '#ff3366' as const;
  const accentYellow = '#ffd700' as const;

  if (userLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: textSecondary, marginTop: 10 }}>Loading your data...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      <Stack.Screen
        options={{
          title: 'Driver Score',
          headerStyle: {
            backgroundColor: bgColor,
          },
          headerTintColor: textColor,
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: 12, marginRight: 8 }}>
              <TouchableOpacity onPress={toggleTheme}>
                {isDark ? (
                  <Sun size={24} color={textColor} />
                ) : (
                  <Moon size={24} color={textColor} />
                )}
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 12 }}>
        <View style={{
          backgroundColor: cardColor,
          borderRadius: 14,
          padding: 12,
          marginBottom: 10,
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <View style={{ flex: 1 }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 6,
              }}>
                <View style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: colors.primary + '30',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                }}>
                  {user.photo ? (
                    <Image 
                      source={{ uri: user.photo }} 
                      style={{ width: 36, height: 36, borderRadius: 18 }}
                    />
                  ) : (
                    <User size={18} color={accentGreen} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 15,
                    fontWeight: '700' as const,
                    color: textColor,
                    marginBottom: 2,
                  }}>
                    {user.name || 'Anonymous Driver'}
                  </Text>
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}>
                    <Car size={11} color='#888' />
                    <Text style={{
                      fontSize: 11,
                      color: textSecondary,
                      marginLeft: 4,
                    }}>
                      {user.licensePlate}
                    </Text>
                    {user.state && (
                      <Text style={{
                        fontSize: 11,
                        color: '#888',
                        marginLeft: 4,
                      }}>
                        • {user.state}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            </View>
            
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {(user.adminRole === 'analyst' || user.adminRole === 'moderator' || user.adminRole === 'admin' || user.adminRole === 'super_admin') && (
                <TouchableOpacity
                  onPress={() => router.push('/analytics' as any)}
                  style={{
                    backgroundColor: '#2563EB' + '30',
                    borderRadius: 8,
                    padding: 7,
                  }}
                >
                  <BarChart3 size={16} color="#2563EB" />
                </TouchableOpacity>
              )}
              {user.adminRole && user.adminRole !== 'analyst' && (
                <TouchableOpacity
                  onPress={() => router.push('/admin' as any)}
                  style={{
                    backgroundColor: '#FFD700' + '30',
                    borderRadius: 8,
                    padding: 7,
                  }}
                >
                  <Shield size={16} color="#FFD700" />
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                onPress={() => router.push('/edit-profile' as any)}
                style={{
                  backgroundColor: colors.primary + '30',
                  borderRadius: 8,
                  padding: 7,
                }}
              >
                <Edit size={16} color={accentGreen} />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={{
            flexDirection: 'row',
            marginTop: 10,
            paddingTop: 10,
            borderTopWidth: 1,
            borderTopColor: '#333344',
          }}>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{
                fontSize: 18,
                fontWeight: '700' as const,
                color: accentYellow,
              }}>
                {currentLevel}
              </Text>
              <Text style={{
                fontSize: 10,
                color: textSecondary,
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginTop: 2,
              }}>
                Level
              </Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{
                fontSize: 18,
                fontWeight: '700' as const,
                color: accentGreen,
              }}>
                {currentExp}
              </Text>
              <Text style={{
                fontSize: 10,
                color: textSecondary,
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginTop: 2,
              }}>
                EXP
              </Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{
                fontSize: 18,
                fontWeight: '700' as const,
                color: colors.primary,
              }}>
                {userBadges.length}
              </Text>
              <Text style={{
                fontSize: 10,
                color: textSecondary,
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginTop: 2,
              }}>
                Badges
              </Text>
            </View>
          </View>
        </View>

        <View style={{
          backgroundColor: cardColor,
          borderRadius: 12,
          padding: 10,
          marginBottom: 8,
        }}>
          <Text style={{
            fontSize: 11,
            fontWeight: '600' as const,
            color: textColor,
            marginBottom: 6,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}>
            Level Progress
          </Text>
          
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 6,
          }}>
            <Text style={{
              fontSize: 10,
              color: '#888',
            }}>
              Level {currentLevel}
            </Text>
            <Text style={{
              fontSize: 10,
              color: '#888',
            }}>
              {expInfo.current} / {expInfo.next} EXP
            </Text>
          </View>
          
          <ExperienceBar 
            level={currentLevel}
            currentExp={expInfo.current}
            nextLevelExp={expInfo.next}
            progress={expInfo.progress}
          />
          
          <Text style={{
            fontSize: 9,
            color: '#666',
            textAlign: 'center',
            marginTop: 4,
          }}>
            {expInfo.progress}% complete
          </Text>
        </View>

        <View style={{
          backgroundColor: cardColor,
          borderRadius: 14,
          padding: 14,
          marginBottom: 10,
        }}>
          <Text style={{
            fontSize: 13,
            fontWeight: '600' as const,
            color: textColor,
            marginBottom: 12,
            textAlign: 'center',
            textTransform: 'uppercase',
            letterSpacing: 1.5,
          }}>
            Driver Score
          </Text>
          
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            marginBottom: 8,
          }}>
            <CircularGauge
              value={positiveReceived}
              maxValue={Math.max(positiveReceived + 10, 50)}
              size={100}
              strokeWidth={10}
              color={accentGreen}
              label="Positive Tags"
            />
            
            <CircularGauge
              value={negativeReceived}
              maxValue={Math.max(negativeReceived + 10, 50)}
              size={100}
              strokeWidth={10}
              color={accentRed}
              label="Negative Tags"
            />
          </View>
        </View>

        <View style={{
          backgroundColor: cardColor,
          borderRadius: 14,
          padding: 12,
          marginBottom: 10,
        }}>
          <Text style={{
            fontSize: 12,
            fontWeight: '600' as const,
            color: textColor,
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}>
            Activity
          </Text>
          
          <View style={{ gap: 6 }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: bgColor,
              borderRadius: 10,
              padding: 10,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Target size={18} color={accentYellow} />
                <Text style={{
                  fontSize: 13,
                  color: '#cccccc',
                  marginLeft: 10,
                }}>
                  Pellets Given
                </Text>
              </View>
              <Text style={{
                fontSize: 15,
                fontWeight: '700' as const,
                color: textColor,
              }}>
                {totalGiven}
              </Text>
            </View>
            
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: bgColor,
              borderRadius: 10,
              padding: 10,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ThumbsUp size={18} color={accentGreen} />
                <Text style={{
                  fontSize: 13,
                  color: '#cccccc',
                  marginLeft: 10,
                }}>
                  Positive Given
                </Text>
              </View>
              <Text style={{
                fontSize: 15,
                fontWeight: '700' as const,
                color: textColor,
              }}>
                {positiveGiven}
              </Text>
            </View>
            
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: bgColor,
              borderRadius: 10,
              padding: 10,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ThumbsUp size={18} color={accentRed} style={{ transform: [{ rotate: '180deg' }] }} />
                <Text style={{
                  fontSize: 13,
                  color: '#cccccc',
                  marginLeft: 10,
                }}>
                  Negative Given
                </Text>
              </View>
              <Text style={{
                fontSize: 15,
                fontWeight: '700' as const,
                color: textColor,
              }}>
                {negativeGiven}
              </Text>
            </View>
            
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: bgColor,
              borderRadius: 10,
              padding: 10,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Star size={18} color={accentYellow} />
                <Text style={{
                  fontSize: 13,
                  color: '#cccccc',
                  marginLeft: 10,
                }}>
                  Total Received
                </Text>
              </View>
              <Text style={{
                fontSize: 15,
                fontWeight: '700' as const,
                color: textColor,
              }}>
                {totalReceived}
              </Text>
            </View>
          </View>
        </View>

        {userBadges.length > 0 && (
          <View style={{
            backgroundColor: cardColor,
            borderRadius: 14,
            padding: 12,
            marginBottom: 10,
          }}>
            <Text style={{
              fontSize: 12,
              fontWeight: '600' as const,
              color: '#ffffff',
              marginBottom: 8,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}>
              Recent Badges
            </Text>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {userBadges.slice(0, 5).map((badge) => (
                  <View
                    key={badge.id}
                    style={{
                      backgroundColor: bgColor,
                      borderRadius: 10,
                      padding: 10,
                      alignItems: 'center',
                      width: 70,
                    }}
                  >
                    <Text style={{ fontSize: 18, marginBottom: 4 }}>
                      {badge.icon}
                    </Text>
                    <Text style={{
                      fontSize: 9,
                      fontWeight: '600' as const,
                      color: textColor,
                      textAlign: 'center',
                    }}>
                      {badge.name}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        <TouchableOpacity
          onPress={handleLogout}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isDark ? '#2a2a3e' : colors.card,
            borderRadius: 10,
            padding: 10,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: isDark ? '#3a3a4f' : colors.border,
          }}
        >
          <LogOut size={18} color={accentRed} />
          <Text style={{
            color: textColor,
            fontSize: 14,
            fontWeight: '600' as const,
            marginLeft: 8,
          }}>
            Logout
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
