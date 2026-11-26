import { SymbolView } from 'expo-symbols';
import React, { useEffect } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    View,
} from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export interface OnboardingStepLayoutProps {
    /** Progress ratio from 0 to 1 (e.g., 0.1 for step 1, 1 for step 5). */
    progress: number;
    title: string;
    description: string;
    showBackButton?: boolean;
    onBack?: () => void;
    children: React.ReactNode;
    footer?: React.ReactNode;
    scrollable?: boolean;
}

export function OnboardingProgressMeter({ progress }: { progress: number }) {
    const clamped = Math.max(0.05, Math.min(1, progress));
    const widthPct = useSharedValue(clamped * 100);

    useEffect(() => {
        widthPct.value = withTiming(clamped * 100, {
            duration: 300,
            easing: Easing.out(Easing.cubic),
        });
    }, [clamped, widthPct]);

    const fillStyle = useAnimatedStyle(() => ({
        width: `${widthPct.value}%`,
    }));

    return (
        <View className="w-[211px] h-1 rounded-full bg-input-background overflow-hidden">
            <Animated.View
                style={[{ backgroundColor: '#2DB42D' }, fillStyle]}
                className="h-full rounded-full"
            />
        </View>
    );
}

export default function OnboardingStepLayout({
    progress,
    title,
    description,
    showBackButton = false,
    onBack,
    children,
    footer,
    scrollable = true,
}: OnboardingStepLayoutProps) {
    const body = (
        <View className="flex-1 px-6 pt-5">
            <View className="gap-3">
                <Text className="font-figtree-bold text-[32px] leading-[34px] tracking-[-0.64px] text-text-black">
                    {title}
                </Text>
                <Text className="font-inter-regular text-sm leading-5 tracking-[-0.14px] text-text-body">
                    {description}
                </Text>
            </View>

            <View className="mt-6 flex-1">{children}</View>
        </View>
    );

    return (
        <KeyboardAvoidingView
            className="flex-1 pt-20 bg-white"
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            {/* Top Navigation & Progress Bar */}
            <View className="h-12 px-5 flex-row items-center justify-center relative">
                {showBackButton && onBack ? (
                    <Pressable
                        onPress={onBack}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel="Go back"
                        className="absolute left-5 w-9 h-9 rounded-full bg-input-background items-center justify-center active:opacity-75"
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

                <OnboardingProgressMeter progress={progress} />
            </View>

            {scrollable ? (
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {body}
                </ScrollView>
            ) : (
                body
            )}

            {footer ? <View className="px-6 pb-4 pt-2">{footer}</View> : null}
        </KeyboardAvoidingView>
    );
}
