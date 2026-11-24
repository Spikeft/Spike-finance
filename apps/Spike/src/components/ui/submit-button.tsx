import React from "react";
import {
  FieldValues,
  SubmitErrorHandler,
  SubmitHandler,
  useFormContext,
} from "react-hook-form";
import {
  ActivityIndicator,
  DimensionValue,
  Pressable,
  PressableProps,
  Text,
  ViewStyle,
} from "react-native";

export interface SubmitButtonProps<
  TFieldValues extends FieldValues = FieldValues,
> extends Omit<PressableProps, "onPress" | "children"> {
  label: string;
  loadingLabel?: string;
  isLoading?: boolean;
  onSubmit?: SubmitHandler<TFieldValues>;
  onError?: SubmitErrorHandler<TFieldValues>;
  onPress?: () => void;
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  disabled?: boolean;
  className?: string;
  textClassName?: string;
  style?: ViewStyle;
}

export default function SubmitButton<
  TFieldValues extends FieldValues = FieldValues,
>({
  label,
  loadingLabel,
  isLoading = false,
  onSubmit,
  onError,
  onPress,
  width = "100%",
  height = 52,
  borderRadius = 14,
  borderWidth = 0,
  borderColor = "transparent",
  disabled = false,
  className,
  textClassName,
  style,
  ...rest
}: SubmitButtonProps<TFieldValues>) {
  const formContext = useFormContext<TFieldValues>();
  const submitting = isLoading || Boolean(formContext?.formState.isSubmitting);
  const isDisabled = submitting || disabled;

  const handlePress = () => {
    if (isDisabled) return;

    if (formContext && onSubmit) {
      formContext.handleSubmit(onSubmit, onError)();
      return;
    }

    onPress?.();
  };

  return (
    <Pressable
      {...rest}
      onPress={handlePress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: submitting }}
      className={`bg-primary flex-row items-center justify-center gap-2 ${
        isDisabled ? "opacity-60" : "active:opacity-85"
      } ${className ?? ""}`}
      style={[
        {
          width,
          height,
          borderRadius,
          borderWidth,
          borderColor,
        },
        style,
      ]}
    >
      {submitting ? (
        <>
          <ActivityIndicator size="small" color="#FFFFFF" />
          {loadingLabel ? (
            <Text
              className={`font-figtree-medium text-base text-white ${textClassName ?? ""}`}
            >
              {loadingLabel}
            </Text>
          ) : null}
        </>
      ) : (
        <Text
          className={`font-figtree-medium text-base text-white ${textClassName ?? ""}`}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}
