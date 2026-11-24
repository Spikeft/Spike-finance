import OnboardingStepLayout from '@/components/onboarding/OnboardingStepLayout';
import CustomTextInput from '@/components/ui/custom-input';
import SubmitButton from '@/components/ui/submit-button';
import useForm from '@/hooks/use-form';
import { useOnboardingState } from '@/states/onboarding-state';
import { router } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';
import { z } from 'zod';

const homeAddressSchema = z.object({
    streetAddress: z.string().trim().min(2, 'Please enter your street address'),
    houseNo: z.string().optional(),
    city: z.string().trim().min(2, 'Please enter your city or town'),
    state: z.string().trim().min(2, 'Please enter your state'),
    lga: z.string().trim().min(2, 'Please enter your LGA'),
});

type HomeAddressForm = z.infer<typeof homeAddressSchema>;

const HomeAddressScreen = () => {
    const {
        streetAddress,
        houseNo,
        city,
        state,
        lga,
        updateFields,
    } = useOnboardingState();

    const { renderForm } = useForm({
        defaultValues: {
            streetAddress,
            houseNo,
            city,
            state,
            lga,
        },
        validationSchema: homeAddressSchema,
    });

    const handleSubmit = (values: HomeAddressForm) => {
        updateFields({
            streetAddress: values.streetAddress.trim(),
            houseNo: values.houseNo?.trim() ?? '',
            city: values.city.trim(),
            state: values.state.trim(),
            lga: values.lga.trim(),
        });
        router.push('/auth/onboarding/verify-bvn');
    };

    return renderForm(
        <OnboardingStepLayout
            progress={0.82}
            title="Where do you live?"
            description="Enter your correct home address to avoid account verification delays."
            showBackButton
            onBack={() => router.back()}
            footer={
                <SubmitButton<HomeAddressForm>
                    label="Next"
                    onSubmit={handleSubmit}
                    borderRadius={100}
                    height={48}
                />
            }
        >
            <View className="gap-3 pb-4">
                <CustomTextInput
                    name="streetAddress"
                    label="Street address"
                    placeholder="Block 123"
                    height={48}
                    borderRadius={12}
                />

                <View>
                    <View className="flex-row items-center mb-2">
                        <Text className="font-figtree-medium text-sm text-text-body">
                            House no{' '}
                        </Text>
                        <Text className="font-inter-regular text-sm text-text-body/70">
                            (optional)
                        </Text>
                    </View>
                    <CustomTextInput
                        name="houseNo"
                        placeholder="2A"
                        height={48}
                        borderRadius={12}
                    />
                </View>

                <CustomTextInput
                    name="city"
                    label="City or town"
                    placeholder="Port Harcourt"
                    height={48}
                    borderRadius={12}
                />

                <CustomTextInput
                    name="state"
                    label="State"
                    placeholder="Rivers State"
                    height={48}
                    borderRadius={12}
                />

                <CustomTextInput
                    name="lga"
                    label="Local Government Area (LGA)"
                    placeholder="Obio/Akpor"
                    height={48}
                    borderRadius={12}
                />
            </View>
        </OnboardingStepLayout>,
    );
};

export default HomeAddressScreen;
