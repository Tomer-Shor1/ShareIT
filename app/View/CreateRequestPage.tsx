import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { DatabaseManager } from '../Model/databaseManager'; // Import your logic class
import { Reader } from '../ViewModel/Reader';
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
import { LoadScript, Autocomplete, Libraries } from '@react-google-maps/api';
import * as Location from 'expo-location';

const GOOGLE_API_KEY = 'AIzaSyAvIDbKAaM57QVUK6Pmw5koJ-LUYOOzjjE';
const CreateRequestScreen = ({ navigation }: { navigation: NavigationProp<any> }) => {
  const [title, setTitle] = useState('');
  const [phoneNumberm, setPhoneNumber] = useState('');
  const [currentAddress, setCurrentAddress] = useState('');
  const [currentCoordinates, setCurrentCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [DestinationLoaction,setDestinationLoaction] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [takenBy, setTakenBy] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentAutocomplete, setCurrentAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [destinationAutocomplete, setDestinationAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const googleLibraries: Libraries = ['places'];
  const writer = new Writer(); // ֿWriter
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

  


async function getUser(): Promise<string | null> {
  return new Promise((resolve) => {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log(`✅ User is logged in: ${user.email} (${user.uid})`);
        resolve(user.uid);
      } else {
        console.log("❌ No user logged in");
        resolve(null);
      }
    });
  });
}

  const handleSubmit = async () => {
    try {
      const user = await Reader.getCurrentUser();
      if (!user) {
        Alert.alert("Error", "You must be logged in to create a request.");
        return;
      }

      const userId =  user.uid;
  
      const userCoins = await DatabaseManager.getUserCoins(userId);
      if (userCoins === null || userCoins < 1) {
        Alert.alert("Not enough coins", "You need at least 1 coin to create a request.");
        return;
      }
      
      console.log("Adding request!!!!!");
      // ✅ Proceed with adding the request
      const response = await writer.addRequest(
        title,
        currentCoordinates ? `${currentCoordinates.latitude},${currentCoordinates.longitude}` : '',
        currentAddress,
        DestinationLoaction,
        additionalNotes,
        phoneNumberm,
        takenBy
      );
  
      if (response.success) {

        // set deduct amount
        let deductAmount = -1;
        let isUserSubscribed = await DatabaseManager.isUserSubscribed(userId);

        if (isUserSubscribed) { // if user is subscribed, deduct half of the original price
          await DatabaseManager.addCoinsToUser(userId, deductAmount * 0.5); 
        }
        else{   // if user is not subscribed, deduct the original price
          await DatabaseManager.addCoinsToUser(userId, deductAmount); 
        }
        Alert.alert("Success", "Request added successfully");
        console.log("Request added successfully");
  
        // Reset form fields
        setTitle("");
        setCurrentAddress("");
        setPhoneNumber("");
        setDestinationLoaction("");
        setAdditionalNotes("");
        setTakenBy("");
        
      } else {
        Alert.alert("Error", response.message);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to add request");
      console.error(error);
    }
    navigation.navigate('Main');
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
          <TouchableOpacity onPress={() => navigation.navigate('Main')} style={styles.backButton}>
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
          <LoadScript googleMapsApiKey={GOOGLE_API_KEY} libraries={googleLibraries}>
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
              >
              <TextInput
                style={styles.input}
                placeholder="Enter destination address..."
                placeholderTextColor="#8E8E93"
                value={DestinationLoaction}
                onChangeText={(text) => setDestinationLoaction(text)}
              />
            </Autocomplete>
          </LoadScript>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone-Number</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Write your phone number..."
            placeholderTextColor="#8E8E93"
            multiline
            numberOfLines={4}
            value={phoneNumberm}
            onChangeText={setPhoneNumber}
          />
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
          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.navigate('Main')}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Submit Favor</Text>
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