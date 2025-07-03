import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { ArrowLeft, Download, Copy, Database, FileText, BarChart3 } from 'lucide-react-native';
import {
  generateFullSQLExport,
  downloadSQLFile,
  copySQLToClipboard,
  getDatabaseStats,
  generateSQLSchema,
  exportDataToSQL,
} from '@/utils/sql-export';
import { colors } from '@/constants/colors';

export default function SQLExportScreen() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<'full' | 'schema' | 'data'>('full');

  const stats = getDatabaseStats();

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
        // On mobile, use Share API
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen
        options={{
          title: 'SQL Export',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginRight: 16 }}
            >
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        {/* Database Statistics */}
        <View style={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 20,
          marginBottom: 24,
        }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: colors.text,
            marginBottom: 16,
          }}>
            Database Statistics
          </Text>
          
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
            <StatItem label="Users" value={stats.users} />
            <StatItem label="Total Pellets" value={stats.pellets} />
            <StatItem label="Negative Pellets" value={stats.negativePellets} />
            <StatItem label="Positive Pellets" value={stats.positivePellets} />
            <StatItem label="Badges" value={stats.badges} />
            <StatItem label="Purchases" value={stats.purchases} />
          </View>
        </View>

        {/* Export Type Selection */}
        <View style={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 20,
          marginBottom: 24,
        }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: colors.text,
            marginBottom: 16,
          }}>
            Export Type
          </Text>
          
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
                  padding: 16,
                  borderRadius: 8,
                  marginBottom: 8,
                  backgroundColor: isSelected ? colors.primary + '20' : colors.background,
                  borderWidth: isSelected ? 2 : 1,
                  borderColor: isSelected ? colors.primary : colors.border,
                }}
              >
                <Icon 
                  size={24} 
                  color={isSelected ? colors.primary : colors.textSecondary} 
                />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '500',
                    color: isSelected ? colors.primary : colors.text,
                    marginBottom: 2,
                  }}>
                    {option.title}
                  </Text>
                  <Text style={{
                    fontSize: 14,
                    color: colors.textSecondary,
                  }}>
                    {option.description}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Export Actions */}
        <View style={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 20,
        }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: colors.text,
            marginBottom: 16,
          }}>
            Export Actions
          </Text>
          
          <TouchableOpacity
            onPress={handleExport}
            disabled={isExporting}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.primary,
              borderRadius: 8,
              padding: 16,
              marginBottom: 12,
              opacity: isExporting ? 0.6 : 1,
            }}
          >
            <Download size={20} color="white" />
            <Text style={{
              color: 'white',
              fontSize: 16,
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
              backgroundColor: colors.background,
              borderRadius: 8,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Copy size={20} color={colors.text} />
            <Text style={{
              color: colors.text,
              fontSize: 16,
              fontWeight: '600',
              marginLeft: 8,
            }}>
              Copy to Clipboard
            </Text>
          </TouchableOpacity>
        </View>

        {/* Information */}
        <View style={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 20,
          marginTop: 24,
        }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: colors.text,
            marginBottom: 8,
          }}>
            About SQL Export
          </Text>
          <Text style={{
            fontSize: 14,
            color: colors.textSecondary,
            lineHeight: 20,
          }}>
            This feature exports your app data to SQL format compatible with MySQL, PostgreSQL, and other SQL databases. 
            The export includes table schemas, indexes, and all current data from your local storage.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <View style={{
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 12,
      minWidth: 80,
      alignItems: 'center',
    }}>
      <Text style={{
        fontSize: 20,
        fontWeight: '700',
        color: colors.primary,
        marginBottom: 4,
      }}>
        {value}
      </Text>
      <Text style={{
        fontSize: 12,
        color: colors.textSecondary,
        textAlign: 'center',
      }}>
        {label}
      </Text>
    </View>
  );
}