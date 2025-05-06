import React, { useState } from 'react';
import { FlatList, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';

type EmojiPickerProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (icon: string) => void;
};

type IconCategories = {
  [key: string]: string[];
};

const iconCategories: IconCategories = {
  "Habits & Activities": [
    "fitness-center", "directions-run", "menu-book", "self-improvement", "water-drop", "restaurant", "palette", "music-note", "sports-esports", "edit", "track-changes", "sports-soccer",
    "sports-handball", "pedal-bike", "psychology", "create", "piano", "music-video", "camera-alt"
  ],
  "Health & Wellness": [
    "spa", "directions-walk", "medication", "restaurant-menu", "eco", "grass", "face", "pool", "water", "bedtime",
    "park", "coffee", "science", "food-bank", "medical-services", "clean-hands", "dentistry", "self-improvement", "pool", "explore"
  ],
  "Productivity": [
    "laptop", "smartphone", "email", "calendar-today", "alarm", "insert-chart", "check-circle", "trending-up", "lightbulb", "push-pin",
    "place", "track-changes", "assignment", "attachment", "search", "mobile-screen-share", "work", "folder", "edit-note", "edit"
  ],
  "Lifestyle": [
    "wb-sunny", "nightlight", "grass", "pets", "pets", "coffee", "home", "directions-car", "account-balance-wallet", "groups",
    "celebration", "card-giftcard", "chair", "bathtub", "bed", "theater-comedy", "movie", "tv", "headphones", "phone-android"
  ]
};

export function EmojiPicker({ visible, onClose, onSelect }: EmojiPickerProps) {
  const inputBackgroundColor = useThemeColor({}, "card");
  const textColor = useThemeColor({}, "text");
  const dayColor = useThemeColor({}, "icon");
  const tintColor = useThemeColor({}, "tint");
  const [selectedCategory, setSelectedCategory] = useState<string>(Object.keys(iconCategories)[0]);

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

  const renderIcon = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.iconButton}
      onPress={() => {
        onSelect(item);
        onClose();
      }}
    >
      <MaterialIcons name={item as any} size={28} color={textColor} />
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <ThemedView style={styles.emojiPickerContainer}>
        <ThemedView style={[styles.emojiPickerWrapper, { backgroundColor: inputBackgroundColor }]}>
          <FlatList
            data={Object.keys(iconCategories)}
            renderItem={renderCategory}
            keyExtractor={(item) => item}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            style={styles.categoryList}
          />
          <FlatList
            data={iconCategories[selectedCategory]}
            renderItem={renderIcon}
            keyExtractor={(item) => item}
            numColumns={5}
            style={styles.iconList}
            contentContainerStyle={styles.iconListContent}
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
    paddingVertical: 6,
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
    lineHeight: 16,
    textAlignVertical: 'center',
  },
  selectedCategoryText: {
    fontWeight: 'bold',
  },
  iconList: {
    flexGrow: 1,
  },
  iconListContent: {
    paddingVertical: 15,
  },
  iconButton: {
    width: '20%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
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