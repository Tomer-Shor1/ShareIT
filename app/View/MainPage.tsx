// TODO
// 1. buy coins menu
// 2 completer full transaction



import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { setDoc,doc, getDoc, onSnapshot, query, where, collection, } from 'firebase/firestore';
import { getAuth , onAuthStateChanged, User} from 'firebase/auth';
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from './route';
import FavorsTab, { MyFavorsTab } from './ShowRequests';
import { Reader } from '../ViewModel/Reader';

import { sendNotification } from './NotificationService';
import * as Location from "expo-location";
import ProfilePicture from "./ProfileDropDown"
import { PaperProvider } from 'react-native-paper';
import FloatingActionButton from "./ExpandWidget"
import { DatabaseManager } from '../Model/databaseManager';
import { MapContainer, TileLayer, Marker, Popup, MarkerProps } from 'react-leaflet';
import { LatLngExpression, Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';




// ✅ Import correct map library depending on platform
// let MapComponent;
// if (Platform.OS === "web") {
//   import("react-leaflet").then((module) => {
//     MapComponent = module.MapContainer;
//   });
// } else {
//   import("react-native-maps").then((module) => {
//     MapComponent = module.default;
//   });
// }

type NavigationProp = StackNavigationProp<RootStackParamList>;




const MainPage = () => {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("User");
  const [user, setUser] = useState<User | null>(null); // ✅ Track user state
  const [uid, setUID] = useState<string>(null); // ✅ Track user ID
  const [selectedMenu, setSelectedMenu] = useState('Home'); // Current menu selection
  const auth = getAuth();
  const ReaderInstance = new Reader();
  const navigation = useNavigation<NavigationProp>();
  const [userLocation, setUserLocation] = useState<LatLngExpression | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [userCoins, setUserCoins] = useState<number | null>(null);
  const [locationLoaded, setLocationLoaded] = useState(false);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [activeRequestsInfo, setActiveRequestInfo] = useState<any[]>([]);
  const [loadMap, setLoadMap] = useState<boolean>(true);
  const [res, setRes] = useState(null);
  const [requestImage, setRequestImage] = useState<string | null>(null);
  const [myLocationImage, setMylocationImage] = useState<string | null>(null);
  //const [myLocationIcon, setMyLoactionIcon] = useState<string | null>(null);




  

  // recover dynamicly balance everytime it changes
  useEffect(() => {
    const q = query(collection(DatabaseManager.getDB(), "users"), where("uid", "==", uid));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      querySnapshot.forEach((doc) => {
        setUserCoins(doc.data().coins)
      })
    });

    // Cleanup the listener on unmount
    return () => unsubscribe();
  }, [uid]);


  useEffect(() => {
    if (!uid) return;
  
    const q = query(
      collection(DatabaseManager.getDB(), "Open-Requests"),
      where("uid", "==", uid)
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const updatedRequests = Reader.refrenceToDocument(querySnapshot.docs);
      setMyRequests(updatedRequests);
      console.log("Snapshot received. Processing changes...");
  
      querySnapshot.docChanges().forEach((change) => {
        const data = change.doc.data();
        console.log("Change type:", change.type, "Data:", data);
  
        if (change.type === 'modified') {
          if (data.status === "ongoing") {
            console.log("Detected 'ongoing' status change.");
            sendNotification(
              "Request Taken", 
              "Your request has been taken!\nCheck your open requests for more information"
            );
          } else if (data.status === "waitingForApproval") {
            console.log("Detected 'waitingForApproval' status change.");
            sendNotification(
              "Your request has been finished!", 
              "Approve the request to get your coins"
            );
          } else if (data.status === "finished") {
            console.log("Detected 'finished' status change.");
            sendNotification(
              "Thank you for using our app!", 
              "Your request has been approved and your coins have been added to your balance"
            );
          }
        }
      });
    });
  
    return () => unsubscribe();
  }, [uid]);


  // recover open requests by other users
  useEffect(() => {
    const q = query(collection(DatabaseManager.getDB(), "Open-Requests"), where("uid", "!=", uid));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      setRequests(Reader.refrenceToDocument(querySnapshot.docs));
  });

   // Cleanup the listener on unmount
   return () => unsubscribe();
  }, [uid]);


  useEffect(() => {
    const takenByUsers = myRequests.map(request => request.takenBy).filter(Boolean);
    if (takenByUsers.length === 0) return;
  
    const q = query(
      collection(DatabaseManager.getDB(), "users"),
      where("uid", "in", takenByUsers)
    );
  
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      (async () => {
        const requestInfoList = await Promise.all(
          myRequests.map(async (request) => {
            // Await the image so it's not a Promise.
            const image = await fetchProfileImage(request.takenBy);
            return {
              id: request.id,
              title: request.title || "",
              currentCoordinates: request.currentCoordinates || "",
              currentAddress: request.currentAddress || "",
              DestinationLoaction: request.DestinationLoaction || "",
              additionalNotes: request.additionalNotes || "",
              phoneNumber: request.phoneNumber || "",
              timestamp: request.timestamp || "",
              uid: request.uid || "",
              createdAt: request.createdAt || "",
              updatedAt: request.updatedAt || "",
              status: request.status,
              takenBy: request.takenBy || null,
              takenByImage: image || "",
            };
          })
        );
        setActiveRequestInfo(requestInfoList);
      })();
    });
  
    return () => unsubscribe();
  }, [myRequests, uid]);



  // ✅ Listen for authentication state changes
  useEffect(() => {
    console.log("🔥 Checking authentication state...");
    const unsubscribe = onAuthStateChanged(auth, async (authenticatedUser) => {
      if (authenticatedUser) {
        console.log(`✅ Logged in as: ${authenticatedUser.email} (UID: ${authenticatedUser.uid})`);
        setUser(authenticatedUser);
        setUsername(authenticatedUser.email || "User");
        setUID(authenticatedUser.uid);

        // ✅ Immediately fetch profile image after user is set
        //await fetchProfileImage(authenticatedUser.uid);
      } else {
        console.log("❌ No user logged in.");
        setUser(null);
        setProfileImage(null);
        setUsername("User");
      }
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

  
  // request the user to allow location access 
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission to access location was denied");
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    })();
  }, []);


  // Fetch profile image when UID becomes available
  useEffect(() => {
      if (uid) {
        const fetchImage = async () => {
          let image = await fetchProfileImage(uid);
          if (image) {
            setProfileImage(image);
          }
        };
        fetchImage();
      }
    }, [uid]);


    useEffect(() => {
      fetchRequestImage();
    }, []);


    useEffect(() => {
      fetchMyLoactionImage();
    }, []);


