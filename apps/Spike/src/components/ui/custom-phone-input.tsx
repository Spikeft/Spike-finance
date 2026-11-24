import { SymbolView } from "expo-symbols";
import React from "react";
import {
    Control,
    FieldPath,
    FieldValues,
    RegisterOptions,
    useController,
    useFormContext,
} from "react-hook-form";
import {
    FlatList,
    Modal,
    Pressable,
    SafeAreaView,
    Text,
    TextInput,
    TextInputProps,
    View,
    ViewStyle,
} from "react-native";
import { useCSSVariable } from "uniwind";
import { z } from "zod";

export interface CountryItem {
    code: string;
    name: string;
    dialCode: string;
    flag: string;
}

export const COUNTRIES: CountryItem[] = [
    { code: "NG", name: "Nigeria", dialCode: "+234", flag: "🇳🇬" },
    { code: "GH", name: "Ghana", dialCode: "+233", flag: "🇬🇭" },
    { code: "KE", name: "Kenya", dialCode: "+254", flag: "🇰🇪" },
    { code: "ZA", name: "South Africa", dialCode: "+27", flag: "🇿🇦" },
    { code: "GB", name: "United Kingdom", dialCode: "+44", flag: "🇬🇧" },
    { code: "US", name: "United States", dialCode: "+1", flag: "🇺🇸" },
    { code: "CA", name: "Canada", dialCode: "+1", flag: "🇨🇦" },
    { code: "DE", name: "Germany", dialCode: "+49", flag: "🇩🇪" },
    { code: "FR", name: "France", dialCode: "+33", flag: "🇫🇷" },
    { code: "AE", name: "United Arab Emirates", dialCode: "+971", flag: "🇦🇪" },
    { code: "IN", name: "India", dialCode: "+91", flag: "🇮🇳" },
    { code: "EG", name: "Egypt", dialCode: "+20", flag: "🇪🇬" },
    { code: "TZ", name: "Tanzania", dialCode: "+255", flag: "🇹🇿" },
    { code: "UG", name: "Uganda", dialCode: "+256", flag: "🇺🇬" },
    { code: "RW", name: "Rwanda", dialCode: "+250", flag: "🇷🇼" },
    { code: "CM", name: "Cameroon", dialCode: "+237", flag: "🇨🇲" },
    { code: "CI", name: "Côte d'Ivoire", dialCode: "+225", flag: "🇨🇮" },
    { code: "SN", name: "Senegal", dialCode: "+221", flag: "🇸🇳" },
];

const DEFAULT_COUNTRY = COUNTRIES[0]; // Nigeria (+234)

export interface CustomPhoneInputProps<
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<TextInputProps, "value" | "onChangeText" | "keyboardType"> {
    name?: TName;
    control?: Control<TFieldValues>;
    rules?: RegisterOptions<TFieldValues, TName>;
    /** Optional Zod schema for standalone or per-field validation. */
    schema?: z.ZodType;
    label?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    defaultCountryCode?: string;
    countries?: CountryItem[];
    height?: number;
    borderRadius?: number;
    error?: string;
    success?: boolean;
    successMessage?: string;
    containerStyle?: ViewStyle;
    containerClassName?: string;
    inputClassName?: string;
    onCountryChange?: (country: CountryItem) => void;

    // Standalone (non-react-hook-form) usage
    value?: string;
    onChangeText?: (fullPhoneNumber: string) => void;
}

function cleanPhoneDigits(val: string): string {
    return val.replace(/\D/g, "");
}

function parsePhoneValue(
    rawValue: string,
    countries: CountryItem[],
    fallbackCountry: CountryItem,
): { country: CountryItem; nationalNumber: string } {
    if (!rawValue) {
        return { country: fallbackCountry, nationalNumber: "" };
    }

    const trimmed = rawValue.trim();
    if (trimmed.startsWith("+")) {
        // Match longest dialCode first so e.g. +234 matches before +2
        const sorted = [...countries].sort(
            (a, b) => b.dialCode.length - a.dialCode.length,
        );
        const matched = sorted.find((c) => trimmed.startsWith(c.dialCode));
        if (matched) {
            return {
                country: matched,
                nationalNumber: cleanPhoneDigits(trimmed.slice(matched.dialCode.length)),
            };
        }
    }

    return {
        country: fallbackCountry,
        nationalNumber: cleanPhoneDigits(trimmed),
    };
}

