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
  GestureResponderEvent,
  Linking,
  Dimensions,
} from "react-native";
import { Reader } from "../ViewModel/Reader";
import { Writer } from "../ViewModel/Writer";

import { useRef } from 'react';
import { Animated} from 'react-native';
import { sendNotification } from "./NotificationService";
import { DatabaseManager } from "../Model/databaseManager";

interface Request {
  id: string;
  title: string;
  currentCoordinates: string;
  currentAddress: string;
  destinationCoordinates: string;
  additionalNotes: string;
  phoneNumber: string;
  DestinationLoaction: string;
  status: string; 
  takenBy?: string; 
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
  const EndOngoing = async (requestId: string) => {
    try {
      await Writer.changeReqeustStatus(requestId, "awaitingForApproval");
      // עדכון state או רענון הנתונים במידת הצורך
      console.log(`סטטוס הבקשה ${requestId} שונה ל-awaitingForApproval`);
    } catch (error) {
      console.error("שגיאה בעדכון הסטטוס:", error);
    }
  };
  
  const finishApproval = async (requestId: string) => {
    try {
      // change the status of the request to finished
      await Writer.changeReqeustStatus(requestId, "finished");
      // if accepted, send notification to the user
       
      let takenByUserID = await DatabaseManager.getRequestTaker(requestId);

      // add one coin to the other user
      takenByUserID? DatabaseManager.addCoinsToUser(takenByUserID, 1) : console.log("No user to give coins to");

      console.log(`סטטוס הבקשה ${requestId} שונה ל-finished`);
    } catch (error) {
      console.error("שגיאה בעדכון הסטטוס:", error);
    }
  };
  
  const revertApproval = async (requestId: string) => {
    try {
      await Writer.changeReqeustStatus(requestId, "ongoing");
      // עדכון state או רענון הנתונים במידת הצורך
      console.log(`סטטוס הבקשה ${requestId} שונה ל-ongoing`);
    } catch (error) {
      console.error("שגיאה בעדכון הסטטוס:", error);
    }
  };
  
  const openWhatsApp = (phoneNumber: string) => {
    // קישור לפתיחת שיחה בוואצאפ עם המספר
    const url = `https://wa.me/${phoneNumber}`;
    Linking.openURL(url).catch(err => console.error("שגיאה בפתיחת WhatsApp:", err));
  };
  
