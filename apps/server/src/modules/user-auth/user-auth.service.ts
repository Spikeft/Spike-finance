import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { DeviceType, OtpMethod, UserSession } from '@spike/database';
import { PrismaService } from '../../common/services/prisma/prisma.service';
import { EmailService } from '../../common/services/email/email.service';
import { SentService } from '../../common/services/sent/sent.service';
import { LoginOrSignUpDto } from './dto/loginOrSignupDto';
import { ResendOtpDto } from './dto/resendOtpDto';
import { VerifyOtpDto } from './dto/verifyOtpDto';
import { RefreshTokenDto } from './dto/refreshTokenDto';
import { UpdateUserDetailsDto } from './dto/updateUserDetailsDto';
import { VerifyBvnDto } from './dto/verifyBvnDto';
import { CreatePinDto } from './dto/createPinDto';
import { VerifyPinDto } from './dto/verifyPinDto';
import { ChangePinDto } from './dto/changePinDto';
import { RequestPinRecoveryOtpDto } from './dto/requestPinRecoveryOtpDto';
import { RestorePinDto } from './dto/restorePinDto';
import { ResetPinDto } from './dto/resetPinDto';
import { RegisterPushTokenDto } from './dto/registerPushTokenDto';
import { RegisterDeviceDto } from './dto/registerDeviceDto';
import {
  BiometricKeyAlgorithm,
  RegisterBiometricDto,
} from './dto/registerBiometricDto';
import { BiometricChallengeDto } from './dto/biometricChallengeDto';
import { VerifyBiometricDto } from './dto/verifyBiometricDto';
import { JwtUserPayload } from '../../common/guards/auth.guard';
import { TransactionPinService } from '../../common/services/transaction-pin/transaction-pin.service';
import {
  PinAuditAction,
  PinVerificationContext,
} from '../../common/services/transaction-pin/transaction-pin.constants';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

@Injectable()
export class UserAuthService {
  private readonly logger = new Logger(UserAuthService.name);
  private fallbackPinService?: TransactionPinService;

  constructor(
    private readonly databaseService: PrismaService,
    private readonly emailService: EmailService,
    private readonly sentService: SentService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Optional() private readonly transactionPinService?: TransactionPinService,
  ) { }

  private get pinService(): TransactionPinService {
    if (this.transactionPinService) {
      return this.transactionPinService;
    }
    if (!this.fallbackPinService) {
      this.fallbackPinService = new TransactionPinService(
        this.databaseService,
        this.configService,
      );
    }
    return this.fallbackPinService;
  }

  /**
   * 1. Check if user exists by email/phone.
   * If not, create an account with default MAIN pocket.
   * Generate 6-digit OTP, store with 5-minute expiry, and dispatch via Resend (email) or Sent (SMS).
   */
  async loginOrSignup({
    payload,
    type,
  }: {
    payload: LoginOrSignUpDto;
    type?: 'email' | 'phone';
  }) {
    try {
      const isEmail =
        type === 'email' || (Boolean(payload.email) && !payload.phone);
      const isPhone = type === 'phone' || Boolean(payload.phone);

      if (isEmail && !payload.email) {
        throw new BadRequestException('Email address is required');
      }
      if (isPhone && !payload.phone) {
        throw new BadRequestException('Phone number is required');
      }
      if (!isEmail && !isPhone) {
        throw new BadRequestException(
          'Please provide either an email address or phone number',
        );
      }

      const method: OtpMethod = isEmail ? OtpMethod.EMAIL : OtpMethod.PHONE;
      const target = isEmail
        ? payload.email!.trim().toLowerCase()
        : payload.phone!.trim();

      this.logger.log(`Processing login/signup for ${method}: ${target}`);

      // Check if user exists
      let user = await this.databaseService.user.findFirst({
        where: isEmail ? { email: target } : { phone: target },
      });

      if (!user) {
        this.logger.log(`User not found for ${target}. Creating new account...`);
        user = await this.databaseService.user.create({
          data: {
            email: isEmail ? target : undefined,
            phone: !isEmail ? target : undefined,
          },
        });

        // Create primary wallet (MAIN pocket) for new user
        await this.databaseService.pocket.create({
          data: {
            userId: user.id,
            name: 'Main Balance',
            type: 'MAIN',
            currency: 'NGN',
          },
        });
        this.logger.log(`Created new user (${user.id}) with default MAIN pocket`);
      }

      const { expiresAt } = await this.createAndDispatchOtp(
        user.id,
        target,
        method,
      );

      return {
        message: `Verification code sent to your ${isEmail ? 'email address' : 'phone number'}`,
        target,
        method,
        expiresAt,
      };
    } catch (error) {
      this.logger.error('Error processing login/signup', error);
      throw error;
    }
  }

  /**
   * 2. Resend OTP verification code.
   * Finds existing user, invalidates prior unused OTPs, creates fresh 6-digit OTP,
   * and dispatches via Resend (email) or Sent (SMS/WhatsApp).
   */
  async resendOtp({
    payload,
    type,
  }: {
    payload: ResendOtpDto;
    type?: 'email' | 'phone';
  }) {
    let email = payload.email?.trim().toLowerCase();
    let phone = payload.phone?.trim();

    if (payload.identifier) {
      const rawIdentifier = payload.identifier.trim();
      if (rawIdentifier.includes('@')) {
        email = email || rawIdentifier.toLowerCase();
      } else {
        phone = phone || rawIdentifier;
      }
    }

    const isEmail = type === 'email' || (Boolean(email) && !phone);
    const isPhone = type === 'phone' || Boolean(phone);

    if (isEmail && !email) {
      throw new BadRequestException('Email address is required');
    }
    if (isPhone && !phone) {
      throw new BadRequestException('Phone number is required');
    }
    if (!isEmail && !isPhone) {
      throw new BadRequestException(
        'Please provide an email address, phone number, or identifier',
      );
    }

    const method: OtpMethod = isEmail ? OtpMethod.EMAIL : OtpMethod.PHONE;
    const target = isEmail ? email! : phone!;

    this.logger.log(`Resending OTP for ${method}: ${target}`);

    // Check if user exists
    const user = await this.databaseService.user.findFirst({
      where: isEmail ? { email: target } : { phone: target },
    });

    if (!user) {
      throw new NotFoundException(
        `User with this ${isEmail ? 'email address' : 'phone number'} does not exist`,
      );
    }

    const { expiresAt } = await this.createAndDispatchOtp(
      user.id,
      target,
      method,
    );

    return {
      message: `Verification code resent to your ${isEmail ? 'email address' : 'phone number'}`,
      target,
      method,
      expiresAt,
    };
  }

