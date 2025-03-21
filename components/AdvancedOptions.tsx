import React from "react";
import { TextInput, TouchableOpacity, StyleSheet, View } from "react-native";
import { ThemedView } from "./ThemedView";
import { ThemedText } from "./ThemedText";
import { FontAwesome } from "@expo/vector-icons";

interface AdvancedOptionsProps {
  showAdvancedOptions: boolean;
  setShowAdvancedOptions: (show: boolean) => void;
  initialStreak: number;
  setInitialStreak: (streak: number) => void;
  backgroundColor: string;
  textColor: string;
  inputBackgroundColor: string;
  buttonColor: string;
  dayColor: string;
}

export const AdvancedOptions: React.FC<AdvancedOptionsProps> = ({
  showAdvancedOptions,
  setShowAdvancedOptions,
  initialStreak,
  setInitialStreak,
  backgroundColor,
  textColor,
  inputBackgroundColor,
  buttonColor,
  dayColor,
}) => {
  return (
    <ThemedView style={styles.advancedOptionsContainer}>
      <TouchableOpacity 
        style={styles.advancedOptionsHeader}
        onPress={() => setShowAdvancedOptions(!showAdvancedOptions)}
      >
        <ThemedText style={[styles.label, { color: textColor }]}>Advanced Options</ThemedText>
        <FontAwesome 
          name={showAdvancedOptions ? "chevron-up" : "chevron-down"} 
          size={16} 
          color={textColor} 
        />
      </TouchableOpacity>
      
      {showAdvancedOptions && (
        <ThemedView style={styles.advancedOptionsContent}>
          <ThemedText style={[styles.label, { color: textColor, marginTop: 15 }]}>Initial Streak</ThemedText>
          <ThemedText style={[styles.subLabel, { color: dayColor }]}>
            Set a starting streak if you're already tracking this habit elsewhere
          </ThemedText>
          
          <ThemedView style={styles.streakInputContainer}>
            <TouchableOpacity
              style={[styles.streakButton, { backgroundColor: buttonColor }]}
              onPress={() => setInitialStreak(Math.max(0, initialStreak - 1))}
            >
              <ThemedText style={{ color: backgroundColor, fontSize: 16 }}>-</ThemedText>
            </TouchableOpacity>
            
            <TextInput
              style={[
                styles.streakInput,
                { color: textColor, backgroundColor: inputBackgroundColor }
              ]}
              value={initialStreak.toString()}
              onChangeText={(text) => {
                const numericValue = text.replace(/[^0-9]/g, '');
                setInitialStreak(parseInt(numericValue) || 0);
              }}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={dayColor}
            />
            
            <TouchableOpacity
              style={[styles.streakButton, { backgroundColor: buttonColor }]}
              onPress={() => setInitialStreak(initialStreak + 1)}
            >
              <ThemedText style={{ color: backgroundColor, fontSize: 16 }}>+</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  advancedOptionsContainer: {
    marginTop: 20,
    borderRadius: 10,
  },
  advancedOptionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  advancedOptionsContent: {
    marginTop: 5,
    paddingBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
  },
  subLabel: {
    fontSize: 12,
    marginTop: 5,
  },
  streakInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  streakInput: {
    flex: 1,
    fontSize: 16,
    padding: 10,
    borderRadius: 10,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  streakButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});