import SubmitButton from '@/components/ui/submit-button';
import {
    OtaReleaseNotes,
    OtaUpdatePhase,
    useOtaUpdates,
} from '@/hooks/use-ota-updates';
import { SymbolView } from 'expo-symbols';
import React, { useEffect } from 'react';
import {
    Modal,
    Pressable,
    ScrollView,
    Text,
    View,
} from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export interface OtaUpdateScreenProps {
    visible: boolean;
    phase: OtaUpdatePhase;
    progress: number;
    releaseNotes: OtaReleaseNotes;
    errorMessage?: string;
    onUpdateNow: () => void;
    onRestartNow: () => void;
    onDismiss: () => void;
}

export function OtaUpdateModal({
    visible,
    phase,
    progress,
    releaseNotes,
    errorMessage,
    onUpdateNow,
    onRestartNow,
    onDismiss,
}: OtaUpdateScreenProps) {
    const progressWidth = useSharedValue(progress);
    const pulseScale = useSharedValue(1);

    useEffect(() => {
        progressWidth.value = withTiming(progress, {
            duration: 280,
            easing: Easing.out(Easing.cubic),
        });
    }, [progress, progressWidth]);

    useEffect(() => {
        if (phase === 'downloading' || phase === 'restarting') {
            pulseScale.value = withRepeat(
                withSequence(
                    withTiming(1.08, {
                        duration: 900,
                        easing: Easing.inOut(Easing.sin),
                    }),
                    withTiming(0.96, {
                        duration: 900,
                        easing: Easing.inOut(Easing.sin),
                    }),
                ),
                -1,
                true,
            );
        } else {
            pulseScale.value = withTiming(1, { duration: 250 });
        }
    }, [phase, pulseScale]);

    const animatedBarStyle = useAnimatedStyle(() => ({
        width: `${progressWidth.value}%`,
    }));

    const animatedBadgeStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseScale.value }],
    }));

    const isDownloading = phase === 'downloading';
    const isReady = phase === 'ready';
    const isRestarting = phase === 'restarting';
    const isError = phase === 'error';
    const showProgress = isDownloading || isReady || isRestarting;

    const headline = isRestarting
        ? 'Applying update...'
        : isReady
            ? 'Update ready to install'
            : isDownloading
                ? 'Downloading update...'
                : releaseNotes.title;

    const progressStatusText = isRestarting
        ? 'Restarting Spike...'
        : isReady
            ? 'Download complete'
            : 'Downloading latest bundle & assets...';

    return (
        <Modal
            visible={visible}
            animationType="fade"
            statusBarTranslucent
            onRequestClose={onDismiss}
        >
            <View className="flex-1 justify-between px-6 pt-6 pb-6">
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Hero Icon Badge */}
                    <View className="items-center mt-6">
                        <Animated.View
                            style={animatedBadgeStyle}
                            className="w-24 h-24 rounded-full bg-[#38DC38]/15 items-center justify-center"
                        >
                            <View className="w-16 h-16 rounded-full bg-primary items-center justify-center">
                                <SymbolView
                                    name={
                                        isReady
                                            ? {
                                                ios: 'checkmark.seal.fill',
                                                android: 'verified',
                                                web: 'verified',
                                            }
                                            : {
                                                ios: 'arrow.down.circle.fill',
                                                android: 'system_update',
                                                web: 'system_update',
                                            }
                                    }
                                    size={30}
                                    tintColor="#3EF13E"
                                />
                            </View>
                        </Animated.View>

                        {/* Version Pill */}
                        <View className="mt-5 px-3.5 py-1 rounded-full bg-[#38DC38]/15">
                            <Text className="font-figtree-medium text-xs text-primary">
                                Version {releaseNotes.version} • OTA Update
                            </Text>
                        </View>

                        {/* Title & Update Message */}
                        <Text className="font-figtree-bold text-[30px] leading-[36px] tracking-[-0.6px] text-text-black text-center mt-4">
                            {headline}
                        </Text>
                        <Text className="font-inter-regular text-base leading-6 text-text-body text-center mt-2.5 px-2">
                            {releaseNotes.message}
                        </Text>
                    </View>

                    {/* Download Progress Card */}
                    {showProgress ? (
                        <View className="mt-7 p-4 rounded-2xl bg-[#F7F7F8] border border-[#EBEBEC]">
                            <View className="flex-row items-center justify-between mb-2.5">
                                <Text className="font-figtree-medium text-sm text-text-black">
                                    {progressStatusText}
                                </Text>
                                <Text className="font-figtree-bold text-sm text-primary">
                                    {progress}%
                                </Text>
                            </View>

                            <View className="w-full h-2.5 rounded-full bg-[#E4E4E7] overflow-hidden">
                                <Animated.View
                                    style={[
                                        { backgroundColor: '#2DB42D' },
                                        animatedBarStyle,
                                    ]}
                                    className="h-full rounded-full"
                                />
                            </View>
                        </View>
                    ) : null}

                    {/* Error Banner */}
                    {isError && errorMessage ? (
                        <View className="mt-5 p-3.5 rounded-xl bg-error-background border border-error flex-row items-center gap-2.5">
                            <SymbolView
                                name={{
                                    ios: 'exclamationmark.triangle.fill',
                                    android: 'error',
                                    web: 'error',
                                }}
                                size={18}
                                tintColor="#FF383C"
                            />
                            <Text className="flex-1 font-inter-regular text-xs text-error">
                                {errorMessage}
                            </Text>
                        </View>
                    ) : null}

                    {/* What's Fixed & Improved Card */}
                    {releaseNotes.fixes.length > 0 ? (
                        <View className="mt-7 p-4 rounded-2xl bg-[#F7F7F8] border border-[#EBEBEC]">
                            <Text className="font-figtree-bold text-sm text-text-black mb-3">
                                What&apos;s fixed &amp; improved
                            </Text>

                            <View className="gap-3">
                                {releaseNotes.fixes.map((item, idx) => (
                                    <View
                                        key={`${idx}-${item}`}
                                        className="flex-row items-start gap-2.5"
                                    >
                                        <View className="mt-0.5">
                                            <SymbolView
                                                name={{
                                                    ios: 'checkmark.circle.fill',
                                                    android: 'check_circle',
                                                    web: 'check_circle',
                                                }}
                                                size={18}
                                                tintColor="#2DB42D"
                                            />
                                        </View>
                                        <Text className="flex-1 font-inter-regular text-sm leading-5 text-text-black">
                                            {item}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    ) : null}
                </ScrollView>

                {/* Footer Action Buttons */}
                <View className="gap-2.5 pt-3">
                    {isReady || isRestarting ? (
                        <SubmitButton
                            label="Restart & Apply Update"
                            loadingLabel="Restarting..."
                            isLoading={isRestarting}
                            onPress={onRestartNow}
                            borderRadius={100}
                            height={52}
                        />
                    ) : (
                        <SubmitButton
                            label={isError ? 'Try Again' : 'Update Now'}
                            loadingLabel={`Downloading... ${progress}%`}
                            isLoading={isDownloading}
                            onPress={onUpdateNow}
                            borderRadius={100}
                            height={52}
                        />
                    )}

                    {!isDownloading && !isRestarting ? (
                        <Pressable
                            onPress={onDismiss}
                            accessibilityRole="button"
                            className="w-full h-12 rounded-full bg-input-background items-center justify-center active:opacity-80"
                        >
                            <Text className="font-figtree-medium text-base text-text-black">
                                Later
                            </Text>
                        </Pressable>
                    ) : null}
                </View>
            </View>
        </Modal>
    );
}

export default function OtaUpdateGate() {
    const {
        visible,
        phase,
        progress,
        releaseNotes,
        errorMessage,
        startDownload,
        applyUpdate,
        dismiss,
    } = useOtaUpdates();

    return (
        <OtaUpdateModal
            visible={visible}
            phase={phase}
            progress={progress}
            releaseNotes={releaseNotes}
            errorMessage={errorMessage}
            onUpdateNow={startDownload}
            onRestartNow={applyUpdate}
            onDismiss={dismiss}
        />
    );
}
