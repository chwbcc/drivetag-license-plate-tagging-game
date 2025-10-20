import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  FlatList,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { 
  Edit, 
  LogOut, 
  Target, 
  ThumbsUp, 
  Star,
  Database,
  User,
  Car,
  Moon,
  Sun,
} from 'lucide-react-native';
import useAuthStore from '@/store/auth-store';
import usePelletStore from '@/store/pellet-store';
import useBadgeStore from '@/store/badge-store';
import ExperienceBar from '@/components/ExperienceBar';
import CircularGauge from '@/components/CircularGauge';
import PelletCard from '@/components/PelletCard';
import colors from '@/constants/colors';
import { useTheme } from '@/store/theme-store';
import { darkMode } from '@/constants/styles';

export default function HomeScreen() {
  const { user, logout, getExpForNextLevel } = useAuthStore();
  const { getPelletsByLicensePlate, getPelletsCreatedByUser, pellets } = usePelletStore();
  const { getUserBadges } = useBadgeStore();
  const { isDark, toggleTheme } = useTheme();

  if (!user) {
    return null;
  }

  const userBadges = getUserBadges(user.id);
  
  const userLicensePlateWithState = user.state && !user.licensePlate.includes('-') 
    ? `${user.state}-${user.licensePlate}` 
    : user.licensePlate;
  
  const pelletsReceived = getPelletsByLicensePlate(userLicensePlateWithState);
  const negativePelletsReceived = getPelletsByLicensePlate(userLicensePlateWithState, 'negative');
  const positivePelletsReceived = getPelletsByLicensePlate(userLicensePlateWithState, 'positive');
  const pelletsGiven = getPelletsCreatedByUser(user.id);
  const expInfo = getExpForNextLevel();

  const recentPellets = [...pelletsReceived]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 10);

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

  const bgColor = isDark ? '#1a1a24' : colors.background;
  const cardColor = isDark ? '#24243a' : colors.card;
  const textColor = isDark ? '#ffffff' : colors.text;
  const textSecondary = isDark ? '#888' : colors.textSecondary;
  const accentGreen = '#00ff9d' as const;
  const accentRed = '#ff3366' as const;
  const accentYellow = '#ffd700' as const;

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
              <TouchableOpacity onPress={() => router.push('/sql-export')}>
                <Database size={24} color={textColor} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        {/* User Info Header */}
        <View style={{
          backgroundColor: cardColor,
          borderRadius: 20,
          padding: 20,
          marginBottom: 24,
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
                marginBottom: 8,
              }}>
                <View style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  backgroundColor: colors.primary + '30',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}>
                  {user.photo ? (
                    <Image 
                      source={{ uri: user.photo }} 
                      style={{ width: 50, height: 50, borderRadius: 25 }}
                    />
                  ) : (
                    <User size={24} color={accentGreen} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 18,
                    fontWeight: '700',
                    color: textColor,
                    marginBottom: 2,
                  }}>
                    {user.name || 'Anonymous Driver'}
                  </Text>
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}>
                    <Car size={12} color='#888' />
                    <Text style={{
                      fontSize: 12,
                      color: textSecondary,
                      marginLeft: 4,
                    }}>
                      {user.licensePlate}
                    </Text>
                    {user.state && (
                      <Text style={{
                        fontSize: 12,
                        color: '#888',
                        marginLeft: 4,
                      }}>
                        {"• "}{user.state}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            </View>
            
            <TouchableOpacity
              onPress={() => router.push('/edit-profile')}
              style={{
                backgroundColor: colors.primary + '30',
                borderRadius: 8,
                padding: 8,
              }}
            >
              <Edit size={18} color={accentGreen} />
            </TouchableOpacity>
          </View>
          
          <View style={{
            flexDirection: 'row',
            marginTop: 16,
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: '#333344',
          }}>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{
                fontSize: 24,
                fontWeight: '700',
                color: accentYellow,
              }}>
                {user.level}
              </Text>
              <Text style={{
                fontSize: 11,
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
                fontSize: 24,
                fontWeight: '700',
                color: accentGreen,
              }}>
                {user.exp || 0}
              </Text>
              <Text style={{
                fontSize: 11,
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
                fontSize: 24,
                fontWeight: '700',
                color: colors.primary,
              }}>
                {userBadges.length}
              </Text>
              <Text style={{
                fontSize: 11,
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

        {/* Main Gauges - Positive & Negative */}
        <View style={{
          backgroundColor: cardColor,
          borderRadius: 20,
          padding: 24,
          marginBottom: 24,
        }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: textColor,
            marginBottom: 24,
            textAlign: 'center',
            textTransform: 'uppercase',
            letterSpacing: 1.5,
          }}>
            Driver Score
          </Text>
          
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            marginBottom: 20,
          }}>
            <CircularGauge
              value={positivePelletsReceived.length}
              maxValue={Math.max(positivePelletsReceived.length + 10, 50)}
              size={140}
              strokeWidth={12}
              color={accentGreen}
              label="Positive Tags"
            />
            
            <CircularGauge
              value={negativePelletsReceived.length}
              maxValue={Math.max(negativePelletsReceived.length + 10, 50)}
              size={140}
              strokeWidth={12}
              color={accentRed}
              label="Negative Tags"
            />
          </View>
        </View>

        {/* Activity Stats */}
        <View style={{
          backgroundColor: cardColor,
          borderRadius: 20,
          padding: 20,
          marginBottom: 24,
        }}>
          <Text style={{
            fontSize: 14,
            fontWeight: '600',
            color: textColor,
            marginBottom: 16,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}>
            Activity
          </Text>
          
          <View style={{ gap: 12 }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: bgColor,
              borderRadius: 12,
              padding: 16,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Target size={20} color={accentYellow} />
                <Text style={{
                  fontSize: 14,
                  color: '#cccccc',
                  marginLeft: 12,
                }}>
                  Pellets Given
                </Text>
              </View>
              <Text style={{
                fontSize: 18,
                fontWeight: '700',
                color: textColor,
              }}>
                {pelletsGiven.length}
              </Text>
            </View>
            
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: bgColor,
              borderRadius: 12,
              padding: 16,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ThumbsUp size={20} color={accentGreen} />
                <Text style={{
                  fontSize: 14,
                  color: '#cccccc',
                  marginLeft: 12,
                }}>
                  Positive Given
                </Text>
              </View>
              <Text style={{
                fontSize: 18,
                fontWeight: '700',
                color: textColor,
              }}>
                {pelletsGiven.filter(p => p.type === 'positive').length}
              </Text>
            </View>
            
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: bgColor,
              borderRadius: 12,
              padding: 16,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Star size={20} color={accentYellow} />
                <Text style={{
                  fontSize: 14,
                  color: '#cccccc',
                  marginLeft: 12,
                }}>
                  Total Received
                </Text>
              </View>
              <Text style={{
                fontSize: 18,
                fontWeight: '700',
                color: textColor,
              }}>
                {pelletsReceived.length}
              </Text>
            </View>
          </View>
        </View>

        {/* Experience Progress */}
        <View style={{
          backgroundColor: cardColor,
          borderRadius: 20,
          padding: 20,
          marginBottom: 24,
        }}>
          <Text style={{
            fontSize: 14,
            fontWeight: '600',
            color: textColor,
            marginBottom: 12,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}>
            Level Progress
          </Text>
          
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}>
            <Text style={{
              fontSize: 12,
              color: '#888',
            }}>
              Level {user.level}
            </Text>
            <Text style={{
              fontSize: 12,
              color: '#888',
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
            fontSize: 11,
            color: '#666',
            textAlign: 'center',
            marginTop: 8,
          }}>
            {expInfo.progress}% complete
          </Text>
        </View>

        {/* Recent Tags Section */}
        <View style={{
          backgroundColor: cardColor,
          borderRadius: 20,
          padding: 20,
          marginBottom: 24,
        }}>
          <Text style={{
            fontSize: 14,
            fontWeight: '600',
            color: textColor,
            marginBottom: 16,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}>
            Recent Tags
          </Text>
          
          {recentPellets.length === 0 ? (
            <View style={{
              paddingVertical: 40,
              alignItems: 'center',
            }}>
              <Text style={{ fontSize: 48 }}>💥</Text>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: textColor,
                marginTop: 16,
              }}>
                No tags received yet
              </Text>
              <Text style={{
                fontSize: 14,
                color: '#888',
                textAlign: 'center',
                marginTop: 8,
              }}>
                Your driving record is clean!
              </Text>
            </View>
          ) : (
            <View>
              {recentPellets.map((item) => (
                <View key={item.id} style={{ marginBottom: 8 }}>
                  <PelletCard pellet={item} />
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Recent Badges */}
        {userBadges.length > 0 && (
          <View style={{
            backgroundColor: cardColor,
            borderRadius: 20,
            padding: 20,
            marginBottom: 24,
          }}>
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: '#ffffff',
              marginBottom: 16,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}>
              Recent Badges
            </Text>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {userBadges.slice(0, 5).map((badge) => (
                  <View
                    key={badge.id}
                    style={{
                      backgroundColor: bgColor,
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
                      color: textColor,
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
                color: accentGreen,
                fontSize: 14,
                fontWeight: '600',
              }}>
                View All Badges →
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
            backgroundColor: isDark ? '#2a2a3e' : colors.card,
            borderRadius: 12,
            padding: 16,
            marginBottom: 40,
            borderWidth: 1,
            borderColor: isDark ? '#3a3a4f' : colors.border,
          }}
        >
          <LogOut size={20} color={accentRed} />
          <Text style={{
            color: textColor,
            fontSize: 16,
            fontWeight: '600',
            marginLeft: 8,
          }}>
            Logout
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}