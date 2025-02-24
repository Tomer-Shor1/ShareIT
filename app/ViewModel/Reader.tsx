import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform, SafeAreaView, KeyboardAvoidingView } from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged,User, GoogleAuthProvider, signInWithPopup, signInWithCredential, FacebookAuthProvider } from 'firebase/auth';
import { DatabaseManager } from '../Model/databaseManager';
import firestore from '@react-native-firebase/firestore';
import { firebaseConfig } from '../Model/firebaseConfig'; 

interface LoginManagerType {
  logInWithPermissions: (permissions: string[]) => Promise<{ isCancelled: boolean }>;
}

interface AccessTokenType {
  getCurrentAccessToken: () => Promise<{ accessToken: string } | null>;
}

interface GoogleSigninType {
  configure: (options: { webClientId: string }) => void;
  hasPlayServices: () => Promise<boolean>;
  signIn: () => Promise<any>;
  getTokens: () => Promise<{ idToken: string }>;
}

let GoogleSignin: GoogleSigninType,
  LoginManager: LoginManagerType,
  AccessToken: AccessTokenType;

if (Platform.OS !== 'web') {
  GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
  const FBSDK = require('react-native-fbsdk-next');
  LoginManager = FBSDK.LoginManager;
  AccessToken = FBSDK.AccessToken;

  GoogleSignin.configure({
    webClientId: '441220624714',
  });
}
export class Reader {
  private databaseManager: DatabaseManager;

  constructor() {
    // Initialize the DatabaseManager with the required configuration
    try{
      this.databaseManager = DatabaseManager.getInstance();
      }
      catch{
        this.databaseManager = DatabaseManager.getInstance();
      }
  }

  // this function logs an existing user in
  async HandleLogins(email: string, password: string): Promise<{ success: boolean; message: string }> {
    try {
      const auth = getAuth();
  
      // ✅ Sign in with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      console.log(`✅ Logged in as: ${user.email} (UID: ${user.uid})`);
  
      // ✅ Now the Firebase Auth system recognizes the user
      Alert.alert("Success", `Welcome back, ${user.email || "User"}!`);
      return { success: true, message: "Login successful" };
    } catch (error: any) {
      console.error("❌ Login error:", error);
  
      if (error.code === "auth/user-not-found") {
        Alert.alert("Error", "User not found.");
      } else if (error.code === "auth/wrong-password") {
        Alert.alert("Error", "Incorrect password.");
      } else {
        Alert.alert("Error", "An error occurred while logging in.");
      }
  
      return { success: false, message: error.message };
    }
  }

