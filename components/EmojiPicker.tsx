import React, { useState, useRef } from 'react';
import { FlatList, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import PagerView from 'react-native-pager-view';

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
    "fitness-center", "directions-run", "book", "psychology", "opacity", "restaurant", "palette", "music-note", "games", "edit", "track-changes", "sports-soccer",
    "sports-handball", "pedal-bike", "psychology", "create", "piano", "music-video", "photo-camera"
  ],
  "Health & Wellness": [
    "spa", "directions-walk", "medication", "restaurant-menu", "eco", "grass", "face", "pool", "water", "bedtime",
    "park", "local-cafe", "science", "local-dining", "medical-services", "clean-hands", "medical-services", "self-improvement", "pool", "explore"
  ],
  "Productivity": [
    "laptop", "smartphone", "email", "today", "alarm", "insert-chart", "check-circle", "trending-up", "lightbulb", "push-pin",
    "place", "track-changes", "assignment", "attach-file", "search", "screen-share", "work", "folder", "edit-note", "edit"
  ],
  "Lifestyle": [
    "wb-sunny", "nights-stay", "grass", "pets", "pets", "local-cafe", "home", "directions-car", "account-balance-wallet", "groups",
    "celebration", "card-giftcard", "chair", "bathtub", "bed", "theater-comedy", "local-movies", "tv", "headphones", "phone-android"
  ]
};

export function EmojiPicker({ visible, onClose, onSelect }: EmojiPickerProps) {
  const inputBackgroundColor = useThemeColor({}, "card");
  const textColor = useThemeColor({}, "text");
  const dayColor = useThemeColor({}, "icon");
  const tintColor = useThemeColor({}, "tint");
  const [selectedCategory, setSelectedCategory] = useState<string>(Object.keys(iconCategories)[0]);
  const pagerRef = useRef<PagerView>(null);
  const categoryListRef = useRef<FlatList>(null);

  const categories = Object.keys(iconCategories);

  const handlePageSelected = (event: any) => {
    const newIndex = event.nativeEvent.position;
    const newCategory = categories[newIndex];
    setSelectedCategory(newCategory);
    categoryListRef.current?.scrollToIndex({
      index: newIndex,
      animated: true,
      viewPosition: 0.5
    });
  };

  const renderCategory = ({ item, index }: { item: string; index: number }) => (
    <TouchableOpacity
      style={[
        styles.categoryTab,
        selectedCategory === item && [
          styles.selectedCategory,
          { backgroundColor: tintColor + '20', borderColor: tintColor }
        ],
        selectedCategory !== item && { borderColor: textColor }
      ]}
      onPress={() => {
        setSelectedCategory(item);
        pagerRef.current?.setPage(index);
      }}
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

  const renderPage = (category: string) => (
    <View style={styles.pageContainer}>
      <FlatList
        data={iconCategories[category]}
        renderItem={renderIcon}
        keyExtractor={(item) => item}
        numColumns={5}
        style={styles.iconList}
        contentContainerStyle={styles.iconListContent}
      />
    </View>
  );

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <ThemedView style={styles.emojiPickerContainer}>
        <ThemedView style={[styles.emojiPickerWrapper, { backgroundColor: inputBackgroundColor }]}>
          <FlatList
            ref={categoryListRef}
            data={categories}
            renderItem={({ item, index }) => renderCategory({ item, index })}
            keyExtractor={(item) => item}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            style={styles.categoryList}
            getItemLayout={(data, index) => ({
              length: 120,
              offset: 120 * index,
              index,
            })}
          />
          
          <PagerView
            ref={pagerRef}
            style={styles.pagerView}
            initialPage={0}
            onPageSelected={handlePageSelected}
          >
            {categories.map((category) => (
              <View key={category}>
                {renderPage(category)}
              </View>
            ))}
          </PagerView>

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
    maxHeight: 40,
    marginBottom: 6,
  },
  categoryTab: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 4,
    marginRight: 4,
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
    paddingVertical: 8,
  },
  iconButton: {
    width: '20%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
  },
  closeButton: {
    padding: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  pagerView: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
  }
});