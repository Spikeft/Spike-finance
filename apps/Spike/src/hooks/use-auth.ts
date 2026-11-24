import AuthService from '@/services/auth-service';
import {
    CreatePinPayload,
    LoginPayload,
    RegisterPushTokenPayload,
    RequestPayload,
    ResendOtpPayload,
    UpdateUserDetailsPayload,
    VerifyBvnPayload,
    VerifyOtpPayload,
} from '@/types/request-payload';
import { useMutation } from '@tanstack/react-query';

export const useLogin = () => {
    const { mutateAsync: login, isPending, error, data } = useMutation({
        mutationFn: (payload: RequestPayload<LoginPayload, null, { type: string }>) => {
            return AuthService.login(payload);
        },
    });

    return { login, isPending, error, data };
};

export const useVerifyOtp = () => {
    const { mutateAsync: verifyOtp, isPending, error, data } = useMutation({
        mutationFn: (payload: RequestPayload<VerifyOtpPayload, null, null>) => {
            return AuthService.verifyOtp(payload);
        },
    });

    return { verifyOtp, isPending, error, data };
};

export const useResendOtp = () => {
    const { mutateAsync: resendOtp, isPending, error, data } = useMutation({
        mutationFn: (payload: RequestPayload<ResendOtpPayload, null, null>) => {
            return AuthService.resentOtp(payload);
        },
    });

    return { resendOtp, isPending, error, data };
};

export const useUpdateUserDetails = () => {
    const { mutateAsync: updateUserDetails, isPending, error, data } = useMutation({
        mutationFn: (payload: RequestPayload<UpdateUserDetailsPayload, null, null>) => {
            return AuthService.updateUserDetails(payload);
        },
    });

    return { updateUserDetails, isPending, error, data };
};

export const useVerifyBvn = () => {
    const { mutateAsync: verifyBvn, isPending, error, data } = useMutation({
        mutationFn: (payload: RequestPayload<VerifyBvnPayload, null, null>) => {
            return AuthService.verifyBvn(payload);
        },
    });

    return { verifyBvn, isPending, error, data };
};

export const useCreatePin = () => {
    const { mutateAsync: createPin, isPending, error, data } = useMutation({
        mutationFn: (payload: RequestPayload<CreatePinPayload, null, null>) => {
            return AuthService.createPin(payload);
        },
    });

    return { createPin, isPending, error, data };
};

export const useRegisterPushToken = () => {
    const { mutateAsync: registerPushToken, isPending, error, data } = useMutation({
        mutationFn: (payload: RequestPayload<RegisterPushTokenPayload, null, null>) => {
            return AuthService.registerPushToken(payload);
        },
    });

    return { registerPushToken, isPending, error, data };
};
