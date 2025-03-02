import React, { useState, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { Button } from "react-native-paper";
import { TimePickerModal } from "react-native-paper-dates";
import { SafeAreaProvider } from "react-native-safe-area-context";

interface TimePickerProps {
  isEditing: boolean;
  time: Date;
  onTimeChange: (selectedTime: Date | undefined) => void;
}

const TimePicker: React.FC<TimePickerProps> = ({ isEditing, time, onTimeChange }) => {
  const [visible, setVisible] = useState(isEditing ? false : true);

  const onDismiss = useCallback(() => {
    setVisible(false);
  }, [setVisible]);

  const onConfirm = useCallback(
    ({ hours, minutes }: { hours: number; minutes: number }) => {
      setVisible(false);
      const selectedTime = new Date();
      selectedTime.setHours(hours);
      selectedTime.setMinutes(minutes);
      onTimeChange(selectedTime);
    },
    [setVisible, onTimeChange]
  );

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <Button mode="contained" onPress={() => setVisible(true)}>
          {time ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Set Time"}
        </Button>
        <TimePickerModal
          visible={visible}
          onDismiss={onDismiss}
          onConfirm={onConfirm}
          hours={time.getHours()}
          minutes={time.getMinutes()}
        />
      </View>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
  },
});

export default TimePicker;