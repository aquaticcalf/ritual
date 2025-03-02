import React from 'react';
import { FlatList, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';

type EmojiPickerProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
};

const emojis = [
  "💪", "🏃", "📚", "🧘", "💧", "🍎", "🎨", "🎵",
  "☀️", "🌙", "🌱", "🐶", "🐱", "☕", "💻", "💡"
];

export function EmojiPicker({ visible, onClose, onSelect }: EmojiPickerProps) {
  const inputBackgroundColor = useThemeColor({}, "card");
  const textColor = useThemeColor({}, "text");
  const dayColor = useThemeColor({}, "icon");

  const renderEmoji = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.emojiButton}
      onPress={() => {
        onSelect(item);
        onClose();
      }}
    >
      <ThemedText style={styles.emojiText}>{item}</ThemedText>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <ThemedView style={styles.emojiPickerContainer}>
        <ThemedView style={[styles.emojiPickerWrapper, { backgroundColor: inputBackgroundColor }]}>
          <FlatList
            data={emojis}
            renderItem={renderEmoji}
            keyExtractor={(item) => item}
            numColumns={4}
            style={styles.emojiList}
            contentContainerStyle={styles.emojiListContent}
          />
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: dayColor === textColor ? "#f0f0f0" : inputBackgroundColor }]}
            onPress={onClose}
          >
            <ThemedText style={styles.closeButtonText}>Close</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  emojiPickerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  emojiPickerWrapper: {
    width: "90%",
    height: 400,
    borderRadius: 10,
    overflow: "hidden",
    padding: 16,
    justifyContent: 'space-between',
  },
  emojiList: {
    flexGrow: 1,
  },
  emojiListContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiButton: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 8,
    padding: 8, // Added padding to ensure emojis are fully visible
  },
  emojiText: {
    fontSize: 24,
  },
  closeButton: {
    padding: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  }
});