import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

interface ActionButtonsRowProps {
  onPressAddMoney?: () => void;
  onPressTransfer?: () => void;
}

export function ActionButtonsRow({
  onPressAddMoney,
  onPressTransfer,
}: ActionButtonsRowProps) {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={onPressAddMoney}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Add Money"
      >
        <Image
          source={require('@/assets/images/home/icon-add-circle.svg')}
          contentFit="contain"
          style={styles.icon}
        />
        <Text style={styles.buttonText}>Add Money</Text>
      </Pressable>

      <Pressable
        onPress={onPressTransfer}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Transfer"
      >
        <Image
          source={require('@/assets/images/home/icon-transfer.svg')}
          contentFit="contain"
          style={styles.icon}
        />
        <Text style={styles.buttonText}>Transfer</Text>
      </Pressable>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    marginTop: 32,
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: 9999,
    backgroundColor: '#0C490C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  icon: {
    width: 20,
    height: 20,
  },
  buttonText: {
    fontFamily: 'Inter_18pt-Medium',
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.16,
    color: '#FCFCFC',
  },
  pressed: {
    opacity: 0.85,
  },
});
