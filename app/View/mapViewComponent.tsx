import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { Reader } from "../ViewModel/Reader";

interface Request {
  id: string;
  title: string;
  currentCoordinates: string; // Example: "37.7749,-122.4194"
  currentAddress: string;
}

const MapViewComponent: React.FC = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<Request[]>([]);

  useEffect(() => {
    const fetchLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.error("Permission to access location was denied");
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
      setLoading(false);
    };

    fetchLocation();
  }, []);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const reader = new Reader();
        const openRequests = await reader.ReadOpenRequests();
        setRequests(openRequests);
      } catch (error) {
        console.error("Error fetching requests:", error);
      }
    };

    fetchRequests();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />;
  }

  return (
    <View style={styles.container}>
      {location ? (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          {/* Add markers for each request */}
          {requests.map((req) => {
            const [lat, lon] = req.currentCoordinates.split(",").map(Number);
            return (
              <Marker
                key={req.id}
                coordinate={{ latitude: lat, longitude: lon }}
                title={req.title}
                description={req.currentAddress}
              />
            );
          })}
        </MapView>
      ) : (
        <Text style={styles.errorText}>Could not get your location</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    textAlign: "center",
    fontSize: 16,
    color: "red",
    marginTop: 20,
  },
});

export default MapViewComponent;