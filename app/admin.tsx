import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Share,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { 
  ArrowLeft, 
  Download, 
  Copy, 
  Database, 
  FileText, 
  BarChart3,
  Users,
  TrendingUp,
  Shield,
} from 'lucide-react-native';
import {
  generateFullSQLExport,
  downloadSQLFile,
  copySQLToClipboard,
  generateSQLSchema,
  exportDataToSQL,
} from '@/utils/sql-export';
import colors from '@/constants/colors';
import { useTheme } from '@/store/theme-store';
import { darkMode } from '@/constants/styles';
import useAuthStore from '@/store/auth-store';
import { trpc } from '@/lib/trpc';

export default function AdminScreen() {
  const { user } = useAuthStore();
  const { isDark } = useTheme();
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<'full' | 'schema' | 'data'>('full');

  const bgColor = isDark ? darkMode.background : colors.background;
  const cardColor = isDark ? darkMode.card : colors.card;
  const textColor = isDark ? darkMode.text : colors.text;
  const textSecondary = isDark ? darkMode.textSecondary : colors.textSecondary;
  const borderColor = isDark ? darkMode.border : colors.border;

  const adminCheckQuery = trpc.admin.checkAdmin.useQuery(
    { email: user?.email || '' },
    { enabled: !!user?.email }
  );

  const statsQuery = trpc.admin.getStats.useQuery(
    { adminEmail: user?.email || '' },
    { enabled: !!user?.email && adminCheckQuery.data?.isAdmin === true }
  );

  const usersQuery = trpc.admin.getUsers.useQuery(
    { adminEmail: user?.email || '' },
    { enabled: !!user?.email && adminCheckQuery.data?.isAdmin === true }
  );

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
        <Stack.Screen options={{ title: 'Admin Area' }} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Shield size={48} color={textSecondary} />
          <Text style={{ fontSize: 18, fontWeight: '600', color: textColor, marginTop: 16 }}>
            Authentication Required
          </Text>
          <Text style={{ fontSize: 14, color: textSecondary, textAlign: 'center', marginTop: 8 }}>
            Please log in to access the admin area
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (adminCheckQuery.isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
        <Stack.Screen options={{ title: 'Admin Area' }} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ fontSize: 14, color: textSecondary, marginTop: 16 }}>
            Checking permissions...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!adminCheckQuery.data?.isAdmin) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
        <Stack.Screen options={{ title: 'Admin Area' }} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Shield size={48} color={textSecondary} />
          <Text style={{ fontSize: 18, fontWeight: '600', color: textColor, marginTop: 16 }}>
            Access Denied
          </Text>
          <Text style={{ fontSize: 14, color: textSecondary, textAlign: 'center', marginTop: 8 }}>
            You don&apos;t have permission to access this area
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              backgroundColor: colors.primary,
              borderRadius: 8,
              paddingHorizontal: 20,
              paddingVertical: 12,
              marginTop: 20,
            }}
          >
            <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const stats = statsQuery.data || {
    users: 0,
    pellets: 0,
    negativePellets: 0,
    positivePellets: 0,
    badges: 0,
    purchases: 0,
    revenue: 0,
  };

  const users = usersQuery.data?.users || [];

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      let content: string;
      let filename: string;
      
      switch (exportType) {
        case 'schema':
          content = generateSQLSchema();
          filename = 'stupid-pellets-schema.sql';
          break;
        case 'data':
          content = exportDataToSQL();
          filename = 'stupid-pellets-data.sql';
          break;
        default:
          content = generateFullSQLExport().fullExport;
          filename = 'stupid-pellets-full-export.sql';
      }
      
      if (Platform.OS === 'web') {
        downloadSQLFile(content, filename);
        Alert.alert('Success', 'SQL file downloaded successfully!');
      } else {
        await Share.share({
          message: content,
          title: 'Stupid Pellets SQL Export',
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to export SQL file');
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyToClipboard = async () => {
    let content: string;
    
    switch (exportType) {
      case 'schema':
        content = generateSQLSchema();
        break;
      case 'data':
        content = exportDataToSQL();
        break;
      default:
        content = generateFullSQLExport().fullExport;
    }
    
    const success = await copySQLToClipboard(content);
    
    if (success) {
      Alert.alert('Success', 'SQL copied to clipboard!');
    } else {
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  };

  const exportOptions = [
    {
      id: 'full',
      title: 'Full Export',
      description: 'Complete database schema and data',
      icon: Database,
    },
    {
      id: 'schema',
      title: 'Schema Only',
      description: 'Table structure and indexes',
      icon: FileText,
    },
    {
      id: 'data',
      title: 'Data Only',
      description: 'INSERT statements for current data',
      icon: BarChart3,
    },
  ] as const;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
      <Stack.Screen
        options={{
          title: 'Admin Area',
          headerStyle: {
            backgroundColor: bgColor,
          },
          headerTintColor: textColor,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginRight: 16 }}
            >
              <ArrowLeft size={24} color={textColor} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        <View style={{
          backgroundColor: colors.primary + '20',
          borderRadius: 12,
          padding: 16,
          marginBottom: 24,
          flexDirection: 'row',
          alignItems: 'center',
        }}>
          <Shield size={24} color={colors.primary} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: textColor,
              marginBottom: 2,
            }}>
              Admin Access
            </Text>
            <Text style={{
              fontSize: 12,
              color: textSecondary,
            }}>
              You have full access to all admin features
            </Text>
          </View>
        </View>

        <View style={{
          backgroundColor: cardColor,
          borderRadius: 12,
          padding: 20,
          marginBottom: 24,
          borderWidth: 1,
          borderColor,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <TrendingUp size={20} color={colors.primary} />
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: textColor,
              marginLeft: 8,
            }}>
              Database Statistics
            </Text>
          </View>
          
          {statsQuery.isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              <StatItem label="Users" value={stats.users} bgColor={bgColor} />
              <StatItem label="Total Pellets" value={stats.pellets} bgColor={bgColor} />
              <StatItem label="Negative Pellets" value={stats.negativePellets} bgColor={bgColor} />
              <StatItem label="Positive Pellets" value={stats.positivePellets} bgColor={bgColor} />
              <StatItem label="Badges" value={stats.badges} bgColor={bgColor} />
              <StatItem label="Purchases" value={stats.purchases} bgColor={bgColor} />
              <StatItem 
                label="Revenue" 
                value={`$${stats.revenue.toFixed(2)}`} 
                bgColor={bgColor}
                isRevenue 
              />
            </View>
          )}
        </View>

        <View style={{
          backgroundColor: cardColor,
          borderRadius: 12,
          padding: 20,
          marginBottom: 24,
          borderWidth: 1,
          borderColor,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Users size={20} color={colors.primary} />
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: textColor,
              marginLeft: 8,
            }}>
              Current Users
            </Text>
          </View>
          
          {usersQuery.isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : users.length === 0 ? (
            <Text style={{
              fontSize: 14,
              color: textSecondary,
              textAlign: 'center',
              paddingVertical: 16,
            }}>
              No users found
            </Text>
          ) : (
            users.map((u: any) => (
              <View
                key={u.id}
                style={{
                  backgroundColor: bgColor,
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 8,
                }}
              >
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: textColor,
                  marginBottom: 4,
                }}>
                  {u.name || 'Anonymous User'}
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: textSecondary,
                  marginBottom: 2,
                }}>
                  Email: {u.email}
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: textSecondary,
                  marginBottom: 2,
                }}>
                  License Plate: {u.licensePlate} {u.state ? `(${u.state})` : ''}
                </Text>
                <View style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  marginTop: 8,
                  gap: 8,
                }}>
                  <Text style={{
                    fontSize: 11,
                    color: colors.primary,
                    backgroundColor: colors.primary + '20',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 4,
                  }}>
                    Level {u.level}
                  </Text>
                  <Text style={{
                    fontSize: 11,
                    color: colors.primary,
                    backgroundColor: colors.primary + '20',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 4,
                  }}>
                    {u.exp} EXP
                  </Text>
                  <Text style={{
                    fontSize: 11,
                    color: colors.primary,
                    backgroundColor: colors.primary + '20',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 4,
                  }}>
                    {u.pelletCount} Negative Pellets
                  </Text>
                  <Text style={{
                    fontSize: 11,
                    color: colors.success,
                    backgroundColor: colors.success + '20',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 4,
                  }}>
                    {u.positivePelletCount} Positive Pellets
                  </Text>
                  <Text style={{
                    fontSize: 11,
                    color: colors.secondary,
                    backgroundColor: colors.secondary + '20',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 4,
                  }}>
                    {u.badges?.length || 0} Badges
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={{
          backgroundColor: cardColor,
          borderRadius: 12,
          padding: 20,
          marginBottom: 24,
          borderWidth: 1,
          borderColor,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Database size={20} color={colors.primary} />
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: textColor,
              marginLeft: 8,
            }}>
              SQL Export
            </Text>
          </View>
          
          {exportOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = exportType === option.id;
            
            return (
              <TouchableOpacity
                key={option.id}
                onPress={() => setExportType(option.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 8,
                  backgroundColor: isSelected ? colors.primary + '20' : bgColor,
                  borderWidth: isSelected ? 2 : 1,
                  borderColor: isSelected ? colors.primary : borderColor,
                }}
              >
                <Icon 
                  size={20} 
                  color={isSelected ? colors.primary : textSecondary} 
                />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: isSelected ? colors.primary : textColor,
                    marginBottom: 2,
                  }}>
                    {option.title}
                  </Text>
                  <Text style={{
                    fontSize: 12,
                    color: textSecondary,
                  }}>
                    {option.description}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
          
          <TouchableOpacity
            onPress={handleExport}
            disabled={isExporting}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.primary,
              borderRadius: 8,
              padding: 14,
              marginTop: 8,
              marginBottom: 12,
              opacity: isExporting ? 0.6 : 1,
            }}
          >
            <Download size={18} color="white" />
            <Text style={{
              color: 'white',
              fontSize: 14,
              fontWeight: '600',
              marginLeft: 8,
            }}>
              {isExporting ? 'Exporting...' : Platform.OS === 'web' ? 'Download SQL File' : 'Share SQL File'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={handleCopyToClipboard}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: bgColor,
              borderRadius: 8,
              padding: 14,
              borderWidth: 1,
              borderColor,
            }}
          >
            <Copy size={18} color={textColor} />
            <Text style={{
              color: textColor,
              fontSize: 14,
              fontWeight: '600',
              marginLeft: 8,
            }}>
              Copy to Clipboard
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{
          backgroundColor: cardColor,
          borderRadius: 12,
          padding: 20,
          borderWidth: 1,
          borderColor,
        }}>
          <Text style={{
            fontSize: 14,
            fontWeight: '600',
            color: textColor,
            marginBottom: 8,
          }}>
            About Admin Area
          </Text>
          <Text style={{
            fontSize: 12,
            color: textSecondary,
            lineHeight: 18,
          }}>
            The admin area provides access to user management, database statistics, 
            and SQL export functionality. Only authorized administrators can access this area.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatItem({ 
  label, 
  value, 
  bgColor,
  isRevenue = false 
}: { 
  label: string; 
  value: number | string; 
  bgColor: string;
  isRevenue?: boolean;
}) {
  return (
    <View style={{
      backgroundColor: bgColor,
      borderRadius: 8,
      padding: 12,
      minWidth: 100,
      alignItems: 'center',
    }}>
      <Text style={{
        fontSize: 18,
        fontWeight: '700',
        color: isRevenue ? colors.success : colors.primary,
        marginBottom: 4,
      }}>
        {value}
      </Text>
      <Text style={{
        fontSize: 11,
        color: colors.textSecondary,
        textAlign: 'center',
      }}>
        {label}
      </Text>
    </View>
  );
}
