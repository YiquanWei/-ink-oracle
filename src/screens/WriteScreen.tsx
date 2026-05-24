import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import StrokeCanvas from '../components/StrokeCanvas';
import { getReading } from '../logic/divination';
import type { RootStackParamList, StrokeEvent } from '../types';

type Props = StackScreenProps<RootStackParamList, 'Write'>;

export default function WriteScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);

  function handleComplete(events: StrokeEvent[]) {
    setLoading(true);
    // Yield to the render loop so the indicator paints before the sync calculation
    setTimeout(() => {
      const result = getReading(events);
      navigation.navigate('Result', { result });
    }, 60);
  }

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#C8A96E" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StrokeCanvas onComplete={handleComplete} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0D0D0D',
  },
});