// ✅ Step 2: Function to fetch profile image
const fetchProfileImage = async (uid: string) => {
  try {
    console.log(`🔍 Fetching profile image for UID: ${uid}`);
    
    const userDocRef = await ReaderInstance.findUserByInternalId(uid);
    if (!userDocRef) {
      console.warn(`⚠️ No document found for user ${uid}`);
      return;
    }
    
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      // Read the correct field (assumed to be 'profileImage' here)
      
      const base64Data = userData?.ProfileImage || null;
      return base64Data;
    } else {
      console.warn(`⚠️ No profile image found for user ${uid}`);
    }
  } catch (error) {
    console.error("❌ Error fetching profile image:", error);
  }
};


const fetchRequestImage = async () => {
  try {
    // Reference the document in the Resources collection with id "RequestImage"
    const imageDocRef = doc(DatabaseManager.getDB(), "Resources", "RequestImage");
    const docSnap = await getDoc(imageDocRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      // Assuming the base64 image is stored in the "photo" field
      const base64Image = data.Photo;
      

      setRequestImage(base64Image);

    } else {
      console.warn("No RequestImage document found in Resources.");
    }
  } catch (error) {
    console.error("Error fetching request image:", error);
  }
};


const fetchMyLoactionImage = async () => {
  try {
    // Reference the document in the Resources collection with id "RequestImage"
    const imageDocRef = doc(DatabaseManager.getDB(), "Resources", "myLocationImage");
    const docSnap = await getDoc(imageDocRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      // Assuming the base64 image is stored in the "photo" field
      const base64Image = data.Photo;
      

      setMylocationImage(base64Image);

    } else {
      console.warn("No RequestImage document found in Resources.");
    }
  } catch (error) {
    console.error("Error fetching request image:", error);
  }
};



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
          await (base64String);
        }
      } else {
        console.log('Image picker canceled.');
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };


  const handleLogout = () => {
    auth.signOut().then(() => {
      navigation.navigate("LogIn");
    }).catch((error) => {
      console.error('Error logging out:', error);
    });
  };

    // ✅ Load requests and render them on screen
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
  
    // ✅ Request location permission and get user's location
    useEffect(() => {
      (async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          console.log("❌ Permission to access location was denied");
          Alert.alert("Error", "We couldn't get your location. Loading default view.");
          // set default location (Jereuslaem)
          setUserLocation([31.5, 34.75]); 
          setLocationLoaded(true);
          return;
        }
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation([location.coords.latitude, location.coords.longitude]);
        setLocationLoaded(true);
      })();
    }, []);
  

  const renderContent = (option) => {
    setLoadMap(false);
    setSelectedMenu(option)
    switch (option) {
      case 'Create Request':
        navigation.navigate("CreateRequest");
        return null; // No content to render
        case 'Favors':
          return (
            <View style={styles.contentWrapper}>
              <FavorsTab />
              <MyFavorsTab />
            </View>
          );
        case "Home":
          setLoadMap(true);
      default:
        
        // return (
        //   // <View style={styles.contentWrapper}>
        //   //   <TouchableOpacity style={styles.uploadSection} onPress={pickImage}>
        //   //     {profileImage ? (
        //   //       <Image
        //   //         source={{ uri: `data:image/jpeg;base64,${profileImage}` }}
        //   //         style={styles.uploadedImage}
        //   //       />
        //   //     ) : (
        //   //       <Text style={styles.uploadPrompt}>Tap to upload a profile image</Text>
        //   //     )}
        //   //   </TouchableOpacity>
        //   // </View>
        // );
    }
  };

  const balance = userCoins !== null ? `💰Balance: ${userCoins}` : "💰Balance: Loading...";

  const handleOptionSelect = (option: string) => {
    const trimmedOption = option.trim();
    console.log("Selected option:", JSON.stringify(trimmedOption));
    switch (trimmedOption) {
      case "👤Profile":
        navigation.navigate("ProfilePage");
        break;
      case balance:
        navigation.navigate("BuyCoinsPage");
        break;
      case "⚙️Settings":

        break;
      case "❌Log Out":
        handleLogout();
        break;
      default:

    }
  };


