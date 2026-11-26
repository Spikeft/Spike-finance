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
import BankTransferModal from '@/components/home/modals/bank-transfer-modal';
import RecieveMoneyModal from '@/components/home/modals/recieve-money-modal';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const user = useActiveUserState((state) => state.user);

  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [showProfileCompletion, setShowProfileCompletion] = useState(false);
  const [showRecieveMoneyModal, setShowRecieveMoneyModal] = useState(false);
  const [showBankTransferModal, setShowBankTransferModal] = useState(false);

  const firstName = user?.firstName?.trim() || 'Zara';

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <HomeHeader firstName={firstName} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.contentContainer,
          {
            paddingBottom: Math.max(insets.bottom, 20) + 96,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >

        <BalanceSummary
          totalBalance={804990.89}
          withdrawableBalance={80950.91}
          isBalanceHidden={isBalanceHidden}
          onToggleBalanceVisibility={() => setIsBalanceHidden((prev) => !prev)}
        />

        <RecieveMoneyModal
          visible={showRecieveMoneyModal}
          height={'70%'}
          onClose={() => setShowRecieveMoneyModal(false)}
          onSelectBankTransfer={() => {
            setTimeout(() => setShowBankTransferModal(true), 260);
          }}
          onSelectSpikeTag={() => {
            router.push('/dashboard/spike-tag');
          }}
        />
        <BankTransferModal
          visible={showBankTransferModal}
          onClose={() => setShowBankTransferModal(false)}
        />
        <ActionButtonsRow onPressAddMoney={() => setShowRecieveMoneyModal(true)} />

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
    paddingTop: 60
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
});
