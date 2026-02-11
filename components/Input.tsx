import React from 'react';
import { 
  View, 
  TextInput, 
  Text, 
  StyleSheet, 
  TextInputProps,
  ViewStyle
} from 'react-native';
import Colors from '@/constants/colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  id?: string;
  name?: string;
}

export default function Input({ 
  label, 
  error, 
  containerStyle,
  id,
  name,
  ...props 
}: InputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {Boolean(label) && <Text style={styles.label}>{label}</Text>}
      <TextInput 
        style={[
          styles.input, 
          error && styles.inputError,
          props.editable === false && styles.inputDisabled
        ]}
        placeholderTextColor={Colors.textSecondary}
        id={id}
        aria-label={name || label}
        {...props}
      />
      {Boolean(error) && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
  },
  inputError: {
    borderColor: Colors.error,
  },
  inputDisabled: {
    backgroundColor: Colors.border,
    color: Colors.textSecondary,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginTop: 4,
  },
});