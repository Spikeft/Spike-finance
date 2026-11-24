import OnboardingStepLayout from '@/components/onboarding/OnboardingStepLayout';
import CustomTextInput from '@/components/ui/custom-input';
import SubmitButton from '@/components/ui/submit-button';
import { useUpdateUserDetails } from '@/hooks/use-auth';
import useForm from '@/hooks/use-form';
import { useActiveUserState } from '@/states/active-user-state';
import { useOnboardingState } from '@/states/onboarding-state';
import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { toast } from 'react-native-toastify-expo';
import { z } from 'zod';

const legalNameSchema = z.object({
    firstName: z.string().trim().min(2, 'Please enter your first name'),
    lastName: z.string().trim().min(2, 'Please enter your last name'),
});

type LegalNameForm = z.infer<typeof legalNameSchema>;

const LegalNameScreen = () => {
    const { firstName, lastName, updateFields } = useOnboardingState();
    const { user, setUser } = useActiveUserState();
    const { updateUserDetails, isPending } = useUpdateUserDetails();

    const { renderForm } = useForm({
        defaultValues: {
            firstName: firstName || user?.firstName || '',
            lastName: lastName || user?.lastName || '',
        },
        validationSchema: legalNameSchema,
    });

    const handleSubmit = async (values: LegalNameForm) => {
        try {
            const response = await updateUserDetails({
                body: {
                    firstName: values.firstName.trim(),
                    lastName: values.lastName.trim(),
                },
                params: null,
                query: null,
            });

            updateFields({
                firstName: values.firstName.trim(),
                lastName: values.lastName.trim(),
            });

            if (response?.data) {
                setUser(response.data);
            }

            router.push('/auth/onboarding/date-of-birth');
        } catch (err: any) {
            toast.error(err?.message ?? 'Could not save your name. Please try again.');
        }
    };

    return renderForm(
        <OnboardingStepLayout
            progress={0.15}
            title="What's your legal name?"
            description="Your name must match your BVN records, or verification may fail."
            footer={
                <SubmitButton<LegalNameForm>
                    label="Next"
                    isLoading={isPending}
                    onSubmit={handleSubmit}
                    borderRadius={100}
                    height={48}
                />
            }
        >
            <View className="gap-3">
                <CustomTextInput
                    name="firstName"
                    placeholder="First name"
                    autoCapitalize="words"
                    autoComplete="given-name"
                    textContentType="givenName"
                    height={48}
                    borderRadius={12}
                />
                <CustomTextInput
                    name="lastName"
                    placeholder="Last name"
                    autoCapitalize="words"
                    autoComplete="family-name"
                    textContentType="familyName"
                    height={48}
                    borderRadius={12}
                />
            </View>
        </OnboardingStepLayout>,
    );
};

export default LegalNameScreen;
