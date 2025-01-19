import { getAuth, GoogleAuthProvider, signInWithCredential, FacebookAuthProvider } from 'firebase/auth';
import { DatabaseManager } from '../Model/databaseManager';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { AccessToken, LoginManager } from 'react-native-fbsdk-next';
import { getStorage, ref, uploadString } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';

export class Logic {
  private databaseManager: DatabaseManager;
  private messages: string[];

  constructor() {
    this.messages = [];
  }

  // הוספת הודעה
  private addMessage(message: string) {
    this.messages.push(message);
  }

  // בדיקת שם משתמש
  async validateUsername(value: string): Promise<string> {
    if (value.trim().length < 3) {
      return 'Username must be at least 3 characters long';
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(value)) {
      return 'Username can only contain letters, numbers, underscores, and dots';
    }

    try {
      const users = await DatabaseManager.queryCollection('users', 'username', '==', value);
      if (users.length > 0) {
        return 'Username already taken';
      }
    } catch (error) {
      console.error('Error checking username existence:', error);
      return 'An error occurred while validating the username';
    }

    return '';
  }

  // בדיקת אימייל
  async validateEmail(value: string): Promise<string> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }

    try {
      const users = await DatabaseManager.queryCollection('users', 'email', '==', value);
      if (users.length > 0) {
        return 'Email already registered';
      }
    } catch (error) {
      console.error('Error checking email existence:', error);
      return 'An error occurred while validating the email';
    }

    return '';
  }

  // בדיקת סיסמה
  validatePassword(value: string): string {
    if (value.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(value)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[0-9]/.test(value)) {
      return 'Password must contain at least one number';
    }
    if (!/[!@#$%^&*]/.test(value)) {
      return 'Password must contain at least one special character (!@#$%^&*)';
    }
    return '';
  }

  // בדיקת סיסמה חוזרת
  validateConfirmPassword(password: string, confirmPassword: string): string {
    if (password !== confirmPassword) {
      return 'Passwords do not match';
    }
    return '';
  }

  // בדיקת הסכמה
  validateAgreement(value: boolean): string {
    if (!value) {
      return 'You must agree to the terms and conditions';
    }
    return '';
  }

  async validateSignUpInput(username: string, email: string, password: string, confirmPassword: string, agree: boolean) {
    this.messages = []; // איפוס הודעות

    const usernameError = await this.validateUsername(username);
    if (usernameError) this.addMessage(usernameError);

    const emailError = await this.validateEmail(email);
    if (emailError) this.addMessage(emailError);

    const passwordError = this.validatePassword(password);
    if (passwordError) this.addMessage(passwordError);

    const confirmPasswordError = this.validateConfirmPassword(password, confirmPassword);
    if (confirmPasswordError) this.addMessage(confirmPasswordError);

    const agreementError = this.validateAgreement(agree);
    if (agreementError) this.addMessage(agreementError);

    if (this.messages.length > 0) {
      return { success: false, messages: this.messages };
    }
    return { success: true, messages: ['Sign-up input is valid'] };
  }
}
