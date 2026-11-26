// General Payload
export type RequestPayload<B = null, P = null, Q = null> = {
    body: B;
    params: P;
    query: Q;
};

// Login payload
export type LoginPayload = {
    email?: string;
    phone?: string;
};

export type VerifyOtpPayload = {
    code: string;
    identifier: string;
    deviceId: string;
    deviceName: string;
    deviceType: string;
};

export type ResendOtpPayload = {
    identifier: string;
    email?: string;
    phone?: string;
};

export type UpdateUserDetailsPayload = {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    pushToken?: string;
};

export type VerifyBvnPayload = {
    bvn: string;
};

export type CreatePinPayload = {
    pin: string;
};

export type RegisterPushTokenPayload = {
    pushToken: string;
};

export type CreateSpikeTagPayload = {
    tag: string;
};

export type SpikeTagResponse = {
    hasTag: boolean;
    tag: string | null;
    suggestedTag: string;
    tagRecord: {
        id: string;
        userId: string;
        tag: string;
        createdAt: string;
        updatedAt: string;
    } | null;
};
