import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

export type TransactionKind = 'savings' | 'deposit' | 'transfer' | 'electricity';
export type TransactionStatus = 'success' | 'failed';

export interface HomeTransaction {
  id: string;
  kind: TransactionKind;
  title: string;
  subtitle: string;
  amount: string;
  isCredit: boolean;
  status: TransactionStatus;
}

export const DEFAULT_TRANSACTIONS: HomeTransaction[] = [
  {
    id: 'tx-1',
    kind: 'savings',
    title: 'Savings',
    subtitle: 'To Emergency funds',
    amount: '−₦15,000.00',
    isCredit: false,
    status: 'success',
  },
  {
    id: 'tx-2',
    kind: 'deposit',
    title: 'Deposit',
    subtitle: 'From Emeka A.',
    amount: '+₦50,000.00',
    isCredit: true,
    status: 'success',
  },
  {
    id: 'tx-3',
    kind: 'transfer',
    title: 'Transfer',
    subtitle: 'To Aisha L.',
    amount: '−₦12,000.00',
    isCredit: false,
    status: 'failed',
  },
  {
    id: 'tx-4',
    kind: 'electricity',
    title: 'Electricity',
    subtitle: 'From IKED',
    amount: '−₦12,000.00',
    isCredit: false,
    status: 'success',
  },
  {
    id: 'tx-5',
    kind: 'deposit',
    title: 'Deposit',
    subtitle: 'From Azeez T.',
    amount: '+₦150,000.00',
    isCredit: true,
    status: 'success',
  },
  {
    id: 'tx-6',
    kind: 'transfer',
    title: 'Transfer',
    subtitle: 'To Kabir S.',
    amount: '−₦12,000.00',
    isCredit: false,
    status: 'success',
  },
];

interface TransactionsSectionProps {
  transactions?: HomeTransaction[];
  onPressHeader?: () => void;
  onPressTransaction?: (tx: HomeTransaction) => void;
}

function TransactionLeadingIcon({
  kind,
  status,
}: {
  kind: TransactionKind;
  status: TransactionStatus;
}) {
  const isFailed = status === 'failed';

  return (
    <View style={styles.avatarCircle}>
      {kind === 'savings' && (
        <Image
          source={require('@/assets/images/home/icon-savings.svg')}
          contentFit="contain"
          style={styles.glyphIcon}
        />
      )}
      {kind === 'deposit' && (
        <Image
          source={require('@/assets/images/home/icon-arrow-downward.svg')}
          contentFit="contain"
          style={styles.glyphIcon}
        />
      )}
      {kind === 'transfer' && (
        <Image
          source={require('@/assets/images/home/icon-arrow-upward.svg')}
          contentFit="contain"
          style={styles.glyphIcon}
        />
      )}
      {kind === 'electricity' && (
        <Image
          source={require('@/assets/images/home/tx-iked.png')}
          contentFit="contain"
          style={styles.merchantIcon}
        />
      )}

      <View
        style={[
          styles.statusBadge,
          isFailed ? styles.statusBadgeFailed : styles.statusBadgeSuccess,
        ]}
      >
        <Image
          source={
            isFailed
              ? require('@/assets/images/home/icon-xmark.svg')
              : require('@/assets/images/home/icon-check.svg')
          }
          contentFit="contain"
          style={styles.statusIcon}
        />
      </View>
    </View>
  );
}

export function TransactionsSection({
  transactions = DEFAULT_TRANSACTIONS,
  onPressHeader,
  onPressTransaction,
}: TransactionsSectionProps) {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={onPressHeader}
        style={({ pressed }) => [styles.headerRow, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Transactions"
      >
        <Image
          source={require('@/assets/images/home/icon-history.svg')}
          contentFit="contain"
          style={styles.headerIcon}
        />
        <Text style={styles.headerTitle}>Transactions</Text>
        <View style={styles.chevronBox}>
          <Image
            source={require('@/assets/images/home/icon-chevron-right.svg')}
            contentFit="contain"
            style={styles.chevronIcon}
          />
        </View>
      </Pressable>

      {transactions.length === 0 ? (
        <View style={styles.emptyState}>
          <Image
            source={require('@/assets/images/home/icon-bill-list.svg')}
            contentFit="contain"
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyMessage}>Your activity will appear here</Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {transactions.map((tx, index) => (
            <React.Fragment key={tx.id}>
              <Pressable
                onPress={() => onPressTransaction?.(tx)}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                accessibilityRole="button"
                accessibilityLabel={`${tx.title} ${tx.subtitle} ${tx.amount}`}
              >
                <View style={styles.rowLeft}>
                  <TransactionLeadingIcon kind={tx.kind} status={tx.status} />
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {tx.title}
                    </Text>
                    <Text style={styles.rowSubtitle} numberOfLines={1}>
                      {tx.subtitle}
                    </Text>
                  </View>
                </View>

                <Text
                  style={[
                    styles.rowAmount,
                    tx.isCredit ? styles.amountCredit : styles.amountDebit,
                  ]}
                  numberOfLines={1}
                >
                  {tx.amount}
                </Text>
              </Pressable>

              {index < transactions.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    paddingHorizontal: 20,
    gap: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    alignSelf: 'flex-start',
  },
  headerIcon: {
    width: 20,
    height: 20,
  },
  headerTitle: {
    fontFamily: 'Figtree-Bold',
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.16,
    color: '#71717A',
  },
  chevronBox: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronIcon: {
    width: 16,
    height: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    gap: 12,
  },
  emptyIcon: {
    width: 28,
    height: 28,
  },
  emptyMessage: {
    fontFamily: 'Inter_18pt-Regular',
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.16,
    color: '#71717A',
    textAlign: 'center',
  },
  listContainer: {
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EBEBEB',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glyphIcon: {
    width: 20,
    height: 20,
  },
  merchantIcon: {
    width: 24,
    height: 28,
  },
  statusBadge: {
    position: 'absolute',
    right: -2,
    bottom: -1,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.25,
    borderColor: '#EBEBEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadgeSuccess: {
    backgroundColor: '#2DB42D',
  },
  statusBadgeFailed: {
    backgroundColor: '#FF383C',
  },
  statusIcon: {
    width: 12,
    height: 12,
  },
  rowInfo: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: 'Figtree-Bold',
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.16,
    color: '#18181B',
  },
  rowSubtitle: {
    fontFamily: 'Inter_18pt-Regular',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.14,
    color: '#71717A',
  },
  rowAmount: {
    fontFamily: 'Figtree-Bold',
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.16,
    textAlign: 'right',
  },
  amountCredit: {
    color: '#249824',
  },
  amountDebit: {
    color: '#18181B',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginLeft: 56,
  },
  pressed: {
    opacity: 0.7,
  },
  rowPressed: {
    opacity: 0.75,
  },
});
