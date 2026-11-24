import { SymbolView } from 'expo-symbols';
import React from 'react';
import { Text, TextInput, View } from 'react-native';

export interface DateOfBirthInputProps {
    /** Formatted string as MM/DD/YYYY */
    value: string;
    onChangeText: (formatted: string) => void;
    error?: string;
    disabled?: boolean;
}

/**
 * Formats raw numeric digits into MM/DD/YYYY as the user types.
 */
export function formatDobInput(raw: string): string {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/**
 * Validates MM/DD/YYYY and converts to ISO YYYY-MM-DD (matching UpdateUserDetailsDto).
 * Returns null if incomplete or invalid.
 */
export function parseDobToIso(formatted: string): string | null {
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(formatted.trim());
    if (!match) return null;

    const month = Number(match[1]);
    const day = Number(match[2]);
    const year = Number(match[3]);
    const currentYear = new Date().getFullYear();

    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 31) return null;
    if (year < 1900 || year > currentYear) return null;

    const date = new Date(year, month - 1, day);
    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        return null;
    }

    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function DateOfBirthInput({
    value,
    onChangeText,
    error,
    disabled = false,
}: DateOfBirthInputProps) {
    const isValid = Boolean(parseDobToIso(value)) && !error;
    const hasError = Boolean(error);

    const wrapperClasses = hasError
        ? 'border-error bg-input-background'
        : isValid
            ? 'border-secondary bg-primary-background'
            : 'border-input-border bg-input-background';

    return (
        <View>
            <View
                className={`w-full h-12 rounded-xl border-[1.5px] flex-row items-center overflow-hidden pl-3 ${wrapperClasses} ${disabled ? 'opacity-60' : ''}`}
            >
                <TextInput
                    value={value}
                    onChangeText={(text) => onChangeText(formatDobInput(text))}
                    placeholder="mm / dd / yyyy"
                    placeholderTextColor="#71717A"
                    keyboardType="number-pad"
                    maxLength={10}
                    editable={!disabled}
                    className="flex-1 font-inter-regular text-base text-text-black"
                />

                <View className="h-full px-3 bg-[#E5E5E6] items-center justify-center">
                    <SymbolView
                        name={{
                            ios: 'calendar',
                            android: 'calendar_today',
                            web: 'calendar_today',
                        }}
                        size={16}
                        tintColor="#71717A"
                    />
                </View>
            </View>

            {error ? (
                <Text className="font-inter-regular text-xs text-error mt-1.5">
                    {error}
                </Text>
            ) : null}
        </View>
    );
}
