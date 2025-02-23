import React, { useState, useEffect } from 'react';
import { SafeAreaView ,StyleSheet, View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getDoc } from 'firebase/firestore';
import { Reader } from '../ViewModel/Reader';
import { NavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';


const ProfilePage = ({ navigation }: { navigation: NavigationProp<any> }) => {
  const [user, setUser] = useState<any>(null);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const auth = getAuth();


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const readerInstance = new Reader();
        (async () => {
          try {
            const userDocRef = await readerInstance.getTableEntranceByKey("users", currentUser.uid);
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists()) {
              const data = docSnap.data();
              setProfilePicture(data.picture || null);
            }
          } catch (error) {
            console.error("Error fetching profile picture:", error);
          }
        })();
      }
    });
    return () => unsubscribe();
  }, []);


  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>


        {/* Profile Content */}
        <View style={styles.profileContainer}>
        {/* Back Button */}
        <TouchableOpacity onPress={() => navigation.navigate('Main')} style={styles.backButton}>
            <Ionicons name="arrow-back-outline" size={24} color="#2C3E50" />
        </TouchableOpacity>
        
          {profilePicture ? (
            <Image
              source={{ uri: `data:image/jpeg;base64,${profilePicture}` }}
              style={styles.profileImage}
            />
          ) : (
            <View style={styles.profilePlaceholder}>
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}
        </View>

        {/* Header with email and phone in separate rows */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.headerLabel}>Email: </Text>
            <Text style={styles.headerValue}>{user?.email || 'No Email'}</Text>
          </View>
          <View style={styles.headerRow}>
            <Text style={styles.headerLabel}>Phone: </Text>
            <Text style={styles.headerValue}>{user?.phoneNumber || 'No Phone'}</Text>
          </View>
        </View>

        {/* Subscribe Button at the bottom */}
        <TouchableOpacity
          style={styles.subscribeButton}
          onPress={() => navigation.navigate("Subscribe")}
        >
          <Text style={styles.subscribeButtonText}>Subscribe</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfilePage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  scrollContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  header: {
    width: '90%',
    backgroundColor: '#3867d6',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 30,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8, // increased spacing between rows
  },
  headerLabel: {
    fontSize: 30, // bigger font for labels
    color: '#fff',
    fontWeight: '600',
    marginRight: 10,
  },
  headerValue: {
    fontSize: 30, // bigger font for values
    color: '#fff',
    fontWeight: 'bold',
  },
  profileContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileImage: {
    width: 300,  
    height: 300, 
    borderRadius: 200,
    marginBottom: 40,
  },
  profilePlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  placeholderText: {
    color: '#fff',
    fontSize: 16,
  },
  subscribeButton: {
    backgroundColor: '#3867d6',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 20,
  },
  backButton: {
    marginRight: 200,
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});