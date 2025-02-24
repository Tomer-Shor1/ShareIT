// NotificationService.ts

import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform, Alert } from 'react-native';

// Configure notifications for native platforms
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Registers the device for push notifications (native only).
 */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  let token;
  if (Constants.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      Alert.alert('Failed to get push token for notifications!');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Push token:', token);
  } else {
    Alert.alert('Must use physical device for Push Notifications');
  }
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
  return token;
}

/**
 * Sends a notification to the device.
 * @param title The notification title.
 * @param body The notification body.
 * @param data Additional data to send with the notification.
 */
export async function sendNotification(
  title: string,
  body?: string,
  data: object = {}
): Promise<void> {
  if (Platform.OS === 'web') {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications.");
      return;
    }
    if (Notification.permission === "granted") {
      console.log("Sending web notification (granted).");
      new Notification(title, { body });
    } else if (Notification.permission !== "denied") {
      console.log("Requesting web notification permission...");
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        console.log("Web notification permission granted, sending notification.");
        new Notification(title, { body });
      } else {
        console.log("Web notification permission denied.");
      }
    } else {
      console.log("Web notification permission denied previously.");
    }
  } else {
    console.log("Sending native notification.");
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: null, // triggers immediately
    });
  }
}