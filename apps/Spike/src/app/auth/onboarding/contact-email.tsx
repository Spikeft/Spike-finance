import OnboardingStepLayout from '@/components/onboarding/OnboardingStepLayout';
import CustomTextInput from '@/components/ui/custom-input';
import SubmitButton from '@/components/ui/submit-button';
import useForm from '@/hooks/use-form';
import { useActiveUserState } from '@/states/active-user-state';
import { useOnboardingState } from '@/states/onboarding-state';
import { router } from 'expo-router';
import React from 'react';
import { z } from 'zod';

const contactEmailSchema = z.object({
    contactEmail: z.email('Please enter a valid email address'),
});

type ContactEmailForm = z.infer<typeof contactEmailSchema>;

const ContactEmailScreen = () => {
    const { contactEmail, updateFields } = useOnboardingState();
    const { user } = useActiveUserState();

    const { renderForm } = useForm({
        defaultValues: {
            contactEmail: contactEmail || user?.email || '',
        },
        validationSchema: contactEmailSchema,
    });

    const handleSubmit = (values: ContactEmailForm) => {
        updateFields({ contactEmail: values.contactEmail.trim() });
        router.push('/auth/onboarding/home-address');
    };

    return renderForm(
        <OnboardingStepLayout
            progress={0.62}
            title="How can we reach you?"
            description="Use your correct contact details so you don't miss important account updates."
            showBackButton
            onBack={() => router.back()}
            footer={
                <SubmitButton<ContactEmailForm>
                    label="Next"
                    onSubmit={handleSubmit}
                    borderRadius={100}
                    height={48}
                />
            }
        >
            <CustomTextInput
                name="contactEmail"
                placeholder="example@mail.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                height={48}
                borderRadius={12}
            />
        </OnboardingStepLayout>,
    );
};

export default ContactEmailScreen;