interface BasePhoneInputProps extends Omit<
    CustomPhoneInputProps,
    "name" | "control" | "rules" | "schema"
> {
    rawValue: string;
    isValid?: boolean;
    errorMessage?: string;
    showError: boolean;
    onValueChange: (fullPhoneNumber: string) => void;
    onFieldBlur?: () => void;
    inputRef?: React.Ref<React.ComponentRef<typeof TextInput>>;
}

function BaseCustomPhoneInput({
    label = "Phone number",
    placeholder,
    required,
    disabled,
    defaultCountryCode = "NG",
    countries = COUNTRIES,
    height = 52,
    borderRadius = 14,
    success,
    successMessage,
    containerStyle,
    containerClassName,
    inputClassName,
    onCountryChange,
    onFocus,
    onBlur,
    style: inputStyle,
    rawValue,
    isValid,
    errorMessage,
    showError,
    onValueChange,
    onFieldBlur,
    inputRef,
    ...restTextInputProps
}: BasePhoneInputProps) {
    const initialCountry = React.useMemo(
        () =>
            countries.find(
                (c) => c.code.toUpperCase() === defaultCountryCode.toUpperCase(),
            ) ??
            countries[0] ??
            DEFAULT_COUNTRY,
        [countries, defaultCountryCode],
    );

    const [selectedCountry, setSelectedCountry] =
        React.useState<CountryItem>(initialCountry);
    const [pickerVisible, setPickerVisible] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");

    const bodyColorRaw = useCSSVariable("--color-text-body");
    const blackColorRaw = useCSSVariable("--color-text-black");
    const bodyColor =
        typeof bodyColorRaw === "string" ? bodyColorRaw : "#71717A";
    const blackColor =
        typeof blackColorRaw === "string" ? blackColorRaw : "#18181B";

    const parsed = React.useMemo(
        () => parsePhoneValue(rawValue, countries, selectedCountry),
        [rawValue, countries, selectedCountry],
    );

    // Sync selected country if external value changes with a different dial code
    React.useEffect(() => {
        if (rawValue.startsWith("+") && parsed.country.code !== selectedCountry.code) {
            setSelectedCountry(parsed.country);
        }
    }, [rawValue, parsed.country, selectedCountry.code]);

    const nationalNumber = parsed.nationalNumber;

    const filteredCountries = React.useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return countries;
        return countries.filter(
            (c) =>
                c.name.toLowerCase().includes(q) ||
                c.dialCode.includes(q) ||
                c.code.toLowerCase().includes(q),
        );
    }, [countries, searchQuery]);

    const handleDigitsChange = (text: string) => {
        const digits = cleanPhoneDigits(text);
        const fullNumber = digits ? `${selectedCountry.dialCode}${digits}` : "";
        onValueChange(fullNumber);
    };

    const handleSelectCountry = (country: CountryItem) => {
        setSelectedCountry(country);
        onCountryChange?.(country);
        if (nationalNumber) {
            onValueChange(`${country.dialCode}${nationalNumber}`);
        }
        setPickerVisible(false);
        setSearchQuery("");
    };

    const handleBlur: TextInputProps["onBlur"] = (e) => {
        onFieldBlur?.();
        onBlur?.(e);
    };

    const hasError = Boolean(errorMessage);
    const hasVisibleError = Boolean(errorMessage && showError);
    const hasContent = nationalNumber.length > 0;
    const hasSuccess =
        success !== undefined
            ? Boolean(success) && !hasError
            : Boolean(isValid) && hasContent && !hasError;
    const hasVisibleSuccessMessage = Boolean(successMessage && hasSuccess);

    const labelColorClass = hasVisibleError ? "text-error" : "text-text-black";

    const wrapperStateClasses = hasVisibleError
        ? "border-error bg-input-background"
        : hasSuccess
            ? "border-secondary bg-primary-background"
            : "border-input-border bg-input-background";

    return (
        <View style={containerStyle} className={containerClassName}>
            {label && (
                <View className="flex-row items-center mb-2">
                    <Text className={`font-figtree-medium text-sm ${labelColorClass}`}>
                        {label}
                    </Text>
                    {required && (
                        <Text className="font-figtree-medium text-sm text-error ml-0.5">
                            *
                        </Text>
                    )}
                </View>
            )}

            <View
                collapsable={false}
                className={`w-full border-[1.5px] px-3 flex-row items-center ${wrapperStateClasses} ${disabled ? "opacity-60" : ""
                    }`}
                style={{ borderRadius, height }}
            >
                {/* Country selector */}
                <Pressable
                    onPress={() => {
                        if (!disabled) setPickerVisible(true);
                    }}
                    disabled={disabled}
                    hitSlop={6}
                    accessibilityRole="button"
                    accessibilityLabel={`Select country code, currently ${selectedCountry.name} ${selectedCountry.dialCode}`}
                    className="flex-row items-center pr-2.5 gap-1.5"
                >
                    <View className="w-6 h-6 rounded-full overflow-hidden items-center justify-center">
                        <Text className="text-lg leading-6">{selectedCountry.flag}</Text>
                    </View>
                    <Text className="font-inter-regular text-base text-text-black">
                        {selectedCountry.dialCode}
                    </Text>
                    <SymbolView
                        name={{
                            ios: "chevron.down",
                            android: "keyboard_arrow_down",
                            web: "keyboard_arrow_down",
                        }}
                        size={12}
                        weight="medium"
                        tintColor={blackColor}
                    />
                </Pressable>

                {/* Phone digits input */}
                <TextInput
                    ref={inputRef}
                    collapsable={false}
                    {...restTextInputProps}
                    editable={!disabled}
                    value={nationalNumber}
                    keyboardType="phone-pad"
                    textContentType="telephoneNumber"
                    autoComplete="tel"
                    placeholder={placeholder}
                    placeholderTextColor={bodyColor}
                    cursorColor={bodyColor}
                    onChangeText={handleDigitsChange}
                    onFocus={onFocus}
                    onBlur={handleBlur}
                    className={`flex-1 font-inter-regular text-base text-text-black pl-1 ${inputClassName ?? ""
                        }`}
                    style={[{ height, textAlignVertical: "center" }, inputStyle]}
                />
            </View>

            {(hasVisibleError || hasVisibleSuccessMessage) && (
                <View className="flex-row items-center mt-1.5">
                    {hasVisibleError ? (
                        <Text className="flex-1 font-inter-regular text-xs text-error">
                            {errorMessage}
                        </Text>
                    ) : (
                        <Text className="flex-1 font-inter-regular text-xs text-primary">
                            {successMessage}
                        </Text>
                    )}
                </View>
            )}

            {/* Country picker modal */}
            <Modal
                visible={pickerVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setPickerVisible(false)}
            >
                <SafeAreaView className="flex-1 bg-primary-background">
                    <View className="flex-row items-center justify-between px-4 py-3 border-b border-input-background">
                        <Text className="font-figtree-bold text-md text-text-black">
                            Select country
                        </Text>
                        <Pressable
                            onPress={() => {
                                setPickerVisible(false);
                                setSearchQuery("");
                            }}
                            hitSlop={8}
                        >
                            <Text className="font-figtree-medium text-sm text-primary">
                                Done
                            </Text>
                        </Pressable>
                    </View>

                    <View className="px-4 py-3">
                        <TextInput
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="Search country or dial code"
                            placeholderTextColor={bodyColor}
                            className="w-full h-11 px-3 rounded-xl bg-input-background font-inter-regular text-base text-text-black"
                        />
                    </View>

                    <FlatList
                        data={filteredCountries}
                        keyExtractor={(item) => item.code}
                        keyboardShouldPersistTaps="handled"
                        renderItem={({ item }) => {
                            const isSelected = item.code === selectedCountry.code;
                            return (
                                <Pressable
                                    onPress={() => handleSelectCountry(item)}
                                    className={`flex-row items-center justify-between px-4 py-3.5 border-b border-input-background ${isSelected ? "bg-input-background/60" : ""
                                        }`}
                                >
                                    <View className="flex-row items-center gap-3">
                                        <Text className="text-xl">{item.flag}</Text>
                                        <Text className="font-inter-regular text-base text-text-black">
                                            {item.name}
                                        </Text>
                                    </View>
                                    <Text className="font-figtree-medium text-sm text-text-body">
                                        {item.dialCode}
                                    </Text>
                                </Pressable>
                            );
                        }}
                    />
                </SafeAreaView>
            </Modal>
        </View>
    );
}

