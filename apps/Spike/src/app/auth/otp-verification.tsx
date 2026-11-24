import CustomOtpInput, {
    CustomOtpInputRef,
} from "@/components/ui/custom-otp-input";
import SubmitButton from "@/components/ui/submit-button";
import { useResendOtp, useVerifyOtp } from "@/hooks/use-auth";
import { useDeviceId } from "@/hooks/use-device-id";
import { useLoginState } from "@/states/login-state";
import { ResendOtpPayload, VerifyOtpPayload } from "@/types/request-payload";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    Text,
    View,
} from "react-native";
import * as Device from 'expo-device'
import { toast } from 'react-native-toastify-expo';
import { ServerResponse, VerifyOtpReturnType } from "@spike/shared";
import { useActiveUserState } from "@/states/active-user-state";
import { User } from "@spike/database";
import * as SecureStore from 'expo-secure-store'
import { STORAGE_KEY } from "@/constants/storage-keys";


const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 30;

function formatMaskedDestination(raw?: string): string {
    if (!raw) return "•••• 4582";
    if (raw.includes("@")) return raw;
    const digits = raw.replace(/\D/g, "");
    if (digits.length >= 4) {
        return `•••• ${digits.slice(-4)}`;
    }
    return raw;
}

const OtpVerification = () => {
    // const { destination } = useLocalSearchParams<{ destination?: string }>();
    const otpRef = useRef<CustomOtpInputRef>(null);

    const [otp, setOtp] = useState("");
    const [error, setError] = useState<string | undefined>(undefined);
    const [isVerifying, setIsVerifying] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const { identifier, type } = useLoginState((state) => state);
    const { setUser, setIsInitialized } = useActiveUserState((state) => state);
    const deviceId = useDeviceId();

    // API Call
    const { verifyOtp, isPending, error: apiError, data } = useVerifyOtp();
    const { resendOtp, isPending: resendPending, error: resendError, data: resendData } = useResendOtp()

    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setInterval(() => {
            setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, [resendCooldown]);

    const handleOtpChange = (code: string) => {
        setOtp(code);
        if (error) {
            setError(undefined);
        }
    };

    const handleVerify = async (codeToVerify: string = otp) => {
        if (isPending) return;

        if (codeToVerify.length < OTP_LENGTH) {
            setError("Please enter the 6-digit verification code.");
            otpRef.current?.shake();
            return;
        }

        setError(undefined);

        let response: ServerResponse<VerifyOtpReturnType>;
        try {
            const payload: VerifyOtpPayload = {
                code: codeToVerify,
                identifier: identifier,
                deviceId: deviceId as string,
                deviceName: Device.modelName as string,
                deviceType: Platform.OS === "ios" ? "IOS" : "Android",
            };
            response = await verifyOtp({ body: payload, params: null, query: null });
        } catch (err) {
            console.error("Verify OTP API error:", err);
            const msg = "Invalid verification code. Please try again.";
            setError(msg);
            otpRef.current?.setError(msg);
            return;
        }

        const authData = response?.data;
        console.log("Verify OTP Response", authData);

        if (authData?.user) {
            setUser(authData.user as unknown as User);
        }

        // store token and session in secure storage
        if (authData?.accessToken) {
            SecureStore.setItem(STORAGE_KEY.TOKEN, authData.accessToken);
        }
        if (authData?.refreshToken) {
            SecureStore.setItem(STORAGE_KEY.REFRESH_TOKEN, authData.refreshToken);
        }
        if (authData?.sessionId) {
            SecureStore.setItem(STORAGE_KEY.SESSION_ID, authData.sessionId);
        }

        // do the onboarding check
        const user = authData?.user;
        if (!user?.firstName && !user?.lastName && !user?.bvn && !user?.NIN) {
            router.push('/auth/onboarding');
        } else {
            router.push('/dashboard/home/explore');
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0) return;
        setError(undefined);
        otpRef.current?.clear();
        otpRef.current?.clearError();
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
        const payload: ResendOtpPayload = {
            identifier: identifier,
            email: type === "email" ? identifier : undefined,
            phone: type === "phone" ? identifier : undefined,
        }

        const response = await resendOtp({
            body: payload,
            params: null,
            query: null
        });
        console.log("Resend OTP Response", response.data);
        toast.success(`OTP has been sent to your ${type}`);

    };

    const maskedDestination = formatMaskedDestination(identifier);

    return (
        <KeyboardAvoidingView
            className="flex-1 pt-20"
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <View className="flex-1 justify-between px-6 pt-8 pb-6 h-50">
                {/* Top content */}
                <View>
                    <Text className="font-figtree-medium text-black text-32 leading-9 tracking-[-0.5px]">
                        Verify it&apos;s you
                    </Text>

                    <Text className="font-inter-regular text-text-body text-sm mt-2">
                        Enter the code sent to {maskedDestination}.
                    </Text>

                    <CustomOtpInput
                        ref={otpRef}
                        length={OTP_LENGTH}
                        value={otp}
                        onChange={handleOtpChange}
                        onComplete={(code) => handleVerify(code)}
                        error={error}
                        containerClassName="mt-6"
                    />

                    <View className="flex-row items-center mt-4">
                        <Text className="font-inter-regular text-sm text-text-body">
                            Didn&apos;t receive a code?{" "}
                        </Text>
                        <Pressable
                            onPress={handleResend}
                            disabled={resendCooldown > 0}
                            hitSlop={8}
                        >
                            <Text
                                className={`font-figtree-medium text-sm text-primary ${resendCooldown > 0 ? "opacity-50" : ""
                                    }`}
                            >
                                {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : "Resend"}
                            </Text>
                        </Pressable>
                    </View>

                    <SubmitButton
                        label="Verify OTP"
                        isLoading={isPending}
                        onPress={() => handleVerify()}
                        borderRadius={100}
                        height={52}
                        className="mt-5"
                    />
                </View>

                {/* Bottom secondary action */}
                <Pressable
                    onPress={() => router.back()}
                    accessibilityRole="button"
                    className="w-full h-13 rounded-full bg-input-background items-center justify-center active:opacity-80"
                >
                    <Text className="font-figtree-medium text-base text-text-black">
                        I have another number
                    </Text>
                </Pressable>
            </View>
        </KeyboardAvoidingView>
    );
};

export default OtpVerification;
