// ProfilePage.tsx
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getDoc } from 'firebase/firestore';
import { Reader } from '../ViewModel/Reader';
import { NavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ProfileImageUploader from './ProfileImageUploader';

const ReaderInstance = new Reader();

const ProfilePage = ({ navigation }: { navigation: NavigationProp<any> }) => {
  const [user, setUser] = useState<any>(null);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);


  // שליטה בהצגת ה-Bottom Sheet
  const [showUploader, setShowUploader] = useState(false);

  const auth = getAuth();

  // טוען / מרענן את תמונת הפרופיל מה־Firestore
  const refreshProfilePicture = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
  try {
    console.log(`🔍 Fetching profile image for UID: ${currentUser.uid}`);
    
    const userDocRef = await ReaderInstance.findUserByInternalId(currentUser.uid);
    if (!userDocRef) {
      console.warn(`⚠️ No document found for user ${currentUser.uid}`);
      return;
    }
    
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      // Read the correct field (assumed to be 'profileImage' here)
      
      const base64Data = userData?.ProfileImage || null;
      setProfilePicture(base64Data) ;
    } else {
      console.warn(`⚠️ No profile image found for user ${currentUser.uid}`);
    }
  } catch (error) {
    console.error("❌ Error fetching profile image:", error);
  }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        refreshProfilePicture();
      } else {
        setUser(null);
        setProfilePicture(null);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.profileContainer}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Main')}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back-outline" size={24} color="#2C3E50" />
          </TouchableOpacity>

          {/* לחיצה על התמונה הגדולה פותחת את ה-Bottom Sheet */}
          <TouchableOpacity onPress={() => setShowUploader(true)}>
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
          </TouchableOpacity>

          {/* כאן אנחנו מוסיפים את ה-ProfileImageUploader כ-Bottom Sheet, בלי תמונה משלו */}
          <ProfileImageUploader
            isVisible={showUploader}
            onClose={() => setShowUploader(false)}
            onImageUploaded={refreshProfilePicture}
            base64Image={profilePicture}
            headers={['צלם תמונה', 'בחר מהגלריה', 'הסר תמונה']}
          />
        </View>

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

        <TouchableOpacity
          style={styles.subscribeButton}
          onPress={() => navigation.navigate('Subscribe')}
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
    marginVertical: 8,
  },
  headerLabel: {
    fontSize: 30,
    color: '#fff',
    fontWeight: '600',
    marginRight: 10,
  },
  headerValue: {
    fontSize: 30,
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
    borderRadius: 150,
    marginBottom: 40,
  },
  profilePlaceholder: {
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  placeholderText: {
    color: '#fff',
    fontSize: 24,
  },
  backButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
  },
  subscribeButton: {
    backgroundColor: '#3867d6',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 5,
    marginBottom: 20,
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
