import { create } from 'zustand';

interface State {
    email?: string;
    phone?: string;
    type: 'email' | 'phone';
    identifier: string;
    setDetails: (data: Partial<State>) => void;
}

export const useLoginState = create<State>((set) => ({
    email: undefined,
    phone: undefined,
    type: 'email',
    identifier: '',
    setDetails: (data) => set((state) => ({ ...state, ...data })),
}));