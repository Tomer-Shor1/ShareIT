import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  SafeAreaView 
} from 'react-native';
import { getFirestore, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { Reader } from '../ViewModel/Reader';
import { RootStackParamList } from './route';
import { NavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';


const SubscribeScreen = ({ navigation }: { navigation: NavigationProp<any> }) => {
  const [code, setCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const auth = getAuth();
  const ReaderInstance = new Reader();

  
  
  // This function subscribes the user 
  // A subscribtion allowes the user to pay half price for favors
  // A unique code is required to subscribe
  // Currently, the code is provided by the app developer 
  // In the future, the process will consist of a payment by credit card
  const handleSubscribe = async () => {
    if (code !== "1234") {
        setErrorMessage("Incorrect password!");
      Alert.alert("Error", "Incorrect password!");
      return;
    }


    setErrorMessage("");


    const user = auth.currentUser;
    if (!user) {
        setErrorMessage("No user is logged in.");
      Alert.alert("Error", "No user is logged in.");
      return;
    }

    try {
      // Get the document reference for the user's document
      const userDoc = await ReaderInstance.getTableEntranceByKey("users", user.uid);
      // Set the "subscribed" field to 1 (merging with existing fields)
      await setDoc(userDoc, { subscribed: 1 }, { merge: true });
      Alert.alert("Success", "Subscription successful!");
      navigation.goBack();
    } catch (error) {
      console.error("Error subscribing:", error);
      setErrorMessage("Failed to subscribe. Please try again.");
      Alert.alert("Error", "Failed to subscribe. Please try again.");
    }
  };


  // This function unsibscribes the user 
  const handleUnsubscribe = async () => {
    const user = auth.currentUser;
    if (!user) {
      setErrorMessage("No user is logged in.");
      return;
    }
    
    try {
      // Get the user's document reference and update the "subscribed" field to 0
      const userDoc = await ReaderInstance.getTableEntranceByKey("users", user.uid);
      await setDoc(userDoc, { subscribed: 0 }, { merge: true });
      navigation.goBack();
    } catch (error) {
      console.error("Error unsubscribing:", error);
      setErrorMessage("Failed to unsubscribe. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.formContainer}>
        {/* Return to Main Page Button */}
        <TouchableOpacity onPress={() => navigation.navigate('Main')} style={styles.backButton}>
            <Ionicons name="arrow-back-outline" size={24} color="#2C3E50" />
          </TouchableOpacity>
        <Text style={styles.title}>Enter the unique code you received</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter subscription code"
          secureTextEntry
          value={code}
          onChangeText={setCode}
        />
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        {/* Subscribe Button */}
        <TouchableOpacity style={styles.button} onPress={handleSubscribe}>
          <Text style={styles.buttonText}>Subscribe</Text>
        </TouchableOpacity>
        {/* Unsubscribe Button */}
        <TouchableOpacity style={[styles.button, styles.unsubscribeButton]} onPress={handleUnsubscribe}>
            <Text style={styles.buttonText}>Unsubscribe</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};


export default SubscribeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  returnButton: {
    backgroundColor: '#4b7bec',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 20,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  backButton: {
    marginRight: 10,
  },
  button: {
    backgroundColor: '#3867d6',
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  unsubscribeButton: {
    backgroundColor: '#d9534f', // red color for unsubscribe
  },
});