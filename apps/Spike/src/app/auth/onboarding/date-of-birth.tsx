import DateOfBirthInput, {
    parseDobToIso,
} from '@/components/onboarding/DateOfBirthInput';
import OnboardingStepLayout from '@/components/onboarding/OnboardingStepLayout';
import SubmitButton from '@/components/ui/submit-button';
import { useUpdateUserDetails } from '@/hooks/use-auth';
import { useActiveUserState } from '@/states/active-user-state';
import { useOnboardingState } from '@/states/onboarding-state';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { toast } from 'react-native-toastify-expo';

const DateOfBirthScreen = () => {
    const { dateOfBirth, updateFields } = useOnboardingState();
    const { setUser } = useActiveUserState();
    const { updateUserDetails, isPending } = useUpdateUserDetails();

    const [dobText, setDobText] = useState(dateOfBirth);
    const [error, setError] = useState<string | undefined>(undefined);

    const handleNext = async () => {
        const isoDate = parseDobToIso(dobText);
        if (!isoDate) {
            setError('Please enter a valid date in MM/DD/YYYY format.');
            return;
        }

        setError(undefined);
        try {
            const response = await updateUserDetails({
                body: { dateOfBirth: isoDate },
                params: null,
                query: null,
            });

            updateFields({ dateOfBirth: dobText });
            if (response?.data) {
                setUser(response.data);
            }

            router.push('/auth/onboarding/contact-email');
        } catch (err: any) {
            toast.error(err?.message ?? 'Could not save your date of birth.');
        }
    };

    return (
        <OnboardingStepLayout
            progress={0.38}
            title="When were you born?"
            description="Your date of birth must match your BVN records to complete verification."
            showBackButton
            onBack={() => router.back()}
            footer={
                <SubmitButton
                    label="Next"
                    isLoading={isPending}
                    onPress={handleNext}
                    borderRadius={100}
                    height={48}
                />
            }
        >
            <DateOfBirthInput
                value={dobText}
                onChangeText={(val) => {
                    setDobText(val);
                    if (error) setError(undefined);
                }}
                error={error}
                disabled={isPending}
            />
        </OnboardingStepLayout>
    );
};

export default DateOfBirthScreen;
