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
  Pressable,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";
import { useCSSVariable } from "uniwind";
import { z } from "zod";

export interface CustomTextInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<TextInputProps, "value" | "onChangeText"> {
  name?: TName;
  control?: Control<TFieldValues>;
  rules?: RegisterOptions<TFieldValues, TName>;
  /** Optional Zod schema for standalone field validation (when not using FormProvider + zodResolver). */
  schema?: z.ZodType;
  required?: boolean;
  placeholder?: string;
  isPassword?: boolean;
  containerStyle?: ViewStyle;
  containerClassName?: string;
  inputClassName?: string;
  label?: string;
  height?: number;
  borderRadius?: number;
  leftIcon?: React.ReactNode;
  multiline?: boolean;
  numberOfLines?: number;
  disabled?: boolean;
  showCharCount?: boolean;
  error?: string;
  success?: boolean;
  successMessage?: string;
  allowSpecialCharacters?: boolean;

  // Standalone (non-react-hook-form) usage
  value?: string;
  onChangeText?: (text: string) => void;
}

export const cleanDecimalValue = (val: string): string => {
  if (!val) return "";

  const clean = val.replace(/[^0-9.]/g, "");
  if (!clean) return "";

  const dotIndex = clean.indexOf(".");
  let integerPart = dotIndex !== -1 ? clean.slice(0, dotIndex) : clean;
  const decimalPart =
    dotIndex !== -1 ? clean.slice(dotIndex + 1).replace(/\./g, "") : undefined;

  if (integerPart.length > 1 && integerPart.startsWith("0")) {
    integerPart = integerPart.replace(/^0+(?=\d)/, "");
  }

  if (decimalPart !== undefined) {
    return `${integerPart}.${decimalPart}`;
  }

  return integerPart;
};