function ControlledCustomPhoneInput<
    TFieldValues extends FieldValues,
    TName extends FieldPath<TFieldValues>,
>({
    name,
    control,
    rules,
    schema,
    value: propValue,
    error: propError,
    onChangeText,
    ...rest
}: CustomPhoneInputProps<TFieldValues, TName> & {
    name: TName;
    control: Control<TFieldValues>;
}) {
    const mergedRules = React.useMemo<
        RegisterOptions<TFieldValues, TName> | undefined
    >(() => {
        if (!schema) return rules;
        return {
            ...rules,
            validate: {
                ...(typeof rules?.validate === "function"
                    ? { custom: rules.validate }
                    : rules?.validate),
                zod: (val) => {
                    const result = schema.safeParse(val);
                    return result.success
                        ? true
                        : (result.error.issues[0]?.message ?? "Invalid phone number");
                },
            },
        };
    }, [rules, schema]);

    const {
        field,
        fieldState: { error: fieldError, invalid, isDirty, isTouched },
        formState: { isSubmitted },
    } = useController({
        name,
        control,
        rules: mergedRules,
    });

    const rawValue =
        propValue !== undefined
            ? String(propValue)
            : field.value !== undefined && field.value !== null
                ? String(field.value)
                : "";

    const errorMessage =
        propError !== undefined ? propError : fieldError?.message;
    const showError =
        propError !== undefined
            ? Boolean(propError)
            : Boolean(isTouched || isSubmitted);
    const isSchemaValid = schema ? schema.safeParse(rawValue).success : true;
    const isValid =
        rawValue.trim().length > 0 &&
        !errorMessage &&
        !invalid &&
        isSchemaValid &&
        Boolean(isDirty || isTouched || isSubmitted);

    return (
        <BaseCustomPhoneInput
            {...rest}
            inputRef={field.ref}
            rawValue={rawValue}
            isValid={isValid}
            errorMessage={errorMessage}
            showError={showError}
            onValueChange={(fullNumber) => {
                field.onChange(fullNumber);
                onChangeText?.(fullNumber);
            }}
            onFieldBlur={field.onBlur}
        />
    );
}