  async LoginnWithGoogle(): Promise<{ success: boolean; message: string }> {
    console.log('Logging in with Google...');
    try {
      const auth = getAuth();
      let user;
      if (Platform.OS === 'web') {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        user = result.user;
        return { success: true, message: `Welcome ${user.displayName || 'User'}!` };
      } else {
        await GoogleSignin.hasPlayServices();
        const userInfo = await GoogleSignin.signIn();
        const { idToken } = await GoogleSignin.getTokens();
        const googleCredential = GoogleAuthProvider.credential(idToken);
        const userCredential = await signInWithCredential(auth, googleCredential);
        const user = userCredential.user;
        console.log('Adding user to database...');
        return { success: true, message: `Welcome ${user.displayName || 'User'}!` };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Google Sign-In Error:', error);
      return { success: false, message: `Google Sign-In failed: ${errorMessage}` };
    }
  }

  async LoginWithFacebook(): Promise<{ success: boolean; message: string }> {
    try {
      const auth = getAuth();

      if (Platform.OS === 'web') {
        const provider = new FacebookAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

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


        return { success: true, message: `Welcome ${user.displayName || 'User'}!` };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Facebook Sign-In Error:', error);
      return { success: false, message: `Facebook Sign-In failed: ${errorMessage}` };
    }
  }

  // Read open requests from the database - returns an array of requests
  async ReadOpenRequests(): Promise<any[]> {
    try {
      // let requests: any[] = [];
      
      // Get the current user's UID (or empty string if not logged in)
      const auth = getAuth();   // could be const auth = getAuth();   --- need to 
      const currentUserId = auth.currentUser?.uid || "";
      
      // Query the "Open-Requests" collection
      const querySnapshot = await DatabaseManager.queryCollection("Open-Requests", "uid", "!=", currentUserId);
      console.log("Query executed successfully");
      
      let requests = Reader.refrenceToDocument(querySnapshot);
      return requests;
    }catch (error) {
      console.error("Error reading open requests:", error);
      throw new Error("Failed to read open requests");
      }
    }

  // this function returns the requests that were opened by the user
  // the function receives the querySnapshot and the user's UID and returns an array of requests
  // 
  static refrenceToDocument(querySnapshot: any){
    let requests: any[] = [];

    for (const doc of querySnapshot) {
      if (doc && doc.id) {
        const data = doc.data ? doc.data() : doc; // Retrieve data from the document

        // Filter: if the request has a "takenBy" field equal to the current user's UID, skip it.
        // if (data.uid && data.uid === UserId) {
        //   console.log(`Skipping request ${doc.id} because it was opened by the current user!`);
        //   continue;
        // }

        const request = { 
          id: doc.id,                                           // Document ID
          title: data.title || "",                              // "title" field
          currentCoordinates: data.currentCoordinates || "",    // "currentCoordinates"
          currentAddress: data.currentAddress || "",            // "currentAddress"
          DestinationLoaction: data.DestinationLoaction || "",  // "destinationCoordinates"
          additionalNotes: data.additionalNotes || "",          // "additionalNotes"
          phoneNumber: data.phoneNumber || "",                  // "phoneNumber"
          timestamp: data.timestamp || "",                      // "timestamp"
          uid: data.uid || "",                                  // "uid"
          createdAt: data.createdAt || "",                      // "createdAt"
          updatedAt: data.updatedAt || "",                      // "updatedAt"
          status: data.status || "",                            // "status field"
          takenBy: data.takenBy || null,                        // uid of whoever took it
        };

        // Add the filtered request to the array.
        requests.push(request);
      } else {
        console.log(`Skipping request with ID: ${doc.id} - Data not available.`);
      }
    }
    
    console.log("Successfully retrieved Open-Requests:", requests);
    return requests;
  }


  async ReadTakenRequestsByUser(uid: string): Promise<any[]> {
    return DatabaseManager.getRequestsTakenByUser(uid);
  }

  // this function returns the requests that were opened by the user
  async ReadRequestsOpenedByUser(uid: string): Promise<any[]> {
    return DatabaseManager.getRequestsOpenedByUser(uid);
  }

   async findUserByInternalId(userId: string) {
    try {
      // Reference the "users" collection
      const db = DatabaseManager.getDB();
      const usersRef = collection(db, 'users');
      
      // Create a query to find documents where the "userID" field == userId
      const q = query(usersRef, where('uid', '==', userId));
  
      // Execute the query
      const querySnapshot = await getDocs(q);
      console.log("---------------------------");
      console.log(querySnapshot);
      // If a matching document is found, return its ref
      if (!querySnapshot.empty) {
        console.log('User found:', querySnapshot.docs[0].data);
        return querySnapshot.docs[0].ref;
      }
  
      // Otherwise, return null if no matching document is found
      return null;
    } catch (error) {
      console.error('Error finding user by internal ID:', error);
      return null;
    }
  }



   async getRequestById(requestId: string) {
    try {
      const docRef = firestore().collection('Open-Requests').doc(requestId);
      const doc = await docRef.get();

      if (doc.exists) {
        console.log("Document data:", doc.data());
        return doc;
      } else {
        console.log("No such document!");
        return null;
      }
    } catch (error) {
      console.error("Error getting document:", error);
      throw new Error("Failed to get document");
    }
  }


  /**
 * Fetches the currently authenticated user in real time.
 * @returns A promise that resolves with the User object or null if no user is logged in.
 */
static async getCurrentUser(): Promise<User | null>  {
  return new Promise((resolve) => {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log(`✅ User logged in: ${user.email} (UID: ${user.uid})`);
        resolve(user);
      } else {
        console.log("❌ No user is logged in.");
        resolve(null);
      }
    });
  });
};

async getTableEntranceByKey(table_name: String , entrance_key: String){
  return this.databaseManager.getTableEntranceByKey(table_name, entrance_key);
};

}    