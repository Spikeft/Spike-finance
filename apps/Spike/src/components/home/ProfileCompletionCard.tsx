import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

interface ProfileCompletionCardProps {
  completionPercentage?: number;
  onPressContinue?: () => void;
}

export function ProfileCompletionCard({
  completionPercentage = 50,
  onPressContinue,
}: ProfileCompletionCardProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        <View style={styles.details}>
          <Text style={styles.message}>
            Your profile is{' '}
            <Text style={styles.percentage}>{completionPercentage}%</Text>{' '}
            complete. Finish setting it up for a better experience.
          </Text>

          <Pressable
            onPress={onPressContinue}
            style={({ pressed }) => [styles.ctaButton, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Continue profile setup"
          >
            <Text style={styles.ctaText}>Continue</Text>
            <Image
              source={require('@/assets/images/home/icon-arrow-right.svg')}
              contentFit="contain"
              style={styles.arrowIcon}
            />
          </Pressable>
        </View>

        <View style={styles.progressContainer}>
          <Image
            source={require('@/assets/images/home/chart-ring-50.svg')}
            contentFit="contain"
            style={styles.progressRing}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 2.5,
    elevation: 2,
  },
  details: {
    flex: 1,
    gap: 12,
  },
  message: {
    fontFamily: 'Inter_18pt-Regular',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.16,
    color: '#18181B',
  },
  percentage: {
    fontFamily: 'Inter_18pt-Medium',
    color: '#F97316',
  },
  ctaButton: {
    alignSelf: 'flex-start',
    height: 40,
    borderRadius: 9999,
    backgroundColor: '#86FC80',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaText: {
    fontFamily: 'Inter_18pt-Medium',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.14,
    color: '#0C490C',
  },
  arrowIcon: {
    width: 16,
    height: 16,
  },
  progressContainer: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRing: {
    width: 44,
    height: 44,
  },
  pressed: {
    opacity: 0.8,
  },
});
