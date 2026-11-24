import { User } from '@spike/database'
export type VerifyOtpUserResponse = {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  tag: string | null;
  dateOfBirth: string | null;
  NIN: string | null;
  bvn: string | null;
  kycTier: string;
  userType: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isBvnVerified: boolean;
  isLoggedIn: boolean;
  isDeleted: boolean;
  pushToken: string | null;
  tokenVersion: number;
  pinFailedAttempts: number;
  pinLockoutCount: number;
  pinLockedUntil: string | null;
  lastPinFailedAt: string | null;
  pinRequiresRecovery: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  pockets: unknown[];
  virtualAccounts: unknown[];
};

export interface VerifyOtpReturnType {
  message: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  sessionId: string;
  user: User;
};
