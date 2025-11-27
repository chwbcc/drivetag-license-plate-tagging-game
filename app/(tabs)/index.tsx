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
  User,
  Car,
  Moon,
  Sun,
  Shield,
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
              {user.adminRole && (
                <TouchableOpacity
                  onPress={() => router.push('/admin')}
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
                onPress={() => router.push('/edit-profile')}
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
                fontWeight: '700',
                color: accentYellow,
              }}>
                {user.level}
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
                fontWeight: '700',
                color: accentGreen,
              }}>
                {user.exp || 0}
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
                fontWeight: '700',
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
            fontWeight: '600',
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
              Level {user.level}
            </Text>
            <Text style={{
              fontSize: 10,
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
            fontWeight: '600',
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
              value={positivePelletsReceived.length}
              maxValue={Math.max(positivePelletsReceived.length + 10, 50)}
              size={100}
              strokeWidth={10}
              color={accentGreen}
              label="Positive Tags"
            />
            
            <CircularGauge
              value={negativePelletsReceived.length}
              maxValue={Math.max(negativePelletsReceived.length + 10, 50)}
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
            fontWeight: '600',
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
                fontWeight: '700',
                color: textColor,
              }}>
                {pelletsReceived.length}
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
              fontWeight: '600',
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
