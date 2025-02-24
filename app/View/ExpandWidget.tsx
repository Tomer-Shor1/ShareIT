import React, { useState } from "react";
import { View, Text, TouchableOpacity, Animated, StyleSheet, FlatList, Modal, Image } from "react-native";
import { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

const FloatingActionButton = ({ requests }) => {
  const [expanded, setExpanded] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const animatedStyle = useAnimatedStyle(() => ({
    width: withTiming(expanded ? 300 : 60, { duration: 300 }),
    height: withTiming(expanded ? 400 : 60, { duration: 300 }),
    // Fixed borderRadius to 10 to maintain a rectangular shape in collapsed state.
    borderRadius: withTiming(10, { duration: 300 }),
  }));

  if (!requests || requests.length === 0) {
    return null;
  }

  // Helper to convert Firestore timestamps to a readable string.
  const formatTimestamp = (timestamp) => {
    if (timestamp && typeof timestamp.toDate === "function") {
      return timestamp.toDate().toLocaleString();
    }
    return timestamp;
  };

  // Returns background color based on request status.
  const getButtonColor = (status) => {
    switch (status) {
      case "pending":
        return "#f1c40f"; // yellow
      case "ongoing":
        return "#e67e22"; // orange
      case "awaitingForApproval":
        return "#2ecc71"; // green
      case "finished":
        return "#3498db"; // blue
      default:
        return "#3498db";
    }
  };
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.8}>
        <Animated.View style={[styles.widget, animatedStyle]}>
          {expanded ? (
            <FlatList
              data={requests}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.listItem,
                    { backgroundColor: getButtonColor(item.status) }
                  ]}
                  onPress={() => setSelectedRequest(item)}
                >
                  <View style={styles.itemContent}>
                    <View style={styles.takenByContainer}>
                      {item.takenByImage ? (
                        <Image source={{ uri: `data:image/jpeg;base64,${item.takenByImage}` }} style={styles.takenByImage} />
                      ) : (
                        <View style={styles.takenByPlaceholder}>
                          <Text style={styles.takenByPlaceholderText}>?</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.listItemText}>{item.title}</Text>
                  </View>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.listContainer}
            />
          ) : (
            <Ionicons name="add" size={30} color="white" />
          )}
        </Animated.View>
      </TouchableOpacity>
      {selectedRequest && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={!!selectedRequest}
          onRequestClose={() => setSelectedRequest(null)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{selectedRequest.title}</Text>
              <Text>Current Coordinates: {selectedRequest.currentCoordinates}</Text>
              <Text>Current Address: {selectedRequest.currentAddress}</Text>
              <Text>Destination Location: {selectedRequest.DestinationLoaction}</Text>
              <Text>Additional Notes: {selectedRequest.additionalNotes}</Text>
              <Text>Phone Number: https://wa.me/${selectedRequest.phoneNumberr}</Text>
              {/* <Text>Timestamp: {formatTimestamp(selectedRequest.timestamp)}</Text> */}
              {/* <Text>UID: {selectedRequest.uid}</Text> */}
              {/* <Text>Created At: {formatTimestamp(selectedRequest.createdAt)}</Text> */}
              {/* <Text>Updated At: {formatTimestamp(selectedRequest.updatedAt)}</Text> */}
              <Text>Status: {selectedRequest.status}</Text>
              {/* <Text>Taken By: {selectedRequest.takenBy}</Text> */}
              <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedRequest(null)}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
    //add taken by ,open by
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
    // backgroundColor: "#3498db",
    backgroundColor: "#2b2b2b",
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
    borderRadius: 5,
    marginVertical: 5,
    padding: 10,
  },
  itemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  takenByContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    overflow: "hidden",
    marginRight: 10,
  },
  takenByImage: {
    width: "100%",
    height: "100%",
  },
  takenByPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#bdc3c7",
    alignItems: "center",
    justifyContent: "center",
  },
  takenByPlaceholderText: {
    color: "white",
    fontWeight: "bold",
  },
  listItemText: {
    color: "#2c3e50",
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "flex-end",
    alignItems: "flex-end",
    padding: 20,
  },
  modalContent: {
    width: 250,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  closeButton: {
    marginTop: 15,
    backgroundColor: "#2b2b2b",
    padding: 10,
    borderRadius: 5,
    alignSelf: "center",
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default FloatingActionButton;

