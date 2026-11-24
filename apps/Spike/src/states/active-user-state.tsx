import { User } from '@spike/database';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface ActiveUserState {
    user: User | null;
    setUser: (user: User) => void;
    clearUser: () => void;
    isInitialized: boolean;
    setIsInitialized: (isInitialized: boolean) => void;
}

const secureStorage = createJSONStorage(() => ({
    getItem: (name: string) => SecureStore.getItem(name),
    setItem: (name: string, value: string) => {
        try {
            SecureStore.setItem(name, value);
        } catch (err) {
            console.warn('Failed to persist active-user in SecureStore:', err);
        }
    },
    removeItem: (name: string) => SecureStore.deleteItemAsync(name),
}));

export const useActiveUserState = create<ActiveUserState>()(
    persist(
        (set) => ({
            user: null,
            setUser: (user) => set({ user }),
            clearUser: () => set({ user: null }),
            isInitialized: false,
            setIsInitialized: (isInitialized) => set({ isInitialized }),
        }),
        {
            name: 'active-user',
            storage: secureStorage,
        },
    ),
);
