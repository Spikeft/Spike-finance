import { SymbolView, SymbolViewProps } from 'expo-symbols';
import React from 'react';
import { Pressable, Text, View, ViewStyle } from 'react-native';

export interface OptionActionCardProps {
    title: string;
    description: string;
    iconBgColor: string;
    icon?: React.ReactNode;
    symbolName?: SymbolViewProps['name'];
    iconColor?: string;
    iconSize?: number;
    showChevron?: boolean;
    disabled?: boolean;
    onPress?: () => void;
    className?: string;
    style?: ViewStyle;
}

export default function OptionActionCard({
    title,
    description,
    iconBgColor,
    icon,
    symbolName,
    iconColor = '#18181B',
    iconSize = 20,
    showChevron = true,
    disabled = false,
    onPress,
    className,
    style,
}: OptionActionCardProps) {
    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={`${title}. ${description}`}
            className={`w-full bg-white rounded-[24px] p-4 active:opacity-80 ${
                disabled ? 'opacity-50' : ''
            } ${className ?? ''}`}
            style={[
                {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.04,
                    shadowRadius: 8,
                    elevation: 2,
                },
                style,
            ]}
        >
            {/* Top Row: Circular Icon Badge + Right Chevron */}
            <View className="flex-row items-start justify-between">
                <View
                    style={{ backgroundColor: iconBgColor }}
                    className="w-11 h-11 rounded-full items-center justify-center"
                >
                    {icon ? (
                        icon
                    ) : symbolName ? (
                        <SymbolView
                            name={symbolName}
                            size={iconSize}
                            weight="semibold"
                            tintColor={iconColor}
                        />
                    ) : null}
                </View>

                {showChevron ? (
                    <View className="pt-1 pr-0.5">
                        <SymbolView
                            name={{
                                ios: 'chevron.right',
                                android: 'chevron_right',
                                web: 'chevron_right',
                            }}
                            size={14}
                            weight="semibold"
                            tintColor="#71717A"
                        />
                    </View>
                ) : null}
            </View>

            {/* Bottom Text Block */}
            <View className="mt-4 gap-1">
                <Text className="font-figtree-bold text-[17px] leading-[22px] tracking-[-0.2px] text-text-black">
                    {title}
                </Text>
                <Text className="font-inter-regular text-sm leading-5 text-text-body">
                    {description}
                </Text>
            </View>
        </Pressable>
    );
}
