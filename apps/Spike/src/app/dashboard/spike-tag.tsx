import SpikeTagCard, {
    TagAvailabilityStatus,
} from '@/components/home/SpikeTagCard';
import SubmitButton from '@/components/ui/submit-button';
import { useCreateSpikeTag, useMySpikeTag } from '@/hooks/use-user';
import UserService from '@/services/user-service';
import { useActiveUserState } from '@/states/active-user-state';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    Share,
    Text,
    View,
} from 'react-native';
import { toast } from 'react-native-toastify-expo';

function sanitizeTagInput(raw: string): string {
    return raw
        .replace(/^@+/, '')
        .replace(/[^a-zA-Z0-9._]/g, '')
        .toLowerCase()
        .slice(0, 20);
}

export default function SpikeTagScreen() {
    const { data: tagResponse, isLoading, isError, refetch } = useMySpikeTag();
    const { createSpikeTag, isPending } = useCreateSpikeTag();
    const { user, setUser } = useActiveUserState();

    const tagData = tagResponse?.data;
    const hasTag = Boolean(tagData?.hasTag && tagData?.tag);
    const currentTag = tagData?.tag ?? '';
    const suggestedTag = tagData?.suggestedTag ?? '';

    const fullName =
        [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
        'SPIKE User';

    const [tagInput, setTagInput] = useState('');
    const [inputError, setInputError] = useState<string | undefined>(undefined);
    const [availabilityStatus, setAvailabilityStatus] =
        useState<TagAvailabilityStatus>('idle');
    const [isEditing, setIsEditing] = useState(false);

    const showCreateMode = !hasTag || isEditing;

    // Pre-fill the input with the server-generated unique default tag
    useEffect(() => {
        if (!tagData) return;
        if (!tagData.hasTag && tagData.suggestedTag && !tagInput) {
            setTagInput(tagData.suggestedTag);
            setAvailabilityStatus('available');
        } else if (tagData.hasTag && tagData.tag && isEditing && !tagInput) {
            setTagInput(tagData.tag);
            setAvailabilityStatus('available');
        }
    }, [isEditing, tagData, tagInput]);

    // Debounced live availability check while editing/creating
    useEffect(() => {
        if (!showCreateMode) return;

        const cleaned = sanitizeTagInput(tagInput);
        if (!cleaned) {
            setAvailabilityStatus('idle');
            return;
        }
        if (cleaned.length < 3) {
            setAvailabilityStatus('invalid');
            return;
        }
        if (cleaned === currentTag || (!hasTag && cleaned === suggestedTag)) {
            setAvailabilityStatus('available');
            return;
        }

        let cancelled = false;
        setAvailabilityStatus('checking');

        const timer = setTimeout(async () => {
            try {
                const res = await UserService.checkSpikeTagAvailability(cleaned);
                if (cancelled) return;
                setAvailabilityStatus(
                    res?.data?.available ? 'available' : 'taken',
                );
            } catch {
                if (cancelled) return;
                setAvailabilityStatus('idle');
            }
        }, 350);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [currentTag, hasTag, showCreateMode, suggestedTag, tagInput]);

    const isValidTag =
        /^[a-z0-9._]{3,20}$/.test(tagInput) &&
        availabilityStatus !== 'taken' &&
        availabilityStatus !== 'checking';

    const handleSaveTag = async () => {
        const cleaned = sanitizeTagInput(tagInput);
        if (!/^[a-z0-9._]{3,20}$/.test(cleaned)) {
            setInputError(
                'Tag must be 3–20 characters (letters, numbers, dots, or underscores).',
            );
            return;
        }

        setInputError(undefined);
        try {
            const response = await createSpikeTag({
                body: { tag: cleaned },
                params: null,
                query: null,
            });

            if (user && response?.data?.tagRecord) {
                setUser({
                    ...(user as any),
                    tag: response.data.tagRecord,
                });
            }

            setIsEditing(false);
            toast.success(`@${cleaned} is now your SPIKE tag!`);
        } catch (err: any) {
            const msg =
                typeof err?.message === 'string'
                    ? err.message
                    : 'Could not save SPIKE tag. Please try another one.';
            setInputError(msg);
            if (msg.toLowerCase().includes('taken')) {
                setAvailabilityStatus('taken');
            }
            toast.error(msg);
        }
    };

    const handleDiscard = () => {
        setInputError(undefined);
        if (hasTag) {
            setTagInput(currentTag);
            setIsEditing(false);
        } else {
            router.back();
        }
    };

    const handleCopyTag = async () => {
        const formatted = `@${currentTag}`;
        try {
            if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(formatted);
            }
        } catch {
            // Ignore
        }
        toast.success(`${formatted} copied`);
    };

    const handleShareTag = async () => {
        try {
            await Share.share({
                message: `Send me money on SPIKE using my SPIKE tag: @${currentTag}`,
            });
        } catch {
            toast.error('Could not open share sheet.');
        }
    };

    return (
        <KeyboardAvoidingView
            className="flex-1 bg-[#F7F7F8]"
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View className="flex-1 justify-between px-6 pt-14 pb-8">
                {/* Top Bar */}
                <View className="flex-row items-center justify-between">
                    <Pressable
                        onPress={handleDiscard}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel="Go back"
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
                                ios: 'arrow.left',
                                android: 'arrow_back',
                                web: 'arrow_back',
                            }}
                            size={18}
                            weight="medium"
                            tintColor="#18181B"
                        />
                    </Pressable>
                </View>

                {isLoading ? (
                    <View className="flex-1 items-center justify-center gap-3">
                        <ActivityIndicator size="large" color="#0C490C" />
                        <Text className="font-inter-regular text-sm text-text-body">
                            Loading your SPIKE tag...
                        </Text>
                    </View>
                ) : isError ? (
                    <View className="flex-1 items-center justify-center gap-4 px-4">
                        <Text className="font-figtree-bold text-xl text-text-black text-center">
                            Couldn&apos;t load your SPIKE tag
                        </Text>
                        <Text className="font-inter-regular text-sm text-text-body text-center">
                            Please check your connection and try again.
                        </Text>
                        <SubmitButton
                            label="Retry"
                            onPress={() => {
                                void refetch();
                            }}
                            borderRadius={100}
                            height={48}
                            width="60%"
                        />
                    </View>
                ) : (
                    <>
                        <View className="flex-1 pt-6">
                            {/* Green @ Badge */}
                            <Image
                                source={require('@/assets/images/home/at.png')}
                                contentFit="contain"
                                style={{ width: 72, height: 72 }}
                            />

                            <Text className="font-figtree-bold text-[30px] leading-[36px] tracking-[-0.6px] text-text-black mt-5">
                                {showCreateMode
                                    ? hasTag
                                        ? 'Change your SPIKE tag'
                                        : 'Create your SPIKE tag'
                                    : 'Receive with SPIKE tag'}
                            </Text>

                            <Text className="font-inter-regular text-sm leading-5 text-text-body mt-2">
                                {showCreateMode
                                    ? 'Choose a unique handle so other SPIKE users can send you money easily.'
                                    : 'Share your unique SPIKE tag to get paid instantly by other SPIKE users.'}
                            </Text>

                            {showCreateMode ? (
                                <View className="mt-7">
                                    <SpikeTagCard
                                        editable
                                        tag={tagInput}
                                        placeholder={suggestedTag || 'yourtag'}
                                        fullName={fullName}
                                        availabilityStatus={availabilityStatus}
                                        errorMessage={inputError}
                                        onChangeTag={(val) => {
                                            setTagInput(sanitizeTagInput(val));
                                            if (inputError) setInputError(undefined);
                                        }}
                                    />

                                    {/* Discard & Claim tag buttons */}
                                    <View className="flex-row items-center gap-3 mt-5">
                                        <Pressable
                                            onPress={handleDiscard}
                                            disabled={isPending}
                                            accessibilityRole="button"
                                            className="flex-1 h-12 rounded-full items-center justify-center active:opacity-80"
                                            style={{ backgroundColor: '#FF3B3B' }}
                                        >
                                            <Text className="font-figtree-medium text-base text-white">
                                                Discard
                                            </Text>
                                        </Pressable>

                                        <View className="flex-1">
                                            <SubmitButton
                                                label="Claim tag"
                                                loadingLabel="Claiming..."
                                                isLoading={isPending}
                                                disabled={!isValidTag}
                                                onPress={handleSaveTag}
                                                borderRadius={100}
                                                height={48}
                                            />
                                        </View>
                                    </View>
                                </View>
                            ) : (
                                <View className="mt-7">
                                    <SpikeTagCard
                                        tag={currentTag}
                                        fullName={fullName}
                                        onPressCopyTag={handleCopyTag}
                                        onPressChangeTag={() => {
                                            setTagInput(currentTag);
                                            setAvailabilityStatus('available');
                                            setInputError(undefined);
                                            setIsEditing(true);
                                        }}
                                    />
                                </View>
                            )}
                        </View>

                        {/* Bottom Share CTA (view mode only) */}
                        {!showCreateMode ? (
                            <View className="pt-4">
                                <SubmitButton
                                    label="Share SPIKE tag"
                                    onPress={handleShareTag}
                                    borderRadius={100}
                                    height={50}
                                />
                            </View>
                        ) : null}
                    </>
                )}
            </View>
        </KeyboardAvoidingView>
    );
}
