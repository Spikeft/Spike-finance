import UserService from '@/services/user-service';
import { CreateSpikeTagPayload, RequestPayload } from '@/types/request-payload';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const SPIKE_TAG_QUERY_KEY = ['user', 'spike-tag'] as const;

export const useMySpikeTag = () => {
    return useQuery({
        queryKey: SPIKE_TAG_QUERY_KEY,
        queryFn: () => UserService.getMySpikeTag(),
    });
};

export const useCreateSpikeTag = () => {
    const queryClient = useQueryClient();

    const { mutateAsync: createSpikeTag, isPending, error, data } = useMutation({
        mutationFn: (payload: RequestPayload<CreateSpikeTagPayload, null, null>) => {
            return UserService.createSpikeTag(payload);
        },
        onSuccess: (response) => {
            queryClient.setQueryData(SPIKE_TAG_QUERY_KEY, response);
            void queryClient.invalidateQueries({ queryKey: SPIKE_TAG_QUERY_KEY });
        },
    });

    return {
        createSpikeTag,
        isPending,
        error,
        data,
    };
};
