import { URLS } from '@/constants/urls';
import {
    CreateSpikeTagPayload,
    RequestPayload,
    SpikeTagResponse,
} from '@/types/request-payload';
import { ServerResponse } from '@spike/shared';
import httpService from './httpService';

export class UserService {
    public async getMySpikeTag(): Promise<ServerResponse<SpikeTagResponse>> {
        const response = await httpService.get(URLS.user.spike_tag);
        return response.data as ServerResponse<SpikeTagResponse>;
    }

    public async checkSpikeTagAvailability(
        tag: string,
    ): Promise<ServerResponse<{ tag: string; available: boolean }>> {
        const response = await httpService.get(URLS.user.check_spike_tag, {
            params: { tag },
        });
        return response.data as ServerResponse<{ tag: string; available: boolean }>;
    }

    public async createSpikeTag(
        payload: RequestPayload<CreateSpikeTagPayload, null, null>,
    ): Promise<ServerResponse<SpikeTagResponse>> {
        const response = await httpService.post(URLS.user.spike_tag, payload.body);
        return response.data as ServerResponse<SpikeTagResponse>;
    }
}

export default new UserService();
