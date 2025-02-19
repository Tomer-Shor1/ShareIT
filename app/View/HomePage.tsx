
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StackNavigationProp } from "@react-navigation/stack";
import { NavigationProp, ParamListBase } from '@react-navigation/native';

interface LoginScreenProps {
  navigation: NavigationProp<ParamListBase>;
}

const HomePage: React.FC<LoginScreenProps> = ({navigation}) => {
    return (
    <View style={styles.container}>
        <LinearGradient
        colors={['#4a90e2', '#2b5876']}
        style={styles.gradient}
        >
          <View style={styles.content}>
            <Text style={styles.logo}>ShareIT</Text>
            <Text style={styles.subtitle}>Connect. Share. Thrive.</Text>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                style={styles.button}
                onPress={() => navigation.navigate("LogIn")}
                >
                  <Text style={styles.buttonText}>Login</Text>
                </TouchableOpacity>

                <TouchableOpacity
                style={[styles.button, styles.signUpButton]}
                onPress={() => navigation.navigate("SignUp")}
                >
                  <Text style={[styles.buttonText, styles.signUpText]}>Sign Up</Text>
                </TouchableOpacity>
              </View>
          </View>
        </LinearGradient>
    </View>)
};


const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    gradient: {
      flex: 1,
      width: '100%',
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    logo: {
      fontSize: 48,
      fontWeight: 'bold',
      color: '#ffffff',
      marginBottom: 10,
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 2, height: 2 },
      textShadowRadius: 5,
    },
    subtitle: {
      fontSize: 18,
      color: '#ffffff',
      marginBottom: 50,
      opacity: 0.9,
    },
    buttonContainer: {
      width: '100%',
      maxWidth: 300,
      gap: 20,
    },
    button: {
      width: '100%',
      height: 54,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 27,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    signUpButton: {
      backgroundColor: '#ffffff',
    },
    buttonText: {
      fontSize: 18,
      fontWeight: '600',
      color: '#ffffff',
    },
    signUpText: {
      color: '#2b5876',
    },
  });

export default HomePage