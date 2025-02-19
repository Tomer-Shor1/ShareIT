import { getAuth ,signOut,GoogleAuthProvider,createUserWithEmailAndPassword, signInWithPopup, signInWithCredential, FacebookAuthProvider, User } from 'firebase/auth';
import { DatabaseManager } from '../Model/databaseManager';
import { Alert, Platform } from 'react-native';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { AccessToken, LoginManager } from 'react-native-fbsdk-next';
import { getStorage, ref, uploadString } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { Logic } from './Logic';
import firestore from '@react-native-firebase/firestore';
import { Reader } from "./Reader"
import { create } from 'react-test-renderer';
import { get } from 'react-native/Libraries/TurboModule/TurboModuleRegistry';
import { firebaseConfig } from '../Model/firebaseConfig'; 



// checkout poetry


export class Writer {

  private databaseManager: DatabaseManager;

  constructor() {
    // Initialize the DatabaseManager with the required configuration
    try{
    this.databaseManager = DatabaseManager.getInstance();
    }
    catch{
      this.databaseManager = DatabaseManager.getInstance();
    }
    // DatabaseManager.initialize(firebaseConfig);
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
    try {
      // ✅ Ensure passwords match
      if (password !== confirmPassword) {
        return { success: false, message: "Passwords do not match." };
      }
  
      // ✅ Ensure terms & conditions are accepted
      if (!agree) {
        return { success: false, message: "You must agree to the terms and conditions." };
      }
  
      const auth = DatabaseManager.getAuthInstance();
  
      // ✅ Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      console.log(`✅ User registered in Firebase Auth: ${user.email} (UID: ${user.uid})`);
  
      // ✅ Store user in Firestore (without password)
      await DatabaseManager.addDocument("users", {
        uid: user.uid,
        username: username,
        email: user.email,
        createdAt: new Date().toISOString(),
        coins: 3, // ✅ Give new users 3 coins
      });
  
      return { success: true, message: "Sign-up successful!" };
    } catch (error: any) {
      console.error("❌ Sign-up error:", error);
  
      // ✅ Handle Firebase Auth errors properly
      if (error.code === "auth/email-already-in-use") {
        return { success: false, message: "Email already in use." };
      } else if (error.code === "auth/weak-password") {
        return { success: false, message: "Password is too weak. Try a stronger password." };
      } else {
        return { success: false, message: error.message };
      }
    }
  }




  // this function enters the app if the email was previously registered.
  // aka. signs in the user related to this google email.
  async signInWithGoogle(): Promise<{ success: boolean; message: string }> {
    try {
      
      const auth = getAuth();

      // ensure previous user is signed out
      console.log("🔄 Signing out previous user...");
      await signOut(auth);

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
      try {
        console.log('Checking email existence...');
        const users = await DatabaseManager.queryCollection('users', 'email', '==', user.email);
        if (users.length > 0) {
          return Promise.resolve({ success: false, message: 'Email already registered' });
        }
      } catch (error) {
        console.error('Error checking email existence:', error);
        return Promise.resolve({ success: false, message: 'Error checking email. Please try again.' });
      }

      // adding user to the database
      try {
        console.log('Adding user to database...');
        await DatabaseManager.addDocument('users', {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || 'User',
          createdAt: new Date().toISOString(),
          coins: 3,
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

    // Check if the platform is web
    if (Platform.OS !== 'web') {
      const FBSDK = require('react-native-fbsdk-next');
      LoginManager = FBSDK.LoginManager;
      AccessToken = FBSDK.AccessToken;
    }
    try {
      const auth = getAuth();
      // ✅ Ensure previous user is logged out before signing in a new user
      console.log("🔄 Signing out previous user...");
      await signOut(auth);

      let user;

      if (Platform.OS === 'web') {
        const provider = new FacebookAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        try {
          console.log('Checking email existence...');
          const users = await DatabaseManager.queryCollection('users', 'email', '==', user.email);
          if (users.length > 0) {
            return Promise.resolve({ success: false, message: 'Email already registered' });
          }
        } catch (error) {
          console.error('Error checking email existence:', error);
          return Promise.resolve({ success: false, message: 'Error checking email. Please try again.' });
        }
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

        // add the user to the database
        await DatabaseManager.addDocument('users', {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || 'User',
          createdAt: new Date().toISOString(),
          coins: 3,
        });
        Alert.alert('Success', `Welcome ${user.displayName || 'User'}!`);
        return { success: true, message: `Welcome ${user.displayName || 'User'}!` };
      }
    } catch (error) {
      console.error('Facebook Sign-In Error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Facebook sign-in failed');
      return { success: false, message: error instanceof Error ? error.message : 'Facebook sign-in failed' };
    }
  };


  /**
 * Function to mark a request as caught.
 * @param requestId - The ID of the request to be updated.
 */
  static async setRequestCaught(requestId: string, flag: boolean): Promise<void> {
    DatabaseManager.markRequestAsCaught(requestId, flag);
  }


  async uploadProfileImage(user: string, base: Base64URLString): Promise<{ success: boolean; message: string }> {
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
  public async addRequest(
    title: string,
    currentCoordinates: string,
    currentAddress: string,
    DestinationLoaction: string,
    additionalNotes: string,
    phoneNumber: string,
    takenBy: string
  ): Promise<{ success: boolean; message: string }> {
    console.log('Request data:', {
      title,
      currentCoordinates,
      currentAddress,
      DestinationLoaction,
      additionalNotes,
    });

    const auth = DatabaseManager.getAuthInstance();

    // user authentication
    const user = auth.currentUser;
    if (!user) {
      // 
      console.log('User is not authenticated. Please sign in first.');
      return {
        success: false,
        message: 'User is not authenticated. Please sign in first.'
      };
    }

    // adding the request to the database
    const requestData = {
      title,
      currentCoordinates,
      currentAddress,
      phoneNumber,
      DestinationLoaction,
      additionalNotes,
      timestamp: new Date().toISOString(), // 
      uid: user.uid, // user's ID
      caught: false // the request is not caught yet
    };

    try {
      console.log('Adding request to database...');
      const docId = await DatabaseManager.addDocument('Open-Requests', requestData);
      console.log("Request added successfully!");

      return {
        success: true,
        message: `Request added successfully with ID: ${docId}`
      };
    } catch (error) {
      console.error('Error adding request to database:', error);

      return {
        success: false,
        message: 'Error adding request. Please try again.'
      };
    }
  }

}