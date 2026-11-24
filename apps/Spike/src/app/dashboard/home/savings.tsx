import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

export default function SavingsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <Text style={styles.title}>Savings</Text>
      <View style={styles.emptyState}>
        <Image
          source={require('@/assets/images/home/icon-spa.svg')}
          contentFit="contain"
          style={styles.icon}
        />
        <Text style={styles.subtitle}>Your saving plans will appear here</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 20,
  },
  title: {
    fontFamily: 'Figtree-Bold',
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.5,
    color: '#18181B',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingBottom: 100,
  },
  icon: {
    width: 32,
    height: 32,
  },
  subtitle: {
    fontFamily: 'Inter_18pt-Regular',
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.16,
    color: '#71717A',
  },
});
