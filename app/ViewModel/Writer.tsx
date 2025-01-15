import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithCredential, FacebookAuthProvider, User } from 'firebase/auth';
import { DatabaseManager } from '../Model/databaseManager';
import { Alert, Platform } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { AccessToken, LoginManager } from 'react-native-fbsdk-next';
import { getStorage, ref, uploadString } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
//import { db } from '../firebaseConfig'; 

export class Writer {
  private databaseManager: DatabaseManager;

  constructor() {
    // Initialize the DatabaseManager with the required configuration
    //this.databaseManager = new DatabaseManager(db);
  }

  /**
   * Handles the sign-up process by validating input and adding the user to the database.
   *
   * @param username The username of the user
   * @param email The email of the user
   * @param password The password of the user
   * @returns A promise resolving with success or error message
   */
  async signUp(
    username: string,
    email: string,
    password: string,
    confirmPassword: string,
    agree: boolean
  ): Promise<{ success: boolean; message: string }> {
    // Validate inputs
    

    // Check if the email already exists in the database
    try {
      console.log('Checking email existence...');
      const users = await DatabaseManager.queryCollection('users', 'email', '==', email);
      if (users.length > 0) {
        return Promise.resolve({ success: false, message: 'Email already registered' });
      }
    } catch (error) {
      console.error('Error checking email existence:', error);
      return Promise.resolve({ success: false, message: 'Error checking email. Please try again.' });
    }

    // Add the user to the database
    try {
      console.log('Adding user to database...');
      await DatabaseManager.addDocument('users', { username, email, password });
      return Promise.resolve({ success: true, message: 'Sign-up successful!' });
    } catch (error) {
      console.error('Error adding user to database:', error);
      return Promise.resolve({ success: false, message: 'Error signing up. Please try again.' });
    }
  }

  async signInWithGoogle(): Promise<{ success: boolean; message: string }> {
    try {
      const auth = getAuth();
      let user;
  
      if (Platform.OS === 'web') {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        user = result.user;
      } else {
        await GoogleSignin.hasPlayServices();
        const userInfo = await GoogleSignin.signIn();
        const { idToken } = await GoogleSignin.getTokens();
        const googleCredential = GoogleAuthProvider.credential(idToken);
        const userCredential = await signInWithCredential(auth, googleCredential);
        user = userCredential.user;
      }
  
      // הוספת משתמש למסד הנתונים
      try {
        console.log('Adding user to database...');
        await DatabaseManager.addDocument('users', {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || 'User',
          createdAt: new Date().toISOString(),
        });
  
        return Promise.resolve({
          success: true,
          message: `Welcome ${user.displayName || 'User'}!`,
        });
      } catch (error) {
        console.error('Error adding user to database:', error);
        return Promise.resolve({
          success: false,
          message: 'Failed to add user to the database. Please try again.',
        });
      }
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      return Promise.resolve({
        success: false,
        message: error instanceof Error ? error.message : 'Google sign-in failed. Please try again.',
      });
    }
  }
  async signInWithFacebook(): Promise<{ success: boolean; message: string }> {
    interface LoginManagerType {
      logInWithPermissions: (permissions: string[]) => Promise<{ isCancelled: boolean }>;
    }
    
    interface AccessTokenType {
      getCurrentAccessToken: () => Promise<{ accessToken: string } | null>;
    }
    
    let LoginManager: LoginManagerType, 
        AccessToken: AccessTokenType;
    
    // ייבוא מותנה פלטפורמה
    if (Platform.OS !== 'web') {
      const FBSDK = require('react-native-fbsdk-next');
      LoginManager = FBSDK.LoginManager;
      AccessToken = FBSDK.AccessToken;
    }
    try {
      const auth = getAuth();

      if (Platform.OS === 'web') {
        const provider = new FacebookAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        await DatabaseManager.addDocument('users', {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || 'User',
          createdAt: new Date().toISOString(),
        });
        Alert.alert('Success', `Welcome ${user.displayName || 'User'}!`);
        return { success: true, message: `Welcome ${user.displayName || 'User'}!` };
      } else {
        const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
        
        if (result.isCancelled) {
          throw new Error('User cancelled the login process');
        }
        const data = await AccessToken.getCurrentAccessToken();
        if (!data) throw new Error('Something went wrong obtaining access token');

        const facebookCredential = FacebookAuthProvider.credential(data.accessToken);
        const userCredential = await signInWithCredential(auth, facebookCredential);
        const user = userCredential.user;
        await DatabaseManager.addDocument('users', {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || 'User',
          createdAt: new Date().toISOString(),
        });
        Alert.alert('Success', `Welcome ${user.displayName || 'User'}!`);
        return { success: true, message: `Welcome ${user.displayName || 'User'}!` };
      }
    } catch (error) {
      console.error('Facebook Sign-In Error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Facebook sign-in failed');
      return { success: false, message: error instanceof Error ? error.message : 'Facebook sign-in failed' };
    }
  };  async uploadProfileImage(user: string,base:Base64URLString): Promise<{ success: boolean; message: string }> {
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
                await DatabaseManager.uploadImageToFirestore(user, base64String);
                return { success: true, message: 'Image uploaded successfully!' };
            } else {
                return { success: false, message: 'Failed to retrieve image data.' };
            }
        } else {
            console.log('Image picker canceled.');
            return { success: false, message: 'Image picker was canceled.' };
        }
    } catch (error) {
        console.error('Error picking image:', error);
        return { success: false, message: 'Error picking or uploading image.' };
    }
}
}