  const renderRow = ({ item }: { item: Request }) => (
    <View style={styles.row}>
      {/* במצב "ongoing" – כפתור אחד */}
      
      { item.status === "ongoing" && (
        <View style={[styles.cellWrapper, styles.finishButtonWrapper]}>
          <TouchableOpacity onPress={() => EndOngoing(item.id)} style={styles.finishButton}>
            <Text style={styles.finishButtonText}>✔</Text>
          </TouchableOpacity>
        </View>
      )}
  
      {/* במצב "awaitingForApproval" – שני כפתורים וגם קישור לוואצאפ */}
      {item.status === "awaitingForApproval" && (
        <View style={[styles.cellWrapper, styles.approvalButtonsWrapper]}>
          {/* כפתור ✔ – לעדכון ל־finished */}
          <TouchableOpacity onPress={() => finishApproval(item.id)} style={styles.finishButton}>
            <Text style={styles.finishButtonText}>✔</Text>
          </TouchableOpacity>
          {/* כפתור ✘ – לעדכון ל־ongoing */}
          <TouchableOpacity onPress={() => revertApproval(item.id)} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>✘</Text>
          </TouchableOpacity>
          {/* כפתור לפתיחת WhatsApp עם המספר מהבקשה */}
          <TouchableOpacity onPress={() => openWhatsApp(item.phoneNumber)} style={styles.whatsAppButton}>
            <Text style={styles.whatsAppButtonText}>WhatsApp</Text>
          </TouchableOpacity>
        </View>
      )}
  
      {/* שאר התאים */}
      <View style={[styles.cellWrapper, styles.titleCell]}>
        <Text style={styles.cellText}>{item.title}</Text>
      </View>
  
      <View style={[styles.cellWrapper, styles.phoneCell]}>
        <Text style={styles.cellText}>{item.phoneNumber}</Text>
      </View>
  
      <View style={styles.cellWrapper}>
        <Text style={styles.cellText}>{item.currentAddress}</Text>
      </View>
  
      <View style={styles.cellWrapper}>
        <Text style={styles.cellText}>{item.DestinationLoaction}</Text>
      </View>
  
      <View style={[styles.cellWrapper, styles.notesCell]}>
        <Text style={styles.cellText}>{item.additionalNotes}</Text>
      </View>
  
      <View style={[styles.cellWrapper, styles.statusCell]}>
        <Text style={styles.cellText}>
          {item.status === "finished" ? "✔" : "⏳"}
        </Text>
      </View>
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


  //
  function handleAcceptRequest(id: any): void {
    throw new Error("Function not implemented.");
  }

  function cancelrequest(id: any): void {
    throw new Error("Function not implemented.");
  }

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



  


  // This function handels the process of taking a package by other user
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
  

    // Update the status field in the database
    await Writer.changeReqeustStatus(selectedRequestId, "ongoing");



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
            <Text style={styles.headerText}>כותרת הזמנה</Text>
          </View>
          <View style={styles.cellWrapper}>
            <Text style={styles.headerText}>מספר טלפון של המזמין</Text>
          </View>
          <View style={styles.cellWrapper}>
            <Text style={styles.headerText}>כתובת התחלה</Text>
          </View>
          <View style={styles.cellWrapper}>
            <Text style={styles.headerText}>כתובת יעד</Text>
          </View>
          <View style={styles.cellWrapper}>
            <Text style={styles.headerText}>מידע נוסף</Text>
          </View>
          <View style={styles.cellWrapper}>
            <Text style={styles.headerText}>לחץ כדי לעזור!</Text>
          </View>
        </View>

        {/* Table Content */}
        <FlatList
          data={requests}
          renderItem={renderRow}
          keyExtractor={(item) => item.id}
          style={{ maxHeight: 600 }}
          contentContainerStyle={{ paddingBottom: 20 }}
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

const { width: screenWidth } = Dimensions.get('window');



const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
    backgroundColor: "#f4f6f9", // רקע רך
  },
  // מעטפת כפתורי האישור/ביטול
  approvalButtonsWrapper: {
    flexDirection: 'row',
    // אפשר להחליף ל־'space-evenly' או 'space-between' בהתאם להעדפה
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: 10, // רווח אנכי בין הכפתורים לרכיבים אחרים
  },

  // כפתור ביטול (✘)
  cancelButton: {
    backgroundColor: '#d9534f',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginHorizontal: 5, // רווח בין כפתורים
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },

  // כפתור WhatsApp
  whatsAppButton: {
    backgroundColor: '#25D366',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 4,
    marginHorizontal: 5, // רווח בין כפתורים
  },
  whatsAppButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },

  // finish button
  finishButtonWrapper: {
    // 
    justifyContent: 'center',
    alignItems: 'center',
  },
  finishButton: {
    backgroundColor: 'green',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 4,
    marginHorizontal: 5, // margin between buttons
  },
  finishButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },

  // Header styles
  header: {
    backgroundColor: "#3b5998", // Header color
    borderBottomWidth: 2,
    borderBottomColor: "#ccc",
    paddingVertical: 2,
    borderRadius: 2,
  },
  headerText: {
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 11,
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
    marginVertical: 15,
    backgroundColor: "#f9f9f9",
    paddingVertical: 8,
    borderRadius: 5,
  },

  notesCell: {
    maxWidth: 120,
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

  // 
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    marginBottom: 6,
    shadowColor: "#000",
    shadowOffset: { width: 3, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // for android
  },

  // 
  cellWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 0.02,
    paddingHorizontal: 0.02
  },
  cellText: {
    fontSize: 10,
    textAlign: "center",
    flexWrap: "wrap",
    color: "#333",
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
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
    color: "#2C3E50",
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
  myRequestsContainer: {
    padding: 16,
    backgroundColor: '#fff',
    marginVertical: 10,
    borderRadius: 8,
    width: screenWidth * 0.9, // 90% of the screen width
    maxWidth: 50,
    alignSelf: 'center',
  },
  myRequestsHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    justifyContent: 'space-between',
  },
  requestTitle: {
    fontSize: 16,
    flex: 1,
  },
  acceptButton: {
    backgroundColor: '#5cb85c',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginLeft: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
  },
});

export default FavorsTab;
export { MyFavorsTab };