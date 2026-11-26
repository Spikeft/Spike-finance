import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import React, { useRef } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

export type TagAvailabilityStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

export interface SpikeTagCardProps {
    tag: string;
    fullName: string;
    editable?: boolean;
    placeholder?: string;
    availabilityStatus?: TagAvailabilityStatus;
    errorMessage?: string;
    onChangeTag?: (val: string) => void;
    onPressChangeTag?: () => void;
    onPressCopyTag?: () => void;
}

const PATTERN_ROWS = 4;
const PATTERN_COLS = 11;

export default function SpikeTagCard({
    tag,
    fullName,
    editable = false,
    placeholder = 'yourtag',
    availabilityStatus = 'idle',
    errorMessage,
    onChangeTag,
    onPressChangeTag,
    onPressCopyTag,
}: SpikeTagCardProps) {
    const inputRef = useRef<React.ComponentRef<typeof TextInput>>(null);

    return (
        <View
            className="w-full bg-white rounded-[24px] overflow-hidden"
            style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.06,
                shadowRadius: 12,
                elevation: 3,
            }}
        >
            {/* Top Green Patterned Banner */}
            <View
                className="w-full h-[116px] overflow-hidden relative"
                style={{ backgroundColor: '#22B522' }}
            >
                <View
                    pointerEvents="none"
                    style={{
                        position: 'absolute',
                        top: -16,
                        left: -20,
                        right: -20,
                        bottom: -16,
                        justifyContent: 'space-between',
                    }}
                >
                    {Array.from({ length: PATTERN_ROWS }).map((_, rowIdx) => (
                        <View
                            key={rowIdx}
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                marginLeft: rowIdx % 2 === 0 ? 0 : 16,
                            }}
                        >
                            {Array.from({ length: PATTERN_COLS }).map((__, colIdx) => (
                                <View
                                    key={colIdx}
                                    style={{
                                        width: 8,
                                        height: 22,
                                        borderRadius: 2,
                                        backgroundColor: 'rgba(110, 245, 110, 0.35)',
                                        transform: [{ rotate: '32deg' }],
                                    }}
                                />
                            ))}
                        </View>
                    ))}
                </View>
            </View>

            {/* Overlapping Avatar + Shield Badge */}
            <View className="px-5">
                <View
                    style={{
                        width: 78,
                        height: 78,
                        marginTop: -46,
                        position: 'relative',
                    }}
                >
                    <View
                        style={{
                            width: 78,
                            height: 78,
                            borderRadius: 39,
                            backgroundColor: '#EFEFEF',
                            borderWidth: 3,
                            borderColor: '#FFFFFF',
                            overflow: 'hidden',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                        }}
                    >
                        <Image
                            source={require('@/assets/images/home/avatar-zara.svg')}
                            contentFit="contain"
                            style={{ width: 72, height: 68, marginBottom: -2 }}
                        />
                    </View>

                    <View
                        pointerEvents="none"
                        style={{
                            position: 'absolute',
                            right: -2,
                            bottom: -2,
                            width: 28,
                            height: 32,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Image
                            source={require('@/assets/images/home/badge-shield-bg.svg')}
                            contentFit="contain"
                            style={{ position: 'absolute', width: 28, height: 32 }}
                        />
                        <Image
                            source={require('@/assets/images/home/badge-crown.svg')}
                            contentFit="contain"
                            style={{ width: 14, height: 14, marginTop: -2 }}
                        />
                    </View>
                </View>
            </View>

            {/* Bottom Tag, Availability / Change Tag, and Full Name */}
            <View className="px-5 pt-3 pb-5">
                {editable ? (
                    <Pressable
                        onPress={() => inputRef.current?.focus()}
                        className="w-full"
                    >
                        <View className="flex-row items-center flex-wrap gap-2">
                            <View className="flex-row items-center">
                                <Text className="font-figtree-bold text-[24px] leading-7 tracking-[-0.4px] text-text-black">
                                    @
                                </Text>
                                <TextInput
                                    ref={inputRef}
                                    value={tag}
                                    onChangeText={onChangeTag}
                                    placeholder={placeholder}
                                    placeholderTextColor="#A1A1AA"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    autoFocus
                                    maxLength={20}
                                    className="font-figtree-bold text-[24px] leading-7 tracking-[-0.4px] text-text-black p-0 min-w-[60px]"
                                />
                            </View>

                            {/* Live Availability Badge */}
                            {availabilityStatus === 'checking' ? (
                                <View className="flex-row items-center gap-1">
                                    <ActivityIndicator size="small" color="#71717A" />
                                    <Text className="font-inter-regular text-xs text-text-body">
                                        Checking...
                                    </Text>
                                </View>
                            ) : availabilityStatus === 'available' ? (
                                <View className="flex-row items-center gap-1">
                                    <SymbolView
                                        name={{
                                            ios: 'checkmark.seal.fill',
                                            android: 'verified',
                                            web: 'verified',
                                        }}
                                        size={16}
                                        tintColor="#22C55E"
                                    />
                                    <Text
                                        className="font-figtree-medium text-xs"
                                        style={{ color: '#22C55E' }}
                                    >
                                        Available
                                    </Text>
                                </View>
                            ) : availabilityStatus === 'taken' ||
                              availabilityStatus === 'invalid' ? (
                                <View className="flex-row items-center gap-1">
                                    <SymbolView
                                        name={{
                                            ios: 'xmark.circle.fill',
                                            android: 'cancel',
                                            web: 'cancel',
                                        }}
                                        size={16}
                                        tintColor="#FF383C"
                                    />
                                    <Text className="font-figtree-medium text-xs text-error">
                                        {availabilityStatus === 'taken'
                                            ? 'Taken'
                                            : 'Min 3 chars'}
                                    </Text>
                                </View>
                            ) : null}
                        </View>

                        <Text
                            numberOfLines={1}
                            className="font-inter-regular text-sm leading-5 text-text-body mt-1"
                        >
                            {fullName}
                        </Text>

                        {errorMessage ? (
                            <Text className="font-inter-regular text-xs text-error mt-1.5">
                                {errorMessage}
                            </Text>
                        ) : null}
                    </Pressable>
                ) : (
                    <View className="flex-row items-center justify-between gap-3">
                        <Pressable
                            onPress={onPressCopyTag}
                            disabled={!onPressCopyTag}
                            className="flex-1 active:opacity-75"
                        >
                            <Text
                                numberOfLines={1}
                                className="font-figtree-bold text-[24px] leading-7 tracking-[-0.4px] text-text-black"
                            >
                                @{tag}
                            </Text>
                            <Text
                                numberOfLines={1}
                                className="font-inter-regular text-sm leading-5 text-text-body mt-0.5"
                            >
                                {fullName}
                            </Text>
                        </Pressable>

                        {onPressChangeTag ? (
                            <Pressable
                                onPress={onPressChangeTag}
                                hitSlop={6}
                                accessibilityRole="button"
                                accessibilityLabel="Change tag"
                                className="flex-row items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#EBEBEC] active:opacity-75"
                            >
                                <SymbolView
                                    name={{
                                        ios: 'pencil',
                                        android: 'edit',
                                        web: 'edit',
                                    }}
                                    size={14}
                                    weight="medium"
                                    tintColor="#18181B"
                                />
                                <Text className="font-figtree-medium text-sm text-text-black">
                                    Change tag
                                </Text>
                            </Pressable>
                        ) : null}
                    </View>
                )}
            </View>
        </View>
    );
}
