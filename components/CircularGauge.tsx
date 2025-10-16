import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface CircularGaugeProps {
  value: number;
  maxValue: number;
  size: number;
  strokeWidth: number;
  color: string;
  label: string;
  suffix?: string;
}

export default function CircularGauge({
  value,
  maxValue,
  size,
  strokeWidth,
  color,
  label,
  suffix = '',
}: CircularGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  
  const percentage = Math.min((value / maxValue) * 100, 100);
  const angle = (percentage / 100) * 270 - 135;
  
  const startAngle = -135;
  const endAngle = 135;
  
  const trackPath = describeArc(center, center, radius, startAngle, endAngle);
  const progressPath = describeArc(center, center, radius, startAngle, angle);
  
  function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  }
  
  function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    
    return [
      "M", start.x, start.y, 
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");
  }

  return (
    <View style={styles.container}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Path
            d={trackPath}
            fill="none"
            stroke="#2a2a3a"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <Path
            d={progressPath}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </Svg>
        
        <View style={[styles.valueContainer, { 
          width: size, 
          height: size,
          position: 'absolute',
          top: 0,
          left: 0,
        }]}>
          <Text style={[styles.value, { color }]}>
            {value}
          </Text>
          {suffix && (
            <Text style={[styles.suffix, { color }]}>
              {suffix}
            </Text>
          )}
        </View>
      </View>
      
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.maxValue}>{`max ${maxValue}`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 36,
    fontWeight: '700',
  },
  suffix: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: -4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  maxValue: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
});