export const formatDecimalPadValue = (val: string): string => {
  if (!val) return "";

  const clean = cleanDecimalValue(val);
  if (!clean) return "";

  const dotIndex = clean.indexOf(".");
  const integerPart = dotIndex !== -1 ? clean.slice(0, dotIndex) : clean;
  const decimalPart = dotIndex !== -1 ? clean.slice(dotIndex + 1) : undefined;

  let formattedInteger = integerPart;
  const num = Number(integerPart);
  if (integerPart && !isNaN(num) && num > 9999) {
    formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  if (decimalPart !== undefined) {
    return `${formattedInteger}.${decimalPart}`;
  }

  return formattedInteger;
};

export const cleanSpecialCharacters = (val: string): string => {
  if (!val) return "";
  try {
    return val.replace(/[^\p{L}\p{N}\s@]/gu, "");
  } catch {
    return val.replace(/[^a-zA-Z0-9\s@]/g, "");
  }
};

interface BaseInputProps extends Omit<
  CustomTextInputProps,
  "name" | "control" | "rules" | "schema"
> {
  rawValue: string;
  isControlled: boolean;
  isValid?: boolean;
  errorMessage?: string;
  showError: boolean;
  onValueChange: (text: string) => void;
  onFieldBlur?: () => void;
  inputRef?: React.Ref<React.ComponentRef<typeof TextInput>>;
}

function BaseCustomTextInput({
  placeholder,
  label,
  height,
  borderRadius,
  leftIcon,
  multiline,
  numberOfLines = 4,
  disabled,
  required,
  isPassword,
  success,
  successMessage,
  containerStyle,
  containerClassName,
  inputClassName,
  showCharCount,
  onFocus,
  onBlur,
  style: inputStyle,
  keyboardType,
  allowSpecialCharacters = true,
  rawValue,
  isControlled,
  isValid,
  errorMessage,
  showError,
  onValueChange,
  onFieldBlur,
  inputRef,
  ...restTextInputProps
}: BaseInputProps) {
  const [focused, setFocused] = React.useState(false);
  const [hidePassword, setHidePassword] = React.useState(true);
  const bodyColorRaw = useCSSVariable("--color-text-body");
  const bodyColor =
    typeof bodyColorRaw === "string" ? bodyColorRaw : "#71717A";

  const value =
    keyboardType === "decimal-pad" && rawValue
      ? formatDecimalPadValue(rawValue)
      : !allowSpecialCharacters && rawValue
        ? cleanSpecialCharacters(rawValue)
        : rawValue;

  const handleChangeText = (rawText: string) => {
    let text = rawText;
    if (keyboardType === "decimal-pad") {
      text = cleanDecimalValue(rawText);
    } else if (!allowSpecialCharacters) {
      text = cleanSpecialCharacters(rawText);
    }
    if (
      restTextInputProps.maxLength &&
      text.length > restTextInputProps.maxLength
    ) {
      text = text.slice(0, restTextInputProps.maxLength);
    }
    onValueChange(text);
  };

  const handleFocus: TextInputProps["onFocus"] = (e) => {
    setFocused(true);
    onFocus?.(e);
  };

  const handleBlur: TextInputProps["onBlur"] = (e) => {
    setFocused(false);
    onFieldBlur?.();
    onBlur?.(e);
  };

  const isTextArea = Boolean(multiline);
  const hasError = Boolean(errorMessage);
  const hasVisibleError = Boolean(errorMessage && showError);
  const hasContent = rawValue.trim().length > 0;
  const hasSuccess =
    success !== undefined
      ? Boolean(success) && !hasError
      : Boolean(isValid) && hasContent && !hasError;
  const hasVisibleSuccessMessage = Boolean(successMessage && hasSuccess);

  const labelColorClass = hasVisibleError ? "text-error" : "text-text-body";

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
        className={`w-full border-[1.5px] px-3 relative ${wrapperStateClasses} ${isTextArea ? "flex-col items-start py-3" : "flex-row items-center"
          } ${disabled ? "opacity-60" : ""}`}
        style={{
          borderRadius: borderRadius ?? 14,
          height: isTextArea ? undefined : (height ?? 52),
        }}
      >
        {!isTextArea && leftIcon && (
          <View
            pointerEvents="none"
            className="absolute left-0 px-2 z-10 justify-center"
          >
            {leftIcon}
          </View>
        )}

        <TextInput
          ref={inputRef}
          collapsable={false}
          {...restTextInputProps}
          editable={!disabled}
          {...(isControlled ||
            keyboardType === "decimal-pad" ||
            !allowSpecialCharacters
            ? { value }
            : {})}
          {...(keyboardType ? { keyboardType } : {})}
          multiline={isTextArea}
          numberOfLines={isTextArea ? numberOfLines : 1}
          placeholderTextColor={bodyColor}
          cursorColor={bodyColor}
          placeholder={placeholder}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={isPassword ? hidePassword : false}
          className={`flex-1 font-inter-regular text-base text-text-black ${leftIcon ? "pl-8" : "pl-1"
            } ${isPassword ? "pr-11" : "pr-1"} ${inputClassName ?? ""}`}
          style={[
            {
              height: isTextArea ? numberOfLines * 24 : (height ?? 52),
              textAlignVertical: isTextArea ? "top" : "center",
            },
            inputStyle,
          ]}
        />

        {!isTextArea && isPassword && (
          <Pressable
            onPress={() => setHidePassword((prev) => !prev)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={
              hidePassword ? "Show password" : "Hide password"
            }
            className="absolute right-0 px-3 justify-center items-center"
          >
            <SymbolView
              name={
                hidePassword
                  ? { ios: "eye", android: "visibility", web: "visibility" }
                  : {
                    ios: "eye.slash",
                    android: "visibility_off",
                    web: "visibility_off",
                  }
              }
              size={22}
              tintColor={bodyColor}
            />
          </Pressable>
        )}
      </View>

      {(hasVisibleError || hasVisibleSuccessMessage || showCharCount) && (
        <View
          className={`flex-row items-center mt-1.5 ${hasVisibleError || hasVisibleSuccessMessage
              ? "justify-between"
              : "justify-end"
            }`}
        >
          {hasVisibleError ? (
            <Text className="flex-1 font-inter-regular text-xs text-error">
              {errorMessage}
            </Text>
          ) : hasVisibleSuccessMessage ? (
            <Text className="flex-1 font-inter-regular text-xs text-primary">
              {successMessage}
            </Text>
          ) : (
            <View className="flex-1" />
          )}

          {showCharCount && (
            <Text className="font-inter-regular text-xs text-text-body ml-2">
              {`${value.length}${restTextInputProps.maxLength ? `/${restTextInputProps.maxLength}` : ""}`}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

function ControlledCustomTextInput<
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
}: CustomTextInputProps<TFieldValues, TName> & {
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
            : (result.error.issues[0]?.message ?? "Invalid value");
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
    propError !== undefined ? Boolean(propError) : Boolean(isTouched || isSubmitted);
  const isSchemaValid = schema ? schema.safeParse(rawValue).success : true;
  const isValid =
    rawValue.trim().length > 0 &&
    !errorMessage &&
    !invalid &&
    isSchemaValid &&
    Boolean(isDirty || isTouched || isSubmitted);

  return (
    <BaseCustomTextInput
      {...rest}
      inputRef={field.ref}
      rawValue={rawValue}
      isControlled
      isValid={isValid}
      errorMessage={errorMessage}
      showError={showError}
      onValueChange={(text) => {
        field.onChange(text);
        onChangeText?.(text);
      }}
      onFieldBlur={field.onBlur}
    />
  );
}

function StandaloneCustomTextInput({
  schema,
  value: propValue,
  error: propError,
  onChangeText,
  ...rest
}: Omit<CustomTextInputProps, "name" | "control" | "rules">) {
  const [localValue, setLocalValue] = React.useState("");
  const [zodError, setZodError] = React.useState<string | undefined>(undefined);
  const [touched, setTouched] = React.useState(false);

  const isControlled = propValue !== undefined;
  const rawValue = isControlled ? String(propValue) : localValue;

  const validateWithZod = (val: string) => {
    if (!schema) return;
    const result = schema.safeParse(val);
    setZodError(
      result.success ? undefined : (result.error.issues[0]?.message ?? "Invalid value"),
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
    <BaseCustomTextInput
      {...rest}
      rawValue={rawValue}
      isControlled={isControlled}
      isValid={isValid}
      errorMessage={errorMessage}
      showError={showError}
      onValueChange={(text) => {
        if (!isControlled) {
          setLocalValue(text);
        }
        if (touched) {
          validateWithZod(text);
        }
        onChangeText?.(text);
      }}
      onFieldBlur={() => {
        setTouched(true);
        validateWithZod(rawValue);
      }}
    />
  );
}

export default function CustomTextInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(props: CustomTextInputProps<TFieldValues, TName>) {
  const formContext = useFormContext<TFieldValues>();
  const resolvedControl = props.control ?? formContext?.control;

  if (props.name && resolvedControl) {
    return (
      <ControlledCustomTextInput
        {...props}
        name={props.name}
        control={resolvedControl}
      />
    );
  }

  const { name: _name, control: _control, rules: _rules, ...standaloneProps } =
    props;

  return <StandaloneCustomTextInput {...standaloneProps} />;
}
