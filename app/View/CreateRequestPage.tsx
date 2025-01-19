import React, { useState, useEffect } from 'react';
import { NavigationProp } from '@react-navigation/native';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Writer } from '../ViewModel/Writer'; // Import your logic class
import { Ionicons } from '@expo/vector-icons';
import { LoadScript, Autocomplete } from '@react-google-maps/api';
import * as Location from 'expo-location';

const GOOGLE_API_KEY = 'AIzaSyAvIDbKAaM57QVUK6Pmw5koJ-LUYOOzjjE';
const CreateRequestScreen = ({ navigation }: { navigation: NavigationProp<any> }) => {
  const [title, setTitle] = useState('');
  const [currentAddress, setCurrentAddress] = useState('');
  const [currentCoordinates, setCurrentCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [destinationCoordinates, setDestinationCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentAutocomplete, setCurrentAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [destinationAutocomplete, setDestinationAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const writer = new Writer(); // יצירת מופע של Writer
  const fetchCurrentLocation = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to continue.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCurrentCoordinates(location.coords);

      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        const { city, region, country } = reverseGeocode[0];
        setCurrentAddress(`${city}, ${region}, ${country}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch current location.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentLocation();
  }, []);

  const onCurrentPlaceChanged = () => {
    if (currentAutocomplete) {
      const place = currentAutocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setCurrentCoordinates({ latitude: lat, longitude: lng });
        setCurrentAddress(place.formatted_address || '');
      }
    }
  };

  const onDestinationPlaceChanged = () => {
    if (destinationAutocomplete) {
      const place = destinationAutocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setDestinationCoordinates({ latitude: lat, longitude: lng });
      }
    }
  };

  const handleSubmit = async () => {

    // קריאה לפונקציה addRequest
    const response = await writer.addRequest(
      title,
      currentCoordinates ? `${currentCoordinates.latitude},${currentCoordinates.longitude}` : '',
      currentAddress,
      destinationCoordinates ? `${destinationCoordinates.latitude},${destinationCoordinates.longitude}` : '',
      additionalNotes
    );

    if (response.success) {
      Alert.alert("Success", response.message);
      console.log("Request added successfully");
      // איפוס השדות לאחר יצירת הבקשה
      setTitle("");
      setCurrentCoordinates(null);
      setCurrentAddress("");
      setDestinationCoordinates(null);
      setAdditionalNotes("");
    } else {
      Alert.alert("Error", response.message);
      console.error(response.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#3498DB" />
        </View>
      )}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backButton}>
            <Ionicons name="arrow-back-outline" size={24} color="#2C3E50" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Request</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Request Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter a title for your request..."
            placeholderTextColor="#8E8E93"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Your Current Location</Text>
          <LoadScript googleMapsApiKey={GOOGLE_API_KEY} libraries={['places']}>
            <Autocomplete
              onLoad={(autocomplete) => setCurrentAutocomplete(autocomplete)}
              onPlaceChanged={onCurrentPlaceChanged}
            >
              <TextInput
                style={styles.input}
                placeholder="Enter current location..."
                placeholderTextColor="#8E8E93"
                value={currentAddress}
                onChangeText={(text) => setCurrentAddress(text)}
              />
            </Autocomplete>
          </LoadScript>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Destination Location</Text>
          <LoadScript googleMapsApiKey={GOOGLE_API_KEY} libraries={['places']}>
            <Autocomplete
              onLoad={(autocomplete) => setDestinationAutocomplete(autocomplete)}
              onPlaceChanged={onDestinationPlaceChanged}
            >
              <TextInput
                style={styles.input}
                placeholder="Enter destination address..."
                placeholderTextColor="#8E8E93"
              />
            </Autocomplete>
          </LoadScript>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Additional Notes</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Write any additional notes..."
            placeholderTextColor="#8E8E93"
            multiline
            numberOfLines={4}
            value={additionalNotes}
            onChangeText={setAdditionalNotes}
          />
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#2C3E50',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontSize: 16,
    color: '#2C3E50',
  },
  textArea: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 15,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontSize: 16,
    color: '#2C3E50',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#E74C3C',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#27AE60',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 10,
  },
  submitButtonText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
  },
  loaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 10,
  },
});

export default CreateRequestScreen;
