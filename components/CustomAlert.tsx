import React from 'react';
import { Modal, StyleSheet, TouchableOpacity, View, Pressable } from 'react-native';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  buttons?: Array<{
    text: string;
    onPress: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }>;
  onDismiss?: () => void;
}

export function CustomAlert({ visible, title, message, buttons = [], onDismiss }: CustomAlertProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const cardBackgroundColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const buttonColor = useThemeColor({}, 'tint');
  const errorColor = useThemeColor({}, 'errorColor');
  const secondaryTextColor = useThemeColor({}, 'tabIconDefault');

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss();
    }
  };

  const handleButtonPress = (onPress: () => void) => {
    onPress();
    handleDismiss();
  };

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={handleDismiss}
      animationType="fade"
    >
      <Pressable style={styles.overlay} onPress={handleDismiss}>
        <Pressable onPress={(e) => e.stopPropagation()}>
          <ThemedView style={[styles.alertContainer, { backgroundColor: cardBackgroundColor }]}>
            <ThemedText style={[styles.title, { color: textColor }]}>{title}</ThemedText>
            <ThemedText style={[styles.message, { color: secondaryTextColor }]}>{message}</ThemedText>
            
            <View style={styles.buttonContainer}>
              {buttons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    { 
                      backgroundColor: 
                        button.style === 'destructive' ? errorColor :
                        button.style === 'cancel' ? 'transparent' :
                        buttonColor
                    }
                  ]}
                  onPress={() => handleButtonPress(button.onPress)}
                >
                  <ThemedText
                    style={[
                      styles.buttonText,
                      { 
                        color: button.style === 'cancel' ? buttonColor : backgroundColor,
                        fontWeight: button.style === 'cancel' ? '400' : '600'
                      }
                    ]}
                  >
                    {button.text}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </ThemedView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContainer: {
    width: '80%',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
  },
});