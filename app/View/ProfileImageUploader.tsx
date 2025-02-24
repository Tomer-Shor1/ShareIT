// ProfileImageUploader.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  Alert,
  StyleSheet,
  Modal,
  Pressable,
  Button,
  Platform,
  Text,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Webcam from 'react-webcam';
import { getAuth } from 'firebase/auth';
import { setDoc, updateDoc } from 'firebase/firestore';
import { Reader } from '../ViewModel/Reader';
import { IconButton } from 'react-native-paper';

interface ProfileImageUploaderProps {
  isVisible: boolean;               // האם להציג את ה-Bottom Sheet
  onClose: () => void;              // פונקציה לסגירת ה-Bottom Sheet
  onImageUploaded: () => void;      // פונקציה לרענון לאחר העלאה/הסרה
  base64Image: string | null;       // התמונה הנוכחית (Base64) או null
  headers: string[];                // מערך עם אפשרויות: "צלם תמונה", "בחר מהגלריה", "הסר תמונה"
}

 const ProfileImageUploader: React.FC<ProfileImageUploaderProps> = ({
  isVisible,
  onClose,
  onImageUploaded,
  base64Image,
  headers,
}) => {
  const auth = getAuth();
  const ReaderInstance = new Reader();

  // מצב עבור תצוגת מצלמת הדפדפן (Web)
  const [showWebcam, setShowWebcam] = useState(false);
  const webcamRef = useRef<Webcam>(null);

  // בקשת הרשאת מצלמה (למובייל)
  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('הרשאה נחוצה', 'יש לאשר גישה למצלמה לצילום תמונה.');
      return false;
    }
    return true;
  };

  // בחירת תמונה מהגלריה או מצלמה
  const pickImage = async (useCamera = false) => {
    try {
      let result;
      if (useCamera) {
        if (Platform.OS === 'web') {
          // ב-Web: מציגים את מצלמת הדפדפן
          setShowWebcam(true);
          onClose();
          return;
        }
        // במובייל: מצלמה באמצעות expo-image-picker
        const permissionGranted = await requestCameraPermission();
        if (!permissionGranted) return;
        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 1,
          base64: true,
        });
      } else {
        // בחירת תמונה מהגלריה
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 1,
          base64: true,
        });
      }
      onClose();
      if (result && !result.canceled && result.assets[0].base64) {
        await uploadImageToFirestore(result.assets[0].base64);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  // Upload the picture to firebase
   const uploadImageToFirestore = async (base64Data: string) => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Erorr! No user logged in. ');
      return;
    }
    
    try {
      const userDocRef = await ReaderInstance.findUserByInternalId(user.uid);
      console.log(userDocRef);
      await updateDoc(userDocRef, { "ProfileImage": base64Data });
      onImageUploaded();
      Alert.alert('Profile picture updated!');
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error uploading image.');
    }
  };

  // הסרת תמונת הפרופיל
  const removeImageFromFirestore = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('שגיאה', 'אין משתמש מחובר.');
      return;
    }
    try {
      const userDoc = await ReaderInstance.getTableEntranceByKey('users', user.uid);
      await setDoc(userDoc, { picture: '' }, { merge: true });
      onImageUploaded();
      Alert.alert('הצלחה', 'תמונת הפרופיל הוסרה.');
    } catch (error) {
      console.error('Error removing image:', error);
      Alert.alert('שגיאה', 'הסרת התמונה נכשלה.');
    }
    onClose();
  };

  // לכידת תמונה ממצלמת הדפדפן (Web)
  const captureImage = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        const base64Data = imageSrc.replace(/^data:image\/\w+;base64,/, '');
        uploadImageToFirestore(base64Data);
      }
      setShowWebcam(false);
    }
  };

  // אם ב-Web המשתמש בחר "צלם תמונה", מציגים את מצלמת הדפדפן
  if (showWebcam && Platform.OS === 'web') {
    return (
      <View style={styles.webcamContainer}>
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          style={styles.webcam}
        />
        <View style={styles.buttonGroup}>
          <Button title="צלם" onPress={captureImage} />
          <Button title="ביטול" onPress={() => setShowWebcam(false)} />
        </View>
      </View>
    );
  }

  // תצוגת ה-Bottom Sheet (Modal) עם האפשרויות
  const iconMapping = {
    'צלם תמונה': 'camera',
    'בחר מהגלריה': 'image',
    'הסר תמונה': 'delete',
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.bottomSheet}>
          <View style={styles.optionsContainer}>
            {headers?.map((option, index) => (
              <Pressable
                key={index}
                style={styles.optionButton}
                onPress={() => {
                  if (option === 'צלם תמונה') {
                    pickImage(true);
                  } else if (option === 'בחר מהגלריה') {
                    pickImage(false);
                  } else if (option === 'הסר תמונה') {
                    removeImageFromFirestore();
                  }
                }}
              >
                <IconButton
                  icon={iconMapping[option] || 'dots-horizontal'}
                  size={30}
                  iconColor="#007AFF"
                  style={styles.iconButton}
                />
                <Text style={styles.optionText}>{option}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

export default ProfileImageUploader;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  optionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
  },
  optionText: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 5,
    textAlign: 'center',
  },
  iconButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 40,
  },
  webcamContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  webcam: {
    width: '90%',
    aspectRatio: 1,
    borderRadius: 15,
  },
  buttonGroup: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'space-around',
    width: '80%',
  },
});
