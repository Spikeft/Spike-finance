import OnboardingStatusView from '@/components/onboarding/OnboardingStatusView';
import OnboardingStepLayout from '@/components/onboarding/OnboardingStepLayout';
import CustomTextInput from '@/components/ui/custom-input';
import SubmitButton from '@/components/ui/submit-button';
import { useVerifyBvn } from '@/hooks/use-auth';
import useForm from '@/hooks/use-form';
import { useActiveUserState } from '@/states/active-user-state';
import { useOnboardingState } from '@/states/onboarding-state';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { z } from 'zod';

const bvnSchema = z.object({
    bvn: z
        .string()
        .trim()
        .regex(/^\d{11}$/, 'BVN must be exactly 11 digits'),
});

type BvnForm = z.infer<typeof bvnSchema>;

type BvnScreenState = 'entry' | 'success' | 'failed';

const VerifyBvnScreen = () => {
    const { bvn, updateFields } = useOnboardingState();
    const { setUser } = useActiveUserState();
    const { verifyBvn, isPending } = useVerifyBvn();

    const [screenState, setScreenState] = useState<BvnScreenState>('entry');
    const [failureMessage, setFailureMessage] = useState<string>(
        "The details you provided don't match your BVN records. Check your information and try again to activate your account.",
    );

    const { renderForm } = useForm({
        defaultValues: { bvn },
        validationSchema: bvnSchema,
    });

    const handleSubmit = async (values: BvnForm) => {
        try {
            const response = await verifyBvn({
                body: { bvn: values.bvn.trim() },
                params: null,
                query: null,
            });

            updateFields({ bvn: values.bvn.trim() });
            if (response?.data?.user) {
                setUser(response.data.user);
            }
            setScreenState('success');
        } catch (err: any) {
            if (typeof err?.message === 'string' && err.message.length > 0) {
                setFailureMessage(err.message);
            }
            setScreenState('failed');
        }
    };

    if (screenState === 'success') {
        return (
            <OnboardingStatusView
                illustration={require('../../../../assets/images/onboarding/account-ready.png')}
                illustrationWidth={130}
                illustrationHeight={116}
                title="Your account is ready!"
                description="You're verified for Level 1 banking. You can increase your limits anytime."
                primaryLabel="Secure your account"
                onPrimaryPress={() => router.replace('/auth/onboarding/create-pin')}
            />
        );
    }

    if (screenState === 'failed') {
        return (
            <OnboardingStatusView
                illustration={require('../../../../assets/images/onboarding/bvn-error.png')}
                illustrationWidth={124}
                illustrationHeight={116}
                title={"We couldn't verify\nyour identity"}
                description={failureMessage}
                primaryLabel="Review my details"
                onPrimaryPress={() => {
                    setScreenState('entry');
                    router.replace('/auth/onboarding');
                }}
                secondaryLabel="Contact support"
                onSecondaryPress={() => {
                    Linking.openURL('mailto:support@spike.finance').catch(() => {});
                }}
            />
        );
    }

    return renderForm(
        <OnboardingStepLayout
            progress={1}
            title="Verify your identity"
            description="Enter your 11-digit BVN. Incorrect details may prevent account verification."
            showBackButton
            onBack={() => router.back()}
            footer={
                <Text className="font-inter-regular text-sm leading-5 text-text-body text-center">
                    We use your BVN to confirm your identity against official records. SPIKE doesn&apos;t store your BVN.
                </Text>
            }
        >
            <View className="gap-4">
                <CustomTextInput
                    name="bvn"
                    placeholder="12345678901"
                    keyboardType="number-pad"
                    maxLength={11}
                    disabled={isPending}
                    height={48}
                    borderRadius={12}
                />

                <SubmitButton<BvnForm>
                    label="Verify BVN"
                    loadingLabel="Verifying BVN..."
                    isLoading={isPending}
                    onSubmit={handleSubmit}
                    borderRadius={100}
                    height={48}
                    className={isPending ? 'bg-[#A3A3A3]' : 'bg-primary'}
                />
            </View>
        </OnboardingStepLayout>,
    );
};

export default VerifyBvnScreen;
