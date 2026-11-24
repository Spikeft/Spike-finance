import NotificationPreviewCard from '@/components/onboarding/NotificationPreviewCard';
import OnboardingStatusView from '@/components/onboarding/OnboardingStatusView';
import { useRegisterPushToken } from '@/hooks/use-auth';
import { useDeviceId } from '@/hooks/use-device-id';
import { useOnboardingState } from '@/states/onboarding-state';
import { router } from 'expo-router';
import React from 'react';
import { toast } from 'react-native-toastify-expo';

const NotificationSetupScreen = () => {
    const deviceId = useDeviceId();
    const resetOnboarding = useOnboardingState((state) => state.reset);
    const { registerPushToken, isPending } = useRegisterPushToken();

    const finishOnboarding = () => {
        resetOnboarding();
        router.replace('/dashboard/home/explore');
    };

    const handleEnableNotifications = async () => {
        try {
            // Register a push token with the server (swap with Expo Notifications token once expo-notifications is added)
            const fallbackToken = `ExponentPushToken[${deviceId}]`;
            await registerPushToken({
                body: { pushToken: fallbackToken },
                params: null,
                query: null,
            });
            toast.success('Notifications enabled!');
            finishOnboarding();
        } catch (err: any) {
            toast.error(
                err?.message ?? 'Could not enable notifications right now.',
            );
            finishOnboarding();
        }
    };

    return (
        <OnboardingStatusView
            illustration={require('../../../../assets/images/onboarding/notification-bell.png')}
            illustrationWidth={114}
            illustrationHeight={120}
            title="Turn on notification"
            description="Enable notifications to get instant alerts for transfers, payments, savings progress, and important account updates."
            extraContent={<NotificationPreviewCard />}
            primaryLabel="Enable notifications"
            primaryLoading={isPending}
            onPrimaryPress={handleEnableNotifications}
            secondaryLabel="Maybe later"
            onSecondaryPress={finishOnboarding}
        />
    );
};

export default NotificationSetupScreen;
