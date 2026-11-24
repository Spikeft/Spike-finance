import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionButtonsRow } from '@/components/home/ActionButtonsRow';
import { BalanceSummary } from '@/components/home/BalanceSummary';
import { HomeHeader } from '@/components/home/HomeHeader';
import { ProfileCompletionCard } from '@/components/home/ProfileCompletionCard';
import { SavingPlansSection } from '@/components/home/SavingPlansSection';
import {
  DEFAULT_TRANSACTIONS,
  TransactionsSection,
} from '@/components/home/TransactionsSection';
import { useActiveUserState } from '@/states/active-user-state';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const user = useActiveUserState((state) => state.user);

  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [showProfileCompletion, setShowProfileCompletion] = useState(false);

  const firstName = user?.firstName?.trim() || 'Zara';

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.contentContainer,
          {
            paddingTop: insets.top + 13,
            paddingBottom: Math.max(insets.bottom, 20) + 96,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <HomeHeader firstName={firstName} />

        <BalanceSummary
          totalBalance={804990.89}
          withdrawableBalance={80950.91}
          isBalanceHidden={isBalanceHidden}
          onToggleBalanceVisibility={() => setIsBalanceHidden((prev) => !prev)}
        />

        <ActionButtonsRow />

        {showProfileCompletion && (
          <ProfileCompletionCard
            completionPercentage={50}
            onPressContinue={() => setShowProfileCompletion(false)}
          />
        )}

        <SavingPlansSection
          onPressHeader={() => router.navigate('/dashboard/home/savings')}
          onPressPlan={() => router.navigate('/dashboard/home/savings')}
        />

        <TransactionsSection transactions={DEFAULT_TRANSACTIONS} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
});
