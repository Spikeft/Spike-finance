import { STORAGE_KEY } from '@/constants/storage-keys';
import * as crypto from 'expo-crypto';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import { useState } from 'react';

export const useDeviceId = (): string => {
    const [id] = useState<string>(() => {
        const existingId = SecureStore.getItem(STORAGE_KEY.DEVICE_ID);
        if (existingId) {
            return existingId;
        }

        const newId = `${Device.deviceName ?? 'device'}-${crypto.randomUUID()}`;
        SecureStore.setItem(STORAGE_KEY.DEVICE_ID, newId);
        return newId;
    });

    return id;
};
