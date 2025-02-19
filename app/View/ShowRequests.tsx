import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Button,
  ScrollView,
} from "react-native";
import { Reader } from "../ViewModel/Reader";
import { Writer } from "../ViewModel/Writer";

import { useRef } from 'react';
import { Animated} from 'react-native';

interface Request {
  id: string;
  title: string;
  currentCoordinates: string;
  currentAddress: string;
  destinationCoordinates: string;
  additionalNotes: string;
  phoneNumber: string;
  DestinationLoaction: string;
  caught: boolean; // Added caught field
  takenBy?: string; // Added takenBy field
}

const MyFavorsTab: React.FC = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string>("");
  const reader = new Reader();

  // Added for tabledropdown
  const [expanded, setExpanded] = useState(false);
  const [selectedHeader, setSelectedHeader] = useState('הזמנות שלקחתי');
  const animation = useRef(new Animated.Value(0)).current;

  // Added for tabledropdown
  const toggleDropdown = () => {
    Animated.timing(animation, {
        toValue: expanded ? 0 : 1,
        duration: 200,
        useNativeDriver: false,
    }).start();
    setExpanded(!expanded);
  };
  // Added for tabledropdown
  const selectHeader = (option) => {
      setSelectedHeader(option);
      toggleDropdown();
  };

  const renderRow = ({ item }: { item: Request }) => (
    <View style={styles.row}>
      {/* Title */}
      <View style={[styles.cellWrapper, styles.titleCell]}>
        <Text style={styles.cellText}>{item.title}</Text>
      </View>
  
      {/* Phone Number */}
      <View style={[styles.cellWrapper, styles.phoneCell]}>
        <Text style={styles.cellText}>{item.phoneNumber}</Text>
      </View>
  
      {/* Current Address */}
      <View style={styles.cellWrapper}>
        <Text style={styles.cellText}>{item.currentAddress}</Text>
      </View>
  
      {/* Destination Location */}
      <View style={styles.cellWrapper}>
        <Text style={styles.cellText}>{item.DestinationLoaction}</Text>
      </View>
  
      {/* Additional Notes */}
      <View style={[styles.cellWrapper, styles.notesCell]}>
        <Text style={styles.cellText}>{item.additionalNotes}</Text>
      </View>

      <View style={[styles.cellWrapper, styles.statusCell]}>
        <Text style={styles.cellText}>{item.caught ? "✔" : "⏳"}</Text>
      </View>
  
      {/* (Optional) Button - Uncomment if needed */}
      {/* <View style={styles.cellWrapper}>
        <TouchableOpacity style={styles.removeButton} onPress={() => handleAction(item.id)}>
          <Text style={styles.removeButtonText}>✘</Text>
        </TouchableOpacity>
      </View> */}
    </View>
  );

  useEffect(() => {
    const fetchRequests = async (selectedHeader) => {
      try {
        const auth = getAuth();
        const userId = auth.currentUser?.uid;
  
        if (!userId) {
          console.error("❌ User is not authenticated");
          return;
        }
        let fetchedRequests;
        if (selectedHeader === 'הזמנות שלקחתי')
        {
          fetchedRequests = await reader.ReadTakenRequestsByUser(userId);
        }
        else
        {
          fetchedRequests = await reader.ReadRequestsOpenedByUser(userId);
        }
        setRequests(fetchedRequests);
      } catch (error) {
        console.error("Error fetching requests:", error);
      }
    };
    fetchRequests(selectedHeader)
  }, [selectedHeader]);

  return (
    <View style={styles.container}>
        <TouchableOpacity onPress={toggleDropdown} style={styles.header}>
            <Text style={styles.headerText}>{selectedHeader}</Text>
        </TouchableOpacity>

        <Animated.View style={[styles.dropdown, { height: animation.interpolate({
            inputRange: [0, 1], outputRange: [0, 80]
        }) }]}> 
            {expanded && (
                <>
                    <TouchableOpacity onPress={() => selectHeader('הזמנות שלקחתי')} style={styles.option}>
                        <Text>הזמנות שלקחתי</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => selectHeader('הזמנות שפתחתי')} style={styles.option}>
                        <Text>הזמנות שפתחתי</Text>
                    </TouchableOpacity>
                </>
            )}
        </Animated.View>
        
        <FlatList
          data={requests}
          renderItem={renderRow}
          keyExtractor={(item) => item.id}
          style={{ maxHeight: 600 }}
          contentContainerStyle={{ paddingBottom: 10 }}
        />
    </View>
  );
}



