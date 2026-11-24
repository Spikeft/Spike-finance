import { URLS } from "@/constants/urls";
import {
    CreatePinPayload,
    LoginPayload,
    RegisterPushTokenPayload,
    RequestPayload,
    ResendOtpPayload,
    UpdateUserDetailsPayload,
    VerifyBvnPayload,
    VerifyOtpPayload,
} from "@/types/request-payload";
import { ServerResponse, VerifyOtpReturnType } from "@spike/shared";
import httpService from "./httpService";

export class AuthService {
    public async login(payload: RequestPayload<LoginPayload, null, { type: string }>): Promise<ServerResponse<any>> {
        const body = payload.body;
        if (!body?.email && !body.phone) {
            throw new Error('You need to input either your email or phone number to continue');
        }

        const response = await httpService.post(
            URLS.auth.login_or_sign,
            payload.body,
            {
                params: payload.query ?? payload.params,
            },
        );

        return response.data as ServerResponse<any>;
    }

    public async verifyOtp(payload: RequestPayload<VerifyOtpPayload, null, null>): Promise<ServerResponse<VerifyOtpReturnType>> {
        const response = await httpService.post(URLS.auth.verify_otp, payload.body);
        return response.data as ServerResponse<VerifyOtpReturnType>;
    }

    public async resentOtp(payload: RequestPayload<ResendOtpPayload, null, null>): Promise<ServerResponse<any>> {
        const response = await httpService.post(URLS.auth.resend_otp, payload.body);
        return response.data as ServerResponse<any>;
    }

    public async getMe(): Promise<ServerResponse<any>> {
        const response = await httpService.get(URLS.auth.details);
        return response.data as ServerResponse<any>;
    }

    public async updateUserDetails(
        payload: RequestPayload<UpdateUserDetailsPayload, null, null>,
    ): Promise<ServerResponse<any>> {
        const response = await httpService.patch(URLS.auth.update_details, payload.body);
        return response.data as ServerResponse<any>;
    }

    public async verifyBvn(
        payload: RequestPayload<VerifyBvnPayload, null, null>,
    ): Promise<ServerResponse<any>> {
        const response = await httpService.post(URLS.auth.verify_bvn, payload.body);
        return response.data as ServerResponse<any>;
    }

    public async createPin(
        payload: RequestPayload<CreatePinPayload, null, null>,
    ): Promise<ServerResponse<any>> {
        const response = await httpService.post(URLS.auth.create_pin, payload.body);
        return response.data as ServerResponse<any>;
    }

    public async registerPushToken(
        payload: RequestPayload<RegisterPushTokenPayload, null, null>,
    ): Promise<ServerResponse<any>> {
        const response = await httpService.post(URLS.auth.register_push_token, payload.body);
        return response.data as ServerResponse<any>;
    }
}

export default new AuthService();
