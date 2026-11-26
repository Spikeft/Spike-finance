import SubmitButton from '@/components/ui/submit-button';
import { Image, ImageSource } from 'expo-image';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export interface OnboardingStatusViewProps {
    illustration: ImageSource;
    illustrationWidth?: number;
    illustrationHeight?: number;
    title: string;
    description: string;
    primaryLabel: string;
    onPrimaryPress: () => void;
    primaryLoading?: boolean;
    secondaryLabel?: string;
    onSecondaryPress?: () => void;
    extraContent?: React.ReactNode;
}

export default function OnboardingStatusView({
    illustration,
    illustrationWidth = 130,
    illustrationHeight = 120,
    title,
    description,
    primaryLabel,
    onPrimaryPress,
    primaryLoading = false,
    secondaryLabel,
    onSecondaryPress,
    extraContent,
}: OnboardingStatusViewProps) {
    return (
        <View className="flex-1 justify-between bg-white px-6 pt-12 pb-6">
            <View className="flex-1 items-center justify-center">
                <Image
                    source={illustration}
                    contentFit="contain"
                    style={{
                        width: illustrationWidth,
                        height: illustrationHeight,
                    }}
                />

                <View className="mt-7 items-center gap-3 w-full">
                    <Text className="font-figtree-bold text-[32px] leading-[36px] tracking-[-0.64px] text-text-black text-center">
                        {title}
                    </Text>
                    <Text className="font-inter-regular text-base leading-6 tracking-[-0.16px] text-text-body text-center px-2">
                        {description}
                    </Text>
                </View>

                {extraContent ? <View className="w-full mt-8">{extraContent}</View> : null}
            </View>

            <View className="gap-2.5 w-full">
                <SubmitButton
                    label={primaryLabel}
                    isLoading={primaryLoading}
                    onPress={onPrimaryPress}
                    borderRadius={100}
                    height={48}
                />

                {secondaryLabel && onSecondaryPress ? (
                    <Pressable
                        onPress={onSecondaryPress}
                        accessibilityRole="button"
                        className="w-full h-12 rounded-full bg-input-background items-center justify-center active:opacity-80"
                    >
                        <Text className="font-figtree-medium text-base text-text-black">
                            {secondaryLabel}
                        </Text>
                    </Pressable>
                ) : null}
            </View>
        </View>
    );
}
