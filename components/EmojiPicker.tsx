import React, { useState } from 'react';
import { FlatList, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';

type EmojiPickerProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
};

type EmojiCategories = {
  [key: string]: string[];
};

const emojiCategories: EmojiCategories = {
  "Habits & Activities": [
    "💪", "🏃", "📚", "🧘", "💧", "🍎", "🎨", "🎵", "🎮", "✍️", "🎯", "⚽️",
    "🏋️", "🚴", "🧠", "📝", "🎸", "🎹", "📸"
  ],
  "Health & Wellness": [
    "🧘‍♀️", "🏃‍♀️", "💊", "🥗", "🥑", "🥦", "💆‍♀️", "🧘", "🚰", "😴",
    "🌿", "🍵", "🧪", "🥩", "⚕️", "🧼", "🦷", "🧘‍♂️", "🏊‍♂️", "🧭"
  ],
  "Productivity": [
    "💻", "📱", "✉️", "📅", "⏰", "📊", "✅", "📈", "💡", "📌",
    "📍", "🎯", "📋", "📎", "🔍", "📲", "💼", "📁", "📝", "✏️"
  ],
  "Lifestyle": [
    "☀️", "🌙", "🌱", "🐶", "🐱", "☕", "🏠", "🚗", "💰", "👥",
    "🎉", "🎁", "🛋️", "🛀", "🛌", "🎭", "🎬", "📺", "🎧", "📱"
  ]
};

export function EmojiPicker({ visible, onClose, onSelect }: EmojiPickerProps) {
  const inputBackgroundColor = useThemeColor({}, "card");
  const textColor = useThemeColor({}, "text");
  const dayColor = useThemeColor({}, "icon");
  const tintColor = useThemeColor({}, "tint");
  const [selectedCategory, setSelectedCategory] = useState<string>(Object.keys(emojiCategories)[0]);

  const renderCategory = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.categoryTab,
        selectedCategory === item && [
          styles.selectedCategory,
          { backgroundColor: tintColor + '20', borderColor: tintColor }
        ],
        selectedCategory !== item && { borderColor: textColor }
      ]}
      onPress={() => setSelectedCategory(item)}
    >
      <ThemedText 
        style={[
          styles.categoryText, 
          selectedCategory === item && { color: tintColor }
        ]}
      >
        {item}
      </ThemedText>
    </TouchableOpacity>
  );

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
            data={Object.keys(emojiCategories)}
            renderItem={renderCategory}
            keyExtractor={(item) => item}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            style={styles.categoryList}
          />
          <FlatList
            data={emojiCategories[selectedCategory]}
            renderItem={renderEmoji}
            keyExtractor={(item) => item}
            numColumns={5}
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
    height: 450,
    borderRadius: 15,
    overflow: "hidden",
    padding: 16,
    justifyContent: 'space-between',
  },
  categoryList: {
    maxHeight: 50,
    marginBottom: 10,
  },
  categoryTab: {
    paddingHorizontal: 12,
    paddingVertical: 6, // Reduced from 8
    marginRight: 10,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCategory: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderColor: '#007AFF',
  },
  categoryText: {
    fontSize: 14,
    lineHeight: 16, // Added to control text height
    textAlignVertical: 'center', // Added for better vertical alignment
  },
  selectedCategoryText: {
    fontWeight: 'bold',
  },
  emojiList: {
    flexGrow: 1,
  },
  emojiListContent: {
    paddingVertical: 15, // Increased padding to give more space
  },
  emojiButton: {
    width: '20%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0, // Remove padding to prevent emoji clipping
  },
  emojiText: {
    fontSize: 28,
    lineHeight: 32, // Add lineHeight to ensure proper vertical spacing
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  closeButton: {
    padding: 12,
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 10,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  }
});