// Default icon defined elsewhere:
const requestDefaultIcon = new Icon({
  iconUrl: "/Images/RequestIcon.jpg",
  iconSize: [50, 50],
  iconAnchor: [25, 50],
  popupAnchor: [0, -50],
});

// In your component:
const customRequestIcon = useMemo(() => {
  if (requestImage) {
    return new Icon({
      iconUrl: requestImage,
      iconSize: [50, 50],
      iconAnchor: [25, 50],
      popupAnchor: [0, -50],
    });
  }
  return requestDefaultIcon;
}, [requestImage]);


// In your component:
const customMyLocationtIcon = useMemo(() => {
  if (myLocationImage) {
    return new Icon({
      iconUrl: myLocationImage,
      iconSize: [50, 50],
      iconAnchor: [25, 50],
      popupAnchor: [0, -50],
    });
  }
  return requestDefaultIcon;
}, [myLocationImage]);





  

  const headers = ["👤Profile", balance, "⚙️Settings", "❌Log Out"];  // the menu headers

  const center: LatLngExpression = [userLocation?.[0] ?? 31.5, userLocation?.[1] ?? 34.75];
  return (
    <PaperProvider>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <ProfilePicture 
              base64Image={profileImage}
              headers={headers}
              onOptionSelect={handleOptionSelect}
            />
            <View>
              <Text style={styles.welcomeText}>Welcome Back</Text>
              <Text style={styles.usernameText}>{username}</Text>
            </View>
          </View>
        </View>
  
        {/* Main Content */}
        <View style={styles.mainContent}>
          {loadMap ? (
            <View style={styles.mapWrapper}>
              {locationLoaded ? (
                <MapContainer center={center} zoom={15} style={styles.map}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {/* User marker */}
                  {userLocation && (
                    <Marker 
                      position={userLocation as [number, number]} 
                      {...{ icon: customMyLocationtIcon }}
                    >
                      <Popup>📍 You are here</Popup>
                    </Marker>
                  )}
                  {/* Request markers */}
                  {requests.map((req) => {
                    if (!req.currentCoordinates) return null;
                    const coordsArr = req.currentCoordinates.split(",").map(parseFloat);
                    if (
                      coordsArr.length !== 2 ||
                      isNaN(coordsArr[0]) ||
                      isNaN(coordsArr[1])
                    ) {
                      return null;
                    }
                    return (
                      <Marker
                        key={req.id}
                        position={[coordsArr[0], coordsArr[1]] as [number, number]}
                        {...{ icon: customRequestIcon }}
                      >
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
          ) : (
            // When loadMap is false, show the table content (result from renderContent)
            <View style={styles.contentWrapper}>
              {res}
            </View>
          )}
        </View>
  
        {/* Bottom Menu */}
        <View style={styles.menuBar}>
          {["Home", "Create Request", "Favors"].map((menu) => (
            <TouchableOpacity
              key={menu}
              style={styles.menuItem}
              onPress={() => {
                const result = renderContent(menu);
                setRes(result);
                setSelectedMenu(menu);
              }}
            >
              <Text
                style={
                  selectedMenu === menu ? styles.menuTextSelected : styles.menuText
                }
              >
                {menu}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.widgetContainer}>
          <FloatingActionButton requests={activeRequestsInfo}/>
        </View>

      </SafeAreaView>
    </PaperProvider>
  );
};

export default MainPage

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
  // New style for main content area:
  mainContent: {
    flex: 1, // occupies remaining vertical space
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
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
  },
  mapWrapper: {
    flex: 1,
    width: '100%',
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  rightContainer: {
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
  widgetContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    bottom: 20,
    right: 20,
  },
});
