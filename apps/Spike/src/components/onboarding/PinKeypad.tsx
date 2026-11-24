import { SymbolView } from 'expo-symbols';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

export interface PinKeypadProps {
    onDigitPress: (digit: string) => void;
    onDeletePress: () => void;
    disabled?: boolean;
}

const KEY_ROWS: Array<Array<{ digit: string; letters?: string } | 'empty' | 'delete'>> = [
    [
        { digit: '1', letters: ' ' },
        { digit: '2', letters: 'ABC' },
        { digit: '3', letters: 'DEF' },
    ],
    [
        { digit: '4', letters: 'GHI' },
        { digit: '5', letters: 'JKL' },
        { digit: '6', letters: 'MNO' },
    ],
    [
        { digit: '7', letters: 'PQRS' },
        { digit: '8', letters: 'TUV' },
        { digit: '9', letters: 'WXYZ' },
    ],
    ['empty', { digit: '0' }, 'delete'],
];

export default function PinKeypad({
    onDigitPress,
    onDeletePress,
    disabled = false,
}: PinKeypadProps) {
    return (
        <View className="w-full bg-[#E5E7EB] rounded-t-[28px] px-2 pt-2.5 pb-4 gap-2">
            {KEY_ROWS.map((row, rowIndex) => (
                <View key={rowIndex} className="flex-row gap-2">
                    {row.map((key, colIndex) => {
                        if (key === 'empty') {
                            return <View key={`empty-${colIndex}`} className="flex-1 h-[52px]" />;
                        }

                        if (key === 'delete') {
                            return (
                                <Pressable
                                    key="delete"
                                    onPress={onDeletePress}
                                    disabled={disabled}
                                    accessibilityRole="button"
                                    accessibilityLabel="Delete digit"
                                    className="flex-1 h-[52px] items-center justify-center rounded-xl active:opacity-60"
                                >
                                    <SymbolView
                                        name={{
                                            ios: 'delete.left',
                                            android: 'backspace',
                                            web: 'backspace',
                                        }}
                                        size={24}
                                        tintColor="#18181B"
                                    />
                                </Pressable>
                            );
                        }

                        return (
                            <Pressable
                                key={key.digit}
                                onPress={() => onDigitPress(key.digit)}
                                disabled={disabled}
                                accessibilityRole="button"
                                accessibilityLabel={key.digit}
                                className="flex-1 h-[52px] bg-white rounded-xl items-center justify-center active:bg-gray-200"
                                style={{
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 1 },
                                    shadowOpacity: 0.08,
                                    shadowRadius: 1,
                                    elevation: 1,
                                }}
                            >
                                <Text className="font-inter-regular text-[22px] leading-6 text-text-black">
                                    {key.digit}
                                </Text>
                                {key.letters !== undefined ? (
                                    <Text className="font-inter-medium text-[9px] tracking-[1.2px] text-text-black">
                                        {key.letters}
                                    </Text>
                                ) : null}
                            </Pressable>
                        );
                    })}
                </View>
            ))}
        </View>
    );
}
