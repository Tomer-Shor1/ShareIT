import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  StyleSheet,
} from "react-native";
import { AbstractList, AbstractListItem } from "../utils/types";
import { updateExistingList } from "@/services/api";
import {useAuth} from '../context/AuthContext';

// TODO: notifications, get random item can return completed item, list class

interface ListComponentProps {
  sourceList: AbstractList;
  updateAndSyncList: (updatedList: AbstractList, index: number) => void;
  listIndex: number;
}

const ListComponent: React.FC<ListComponentProps> = ({ sourceList,listIndex,updateAndSyncList}) => {
  const [list, setList] = useState<AbstractList>(sourceList);
  const [inputValue, setInputValue] = useState<string>("");
  const [date, setDate] = useState<Date | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [notificationFrequency, setNotificationFrequency] = useState<
    string | null
  >(null);
  const {userToken} = useAuth();

  useEffect(() => {
    setDate(list.date);
    updateProgress(list.items);
  }, [list]);

  // Helper Functions
  const calculateProgress = (currentItems: AbstractListItem[]) => {
    if (!currentItems) return 0;
    const completedCount = currentItems.filter((item) => item.completed).length;
    return currentItems.length
      ? (completedCount / currentItems.length) * 100
      : 0;
  };

  const updateProgress = (currentItems: AbstractListItem[]) => {
    setProgress(calculateProgress(currentItems));
  };

  // Function to add an item
  const addItem = (text: string) => {
    if (text.trim() === "") {
      Alert.alert("Error", "Item cannot be empty!");
      return;
    }
    const newItem = new AbstractListItem(text);
    // const newList = [...list, newItem];

    const newList = AbstractList.fromPlainObject({
      ...list,
      items: [...list.items, newItem],
    });
    setList(newList);
    setInputValue("");
    updateProgress(newList.items);
    updateAndSyncList(newList,listIndex);
  };

  // Function to get a random item
  const getRandomItem = () => {
    if (list.items.length === 0) {
      Alert.alert("Info", "No items in the list!");
      return;
    }
    const filteredList = list.items.filter((item) => !item.completed);
    if (filteredList.length === 0) {
      Alert.alert("Info", "No items in filtered list!");
      return;
    }
    const randomItem =
      filteredList[Math.floor(Math.random() * filteredList.length)];
    Alert.alert("Random Item", randomItem.text);
  };

  // Function to delete an item
  const deleteItem = (index: number) => {
    const updatedItems = [...list.items];
    updatedItems.splice(index, 1);
    const updatedList = AbstractList.fromPlainObject({
      ...list,
      items: updatedItems,
    });
    setList(updatedList);
    updateProgress(updatedItems);
    updateAndSyncList(updatedList,listIndex);
  };

  // Function to mark an item as completed
  const markAsCompleted = (index: number) => {
    const updatedItems = [...list.items];
    updatedItems[index].completed = !updatedItems[index].completed;
    const updatedList = AbstractList.fromPlainObject({
      ...list,
      items: updatedItems,
    });
    setList(updatedList);
    updateProgress(updatedItems);
    updateAndSyncList(updatedList,listIndex);
  };

  // Function to set notification frequency
  const setNotification = (frequency: string) => {
    setNotificationFrequency(frequency);
    Alert.alert("Notification Set", `Reminder set to: ${frequency}`);
  };

  return (
    <View style={styles.container}>

      <Text>{list.title ? list.title : ""}</Text>
      <Text style={styles.subTitle}>
        Created on: {date ? date.toString() : ""}
      </Text>
      <View
        style={{
          marginBottom: 30,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <Text style={styles.progress}>Progress: {progress.toFixed(1)}%</Text>
        <TouchableOpacity style={styles.randomButton} onPress={getRandomItem}>
          <Text style={styles.buttonText}>Get Random Item</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => setNotification("Every Saturday")}
        >
          <Text style={styles.buttonText}>Set Weekly Notification</Text>
        </TouchableOpacity>
      </View>

      {/* Add Item Input */}

      <TextInput
        style={styles.input}
        placeholder="Add a new item"
        value={inputValue}
        onChangeText={setInputValue}
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => addItem(inputValue)}
      >
        <Text style={styles.buttonText}>Add Item</Text>
      </TouchableOpacity>

      {/* List of Items */}
      <FlatList
        data={list.items}
        // keyExtractor={(item,index) => index.toString()}
        renderItem={({ item, index }) => (
          <View style={styles.listItem}>
            <Text
              style={item.completed ? styles.completedItem : styles.itemText}
            >
              {item.text}
            </Text>
            <TouchableOpacity onPress={() => markAsCompleted(index)}>
              <Text style={styles.actionText}>✔️</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteItem(index)}>
              <Text style={styles.actionText}>❌</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    flexDirection: "column",
    flex: 1,
  },
  title: {
    justifyContent: "center",
    alignItems: "center",
    fontSize: 24,
    color: "#555",
    fontWeight: "bold",
    // marginBottom: 10,
  },
  subTitle: {
    fontSize: 14,
    color: "#555",
    marginBottom: 20,
  },
  progress: {
    fontSize: 16,
    marginBottom: 20,
    textAlign:'center',
  },
  input: {
    height: 40,
    borderColor: "#6200ee",
    color: "black",
    borderWidth: 1,
    borderRadius: 5,
    // padding: 10,
    marginBottom: 10,
  },
  addButton: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#6200ee",
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    fontSize: 8,
    color: "black",
    fontWeight: "bold",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  itemText: {
    fontSize: 16,
    color: "#1e252b",
  },
  completedItem: {
    fontSize: 16,
    textDecorationLine: "line-through",
    color: "#aaa",
  },
  actionText: {
    fontSize: 20,
    marginHorizontal: 5,
    color: "#1e252b",
  },
  randomButton: {
    backgroundColor: "#03dac6",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  notificationButton: {
    backgroundColor: "#ff5722",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  textBlack: {
    color: "#000",
  },
});

export default ListComponent;
