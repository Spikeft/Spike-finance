import React, { useEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

export interface PinCodeDotsProps {
    length?: number;
    filledCount: number;
    error?: string;
}

export default function PinCodeDots({
    length = 4,
    filledCount,
    error,
}: PinCodeDotsProps) {
    const shakeX = useSharedValue(0);
    const prevError = useRef<string | undefined>(error);

    useEffect(() => {
        if (error && error !== prevError.current) {
            shakeX.value = withSequence(
                withTiming(-10, { duration: 45 }),
                withTiming(10, { duration: 45 }),
                withTiming(-8, { duration: 45 }),
                withTiming(8, { duration: 45 }),
                withTiming(0, { duration: 45 }),
            );
        }
        prevError.current = error;
    }, [error, shakeX]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: shakeX.value }],
    }));

    const hasError = Boolean(error);

    return (
        <View className="items-center">
            <Animated.View
                style={animatedStyle}
                className="flex-row items-center justify-center gap-5"
            >
                {Array.from({ length }).map((_, idx) => {
                    const isFilled = idx < filledCount;
                    const dotClasses = hasError
                        ? 'border-2 border-error bg-error-background'
                        : isFilled
                            ? 'bg-primary border-2 border-primary'
                            : 'bg-[#DCDCDD] border-2 border-transparent';

                    return (
                        <View
                            key={idx}
                            className={`w-6 h-6 rounded-full ${dotClasses}`}
                        />
                    );
                })}
            </Animated.View>

            {error ? (
                <Text className="font-inter-regular text-sm text-error text-center mt-4 px-6">
                    {error}
                </Text>
            ) : null}
        </View>
    );
}