  /**
   * 2. Verify OTP code, mark it used, mark user verified, create session, and issue tokens.
   */
  async verifyOtp(
    dto: VerifyOtpDto,
    clientIp?: string,
    userAgent?: string,
  ) {
    const target = dto.identifier.toLocaleLowerCase().trim();
    const code = dto.code.trim();

    console.log({
      identifier: dto.identifier,
      code: dto.code,
    })

    const otpRecord = await this.databaseService.otp.findFirst({
      where: {
        target,
        code,
        isUsed: false,
      },
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    });

    if (!otpRecord) {
      throw new BadRequestException('Invalid verification code');
    }

    if (otpRecord.expiresAt < new Date()) {
      throw new BadRequestException(
        'Verification code has expired. Please request a new one.',
      );
    }

    // Mark OTP as used
    await this.databaseService.otp.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });

    // Update user status
    const isEmail = otpRecord.method === 'EMAIL';
    const updatedUser = await this.databaseService.user.update({
      where: { id: otpRecord.userId },
      data: {
        isEmailVerified: isEmail ? true : undefined,
        isPhoneVerified: !isEmail ? true : undefined,
        isLoggedIn: true,
        lastLoginAt: new Date(),
      },
      include: {
        pockets: true,
        virtualAccounts: true,
        tag: true,
      },
    });

    // Register or update device if deviceId was provided
    let userDeviceId: string | null = null;
    if (dto.deviceId) {
      const device = await this.databaseService.userDevice.upsert({
        where: {
          userId_deviceId: {
            userId: updatedUser.id,
            deviceId: dto.deviceId.trim(),
          },
        },
        create: {
          userId: updatedUser.id,
          deviceId: dto.deviceId.trim(),
          name: dto.deviceName?.trim() || null,
          deviceType: dto.deviceType as DeviceType,
          ip: clientIp || null,
        },
        update: {
          name: dto.deviceName?.trim() || undefined,
          deviceType: dto.deviceType as DeviceType,
          ip: clientIp || undefined,
          isDeleted: false,
          deletedAt: null,
        },
      });
      userDeviceId = device.id;
    }

    // Create a new UserSession record (7 days duration)
    const session = await this.databaseService.userSession.create({
      data: {
        userId: updatedUser.id,
        deviceId: dto.deviceId?.trim() || null,
        userDeviceId,
        userAgent: userAgent || null,
        ipAddress: clientIp || null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const tokens = await this.generateTokens(
      updatedUser.id,
      updatedUser.email,
      updatedUser.phone,
      session.id,
      updatedUser.tokenVersion,
      dto.deviceId?.trim() || null,
    );

    // Hash refresh token using SHA-256 for token rotation and reuse detection
    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(tokens.refreshToken)
      .digest('hex');

    await this.databaseService.userSession.update({
      where: { id: session.id },
      data: { refreshTokenHash },
    });

    this.logger.log(
      `User ${updatedUser.id} verified OTP and initiated session ${session.id}`,
    );

    return {
      message: 'Verification successful',
      user: this.sanitizeUser(updatedUser),
      sessionId: session.id,
      ...tokens,
    };
  }

  /**
   * 3. Get profile details for authenticated user.
   */
  async getMe(userId: string) {
    const user = await this.databaseService.user.findUnique({
      where: { id: userId },
      include: {
        pockets: true,
        tag: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    return this.sanitizeUser(user);
  }

  /**
   * 4. Refresh access token using a valid refresh token with token rotation and reuse detection.
   */
  async refreshToken(dto: RefreshTokenDto) {
    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        tokenType?: string;
        sessionId?: string;
        tokenVersion?: number;
      }>(dto.refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      });

      if (payload.tokenType !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const user = await this.databaseService.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.isDeleted) {
        throw new UnauthorizedException('User account no longer exists');
      }

      if (
        payload.tokenVersion !== undefined &&
        payload.tokenVersion !== user.tokenVersion
      ) {
        throw new UnauthorizedException(
          'Token has been invalidated. Please sign in again.',
        );
      }

      // Validate session if sessionId is embedded in the refresh token
      let session: UserSession | null = null;
      if (payload.sessionId) {
        session = await this.databaseService.userSession.findUnique({
          where: { id: payload.sessionId },
        });

        if (!session) {
          throw new UnauthorizedException(
            'Session not found or has been revoked',
          );
        }

        if (session.isRevoked) {
          throw new UnauthorizedException('Session has been revoked');
        }

        if (session.expiresAt < new Date()) {
          throw new UnauthorizedException(
            'Session has expired. Please sign in again.',
          );
        }

        // Validate refresh token hash for reuse detection
        const hashedIncomingToken = crypto
          .createHash('sha256')
          .update(dto.refreshToken)
          .digest('hex');

        if (
          session.refreshTokenHash &&
          session.refreshTokenHash !== hashedIncomingToken
        ) {
          // Token reuse detected! Revoke the compromised session immediately
          await this.databaseService.userSession.update({
            where: { id: session.id },
            data: {
              isRevoked: true,
              revokedAt: new Date(),
              revocationReason: 'TOKEN_REUSE_DETECTED',
            },
          });
          this.logger.warn(
            `Refresh token reuse detected for session ${session.id}! Session revoked.`,
          );
          throw new UnauthorizedException(
            'Refresh token reuse detected. Session has been revoked for security.',
          );
        }
      }

      const sessionId = session ? session.id : undefined;
      const tokens = await this.generateTokens(
        user.id,
        user.email,
        user.phone,
        sessionId,
        user.tokenVersion,
        session?.deviceId,
      );

      // Rotate refresh token on the active session
      if (session) {
        const newRefreshTokenHash = crypto
          .createHash('sha256')
          .update(tokens.refreshToken)
          .digest('hex');

        await this.databaseService.userSession.update({
          where: { id: session.id },
          data: {
            refreshTokenHash: newRefreshTokenHash,
            lastActiveAt: new Date(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });
      }

      return {
        message: 'Tokens refreshed successfully',
        ...tokens,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * 5. Update user personal details (names, DOB, push token).
   */
  async updateUserDetails(userId: string, dto: UpdateUserDetailsDto) {
    const user = await this.databaseService.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        dateOfBirth: dto.dateOfBirth,
        pushToken: dto.pushToken,
      },
      include: {
        pockets: true,
        tag: true,
      },
    });

    return {
      message: 'Profile updated successfully',
      user: this.sanitizeUser(user),
    };
  }

  /**
   * 6. Verify BVN, update user record, and provision dummy Moniepoint NUBAN account with SPIKE prefix.
   */
  async verifyBvnAndCreateNuban(userId: string, dto: VerifyBvnDto) {
    const bvn = dto.bvn.trim();
    if (!/^\d{11}$/.test(bvn)) {
      throw new BadRequestException('BVN must be an 11-digit number');
    }

    const user = await this.databaseService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update user BVN status
    const updatedUser = await this.databaseService.user.update({
      where: { id: userId },
      data: {
        bvn,
        kycTier: user.kycTier === 'TIER_0' ? 'TIER_1' : user.kycTier,
      },
      include: {
        pockets: true,
        tag: true,
      },
    });

    // Check if user already has an active NUBAN account
    let virtualAccount = await this.databaseService.virtualAccount.findFirst({
      where: { userId: user.id },
    });

    if (!virtualAccount) {
      // Generate dummy Moniepoint NUBAN (10 digits starting with 65)
      const randomSuffix = Math.floor(
        10000000 + Math.random() * 90000000,
      ).toString();
      const accountNumber = `65${randomSuffix}`;

      // SPIKE-${full name}
      const rawFullName =
        `${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`.trim();
      const identifier =
        rawFullName || updatedUser.email || updatedUser.phone || 'USER';
      const accountName = `SPIKE-${identifier.toUpperCase()}`;

      virtualAccount = await this.databaseService.virtualAccount.create({
        data: {
          userId: user.id,
          bankName: 'Moniepoint Microfinance Bank',
          bankCode: '50515',
          accountNumber,
          accountName,
          currency: 'NGN',
          status: 'ACTIVE',
        },
      });

      this.logger.log(
        `Generated Moniepoint dummy NUBAN (${accountNumber}) for user ${user.id} with name "${accountName}"`,
      );
    }

    return {
      message: 'BVN verified successfully and NUBAN account created',
      user: this.sanitizeUser(updatedUser),
      virtualAccount,
    };
  }

  /**
   * 7. Create 4-digit numeric transaction PIN (stored hashed).
   */
  async createPin(userId: string, dto: CreatePinDto, clientIp?: string) {
    const user = await this.databaseService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.transactionPin) {
      throw new BadRequestException(
        'Transaction PIN already exists. Use change PIN to update it.',
      );
    }

    const hashedPin = await bcrypt.hash(dto.pin, 10);

    await this.databaseService.user.update({
      where: { id: userId },
      data: {
        transactionPin: hashedPin,
        pinFailedAttempts: 0,
        pinLockedUntil: null,
        pinRequiresRecovery: false,
        lastPinFailedAt: null,
      },
    });

    await this.pinService.recordAuditEvent({
      userId,
      action: PinAuditAction.PIN_CREATED,
      ip: clientIp,
      metadata: {
        operation: 'CREATE_PIN',
      },
    });

    return {
      message: 'Transaction PIN created successfully',
      hasPin: true,
    };
  }

  /**
   * 8. Verify 4-digit numeric transaction PIN (tracks consecutive failures and enforces lockout).
   */
  async verifyPin(
    userId: string,
    dto: VerifyPinDto,
    context?: PinVerificationContext,
  ) {
    return this.pinService.verifyPin(userId, dto.pin, {
      action: 'VERIFY_PIN',
      ...context,
    });
  }

  /**
   * 9. Change 4-digit transaction PIN (requires old PIN match and enforces lockout tracking).
   */
  async changePin(
    userId: string,
    dto: ChangePinDto,
    context?: PinVerificationContext,
  ) {
    await this.pinService.verifyPin(userId, dto.oldPin, {
      action: 'CHANGE_PIN',
      ...context,
    });

    if (dto.oldPin === dto.newPin) {
      throw new BadRequestException(
        'New PIN must be different from current PIN',
      );
    }

    const hashedNewPin = await bcrypt.hash(dto.newPin, 10);

    await this.databaseService.user.update({
      where: { id: userId },
      data: {
        transactionPin: hashedNewPin,
        pinFailedAttempts: 0,
        pinLockedUntil: null,
        pinRequiresRecovery: false,
        lastPinFailedAt: null,
      },
    });

    await this.pinService.recordAuditEvent({
      userId,
      action: PinAuditAction.PIN_CHANGED,
      ip: context?.ip,
      metadata: {
        operation: 'CHANGE_PIN',
        deviceId: context?.deviceId,
        sessionId: context?.sessionId,
      },
    });

    return {
      message: 'Transaction PIN changed successfully',
    };
  }

  /**
   * 9b. Get current PIN status (lockout state, failed attempt counters, recovery requirement).
   */
  async getPinStatus(userId: string) {
    return this.pinService.getPinStatus(userId);
  }

  /**
   * 9c. Request a 6-digit recovery OTP to restore locked PIN authorization or reset PIN.
   */
  async requestPinRecoveryOtp(
    userId: string,
    dto: RequestPinRecoveryOtpDto,
    clientIp?: string,
  ) {
    const user = await this.databaseService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const preferredChannel = dto.channel;
    let method: OtpMethod;
    let target: string | null = null;

    if (preferredChannel === 'email') {
      if (!user.email) {
        throw new BadRequestException(
          'No email address is registered on your account',
        );
      }
      method = OtpMethod.EMAIL;
      target = user.email;
    } else if (preferredChannel === 'phone') {
      if (!user.phone) {
        throw new BadRequestException(
          'No phone number is registered on your account',
        );
      }
      method = OtpMethod.PHONE;
      target = user.phone;
    } else if (user.email) {
      method = OtpMethod.EMAIL;
      target = user.email;
    } else if (user.phone) {
      method = OtpMethod.PHONE;
      target = user.phone;
    } else {
      throw new BadRequestException(
        'No verified email or phone number is available to deliver recovery OTP',
      );
    }

    const { expiresAt } = await this.createAndDispatchOtp(
      user.id,
      target,
      method,
    );

    const maskedTarget = this.maskContactTarget(target, method);

    await this.pinService.recordAuditEvent({
      userId,
      action: PinAuditAction.PIN_RECOVERY_OTP_REQUESTED,
      ip: clientIp,
      metadata: {
        operation: 'PIN_RECOVERY_OTP_REQUEST',
        method,
        maskedTarget,
      },
    });

    return {
      message: `PIN recovery verification code sent to your ${method === OtpMethod.EMAIL ? 'email address' : 'phone number'}`,
      method,
      target: maskedTarget,
      expiresAt,
    };
  }

  /**
   * 9d. Restore locked PIN authorization (and optionally reset PIN) after OTP and/or KYC verification.
   * For repeated lockouts (>= 2) when BVN is on file, both OTP and KYC (BVN) verification are required.
   */
  async restorePinAuthorization(
    userId: string,
    dto: RestorePinDto,
    clientIp?: string,
  ) {
    const user = await this.databaseService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const hasOtpInput = Boolean(dto.otpCode?.trim());
    const hasBvnInput = Boolean(dto.bvn?.trim());

    if (!hasOtpInput && !hasBvnInput) {
      throw new BadRequestException(
        'OTP code and/or KYC (BVN) verification is required to restore PIN authorization',
      );
    }

    const requiresBothFactors =
      (user.pinLockoutCount ?? 0) >= 2 && Boolean(user.bvn);

    if (requiresBothFactors && (!hasOtpInput || !hasBvnInput)) {
      throw new BadRequestException(
        'Repeated PIN lockouts detected. Both OTP and KYC (BVN) verification are required to restore PIN authorization.',
      );
    }

    const verificationMethods: Array<'OTP' | 'KYC'> = [];
    let matchedOtpId: string | null = null;

    if (hasOtpInput) {
      const otpCode = dto.otpCode!.trim();
      const otpRecord = await this.databaseService.otp.findFirst({
        where: {
          userId,
          code: otpCode,
          isUsed: false,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!otpRecord || otpRecord.expiresAt < new Date()) {
        await this.pinService.recordAuditEvent({
          userId,
          action: PinAuditAction.PIN_SUSPICIOUS_ACTIVITY,
          ip: clientIp,
          metadata: {
            reason: 'FAILED_RECOVERY_VERIFICATION',
            factor: 'OTP',
            expired: Boolean(otpRecord && otpRecord.expiresAt < new Date()),
          },
        });
        throw new BadRequestException(
          otpRecord
            ? 'Verification code has expired. Please request a new recovery OTP.'
            : 'Invalid verification code',
        );
      }

      matchedOtpId = otpRecord.id;
      verificationMethods.push('OTP');
    }

    if (hasBvnInput) {
      if (!user.bvn) {
        throw new BadRequestException(
          'KYC (BVN) is not registered on this account. Please verify using OTP instead.',
        );
      }

      const providedBvn = dto.bvn!.trim();
      const storedBvn = user.bvn.trim();
      const isBvnMatch = this.timingSafeEqualString(providedBvn, storedBvn);

      if (!isBvnMatch) {
        await this.pinService.recordAuditEvent({
          userId,
          action: PinAuditAction.PIN_SUSPICIOUS_ACTIVITY,
          ip: clientIp,
          metadata: {
            reason: 'FAILED_RECOVERY_VERIFICATION',
            factor: 'KYC_BVN',
          },
        });
        throw new BadRequestException('KYC (BVN) verification failed');
      }

      if (dto.dateOfBirth && user.dateOfBirth) {
        const isDobMatch = this.timingSafeEqualString(
          dto.dateOfBirth.trim(),
          user.dateOfBirth.trim(),
        );
        if (!isDobMatch) {
          await this.pinService.recordAuditEvent({
            userId,
            action: PinAuditAction.PIN_SUSPICIOUS_ACTIVITY,
            ip: clientIp,
            metadata: {
              reason: 'FAILED_RECOVERY_VERIFICATION',
              factor: 'KYC_DOB',
            },
          });
          throw new BadRequestException(
            'KYC (date of birth) verification failed',
          );
        }
      }

      verificationMethods.push('KYC');
    }

    if (matchedOtpId) {
      await this.databaseService.otp.update({
        where: { id: matchedOtpId },
        data: { isUsed: true },
      });
    }

    const wasLocked = Boolean(
      user.pinRequiresRecovery ||
      (user.pinLockedUntil && user.pinLockedUntil > new Date()),
    );

    const updateData: {
      pinFailedAttempts: number;
      pinLockedUntil: null;
      pinRequiresRecovery: boolean;
      lastPinFailedAt: null;
      transactionPin?: string;
    } = {
      pinFailedAttempts: 0,
      pinLockedUntil: null,
      pinRequiresRecovery: false,
      lastPinFailedAt: null,
    };

    const isPinReset = Boolean(dto.newPin);
    if (dto.newPin) {
      updateData.transactionPin = await bcrypt.hash(dto.newPin, 10);
    }

    await this.databaseService.user.update({
      where: { id: userId },
      data: updateData,
    });

    await this.pinService.recordAuditEvent({
      userId,
      action: PinAuditAction.PIN_RESTORED,
      ip: clientIp,
      metadata: {
        operation: 'RESTORE_PIN_AUTHORIZATION',
        verificationMethods,
        wasLocked,
        pinReset: isPinReset,
        previousLockoutCount: user.pinLockoutCount ?? 0,
      },
    });

    if (isPinReset) {
      await this.pinService.recordAuditEvent({
        userId,
        action: PinAuditAction.PIN_RESET,
        ip: clientIp,
        metadata: {
          operation: 'RESET_PIN',
          verificationMethods,
          wasLocked,
        },
      });
    }

    return {
      message: isPinReset
        ? 'Transaction PIN reset and authorization restored successfully'
        : 'Transaction PIN authorization restored successfully',
      restored: true,
      pinReset: isPinReset,
      verificationMethods,
    };
  }

  /**
   * 9e. Reset 4-digit transaction PIN after OTP and/or KYC verification.
   */
  async resetPin(userId: string, dto: ResetPinDto, clientIp?: string) {
    return this.restorePinAuthorization(
      userId,
      {
        otpCode: dto.otpCode,
        bvn: dto.bvn,
        dateOfBirth: dto.dateOfBirth,
        newPin: dto.newPin,
      },
      clientIp,
    );
  }

  private timingSafeEqualString(a: string, b: string): boolean {
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    if (bufA.length !== bufB.length) {
      return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
  }

  private maskContactTarget(target: string, method: OtpMethod): string {
    if (method === OtpMethod.EMAIL) {
      const [local, domain] = target.split('@');
      if (!domain) return '***';
      const visible = local.slice(0, 2);
      return `${visible}***@${domain}`;
    }
    if (target.length <= 4) return '****';
    return `${'*'.repeat(Math.max(2, target.length - 4))}${target.slice(-4)}`;
  }

  /**
   * 10. Register or update user push notification token.
   */
  async registerPushToken(userId: string, dto: RegisterPushTokenDto) {
    const user = await this.databaseService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.databaseService.user.update({
      where: { id: userId },
      data: { pushToken: dto.pushToken.trim() },
    });

    this.logger.log(`Push token registered for user ${userId}`);

    return {
      message: 'Push token registered successfully',
      pushToken: updatedUser.pushToken,
    };
  }

  /**
   * 11. Register or update user's current device (deviceType, ip, location) and link to session.
   */
  async registerDevice(
    userId: string,
    dto: RegisterDeviceDto,
    clientIp?: string,
    sessionId?: string,
  ) {
    const user = await this.databaseService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const resolvedIp = dto.ip?.trim() || clientIp || null;

    const device = await this.databaseService.userDevice.upsert({
      where: {
        userId_deviceId: {
          userId,
          deviceId: dto.deviceId.trim(),
        },
      },
      create: {
        userId,
        deviceId: dto.deviceId.trim(),
        name: dto.name?.trim(),
        deviceType: dto.deviceType,
        ip: resolvedIp,
        location: dto.location?.trim(),
      },
      update: {
        name: dto.name?.trim(),
        deviceType: dto.deviceType,
        ip: resolvedIp,
        location: dto.location?.trim(),
        isDeleted: false,
        deletedAt: null,
      },
    });

    // Link device to current active session if sessionId is provided
    if (sessionId) {
      await this.databaseService.userSession.updateMany({
        where: { id: sessionId, userId },
        data: {
          deviceId: device.deviceId,
          userDeviceId: device.id,
          location: dto.location?.trim() || undefined,
        },
      });
    }

    this.logger.log(
      `Device ${dto.deviceId} (${dto.deviceType}) registered for user ${userId} from IP ${resolvedIp || 'unknown'}`,
    );

    return {
      message: 'Device registered successfully',
      device,
    };
  }

  /**
   * 12. Get all active sessions for authenticated user.
   */
  async getSessions(userId: string, currentSessionId?: string) {
    const sessions = await this.databaseService.userSession.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      include: {
        device: true,
      },
      orderBy: { lastActiveAt: 'desc' },
    });

    return {
      sessions: sessions.map((s) => ({
        id: s.id,
        deviceId: s.deviceId,
        device: s.device
          ? {
            id: s.device.id,
            deviceId: s.device.deviceId,
            name: s.device.name,
            deviceType: s.device.deviceType,
            isPrimaryDevice: s.device.isPrimaryDevice,
          }
          : null,
        ipAddress: s.ipAddress,
        userAgent: s.userAgent,
        location: s.location,
        isCurrent: Boolean(currentSessionId && s.id === currentSessionId),
        lastActiveAt: s.lastActiveAt,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
      })),
    };
  }

  /**
   * 13. Revoke a specific session by ID (e.g., remote logout from an individual browser/device).
   */
  async revokeSession(userId: string, sessionId: string) {
    const session = await this.databaseService.userSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.isRevoked) {
      return { message: 'Session is already revoked' };
    }

    await this.databaseService.userSession.update({
      where: { id: sessionId },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
        revocationReason: 'USER_REVOKED',
      },
    });

    // If no active sessions remain, mark user as logged out
    const activeCount = await this.databaseService.userSession.count({
      where: { userId, isRevoked: false, expiresAt: { gt: new Date() } },
    });
    if (activeCount === 0) {
      await this.databaseService.user.update({
        where: { id: userId },
        data: { isLoggedIn: false },
      });
    }

    this.logger.log(`Session ${sessionId} revoked by user ${userId}`);

    return { message: 'Session revoked successfully' };
  }

  /**
   * 14. Logout of the current active session.
   */
  async logout(userId: string, sessionId?: string) {
    if (sessionId) {
      await this.databaseService.userSession.updateMany({
        where: { id: sessionId, userId, isRevoked: false },
        data: {
          isRevoked: true,
          revokedAt: new Date(),
          revocationReason: 'USER_LOGOUT',
        },
      });
    }

    const activeCount = await this.databaseService.userSession.count({
      where: { userId, isRevoked: false, expiresAt: { gt: new Date() } },
    });
    if (activeCount === 0) {
      await this.databaseService.user.update({
        where: { id: userId },
        data: { isLoggedIn: false },
      });
    }

    this.logger.log(`User ${userId} logged out of session ${sessionId || 'unknown'}`);

    return { message: 'Logged out successfully' };
  }

  /**
   * 15. Logout of all devices and revoke all active tokens immediately.
   */
  async logoutAll(userId: string) {
    // Revoke all active sessions in database
    await this.databaseService.userSession.updateMany({
      where: { userId, isRevoked: false },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
        revocationReason: 'ALL_SESSIONS_REVOKED',
      },
    });

    // Increment tokenVersion so all previously signed JWT access & refresh tokens are instantly rejected
    await this.databaseService.user.update({
      where: { id: userId },
      data: {
        tokenVersion: { increment: 1 },
        isLoggedIn: false,
      },
    });

    this.logger.log(`User ${userId} logged out of all devices. Token version incremented.`);

    return {
      message: 'Logged out of all devices and revoked all active sessions',
    };
  }

  /**
   * 16. Get all registered devices for authenticated user.
   */
  async getDevices(userId: string) {
    const devices = await this.databaseService.userDevice.findMany({
      where: { userId, isDeleted: false },
      include: {
        sessions: {
          where: { isRevoked: false, expiresAt: { gt: new Date() } },
          select: { id: true, lastActiveAt: true },
        },
      },
      orderBy: [{ isPrimaryDevice: 'desc' }, { updatedAt: 'desc' }],
    });

    return {
      devices: devices.map((d) => ({
        id: d.id,
        deviceId: d.deviceId,
        name: d.name,
        deviceType: d.deviceType,
        ip: d.ip,
        location: d.location,
        isPrimaryDevice: d.isPrimaryDevice,
        biometricEnabled: d.biometricEnabled,
        biometricKeyAlgorithm: d.biometricKeyAlgorithm,
        biometricEnrolledAt: d.biometricEnrolledAt,
        activeSessionsCount: d.sessions.length,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      })),
    };
  }

  /**
   * 17. Set a specific device as the user's primary trusted device.
   */
  async setPrimaryDevice(userId: string, deviceId: string) {
    const device = await this.databaseService.userDevice.findFirst({
      where: { userId, deviceId, isDeleted: false },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    // Unset primary flag on other devices
    await this.databaseService.userDevice.updateMany({
      where: { userId, isPrimaryDevice: true },
      data: { isPrimaryDevice: false },
    });

    // Set primary flag on chosen device
    const updated = await this.databaseService.userDevice.update({
      where: { id: device.id },
      data: { isPrimaryDevice: true },
    });

    this.logger.log(`Device ${deviceId} set as primary device for user ${userId}`);

    return {
      message: 'Primary device updated successfully',
      device: updated,
    };
  }

  /**
   * 18. Remove/unlink a device and revoke all active sessions tied to it.
   */
  async removeDevice(userId: string, deviceId: string) {
    const device = await this.databaseService.userDevice.findFirst({
      where: { userId, deviceId, isDeleted: false },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    // Soft delete device and clear biometric credentials
    await this.databaseService.userDevice.update({
      where: { id: device.id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        isPrimaryDevice: false,
        biometricEnabled: false,
        biometricPublicKey: null,
        biometricKeyAlgorithm: null,
        biometricEnrolledAt: null,
      },
    });

    // Invalidate any pending biometric challenges for this device
    await this.databaseService.biometricChallenge?.updateMany({
      where: {
        userId,
        deviceId,
        isUsed: false,
      },
      data: {
        isUsed: true,
        usedAt: new Date(),
      },
    });

    // Revoke all active sessions on this device
    await this.databaseService.userSession.updateMany({
      where: {
        userId,
        OR: [{ deviceId }, { userDeviceId: device.id }],
        isRevoked: false,
      },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
        revocationReason: 'DEVICE_REMOVED',
      },
    });

    this.logger.log(`Device ${deviceId} removed and active sessions revoked for user ${userId}`);

    return {
      message: 'Device removed and its active sessions revoked successfully',
    };
  }

  /**
   * 19. Register or rotate an asymmetric biometric public key for the authenticated user's device.
   */
  async registerBiometricKey(
    userId: string,
    dto: RegisterBiometricDto,
    clientIp?: string,
    sessionId?: string,
  ) {
    const user = await this.databaseService.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.isDeleted) {
      throw new NotFoundException('User not found');
    }

    const deviceId = dto.deviceId.trim();
    const { publicKeyPem, keyAlgorithm } =
      this.parseAndValidateBiometricPublicKey(dto.publicKey, dto.keyAlgorithm);

    const enrolledAt = new Date();
    const device = await this.databaseService.userDevice.upsert({
      where: {
        userId_deviceId: {
          userId,
          deviceId,
        },
      },
      create: {
        userId,
        deviceId,
        name: dto.deviceName?.trim() || null,
        deviceType: dto.deviceType || 'IOS',
        ip: clientIp || null,
        location: dto.location?.trim() || null,
        biometricPublicKey: publicKeyPem,
        biometricEnabled: true,
        biometricKeyAlgorithm: keyAlgorithm,
        biometricEnrolledAt: enrolledAt,
      },
      update: {
        name: dto.deviceName?.trim() || undefined,
        deviceType: dto.deviceType || undefined,
        ip: clientIp || undefined,
        location: dto.location?.trim() || undefined,
        biometricPublicKey: publicKeyPem,
        biometricEnabled: true,
        biometricKeyAlgorithm: keyAlgorithm,
        biometricEnrolledAt: enrolledAt,
        isDeleted: false,
        deletedAt: null,
      },
    });

    // Invalidate any previously issued unused challenges for this device
    await this.databaseService.biometricChallenge.updateMany({
      where: {
        userId,
        deviceId,
        isUsed: false,
      },
      data: {
        isUsed: true,
        usedAt: enrolledAt,
      },
    });

    if (sessionId) {
      await this.databaseService.userSession.updateMany({
        where: { id: sessionId, userId },
        data: {
          deviceId: device.deviceId,
          userDeviceId: device.id,
        },
      });
    }

    this.logger.log(
      `Biometric public key (${keyAlgorithm}) registered for user ${userId} on device ${deviceId}`,
    );

    return {
      message: 'Biometric login enabled for device successfully',
      device: {
        id: device.id,
        deviceId: device.deviceId,
        name: device.name,
        deviceType: device.deviceType,
        biometricEnabled: device.biometricEnabled,
        biometricKeyAlgorithm: device.biometricKeyAlgorithm,
        biometricEnrolledAt: device.biometricEnrolledAt,
      },
    };
  }

  /**
   * 20. Disable biometric login for a device and clear its stored public key.
   */
  async disableBiometric(userId: string, deviceId: string) {
    const trimmedDeviceId = deviceId.trim();
    const device = await this.databaseService.userDevice.findFirst({
      where: {
        userId,
        deviceId: trimmedDeviceId,
        isDeleted: false,
      },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    const now = new Date();
    await this.databaseService.userDevice.update({
      where: { id: device.id },
      data: {
        biometricEnabled: false,
        biometricPublicKey: null,
        biometricKeyAlgorithm: null,
        biometricEnrolledAt: null,
      },
    });

    await this.databaseService.biometricChallenge.updateMany({
      where: {
        userId,
        deviceId: trimmedDeviceId,
        isUsed: false,
      },
      data: {
        isUsed: true,
        usedAt: now,
      },
    });

    this.logger.log(
      `Biometric login disabled for user ${userId} on device ${trimmedDeviceId}`,
    );

    return {
      message: 'Biometric login disabled for device successfully',
    };
  }

  /**
   * 21. Issue a short-lived one-time cryptographic challenge (nonce) for biometric login.
   */
  async createBiometricChallenge(dto: BiometricChallengeDto) {
    const deviceId = dto.deviceId.trim();
    let resolvedUserId = dto.userId?.trim();

    if (!resolvedUserId && dto.identifier) {
      const rawIdentifier = dto.identifier.trim();
      const isEmail = rawIdentifier.includes('@');
      const user = await this.databaseService.user.findFirst({
        where: isEmail
          ? { email: rawIdentifier.toLowerCase(), isDeleted: false }
          : { phone: rawIdentifier, isDeleted: false },
        select: { id: true },
      });

      if (!user) {
        throw new UnauthorizedException(
          'Biometric login is not enabled for this device',
        );
      }
      resolvedUserId = user.id;
    }

    const devices = await this.databaseService.userDevice.findMany({
      where: {
        deviceId,
        ...(resolvedUserId ? { userId: resolvedUserId } : {}),
        isDeleted: false,
        biometricEnabled: true,
        biometricPublicKey: { not: null },
        user: { isDeleted: false },
      },
      take: 2,
    });

    if (devices.length === 0) {
      throw new UnauthorizedException(
        'Biometric login is not enabled for this device',
      );
    }

    if (devices.length > 1) {
      throw new BadRequestException(
        'Multiple accounts have biometrics enabled on this device. Please provide identifier or userId.',
      );
    }

    const device = devices[0];
    const now = new Date();

    // Invalidate any prior unused challenges for this user + device
    await this.databaseService.biometricChallenge.updateMany({
      where: {
        userId: device.userId,
        deviceId: device.deviceId,
        isUsed: false,
      },
      data: {
        isUsed: true,
        usedAt: now,
      },
    });

    const challenge = crypto.randomBytes(32).toString('base64url');
    const expiresAt = new Date(now.getTime() + 2 * 60 * 1000); // 2 minutes TTL

    const challengeRecord = await this.databaseService.biometricChallenge.create(
      {
        data: {
          userId: device.userId,
          userDeviceId: device.id,
          deviceId: device.deviceId,
          challenge,
          expiresAt,
        },
      },
    );

    this.logger.log(
      `Issued biometric challenge ${challengeRecord.id} for device ${device.deviceId}`,
    );

    return {
      challengeId: challengeRecord.id,
      challenge: challengeRecord.challenge,
      expiresAt: challengeRecord.expiresAt,
    };
  }

  /**
   * 22. Verify signed biometric challenge against stored device public key, create session, and issue JWTs.
   */
  async verifyBiometricLogin(
    dto: VerifyBiometricDto,
    clientIp?: string,
    userAgent?: string,
  ) {
    const deviceId = dto.deviceId.trim();
    const challengeId = dto.challengeId.trim();

    const challengeRecord =
      await this.databaseService.biometricChallenge.findUnique({
        where: { id: challengeId },
        include: {
          device: true,
          user: {
            include: {
              pockets: true,
              virtualAccounts: true,
              tag: true,
            },
          },
        },
      });

    if (
      !challengeRecord ||
      challengeRecord.deviceId !== deviceId ||
      challengeRecord.isUsed
    ) {
      throw new UnauthorizedException('Invalid or already used biometric challenge');
    }

    if (challengeRecord.expiresAt < new Date()) {
      await this.databaseService.biometricChallenge.updateMany({
        where: { id: challengeRecord.id, isUsed: false },
        data: { isUsed: true, usedAt: new Date() },
      });
      throw new UnauthorizedException(
        'Biometric challenge has expired. Please try again.',
      );
    }

    const { user, device } = challengeRecord;

    if (!user || user.isDeleted) {
      throw new UnauthorizedException('User account no longer exists');
    }

    if (dto.userId && user.id !== dto.userId.trim()) {
      throw new UnauthorizedException('Biometric challenge does not match user');
    }

    if (dto.identifier) {
      const normalized = dto.identifier.trim().toLowerCase();
      const matchesEmail = user.email?.toLowerCase() === normalized;
      const matchesPhone = user.phone === dto.identifier.trim();
      if (!matchesEmail && !matchesPhone) {
        throw new UnauthorizedException(
          'Biometric challenge does not match user',
        );
      }
    }

    if (
      !device ||
      device.isDeleted ||
      !device.biometricEnabled ||
      !device.biometricPublicKey
    ) {
      throw new UnauthorizedException(
        'Biometric login is not enabled for this device',
      );
    }

    const isSignatureValid = this.verifyBiometricSignature(
      device.biometricPublicKey,
      challengeRecord.challenge,
      dto.signature,
    );

    if (!isSignatureValid) {
      this.logger.warn(
        `Invalid biometric signature attempt for user ${user.id} on device ${deviceId}`,
      );
      throw new UnauthorizedException('Invalid biometric signature');
    }

    // Atomically consume the one-time challenge to prevent replay attacks
    const consumeResult =
      await this.databaseService.biometricChallenge.updateMany({
        where: {
          id: challengeRecord.id,
          isUsed: false,
        },
        data: {
          isUsed: true,
          usedAt: new Date(),
        },
      });

    if (consumeResult.count !== 1) {
      throw new UnauthorizedException('Biometric challenge has already been used');
    }

    const updatedUser = await this.databaseService.user.update({
      where: { id: user.id },
      data: {
        isLoggedIn: true,
        lastLoginAt: new Date(),
      },
      include: {
        pockets: true,
        virtualAccounts: true,
        tag: true,
      },
    });

    if (clientIp) {
      await this.databaseService.userDevice.update({
        where: { id: device.id },
        data: { ip: clientIp },
      });
    }

    const session = await this.databaseService.userSession.create({
      data: {
        userId: updatedUser.id,
        deviceId: device.deviceId,
        userDeviceId: device.id,
        userAgent: userAgent || null,
        ipAddress: clientIp || null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const tokens = await this.generateTokens(
      updatedUser.id,
      updatedUser.email,
      updatedUser.phone,
      session.id,
      updatedUser.tokenVersion,
      device.deviceId,
    );

    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(tokens.refreshToken)
      .digest('hex');

    await this.databaseService.userSession.update({
      where: { id: session.id },
      data: { refreshTokenHash },
    });

    this.logger.log(
      `User ${updatedUser.id} authenticated via biometrics on device ${device.deviceId} (session ${session.id})`,
    );

    return {
      message: 'Biometric authentication successful',
      user: this.sanitizeUser(updatedUser),
      sessionId: session.id,
      ...tokens,
    };
  }

  /**
   * Normalize and validate a device-submitted SPKI public key (PEM or raw base64 DER).
   */
  private parseAndValidateBiometricPublicKey(
    rawPublicKey: string,
    requestedAlgorithm?: BiometricKeyAlgorithm,
  ): { publicKeyPem: string; keyAlgorithm: BiometricKeyAlgorithm } {
    const trimmed = rawPublicKey.trim();
    if (!trimmed) {
      throw new BadRequestException('Public key is required');
    }

    let keyObject: crypto.KeyObject;
    try {
      if (trimmed.includes('-----BEGIN')) {
        keyObject = crypto.createPublicKey(trimmed);
      } else {
        const cleanedBase64 = trimmed.replace(/\s+/g, '');
        const derBuffer = Buffer.from(cleanedBase64, 'base64');
        keyObject = crypto.createPublicKey({
          key: derBuffer,
          format: 'der',
          type: 'spki',
        });
      }
    } catch {
      throw new BadRequestException(
        'Invalid public key format. Expected PEM or base64-encoded SPKI public key.',
      );
    }

    const keyType = keyObject.asymmetricKeyType;
    let detectedAlgorithm: BiometricKeyAlgorithm;

    if (keyType === 'ec') {
      const curve = keyObject.asymmetricKeyDetails?.namedCurve;
      if (
        curve &&
        !['prime256v1', 'secp384r1', 'secp521r1'].includes(curve)
      ) {
        throw new BadRequestException(
          `Unsupported elliptic curve "${curve}". Expected P-256, P-384, or P-521.`,
        );
      }
      detectedAlgorithm = 'ES256';
    } else if (keyType === 'rsa') {
      const modulusLength = keyObject.asymmetricKeyDetails?.modulusLength ?? 0;
      if (modulusLength < 2048) {
        throw new BadRequestException(
          'RSA public key must be at least 2048 bits.',
        );
      }
      detectedAlgorithm = 'RS256';
    } else if (keyType === 'ed25519') {
      detectedAlgorithm = 'EdDSA';
    } else {
      throw new BadRequestException(
        `Unsupported public key type "${keyType || 'unknown'}". Expected EC (P-256), RSA (>=2048-bit), or Ed25519.`,
      );
    }

    if (requestedAlgorithm && requestedAlgorithm !== detectedAlgorithm) {
      throw new BadRequestException(
        `Key algorithm mismatch: key is ${detectedAlgorithm}, but ${requestedAlgorithm} was specified.`,
      );
    }

    const publicKeyPem = keyObject
      .export({ type: 'spki', format: 'pem' })
      .toString();

    return {
      publicKeyPem,
      keyAlgorithm: detectedAlgorithm,
    };
  }

  /**
   * Verify a base64 / base64url encoded signature over the challenge string against a stored SPKI PEM key.
   */
  private verifyBiometricSignature(
    publicKeyPem: string,
    challenge: string,
    signatureInput: string,
  ): boolean {
    try {
      const normalizedSig = signatureInput
        .trim()
        .replace(/-/g, '+')
        .replace(/_/g, '/');
      const paddedSig =
        normalizedSig + '='.repeat((4 - (normalizedSig.length % 4)) % 4);
      const signatureBuffer = Buffer.from(paddedSig, 'base64');

      if (signatureBuffer.length === 0) {
        return false;
      }

      const keyObject = crypto.createPublicKey(publicKeyPem);
      const dataBuffer = Buffer.from(challenge, 'utf8');

      if (keyObject.asymmetricKeyType === 'ed25519') {
        return crypto.verify(null, dataBuffer, keyObject, signatureBuffer);
      }

      if (keyObject.asymmetricKeyType === 'ec') {
        if (crypto.verify('sha256', dataBuffer, keyObject, signatureBuffer)) {
          return true;
        }
        // Fallback for IEEE P1363 raw (r || s) ECDSA signatures used by some WebCrypto / mobile libraries
        return crypto.verify(
          'sha256',
          dataBuffer,
          { key: keyObject, dsaEncoding: 'ieee-p1363' },
          signatureBuffer,
        );
      }

      return crypto.verify('sha256', dataBuffer, keyObject, signatureBuffer);
    } catch {
      return false;
    }
  }

  /**
   * Helper to generate a 6-digit OTP, invalidate previous active OTPs, save to DB with 5m expiry, and dispatch.
   */
  private async createAndDispatchOtp(
    userId: string,
    target: string,
    method: OtpMethod,
  ): Promise<{ code: string; expiresAt: Date }> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

    // Invalidate any existing unused OTPs for this target
    await this.databaseService.otp.updateMany({
      where: { target, isUsed: false },
      data: { isUsed: true },
    });

    // Save OTP to database
    await this.databaseService.otp.create({
      data: {
        userId,
        code,
        method,
        target,
        expiresAt,
      },
    });

    // Dispatch OTP
    if (method === OtpMethod.EMAIL) {
      await this.emailService.sendOtpEmail(target, code);
      this.logger.log(`OTP dispatched via Resend to ${target}`);
    } else {
      await this.sentService.sendMessage({
        channel: ['sms', 'whatsapp'],
        to: [target],
        text: `This is your Spike finance OTP code ${code}. DO NOT SHARE THIS WITH ANYONE`,
      });
      this.logger.log(`OTP dispatched via Sent SMS/WhatsApp to ${target}`);
    }

    return { code, expiresAt };
  }

  /**
   * Helper to sign access token (1h) and refresh token (7d) embedding session and token version.
   */
  private async generateTokens(
    userId: string,
    email?: string | null,
    phone?: string | null,
    sessionId?: string,
    tokenVersion = 0,
    deviceId?: string | null,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    sessionId?: string;
  }> {
    const accessPayload: JwtUserPayload = {
      sub: userId,
      email: email || undefined,
      phone: phone || undefined,
      tokenType: 'access',
      sessionId,
      deviceId: deviceId || undefined,
      tokenVersion,
    };

    const refreshPayload = {
      sub: userId,
      tokenType: 'refresh',
      sessionId,
      tokenVersion,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, { expiresIn: '1h' }),
      this.jwtService.signAsync(refreshPayload, { expiresIn: '7d' }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600,
      sessionId,
    };
  }

  /**
   * Helper to remove password and transaction PIN from responses.
   */
  private sanitizeUser<T extends Record<string, unknown>>(
    user: T,
  ): Omit<T, 'password' | 'transactionPin'> {
    const sanitized = { ...user };
    delete (sanitized as { password?: unknown }).password;
    delete (sanitized as { transactionPin?: unknown }).transactionPin;
    return sanitized;
  }
}
