import { create } from 'zustand';

export interface OnboardingFormData {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    contactEmail: string;
    streetAddress: string;
    houseNo: string;
    city: string;
    state: string;
    lga: string;
    bvn: string;
}

interface OnboardingState extends OnboardingFormData {
    updateFields: (data: Partial<OnboardingFormData>) => void;
    reset: () => void;
}

const initialState: OnboardingFormData = {
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    contactEmail: '',
    streetAddress: '',
    houseNo: '',
    city: '',
    state: '',
    lga: '',
    bvn: '',
};

export const useOnboardingState = create<OnboardingState>((set) => ({
    ...initialState,
    updateFields: (data) => set((state) => ({ ...state, ...data })),
    reset: () => set(initialState),
}));
