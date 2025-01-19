import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { Reader } from "../ViewModel/Reader"; // יבוא Reader

interface Request {
  id: string;
  title: string;
  currentCoordinates: string;
  currentAddress: string;
  destinationCoordinates: string;
  additionalNotes: string;
}

const ShowRequests: React.FC = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const reader = new Reader(); // יצירת מופע של Reader

  useEffect(() => {
    // קריאה לפונקציה ב-Reader
    const fetchRequests = async () => {
      try {
        const fetchedRequests = await reader.ReadOpenRequests(); // קריאה לפונקציה
        setRequests(fetchedRequests); // עדכון ה-state עם הנתונים
      } catch (error) {
        console.error("Error fetching requests:", error);
      }
    };

    fetchRequests();
  }, []);

  // פונקציה להצגת כל שורה בטבלה
  const renderRow = ({ item }: { item: Request }) => (
    <View style={styles.row}>
      <Text style={styles.cell}>{item.title}</Text>
      <Text style={styles.cell}>{item.currentCoordinates}</Text>
      <Text style={styles.cell}>{item.currentAddress}</Text>
      <Text style={styles.cell}>{item.destinationCoordinates}</Text>
      <Text style={styles.cell}>{item.additionalNotes}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* כותרות הטבלה */}
      <View style={styles.header}>
        <Text style={styles.headerCell}>Title</Text>
        <Text style={styles.headerCell}>Current Coordinates</Text>
        <Text style={styles.headerCell}>Current Address</Text>
        <Text style={styles.headerCell}>Destination Coordinates</Text>
        <Text style={styles.headerCell}>Additional Notes</Text>
      </View>
      {/* תוכן הטבלה */}
      <FlatList
        data={requests}
        renderItem={renderRow}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  headerCell: {
    flex: 1,
    fontWeight: "bold",
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  cell: {
    flex: 1,
    textAlign: "center",
  },
});

export default ShowRequests;
