import 'react-native-gesture-handler';
import React from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import WriteScreen from './src/screens/WriteScreen';
import ResultScreen from './src/screens/ResultScreen';
import type { RootStackParamList } from './src/types';

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Write">
          <Stack.Screen
            name="Write"
            component={WriteScreen}
            options={{ title: '占卜' }}
          />
          <Stack.Screen
            name="Result"
            component={ResultScreen}
            options={{ title: '卦象' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
