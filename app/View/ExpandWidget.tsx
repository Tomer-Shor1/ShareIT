import React, { useState } from "react";
import { View, Text, TouchableOpacity, Animated, StyleSheet, FlatList } from "react-native";
import { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

const FloatingActionButton = (requests) => {
  const [expanded, setExpanded] = useState(false);
  const size = useSharedValue(60);

  const animatedStyle = useAnimatedStyle(() => ({
    width: withTiming(expanded ? 300 : 60, { duration: 300 }),
    height: withTiming(expanded ? 400 : 60, { duration: 300 }),
    borderRadius: withTiming(expanded ? 10 : 30, { duration: 300 }),
  }));

  const items = Array.from({ length: 10 }, (_, i) => ({ id: i, text: `Item ${i + 1}` }));

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.8}>
        <Animated.View style={[styles.widget, animatedStyle]}>
          {expanded ? (
            <FlatList
              data={items}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.listItem} onPress={() => {/* Handle press */}}>
                  <Text style={styles.listItemText}>{item.text}</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.listContainer}
            />
          ) : (
            <Ionicons name="add" size={30} color="white" />
          )}
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 20,
    right: 20,
    zIndex: 1000,
  },
  widget: {
    backgroundColor: "#3498db",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    padding: 10,
  },
  listContainer: {
    padding: 10,
  },
  listItem: {
    backgroundColor: "#ecf0f1",
    padding: 15,
    marginVertical: 5,
    borderRadius: 5,
  },
  listItemText: {
    color: "#2c3e50",
    fontWeight: "bold",
  },
});

export default FloatingActionButton;
