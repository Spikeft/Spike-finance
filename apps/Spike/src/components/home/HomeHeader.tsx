import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

interface HomeHeaderProps {
  firstName: string;
  onPressProfile?: () => void;
  onPressSupport?: () => void;
}

export function HomeHeader({
  firstName,
  onPressProfile,
  onPressSupport,
}: HomeHeaderProps) {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={onPressProfile}
        style={({ pressed }) => [styles.profileGroup, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`Profile for ${firstName}`}
      >
        <View style={styles.avatarWrapper}>
          <View style={styles.avatarCircle}>
            <Image
              source={require('@/assets/images/home/avatar-zara.svg')}
              contentFit="contain"
              style={styles.avatarImage}
            />
          </View>
          <View style={styles.badgeContainer} pointerEvents="none">
            <Image
              source={require('@/assets/images/home/badge-shield-bg.svg')}
              contentFit="contain"
              style={styles.badgeShield}
            />
            <Image
              source={require('@/assets/images/home/badge-crown.svg')}
              contentFit="contain"
              style={styles.badgeCrown}
            />
          </View>
        </View>
        <Text style={styles.greeting} numberOfLines={1}>
          Hey, {firstName}!
        </Text>
      </Pressable>

      <Pressable
        onPress={onPressSupport}
        style={({ pressed }) => [styles.supportButton, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Customer support"
        hitSlop={8}
      >
        <Image
          source={require('@/assets/images/home/icon-headset.svg')}
          contentFit="contain"
          style={styles.supportIcon}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  profileGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    flexShrink: 1,
  },
  avatarWrapper: {
    width: 56,
    height: 56,
    position: 'relative',
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  avatarImage: {
    width: 53,
    height: 49,
    marginBottom: -1,
  },
  badgeContainer: {
    position: 'absolute',
    right: -1,
    bottom: -2,
    width: 20,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeShield: {
    position: 'absolute',
    width: 20,
    height: 23,
  },
  badgeCrown: {
    width: 11,
    height: 11,
    marginTop: -2,
  },
  greeting: {
    fontFamily: 'Figtree-Medium',
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.2,
    color: '#18181B',
  },
  supportButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportIcon: {
    width: 24,
    height: 24,
  },
  pressed: {
    opacity: 0.7,
  },
});
