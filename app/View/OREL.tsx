import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Alert,
} from 'react-native';
import { getAuth , onAuthStateChanged, User, signOut } from 'firebase/auth';
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from './route';
import FavorsTab, { MyFavorsTab } from './ShowRequests';
import { Reader } from '../ViewModel/Reader';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import ProfilePicture from "./ProfileDropDown";
import { PaperProvider } from 'react-native-paper';

// ✅ ייבוא רכיבי המפה
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { LatLngExpression, icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

type NavigationProp = StackNavigationProp<RootStackParamList>;

// ✅ אייקון למיקום המשתמש
const userIcon = icon({
  iconUrl: "/user-location.png", // תמונה שתשים ב-public/
  iconSize: [60, 60],
  iconAnchor: [30, 60],
  popupAnchor: [0, -60],
});

// ✅ אייקון ברירת מחדל לבקשות
const requestDefaultIcon = icon({
  iconUrl: "/request-default.png", // תמונה שתשים ב-public/
  iconSize: [50, 50],
  iconAnchor: [25, 50],
  popupAnchor: [0, -50],
});

const MainPage = () => {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("User");
  const [user, setUser] = useState<User | null>(null);
  const [uid, setUID] = useState<string | null>(null);
  const [selectedMenu, setSelectedMenu] = useState('Home');
  
  const [userLocation, setUserLocation] = useState<LatLngExpression | null>(null);
  const [locationLoaded, setLocationLoaded] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);

  const auth = getAuth();
  const ReaderInstance = new Reader();
  const navigation = useNavigation<NavigationProp>();

  // 🔥 האזנה למצב התחברות (Firebase Auth)
  useEffect(() => {
    console.log("🔥 Checking authentication state...");
    const unsubscribe = onAuthStateChanged(auth, async (authenticatedUser) => {
      if (authenticatedUser) {
        console.log(`✅ Logged in as: ${authenticatedUser.email} (UID: ${authenticatedUser.uid})`);
        setUser(authenticatedUser);
        setUsername(authenticatedUser.email || "User");
        setUID(authenticatedUser.uid);
      } else {
        console.log("❌ No user logged in.");
        setUser(null);
        setProfileImage(null);
        setUsername("User");
      }
    });
    return () => unsubscribe();
  }, []);

  // 🏞️ שליפת תמונת פרופיל מ-Firestore ברגע שיש UID
  useEffect(() => {
    if (uid) {
      fetchProfileImage(uid);
    }
  }, [uid]);

  const fetchProfileImage = async (uid: string) => {
    try {
      const db = getFirestore();
      const userDocRef = doc(db, "users", uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const base64Data = userDocSnap.data()?.picture || null;
        setProfileImage(base64Data);
      }
    } catch (error) {
      console.error("❌ Error fetching profile image:", error);
    }
  };

  // 📸 העלאת תמונה
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
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  // שמירת תמונה ב-Firestore
  const uploadImageToFirestore = async (base64Data: string) => {
    if (!user) {
      Alert.alert('Error', 'No user is logged in.');
      return;
    }
    try {
      const db = getFirestore();
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { picture: base64Data }, { merge: true });
      setProfileImage(base64Data);
      Alert.alert('Success', 'Profile image uploaded to Firestore!');
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image.');
    }
  };

  // 🔑 Logout
  const handleLogout = () => {
    signOut(auth).then(() => {
      navigation.navigate("LogIn");
    }).catch((error) => {
      console.error('Error logging out:', error);
    });
  };

  // ✅ טעינת הבקשות והצגתן על המפה
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const fetchedRequests = await ReaderInstance.ReadOpenRequests(); 
        setRequests(fetchedRequests);
      } catch (error) {
        console.error("❌ Error fetching requests:", error);
      }
    };
    fetchRequests();
  }, []);

  // ✅ בקשת הרשאה וקבלת מיקום GPS
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("❌ Permission to access location was denied");
        Alert.alert("Error", "We couldn't get your location. Loading default view.");
        // נציב מיקום ברירת מחדל ונמשיך
        setUserLocation([31.5, 34.75]); 
        setLocationLoaded(true);
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      setUserLocation([location.coords.latitude, location.coords.longitude]);
      setLocationLoaded(true);
    })();
  }, []);

  // 🏠 מכאן נגדיר מה מוצג במרכז התוכן
  const renderContent = () => {
    switch (selectedMenu) {
      // 🔹 Profile
      case 'Profile':
        return (
          <View style={styles.contentWrapper}>
            <Text style={styles.menuContent}>Profile page.</Text>
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

      // 🔹 Create Request
      case 'Create Request':
        navigation.navigate("CreateRequest");
        return null; 

      // 🔹 Settings
      case 'Settings':
        return (
          <View style={styles.contentWrapper}>
            <Text style={styles.menuContent}>Settings</Text>
          </View>
        );

      // 🔹 Groups
      case 'Groups':
        return (
          <View style={styles.contentWrapper}>
            <Text style={styles.menuContent}>Groups</Text>
          </View>
        );

      // 🔹 Favors
      case 'Favors':
        return (
          <View style={styles.contentWrapper}>
            <FavorsTab />
            <MyFavorsTab />
          </View>
        );

      // 🔹 Home – כאן נוסיף את המפה
      default:
        return (
          <View style={styles.mapWrapper}>
            {/* אם locationLoaded == true, נציג את המפה */}
            {locationLoaded ? (
              <MapContainer center={userLocation || [31.5, 34.75]} zoom={15} style={styles.map}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {/* אייקון משתמש */}
                {userLocation && (
                  <Marker position={userLocation} icon={userIcon as any}>
                    <Popup>📍 You are here</Popup>
                  </Marker>
                )}

                {/* בקשות נוסיף כ-Markers */}
                {requests.map((req) => {
                  if (!req.currentCoordinates) return null; // אם חסר קואורדינטות - לדלג
                  const coordsArr = req.currentCoordinates.split(",").map(parseFloat);
                  return (
                    <Marker key={req.id} position={coordsArr} icon={requestDefaultIcon}>
                      <Popup>
                        <Text style={{ fontWeight: 'bold' }}>{req.title}</Text>
                        <Text>📍 {req.currentAddress}</Text>
                        <Text>📌 {req.DestinationLoaction}</Text>
                        <Text>☎ {req.phoneNumber}</Text>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            ) : (
              <Text style={styles.loadingText}>📍 Getting your location...</Text>
            )}
          </View>
        );
    }
  };

  // רק דוגמה לחיצה בתפריט פרופיל
  const handleOptionSelect = (option: string) => {
    Alert.alert('Selected Option', option);
  };

  return (
    <PaperProvider>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <ProfilePicture 
              base64Image={profileImage}
              headers={{}} // Add appropriate headers here
              onOptionSelect={handleOptionSelect} 
            />
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
        <View style={styles.contentContainer}>
          {renderContent()}
        </View>

        {/* Bottom Menu */}
        <View style={styles.menuBar}>
          {["Home", "Profile", "Create Request", "Settings", "Groups", "Favors"].map((menu) => (
            <TouchableOpacity
              key={menu}
              style={styles.menuItem}
              onPress={() => setSelectedMenu(menu)}
            >
              <Text style={selectedMenu === menu ? styles.menuTextSelected : styles.menuText}>
                {menu}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>
    </PaperProvider>
  );
};

export default MainPage;

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
    // אם אתה ב-Web, העבר לboxShadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
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
  contentContainer: {
    flex: 1,
  },
  mapWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
  },
  contentWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  menuContent: {
    fontSize: 20,
    color: '#34495e',
  },
  uploadSection: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    marginTop: 20,
    // boxShadow / shadowProps...
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  uploadedImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginTop: 10,
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
    // boxShadow / shadowProps...
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
});
