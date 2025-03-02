import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { RadioButton } from 'react-native-paper';
import { useState } from 'react';

export default function Settings() {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');
  const buttonColor = useThemeColor({}, 'tint');
  const habitItemBackgroundColor = useThemeColor({}, 'card');

  const [theme, setTheme] = useState('system');

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <ThemedText style={[styles.header, { color: textColor }]}>Settings</ThemedText>
      <ThemedView style={styles.settingsContainer}>
        <ThemedText style={[styles.settingLabel, { color: textColor }]}>Theme</ThemedText>
        <ThemedView style={[styles.themeContainer, { backgroundColor: habitItemBackgroundColor }]}>
          <RadioButton.Group onValueChange={newValue => setTheme(newValue)} value={theme}>
            <ThemedView style={[styles.themeItem, { backgroundColor: habitItemBackgroundColor }]}>
              <ThemedText style={{ color: textColor }}>System</ThemedText>
              <RadioButton value="system" color={iconColor} />
            </ThemedView>
            <ThemedView style={[styles.themeItem, { backgroundColor: habitItemBackgroundColor }]}>
              <ThemedText style={{ color: textColor }}>Light</ThemedText>
              <RadioButton value="light" color={iconColor} />
            </ThemedView>
            <ThemedView style={[styles.themeItem, { backgroundColor: habitItemBackgroundColor }]}>
              <ThemedText style={{ color: textColor }}>Dark</ThemedText>
              <RadioButton value="dark" color={iconColor} />
            </ThemedView>
          </RadioButton.Group>
          <ThemedText style={styles.disclaimer}>*Theme setting is currently not working</ThemedText>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,  
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 20,
  },
  settingsContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  settingLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
  },
  themeContainer: {
    display: 'flex',
    flexDirection: 'column',
    padding: 10,
    borderRadius: 10,
    marginTop: 5,
  },
  themeItem: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
  },
  disclaimer: {
    fontSize: 12,
    marginTop: 5,
    opacity: 0.5,
  },
});
