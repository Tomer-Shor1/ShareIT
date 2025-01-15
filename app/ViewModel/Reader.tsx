import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform, SafeAreaView, KeyboardAvoidingView } from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithCredential, FacebookAuthProvider } from 'firebase/auth';
import { DatabaseManager } from '../Model/databaseManager';
;
//import { db } from '../firebaseConfig'; 

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
    //this.databaseManager = new DatabaseManager(db);
  }

  async HandleLogins(email: string, password: string): Promise<{ success: boolean; message: string }> {
    try {
        const users = await DatabaseManager.queryCollection('users', 'email', '==', email);
  
        if (users.length > 0) {
          const userData = users[0];
  
          if (userData.password === password) {
            Alert.alert('Success', `Welcome back, ${userData.username || 'User'}!`);
            return { success: true, message: 'Login successful' };
          } else {
            Alert.alert('Error', 'Incorrect password');
            return { success: false, message: 'Incorrect password' };
          }
        } else {
          Alert.alert('Error', 'User not found');
          return { success: false, message: 'User not found' };
        }
    } catch (error) {
        Alert.alert('Error', 'An error occurred while logging in');
        console.error(error);
        return { success: false, message: 'An error occurred while logging in' };
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
}