const FavorsTab: React.FC = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string>("");
  const reader = new Reader();

  useEffect(() => {
    // Fetch requests when the tab is loaded
    const fetchRequests = async () => {
      try {
        const fetchedRequests = await reader.ReadOpenRequests();
        setRequests(fetchedRequests);
      } catch (error) {
        console.error("Error fetching requests:", error);
      }
    };

    fetchRequests();
  }, []);

  const handleAction = (id: string): void => {
    setSelectedRequestId(id);
    setModalVisible(true);
  };

  // sets the caught field to true and opens a WhatsApp chat window
  const confirmAction = async (): Promise<void> => {
    try {
      const selectedRequest = requests.find(
        (request) => request.id === selectedRequestId
      );
  
      if (!selectedRequest) {
        console.error("Request not found");
        setModalVisible(false);
        return;
      }
  

    // Update the caught field in the database
    await Writer.setRequestCaught(selectedRequestId, true);

    let phoneNumber = selectedRequest.phoneNumber;

    if (phoneNumber.startsWith("0")) {
      phoneNumber = "+972" + phoneNumber.slice(1); 
    }

    const whatsappLink = `https://wa.me/${phoneNumber}`;
    console.log(whatsappLink);

    window.open(whatsappLink, "_blank");
  

    // Update the state to remove the request locally
    setRequests((prevRequests) =>
      prevRequests.filter((request) => request.id !== selectedRequestId)
    );
    
    //window.open(whatsappLink, "_blank");

    setModalVisible(false);
    } catch (error) {
      console.error("Error updating request:", error);
      setModalVisible(false);
    }
  };
  
  const renderRow = ({ item }: { item: Request }) => (
    <View style={styles.row}>
      <View style={styles.cellWrapper}>
        <Text style={styles.cellText}>{item.title}</Text>
      </View>
      <View style={styles.cellWrapper}>
        <Text style={styles.cellText}>{item.phoneNumber}</Text>
      </View>
      <View style={styles.cellWrapper}>
        <Text style={styles.cellText}>{item.currentAddress}</Text>
      </View>
      <View style={styles.cellWrapper}>
        <Text style={styles.cellText}>{item.DestinationLoaction}</Text>
      </View>
      <View style={styles.cellWrapper}>
        <Text style={styles.cellText}>{item.additionalNotes}</Text>
      </View>
      <View style={styles.cellWrapper}>
        <Button
          title="✘"
          onPress={() => handleAction(item.id)}
          color="red"
        />
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.container}>
      <Text style={styles.sectionTitle}>הזמנות בסביבה</Text>
        <View style={[styles.row, styles.header]}>
          <View style={styles.cellWrapper}>
            <Text style={styles.headerText}>Title</Text>
          </View>
          <View style={styles.cellWrapper}>
            <Text style={styles.headerText}>Phone Number</Text>
          </View>
          <View style={styles.cellWrapper}>
            <Text style={styles.headerText}>Start Address</Text>
          </View>
          <View style={styles.cellWrapper}>
            <Text style={styles.headerText}>Destination Address</Text>
          </View>
          <View style={styles.cellWrapper}>
            <Text style={styles.headerText}>Additional Notes</Text>
          </View>
          <View style={styles.cellWrapper}>
            <Text style={styles.headerText}>Select Favor</Text>
          </View>
        </View>

        {/* Table Content */}
        <FlatList
          data={requests}
          renderItem={renderRow}
          keyExtractor={(item) => item.id}
          style={{ maxHeight: 600 }}
          contentContainerStyle={{ paddingBottom: 10 }}
        />
      </View>

      {/* Modal for Actions */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>
              Are you sure you want to take this request?
            </Text>
            <View style={styles.buttonContainer}>
              <Button
                title="Cancel"
                onPress={() => setModalVisible(false)}
                color="red"
              />
              <Button
                title="Yes"
                onPress={confirmAction}
                color="green"
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: "#f4f6f9", // Softer background color for a clean look
  },

  // Header styles
  header: {
    backgroundColor: "#3b5998", // Deep blue for a modern header
    borderBottomWidth: 2,
    borderBottomColor: "#ccc",
    paddingVertical: 12,
    borderRadius: 8,
  },
  headerText: {
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
    color: "white",
  },

  statusCell: {
    minWidth: 80,
    backgroundColor: "#dff0d8",
    paddingVertical: 8,
    borderRadius: 5,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    color: "#3b5998",
    marginVertical: 15, // Adds spacing before and after title
    backgroundColor: "#f9f9f9",
    paddingVertical: 8,
    borderRadius: 5,
  },

  notesCell: {
    maxWidth: 120, // Prevents text from stretching too wide
    textAlign: "center",
    backgroundColor: "#f9f9f9",
    paddingVertical: 8,
    borderRadius: 5,
  },

  titleCell: {
    backgroundColor: "#f4f4f4",
    paddingVertical: 12,
    borderRadius: 5,
  },
  phoneCell: {
    backgroundColor: "#e8f0fe",
    paddingVertical: 8,
    borderRadius: 5,
  },

  // Table row
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    marginBottom: 6, // Adds spacing between rows
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Android shadow
  },

  // Table cells
  cellWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  cellText: {
    fontSize: 14,
    textAlign: "center",
    flexWrap: "wrap",
    color: "#333", // Slightly darker for contrast
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Dimmed background
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 25,
    borderRadius: 15,
    elevation: 5,
    width: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  modalText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: "center",
    color: "#2C3E50", // Modern deep blue-gray
    fontWeight: "600",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dropdown: { 
    overflow: 'hidden', 
    backgroundColor: '#f9f9f9', 
    borderRadius: 5, 
    marginTop: 5 
  },
  option: { 
    padding: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: '#ccc' 
  },
});

export default FavorsTab;
export { MyFavorsTab };


