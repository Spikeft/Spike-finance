import CustomBottomSheet from '@/components/ui/custom-bottom-sheet';
import OptionActionCard from '@/components/ui/option-action-card';
import React from 'react';
import { DimensionValue, Text, View } from 'react-native';

type IProps = {
    height?: DimensionValue;
    visible: boolean;
    onClose: () => void;
    onSelectBankTransfer?: () => void;
    onSelectRequestPayment?: () => void;
    onSelectSpikeTag?: () => void;
};

const RecieveMoneyModal = ({
    height,
    visible,
    onClose,
    onSelectBankTransfer,
    onSelectRequestPayment,
    onSelectSpikeTag,
}: IProps) => {
    const handleOptionPress = (callback?: () => void) => {
        onClose();
        callback?.();
    };

    return (
        <CustomBottomSheet
            height={height}
            visible={visible}
            onClose={onClose}
            scrollable
            style={{ backgroundColor: '#F5F5F7' }}
        >
            <View className="mt-2">
                <Text className="font-figtree-bold text-[28px] leading-8 tracking-[-0.5px] text-text-black">
                    Receive money
                </Text>
                <Text className="font-inter-regular text-sm leading-5 text-text-body mt-1.5">
                    Choose how you&apos;d like to receive money.
                </Text>
            </View>

            <View className="mt-5 gap-3">
                <OptionActionCard
                    title="Bank transfer"
                    description="Receive directly into your wallet."
                    iconBgColor="#93E2FF"
                    symbolName={{
                        ios: 'building.columns.fill',
                        android: 'account_balance',
                        web: 'account_balance',
                    }}
                    onPress={() => handleOptionPress(onSelectBankTransfer)}
                />

                <OptionActionCard
                    title="Request payment"
                    description="Receive money with a shareable link"
                    iconBgColor="#FCA92A"
                    symbolName={{
                        ios: 'link',
                        android: 'link',
                        web: 'link',
                    }}
                    onPress={() => handleOptionPress(onSelectRequestPayment)}
                />

                <OptionActionCard
                    title="SPIKE tag"
                    description="Get paid by other SPIKE users"
                    iconBgColor="#38F138"
                    symbolName={{
                        ios: 'at',
                        android: 'alternate_email',
                        web: 'alternate_email',
                    }}
                    onPress={() => handleOptionPress(onSelectSpikeTag)}
                />
            </View>
        </CustomBottomSheet>
    );
};

export default RecieveMoneyModal;
