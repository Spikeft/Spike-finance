import CustomBottomSheet from '@/components/ui/custom-bottom-sheet';
import SubmitButton from '@/components/ui/submit-button';
import { useActiveUserState } from '@/states/active-user-state';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import React, { useState } from 'react';
import {
    DimensionValue,
    Pressable,
    Share,
    Text,
    View,
} from 'react-native';
import { toast } from 'react-native-toastify-expo';

export interface BankTransferModalProps {
    visible: boolean;
    onClose: () => void;
    height?: DimensionValue;
    accountName?: string;
    bankName?: string;
    accountNumber?: string;
}

interface DetailRowProps {
    label: string;
    value: string;
    copied: boolean;
    onCopy: () => void;
}

function DetailRow({ label, value, copied, onCopy }: DetailRowProps) {
    return (
        <View className="flex-row items-center justify-between gap-3">
            <Text className="font-inter-regular text-[15px] text-text-black">
                {label}
            </Text>

            <Pressable
                onPress={onCopy}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Copy ${label} ${value}`}
                className="flex-row items-center gap-2 active:opacity-70"
            >
                <Text className="font-figtree-bold text-[15px] text-text-black">
                    {value}
                </Text>
                <SymbolView
                    name={
                        copied
                            ? {
                                ios: 'checkmark.circle.fill',
                                android: 'check_circle',
                                web: 'check_circle',
                            }
                            : {
                                ios: 'doc.on.doc.fill',
                                android: 'content_copy',
                                web: 'content_copy',
                            }
                    }
                    size={18}
                    tintColor={copied ? '#2DB42D' : '#71717A'}
                />
            </Pressable>
        </View>
    );
}

async function copyText(text: string): Promise<void> {
    try {
        // Use Web Clipboard API when available
        if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            return;
        }
    } catch {
        // Ignore and fall through
    }
}

export default function BankTransferModal({
    visible,
    onClose,
    height = '86%',
    accountName: propAccountName,
    bankName: propBankName,
    accountNumber: propAccountNumber,
}: BankTransferModalProps) {
    const user = useActiveUserState((state) => state.user) as any;
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const primaryVirtualAccount = Array.isArray(user?.virtualAccounts)
        ? user.virtualAccounts[0]
        : undefined;

    const fullName = [user?.firstName, user?.lastName]
        .filter(Boolean)
        .join(' ')
        .trim();

    const accountName =
        propAccountName ||
        primaryVirtualAccount?.accountName ||
        fullName ||
        'Ada Okafor';
    const bankName =
        propBankName ||
        primaryVirtualAccount?.bankName ||
        'Moniepoint MFB';
    const accountNumber =
        propAccountNumber ||
        primaryVirtualAccount?.accountNumber ||
        '0123456789';

    const handleCopy = async (field: string, label: string, value: string) => {
        await copyText(value);
        setCopiedField(field);
        toast.success(`${label} copied`);
        setTimeout(() => {
            setCopiedField((prev) => (prev === field ? null : prev));
        }, 1800);
    };

    const handleShareDetails = async () => {
        try {
            await Share.share({
                message: `Bank Transfer Details (SPIKE)\nAccount Name: ${accountName}\nBank Name: ${bankName}\nAccount Number: ${accountNumber}`,
            });
        } catch {
            toast.error('Could not open share sheet.');
        }
    };

    return (
        <CustomBottomSheet
            visible={visible}
            onClose={onClose}
            height={height}
            style={{ backgroundColor: '#F7F7F8' }}
        >
            <View className="flex-1 justify-between pt-2">
                <View>
                    {/* Blue Bank Icon Illustration */}
                    <Image
                        source={require('@/assets/images/home/bank.png')}
                        contentFit="contain"
                        style={{ width: 72, height: 72 }}
                    />

                    {/* Title & Description */}
                    <Text className="font-figtree-bold text-[30px] leading-[35px] tracking-[-0.6px] text-text-black mt-5">
                        {'Receive with Bank\ntransfer'}
                    </Text>

                    <Text className="font-inter-regular text-sm leading-5 text-text-body mt-2.5">
                        Share your account details to receive money directly into your SPIKE wallet.
                    </Text>

                    {/* Account Details Rows */}
                    <View className="mt-7 gap-5">
                        <DetailRow
                            label="Account name:"
                            value={accountName}
                            copied={copiedField === 'accountName'}
                            onCopy={() =>
                                handleCopy('accountName', 'Account name', accountName)
                            }
                        />
                        <DetailRow
                            label="Bank name:"
                            value={bankName}
                            copied={copiedField === 'bankName'}
                            onCopy={() =>
                                handleCopy('bankName', 'Bank name', bankName)
                            }
                        />
                        <DetailRow
                            label="Account number"
                            value={accountNumber}
                            copied={copiedField === 'accountNumber'}
                            onCopy={() =>
                                handleCopy('accountNumber', 'Account number', accountNumber)
                            }
                        />
                    </View>
                </View>

                {/* Bottom CTA */}
                <View className="pt-6">
                    <SubmitButton
                        label="Share details"
                        onPress={handleShareDetails}
                        borderRadius={100}
                        height={50}
                    />
                </View>
            </View>
        </CustomBottomSheet>
    );
}
