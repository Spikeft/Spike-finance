import { ApiProperty } from '@nestjs/swagger';
import type { VerifyOtpReturnType, VerifyOtpUserResponse } from '@spike/shared';

export class VerifyOtpUserDto implements VerifyOtpUserResponse {
  @ApiProperty()
  id: string;

  @ApiProperty({ nullable: true, type: String })
  email: string | null;

  @ApiProperty({ nullable: true, type: String })
  phone: string | null;

  @ApiProperty({ nullable: true, type: String })
  firstName: string | null;

  @ApiProperty({ nullable: true, type: String })
  lastName: string | null;

  @ApiProperty({ nullable: true, type: String })
  tag: string | null;

  @ApiProperty({ nullable: true, type: String })
  dateOfBirth: string | null;

  @ApiProperty({ nullable: true, type: String })
  NIN: string | null;

  @ApiProperty({ nullable: true, type: String })
  bvn: string | null;

  @ApiProperty()
  kycTier: string;

  @ApiProperty()
  userType: string;

  @ApiProperty()
  isEmailVerified: boolean;

  @ApiProperty()
  isPhoneVerified: boolean;

  @ApiProperty()
  isBvnVerified: boolean;

  @ApiProperty()
  isLoggedIn: boolean;

  @ApiProperty()
  isDeleted: boolean;

  @ApiProperty({ nullable: true, type: String })
  pushToken: string | null;

  @ApiProperty()
  tokenVersion: number;

  @ApiProperty()
  pinFailedAttempts: number;

  @ApiProperty()
  pinLockoutCount: number;

  @ApiProperty({ nullable: true, type: String })
  pinLockedUntil: string | null;

  @ApiProperty({ nullable: true, type: String })
  lastPinFailedAt: string | null;

  @ApiProperty()
  pinRequiresRecovery: boolean;

  @ApiProperty({ nullable: true, type: String })
  lastLoginAt: string | null;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  @ApiProperty({ nullable: true, type: String })
  deletedAt: string | null;

  @ApiProperty({ type: [Object] })
  pockets: unknown[];

  @ApiProperty({ type: [Object] })
  virtualAccounts: unknown[];
}

export class VerifyOtpResponseDto implements VerifyOtpReturnType {
  @ApiProperty()
  message: string;

  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  expiresIn: number;

  @ApiProperty()
  sessionId: string;

  @ApiProperty({ type: () => VerifyOtpUserDto })
  user: VerifyOtpUserDto;
}
