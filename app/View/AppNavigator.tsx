import React from "react";
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import { routes } from "./route"; // Import your route configuration

import { RootStackParamList } from "./route"; // Import the type


const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator id={undefined} initialRouteName="Home">
        {routes.map((route, index) => (
          <Stack.Screen
            key={index}
            name={route.name as keyof RootStackParamList} // Ensure TypeScript compatibility
            component={route.component}
            options={{headerShown: false}}
          />
        ))}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
