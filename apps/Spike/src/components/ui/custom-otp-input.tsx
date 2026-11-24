import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  Pressable,
  Text,
  TextInput,
  View,
  ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

export interface CustomOtpInputRef {
  focus: () => void;
  blur: () => void;
  clear: () => void;
  /** Programmatically trigger error state (optionally with an error message). */
  setError: (message?: string | boolean) => void;
  /** Programmatically clear the error state. */
  clearError: () => void;
  /** Trigger the horizontal shake animation. */
  shake: () => void;
}

export interface CustomOtpInputProps {
  /** Number of OTP digits. Defaults to 6. */
  length?: number;
  /** Controlled value. */
  value?: string;
  /** Called whenever the OTP value changes. */
  onChange?: (code: string) => void;
  /** Called when all digits have been entered. */
  onComplete?: (code: string) => void;
  /** Controlled error state: pass `true` or an error message string. */
  error?: string | boolean;
  /** Auto-clear programmatic error when the user types. Defaults to `true`. */
  clearErrorOnChange?: boolean;
  /** Show a dash separator in the middle (for even lengths, e.g. 3-3). Defaults to `true`. */
  showSeparator?: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
  containerStyle?: ViewStyle;
  containerClassName?: string;
}

function BlinkingCaret() {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 450 }),
        withTiming(1, { duration: 450 }),
      ),
      -1,
      false,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={animatedStyle}
      className="w-[1.5px] h-5 bg-text-black rounded-full"
    />
  );
}

const CustomOtpInput = forwardRef<CustomOtpInputRef, CustomOtpInputProps>(
  (
    {
      length = 6,
      value,
      onChange,
      onComplete,
      error: propError,
      clearErrorOnChange = true,
      showSeparator = true,
      autoFocus = true,
      disabled = false,
      containerStyle,
      containerClassName,
    },
    ref,
  ) => {
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const [imperativeError, setImperativeError] = useState<
      string | boolean | undefined
    >(undefined);

    const inputRef = useRef<React.ComponentRef<typeof TextInput>>(null);
    const shakeX = useSharedValue(0);

    const code = isControlled ? value : internalValue;
    const activeError =
      propError !== undefined && propError !== false
        ? propError
        : imperativeError;
    const hasError = Boolean(activeError);
    const errorMessage =
      typeof activeError === "string" ? activeError : undefined;

    const triggerShake = () => {
      shakeX.value = withSequence(
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(-6, { duration: 50 }),
        withTiming(6, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
    };

    // Shake automatically when propError transitions to truthy
    const prevPropError = useRef<string | boolean | undefined>(propError);
    useEffect(() => {
      if (propError && !prevPropError.current) {
        triggerShake();
      }
      prevPropError.current = propError;
    }, [propError]);

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
      clear: () => {
        if (!isControlled) setInternalValue("");
        onChange?.("");
      },
      setError: (message: string | boolean = true) => {
        setImperativeError(message);
        triggerShake();
      },
      clearError: () => {
        setImperativeError(undefined);
      },
      shake: triggerShake,
    }));

    const handleChangeText = (rawText: string) => {
      const cleaned = rawText.replace(/\D/g, "").slice(0, length);

      if (clearErrorOnChange && imperativeError) {
        setImperativeError(undefined);
      }

      if (!isControlled) {
        setInternalValue(cleaned);
      }
      onChange?.(cleaned);

      if (cleaned.length === length) {
        onComplete?.(cleaned);
      }
    };

    const handleBoxPress = () => {
      if (disabled) return;
      inputRef.current?.focus();
    };

    const shakeAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: shakeX.value }],
    }));

    const separatorIndex =
      showSeparator && length % 2 === 0 ? length / 2 : -1;
    const activeIndex = Math.min(code.length, length - 1);

    return (
      <View style={containerStyle} className={containerClassName}>
        {/* Hidden input for native keyboard, paste, and SMS One-Time-Code autofill */}
        <TextInput
          ref={inputRef}
          value={code}
          onChangeText={handleChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          maxLength={length}
          autoFocus={autoFocus}
          editable={!disabled}
          caretHidden
          style={{
            position: "absolute",
            width: 1,
            height: 1,
            opacity: 0,
          }}
        />

        <Animated.View
          style={shakeAnimatedStyle}
          className="flex-row items-center justify-between w-full"
        >
          {Array.from({ length }).map((_, index) => {
            const digit = code[index] ?? "";
            const isCurrentBox = isFocused && index === activeIndex;
            const showCaret = isCurrentBox && !digit;

            const boxStateClasses = hasError
              ? "border-error bg-error-background"
              : isCurrentBox
                ? "border-primary bg-input-background"
                : "border-transparent bg-input-background";

            return (
              <React.Fragment key={index}>
                {index === separatorIndex && (
                  <View className="w-4 items-center justify-center mx-0.5">
                    <View className="w-1.5 h-[1.5px] bg-gray-300 rounded-full" />
                  </View>
                )}

                <Pressable
                  onPress={handleBoxPress}
                  disabled={disabled}
                  accessibilityRole="button"
                  accessibilityLabel={`OTP digit ${index + 1}`}
                  className={`flex-1 aspect-square max-h-[54px] rounded-[10px] border-[1.5px] items-center justify-center ${index > 0 && index !== separatorIndex ? "ml-2" : ""
                    } ${boxStateClasses} ${disabled ? "opacity-60" : ""}`}
                >
                  {digit ? (
                    <Text className="font-figtree-medium text-xl text-text-black">
                      {digit}
                    </Text>
                  ) : showCaret ? (
                    <BlinkingCaret />
                  ) : null}
                </Pressable>
              </React.Fragment>
            );
          })}
        </Animated.View>

        {errorMessage ? (
          <Text className="font-inter-regular text-xs text-error mt-2">
            {errorMessage}
          </Text>
        ) : null}
      </View>
    );
  },
);

CustomOtpInput.displayName = "CustomOtpInput";

export default CustomOtpInput;