function StandaloneCustomPhoneInput({
    schema,
    value: propValue,
    error: propError,
    onChangeText,
    ...rest
}: Omit<CustomPhoneInputProps, "name" | "control" | "rules">) {
    const [localValue, setLocalValue] = React.useState("");
    const [zodError, setZodError] = React.useState<string | undefined>(undefined);
    const [touched, setTouched] = React.useState(false);

    const isControlled = propValue !== undefined;
    const rawValue = isControlled ? String(propValue) : localValue;

    const validateWithZod = (val: string) => {
        if (!schema) return;
        const result = schema.safeParse(val);
        setZodError(
            result.success
                ? undefined
                : (result.error.issues[0]?.message ?? "Invalid phone number"),
        );
    };

    const errorMessage = propError !== undefined ? propError : zodError;
    const showError =
        propError !== undefined ? Boolean(propError) : Boolean(touched && zodError);
    const isValid =
        rawValue.trim().length > 0 &&
        !errorMessage &&
        (schema ? schema.safeParse(rawValue).success : false);

    return (
        <BaseCustomPhoneInput
            {...rest}
            rawValue={rawValue}
            isValid={isValid}
            errorMessage={errorMessage}
            showError={showError}
            onValueChange={(fullNumber) => {
                if (!isControlled) {
                    setLocalValue(fullNumber);
                }
                if (touched) {
                    validateWithZod(fullNumber);
                }
                onChangeText?.(fullNumber);
            }}
            onFieldBlur={() => {
                setTouched(true);
                validateWithZod(rawValue);
            }}
        />
    );
}

export default function CustomPhoneInput<
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(props: CustomPhoneInputProps<TFieldValues, TName>) {
    const formContext = useFormContext<TFieldValues>();
    const resolvedControl = props.control ?? formContext?.control;

    if (props.name && resolvedControl) {
        return (
            <ControlledCustomPhoneInput
                {...props}
                name={props.name}
                control={resolvedControl}
            />
        );
    }

    const { name: _name, control: _control, rules: _rules, ...standaloneProps } =
        props;

    return <StandaloneCustomPhoneInput {...standaloneProps} />;
}
