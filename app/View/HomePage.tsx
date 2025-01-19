import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Alert,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const HomePage = () => {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false); // For showing full-screen image
  const [selectedMenu, setSelectedMenu] = useState('Home'); // Current menu selection
  const auth = getAuth();
  const firestore = getFirestore();
  const user = auth.currentUser;
  const router = useRouter();

  const username = user?.displayName || "User";

  // Fetch the base64 string from Firestore on mount
  useEffect(() => {
    const fetchProfileImage = async () => {
      if (!user) {
        console.log('No user logged in.');
        return;
      }

      try {
        const userDocRef = doc(firestore, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          const base64Data = userData?.picture || null;
          setProfileImage(base64Data);
        }
      } catch (error) {
        console.error('Error fetching profile image:', error);
      }
    };

    fetchProfileImage();
  }, [user]);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
        base64: true,
      });

      if (!result.canceled) {
        const base64String = result.assets[0].base64;
        if (base64String) {
          await uploadImageToFirestore(base64String);
        }
      } else {
        console.log('Image picker canceled.');
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const uploadImageToFirestore = async (base64Data: string) => {
    if (!user) {
      Alert.alert('Error', 'No user is logged in.');
      return;
    }

    try {
      const userDocRef = doc(firestore, 'users', user.uid);
      await setDoc(userDocRef, { picture: base64Data }, { merge: true });
      setProfileImage(base64Data);
      Alert.alert('Success', 'Profile image uploaded to Firestore!');
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image.');
    }
  };

  const handleLogout = () => {
    auth.signOut().then(() => {
      router.replace('/');
    }).catch((error) => {
      console.error('Error logging out:', error);
    });
  };

  const renderContent = () => {
    switch (selectedMenu) {
      case 'Profile':
        return (
          <View style={styles.contentWrapper}>
            <Text style={styles.menuContent}>This is the Profile page.</Text>
          </View>
        );
      case 'Create Request':
        router.push('/CreateRequestPage');
        return null; // כדי למנוע הצגת תוכן נוסף
      case 'Settings':
        return (
          <View style={styles.contentWrapper}>
            <Text style={styles.menuContent}>This is the Settings page.</Text>
          </View>
        );
      case 'Groups':
        return (
          <View style={styles.contentWrapper}>
            <Text style={styles.menuContent}>This is the Groups page.</Text>
          </View>
        );
      case 'Favors':
        return (
          <View style={styles.contentWrapper}>
            <Text style={styles.menuContent}>This is the Favors Around You page.</Text>
            <TouchableOpacity onPress={() => router.push('View/ShowRequests')}>
              <Text>View Requests</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return (
          <View style={styles.contentWrapper}>
            <TouchableOpacity style={styles.uploadSection} onPress={pickImage}>
              {profileImage ? (
                <Image
                  source={{ uri: `data:image/jpeg;base64,${profileImage}` }}
                  style={styles.uploadedImage}
                />
              ) : (
                <Text style={styles.uploadPrompt}>Tap to upload a profile image</Text>
              )}
            </TouchableOpacity>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          {profileImage ? (
            <Image
              source={{ uri: `data:image/jpeg;base64,${profileImage}` }}
              style={styles.profileImage}
            />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}
          <View>
            <Text style={styles.welcomeText}>Welcome Back</Text>
            <Text style={styles.usernameText}>{username}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logout}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {renderContent()}

      {/* Menu */}
      <View style={styles.menuBar}>
        {['Home', 'Profile', 'Create Request', 'Settings', 'Groups', 'Favors'].map((menu) => (
          <TouchableOpacity
            key={menu}
            style={styles.menuItem}
            onPress={() => setSelectedMenu(menu)}
          >
            <Text
              style={
                selectedMenu === menu
                  ? styles.menuTextSelected
                  : styles.menuText
              }
            >
              {menu}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
};

export default HomePage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#4b7bec',
    marginRight: 16,
  },
  placeholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#d1d8e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  placeholderText: {
    color: '#ffffff',
    fontSize: 12,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#2d98da',
  },
  usernameText: {
    fontSize: 18,
    color: '#34495e',
    marginTop: 4,
  },
  logout: {
    fontSize: 16,
    color: '#3867d6',
  },
  contentWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  uploadSection: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  uploadedImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  uploadPrompt: {
    fontSize: 16,
    color: '#7d8ca1',
    textAlign: 'center',
  },
  menuBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#d1d8e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItem: {
    alignItems: 'center',
  },
  menuText: {
    fontSize: 14,
    color: '#7d8ca1',
  },
  menuTextSelected: {
    fontSize: 14,
    color: '#3867d6',
    fontWeight: 'bold',
  },
  menuContent: {
    fontSize: 20,
    color: '#34495e',
  },
});