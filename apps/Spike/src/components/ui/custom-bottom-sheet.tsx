import { SymbolView } from 'expo-symbols';
import React, { useEffect, useState } from 'react';
import {
    DimensionValue,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
    ViewStyle,
} from 'react-native';
import {
    Gesture,
    GestureDetector,
    GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

export interface CustomBottomSheetProps {
    visible: boolean;
    onClose: () => void;
    height?: DimensionValue;
    maxHeight?: DimensionValue;
    children?: React.ReactNode;
    showHandle?: boolean;
    showCloseButton?: boolean;
    closeOnBackdropPress?: boolean;
    scrollable?: boolean;
    containerClassName?: string;
    contentClassName?: string;
    style?: ViewStyle;
}

const SLIDE_OFFSET = 600;

export default function CustomBottomSheet({
    visible,
    onClose,
    height,
    maxHeight = '88%',
    children,
    showHandle = true,
    showCloseButton = true,
    closeOnBackdropPress = true,
    scrollable = false,
    containerClassName,
    contentClassName,
    style,
}: CustomBottomSheetProps) {
    const insets = useSafeAreaInsets();
    const [mounted, setMounted] = useState(visible);

    const backdropOpacity = useSharedValue(0);
    const translateY = useSharedValue(SLIDE_OFFSET);

    useEffect(() => {
        if (visible) {
            setMounted(true);
            backdropOpacity.value = withTiming(1, {
                duration: 240,
                easing: Easing.out(Easing.quad),
            });
            translateY.value = withTiming(0, {
                duration: 280,
                easing: Easing.out(Easing.cubic),
            });
        } else if (mounted) {
            backdropOpacity.value = withTiming(0, {
                duration: 200,
                easing: Easing.in(Easing.quad),
            });
            translateY.value = withTiming(
                SLIDE_OFFSET,
                {
                    duration: 220,
                    easing: Easing.in(Easing.cubic),
                },
                (finished) => {
                    'worklet';
                    if (finished) {
                        scheduleOnRN(setMounted, false);
                    }
                },
            );
        }
    }, [backdropOpacity, mounted, translateY, visible]);

    const panGesture = Gesture.Pan()
        .onUpdate((event) => {
            if (event.translationY > 0) {
                translateY.value = event.translationY;
                backdropOpacity.value = Math.max(0, 1 - event.translationY / 350);
            }
        })
        .onEnd((event) => {
            if (event.translationY > 100 || event.velocityY > 650) {
                scheduleOnRN(onClose);
            } else {
                translateY.value = withSpring(0, {
                    damping: 22,
                    stiffness: 260,
                });
                backdropOpacity.value = withTiming(1, { duration: 180 });
            }
        });

    const backdropStyle = useAnimatedStyle(() => ({
        opacity: backdropOpacity.value,
    }));

    const sheetStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    if (!mounted) return null;

    return (
        <Modal
            visible={mounted}
            transparent
            animationType="none"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            {/* Dimmed backdrop */}
            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    { backgroundColor: 'rgba(0, 0, 0, 0.28)' },
                    backdropStyle,
                ]}
            >
                <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={closeOnBackdropPress ? onClose : undefined}
                    accessibilityRole="button"
                    accessibilityLabel="Close bottom sheet"
                />
            </Animated.View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                pointerEvents="box-none"
                style={{ justifyContent: 'flex-end', height: '100%' }}
            >
                <Animated.View
                    style={[
                        {
                            height,
                            maxHeight,
                            marginHorizontal: 10,
                            marginBottom: 20,
                            backgroundColor: 'white',
                            borderRadius: 36,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: -4 },
                            shadowOpacity: 0.12,
                            shadowRadius: 20,
                            elevation: 12,
                        },
                        sheetStyle,
                        style,
                    ]}
                    className={`overflow-hidden ${containerClassName ?? ''}`}
                >
                    {/* Drag Handle */}
                    {showHandle ? (
                        <GestureDetector gesture={panGesture}>
                            <View className="w-full items-center pt-3 pb-3">
                                <View className="w-10 h-1 rounded-full bg-[#C7C7CC]" />
                            </View>
                        </GestureDetector>
                    ) : null}

                    {/* Top Close Button Row */}
                    {showCloseButton ? (
                        <View className="px-5 pt-1 pb-2 flex-row items-center">
                            <Pressable
                                onPress={onClose}
                                hitSlop={8}
                                accessibilityRole="button"
                                accessibilityLabel="Close"
                                className="w-11 h-11 rounded-full bg-white items-center justify-center active:opacity-75"
                                style={{
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.08,
                                    shadowRadius: 8,
                                    elevation: 3,
                                }}
                            >
                                <SymbolView
                                    name={{
                                        ios: 'xmark',
                                        android: 'close',
                                        web: 'close',
                                    }}
                                    size={17}
                                    weight="medium"
                                    tintColor="#18181B"
                                />
                            </Pressable>
                        </View>
                    ) : null}

                    {/* Sheet Body Slot */}
                    {scrollable ? (
                        <ScrollView
                            className="flex-1"
                            contentContainerStyle={{
                                paddingHorizontal: 20,
                                paddingBottom: 24,
                                flexGrow: 1,
                            }}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                            <View className={contentClassName}>{children}</View>
                        </ScrollView>
                    ) : (
                        <View
                            className={`px-5 pb-6 ${height ? 'flex-1' : ''} ${contentClassName ?? ''}`}
                        >
                            {children}
                        </View>
                    )}
                </Animated.View>
            </KeyboardAvoidingView>
        </Modal>
    );
}
