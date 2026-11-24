import OnboardingStatusView from '@/components/onboarding/OnboardingStatusView';
import PinCodeDots from '@/components/onboarding/PinCodeDots';
import PinKeypad from '@/components/onboarding/PinKeypad';
import { useCreatePin } from '@/hooks/use-auth';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'react-native-toastify-expo';

const PIN_LENGTH = 4;

type PinStep = 'create' | 'confirm' | 'created';

const CreatePinScreen = () => {
    const { createPin, isPending } = useCreatePin();

    const [step, setStep] = useState<PinStep>('create');
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [error, setError] = useState<string | undefined>(undefined);

    const activeValue = step === 'create' ? pin : confirmPin;

    const handleSubmitPin = async (enteredPin: string) => {
        try {
            await createPin({
                body: { pin: enteredPin },
                params: null,
                query: null,
            });
            setStep('created');
        } catch (err: any) {
            const msg =
                typeof err?.message === 'string'
                    ? err.message
                    : 'Could not create PIN. Please try again.';
            setError(msg);
            toast.error(msg);
            setConfirmPin('');
        }
    };

    const handleDigitPress = (digit: string) => {
        if (isPending) return;

        if (step === 'create') {
            if (pin.length >= PIN_LENGTH) return;
            const nextPin = pin + digit;
            setPin(nextPin);
            setError(undefined);

            if (nextPin.length === PIN_LENGTH) {
                setTimeout(() => {
                    setStep('confirm');
                }, 150);
            }
            return;
        }

        if (step === 'confirm') {
            const base = error ? '' : confirmPin;
            if (base.length >= PIN_LENGTH) return;

            const nextConfirm = base + digit;
            setConfirmPin(nextConfirm);
            if (error) setError(undefined);

            if (nextConfirm.length === PIN_LENGTH) {
                if (nextConfirm !== pin) {
                    setError("The PIN you entered doesn't match. Try again.");
                } else {
                    void handleSubmitPin(nextConfirm);
                }
            }
        }
    };

    const handleDeletePress = () => {
        if (isPending) return;

        if (step === 'create') {
            setPin((prev) => prev.slice(0, -1));
            return;
        }

        if (step === 'confirm') {
            if (error) {
                setError(undefined);
                setConfirmPin('');
                return;
            }
            setConfirmPin((prev) => prev.slice(0, -1));
        }
    };

    const handleBackToCreate = () => {
        setStep('create');
        setPin('');
        setConfirmPin('');
        setError(undefined);
    };

    if (step === 'created') {
        return (
            <OnboardingStatusView
                illustration={require('../../../../assets/images/onboarding/pin-lock-created.png')}
                illustrationWidth={103}
                illustrationHeight={131}
                title={'Transaction\nPIN created!'}
                description="You can now use it to securely approve payments and transfers."
                primaryLabel="Continue"
                onPrimaryPress={() =>
                    router.replace('/auth/onboarding/notification-setup')
                }
            />
        );
    }

    return (
        <View className="flex-1 justify-between">
            {/* Top bar */}
            <View className="h-12 px-5 justify-center">
                {step === 'confirm' ? (
                    <Pressable
                        onPress={handleBackToCreate}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel="Go back"
                        className="w-9 h-9 rounded-full bg-input-background items-center justify-center active:opacity-75"
                    >
                        <SymbolView
                            name={{
                                ios: 'arrow.left',
                                android: 'arrow_back',
                                web: 'arrow_back',
                            }}
                            size={16}
                            tintColor="#18181B"
                        />
                    </Pressable>
                ) : null}
            </View>

            {/* Center illustration, copy, and PIN indicators */}
            <View className="flex-1 items-center justify-center px-6">
                <Image
                    source={require('../../../../assets/images/onboarding/pin-lock-open.png')}
                    contentFit="contain"
                    style={{ width: 95, height: 120 }}
                />

                <View className="mt-6 items-center gap-3 w-full">
                    <Text className="font-figtree-bold text-[32px] leading-[34px] tracking-[-0.64px] text-text-black text-center">
                        {step === 'create' ? 'Create transaction PIN' : 'Confirm PIN'}
                    </Text>
                    <Text className="font-inter-regular text-sm leading-5 tracking-[-0.14px] text-text-body text-center px-4">
                        {step === 'create'
                            ? 'Choose a 4-digit PIN to protect your account and approve transactions.'
                            : 'Re-enter your 4-digit PIN to confirm it'}
                    </Text>
                </View>

                <View className="mt-10 items-center min-h-[64px]">
                    <PinCodeDots
                        length={PIN_LENGTH}
                        filledCount={activeValue.length}
                        error={error}
                    />
                    {isPending ? (
                        <ActivityIndicator
                            size="small"
                            color="#0C490C"
                            style={{ marginTop: 12 }}
                        />
                    ) : null}
                </View>
            </View>

            {/* Custom Numeric Keypad */}
            <PinKeypad
                onDigitPress={handleDigitPress}
                onDeletePress={handleDeletePress}
                disabled={isPending}
            />
        </View>
    );
};

export default CreatePinScreen;
