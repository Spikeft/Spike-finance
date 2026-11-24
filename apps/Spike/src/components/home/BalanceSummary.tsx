import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

interface BalanceSummaryProps {
  totalBalance: number;
  withdrawableBalance: number;
  isBalanceHidden: boolean;
  onToggleBalanceVisibility: () => void;
}

function formatNairaParts(amount: number): { whole: string; decimals: string } {
  const fixed = amount.toFixed(2);
  const [intPart, decPart] = fixed.split('.');
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return {
    whole: `₦${formattedInt}`,
    decimals: decPart,
  };
}

export function BalanceSummary({
  totalBalance,
  withdrawableBalance,
  isBalanceHidden,
  onToggleBalanceVisibility,
}: BalanceSummaryProps) {
  const isZero = totalBalance === 0;
  const totalParts = formatNairaParts(totalBalance);
  const withdrawableParts = formatNairaParts(withdrawableBalance);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Total Balance</Text>

      <View style={styles.details}>
        <View style={styles.balanceRow}>
          {isZero ? (
            <Text style={styles.zeroBalanceText}>₦0.00</Text>
          ) : isBalanceHidden ? (
            <View style={styles.hiddenEyesRow}>
              <Image
                source={require('@/assets/images/home/balance-hidden-eyes.svg')}
                contentFit="contain"
                style={styles.hiddenEyePair}
              />
              <Image
                source={require('@/assets/images/home/balance-hidden-eyes.svg')}
                contentFit="contain"
                style={styles.hiddenEyePair}
              />
            </View>
          ) : (
            <View style={styles.amountContainer}>
              <Text style={styles.balanceWhole}>{totalParts.whole}</Text>
              <Text style={styles.balanceDot}>.</Text>
              <Text style={styles.balanceDecimals}>{totalParts.decimals}</Text>
            </View>
          )}

          {!isZero && (
            <Pressable
              onPress={onToggleBalanceVisibility}
              style={({ pressed }) => [styles.eyeButton, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={isBalanceHidden ? 'Show balance' : 'Hide balance'}
              hitSlop={10}
            >
              <Image
                source={
                  isBalanceHidden
                    ? require('@/assets/images/home/icon-eye-closed.svg')
                    : require('@/assets/images/home/icon-eye.svg')
                }
                contentFit="contain"
                style={styles.eyeIcon}
              />
            </Pressable>
          )}
        </View>

        <Text style={styles.availableText}>
          <Text style={styles.availableAmount}>
            {isBalanceHidden && !isZero
              ? '₦••••'
              : `${withdrawableParts.whole}.${withdrawableParts.decimals}`}
          </Text>
          <Text style={styles.availableLabel}> available to withdraw</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 32,
    gap: 8,
  },
  label: {
    fontFamily: 'Figtree-Medium',
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.16,
    color: '#18181B',
  },
  details: {
    gap: 12,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 48,
  },
  zeroBalanceText: {
    fontFamily: 'Figtree-Bold',
    fontSize: 48,
    lineHeight: 52,
    letterSpacing: -0.96,
    color: 'rgba(24, 24, 27, 0.4)',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  balanceWhole: {
    fontFamily: 'Figtree-Bold',
    fontSize: 48,
    lineHeight: 52,
    letterSpacing: -0.96,
    color: '#18181B',
  },
  balanceDot: {
    fontFamily: 'Figtree-Bold',
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.48,
    color: 'rgba(113, 113, 122, 0.7)',
  },
  balanceDecimals: {
    fontFamily: 'Figtree-Bold',
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.48,
    color: 'rgba(113, 113, 122, 0.6)',
  },
  hiddenEyesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hiddenEyePair: {
    width: 77,
    height: 40,
  },
  eyeButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeIcon: {
    width: 24,
    height: 24,
  },
  availableText: {
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.16,
  },
  availableAmount: {
    fontFamily: 'Figtree-Bold',
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.16,
    color: '#EA580C',
  },
  availableLabel: {
    fontFamily: 'Inter_18pt-Regular',
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.16,
    color: '#71717A',
  },
  pressed: {
    opacity: 0.7,
  },
});
