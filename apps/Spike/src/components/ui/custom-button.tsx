import React, { ReactNode } from 'react';
import {
    TouchableOpacity,
    Text,
    ActivityIndicator,
    View,
    ViewStyle,
    TextStyle,
    TouchableOpacityProps,
    DimensionValue,
} from 'react-native';

interface IProps {
    type?: 'button' | 'submit';
    text: string | ReactNode;
    backgroundColor?: string | string[];
    color?: string | string[];
    borderRadius?: number;
    width?: DimensionValue;
    fontSize?: number;
    borderTopRadius?: number;
    borderWidth?: number;
    borderBottomLeftRadius?: number;
    borderBottomRightRadius?: number;
    height?: DimensionValue;
    shadow?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'none';
    isLoading?: boolean;
    borderColor?: string
    variant?: 'solid' | 'outline' | 'ghost' | 'link';
    icon?: ReactNode;
    disable?: boolean;
    onClick?: () => void;
}

// Shadow mapping for React Native
const shadowStyles: Record<string, ViewStyle> = {
    xs: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    xl: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.25,
        shadowRadius: 32,
        elevation: 16,
    },
    '2xl': {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 24 },
        shadowOpacity: 0.3,
        shadowRadius: 48,
        elevation: 24,
    },
    none: {
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
    },
};

// Variant styles
const variantStyles = (
    variant: string,
    backgroundColor: string,
    color: string
): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
        case 'outline':
            return {
                container: {
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    borderColor: backgroundColor || '#5D70F9',
                },
                text: {
                    color: backgroundColor || '#5D70F9',
                },
            };
        case 'ghost':
            return {
                container: {
                    backgroundColor: 'transparent',
                },
                text: {
                    color: backgroundColor || '#5D70F9',
                },
            };
        case 'link':
            return {
                container: {
                    backgroundColor: 'transparent',
                },
                text: {
                    color: backgroundColor || '#5D70F9',
                    textDecorationLine: 'underline',
                },
            };
        default: // solid
            return {
                container: {
                    backgroundColor: backgroundColor || '#5D70F9',
                },
                text: {
                    color: color || 'white',
                },
            };
    }
};

function CustomButton({
    type = 'button',
    text,
    backgroundColor = '#5D70F9',
    color = 'white',
    borderRadius = 12,
    borderTopRadius,
    borderBottomLeftRadius,
    borderBottomRightRadius,
    width,
    height = 50,
    shadow = 'none',
    fontSize = 16,
    isLoading = false,
    icon = undefined,
    borderWidth = 0,
    borderColor,
    variant = 'solid',
    disable = false,
    onClick,
    ...rest
}: IProps & TouchableOpacityProps) {
    // Determine which radius to use
    const topRadius = borderTopRadius ?? borderRadius;
    const bottomLeftRadius = borderBottomLeftRadius ?? borderRadius;
    const bottomRightRadius = borderBottomRightRadius ?? borderRadius;

    // Get variant styles
    const variantStyle = variantStyles(variant, backgroundColor as string, color as string);

    // Get shadow styles
    const shadowStyle = shadowStyles[shadow] || shadowStyles.none;

    const isDisabled = disable || Boolean((rest as any).disabled);

    // Calculate container styles
    const containerStyle: ViewStyle = {
        width: width ?? "100%",
        height: height ?? 45,
        borderRadius: topRadius,
        borderBottomLeftRadius: bottomLeftRadius,
        borderBottomRightRadius: bottomRightRadius,
        justifyContent: 'center',
        borderColor: borderColor ?? "transparent",
        alignItems: 'center',
        flexDirection: 'row',
        borderWidth: borderWidth,
        opacity: (isLoading || isDisabled) ? 0.6 : 1,
        ...variantStyle.container,
        ...shadowStyle,
    };

    // Text styles
    const textStyle: TextStyle = {
        fontSize,
        fontWeight: '600',
        ...variantStyle.text,
    };

    const handlePress = (e?: any) => {
        if (!isLoading && !isDisabled) {
            if (onClick) {
                onClick();
            } else if ((rest as any).onPress) {
                (rest as any).onPress(e);
            }
        }
    };

    return (
        <TouchableOpacity
            {...rest}
            onPress={handlePress}
            activeOpacity={0.7}
            disabled={isLoading || isDisabled}
            style={[containerStyle, rest.style]}
        >
            {isLoading ? (
                <ActivityIndicator size="small" />
            ) : (
                <>
                    {icon && (
                        <>
                            {icon}
                            <View style={{ width: 20 }} />
                        </>
                    )}
                    {typeof text === 'string' ? (
                        <Text style={textStyle}>{text}</Text>
                    ) : (
                        text
                    )}
                </>
            )}
        </TouchableOpacity>
    );
}

export default CustomButton;