import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserAuthService } from './user-auth.service';
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
import { RegisterBiometricDto } from './dto/registerBiometricDto';
import { BiometricChallengeDto } from './dto/biometricChallengeDto';
import { VerifyBiometricDto } from './dto/verifyBiometricDto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { VerifyOtpResponseDto } from './dto/verifyOtpResponseDto';

@ApiTags('Auth & KYC')
@Controller('user-auth')
export class UserAuthController {
  constructor(private readonly userAuthService: UserAuthService) { }

  @Post('login-or-signup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login or register user and send 6-digit verification OTP',
    description:
      'Checks if user exists by email or phone. If not, creates account with default MAIN pocket and dispatches a 5-minute OTP via Resend (email) or Sent (SMS).',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['email', 'phone'],
    description: 'Preferred verification delivery channel',
  })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  loginOrSignup(
    @Body() payload: LoginOrSignUpDto,
    @Query('type') type?: 'email' | 'phone',
  ) {
    return this.userAuthService.loginOrSignup({ payload, type });
  }

  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend OTP verification code',
    description:
      'Invalidates previous unused OTPs and sends a fresh 6-digit OTP code to the provided email or phone number.',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['email', 'phone'],
    description: 'Preferred verification delivery channel',
  })
  @ApiResponse({ status: 200, description: 'OTP resent successfully' })
  resendOtp(
    @Body() payload: ResendOtpDto,
    @Query('type') type?: 'email' | 'phone',
  ) {
    return this.userAuthService.resendOtp({ payload, type });
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify OTP code and authenticate',
    description:
      'Validates 6-digit OTP code, marks identifier as verified, creates an active session, and returns user details with access and refresh tokens.',
  })
  @ApiResponse({
    status: 200,
    description: 'Authentication successful. Returns user and JWT tokens.',
    type: VerifyOtpResponseDto,
  })
  verifyOtp(@Body() dto: VerifyOtpDto, @Req() req?: Request) {
    const rawIp =
      (req?.headers?.['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req?.ip ||
      req?.socket?.remoteAddress;
    const userAgent = req?.headers?.['user-agent'] as string;
    return this.userAuthService.verifyOtp(dto, rawIp, userAgent);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current authenticated user profile',
  })
  @ApiResponse({
    status: 200,
    description: 'Current user profile with pockets, virtual accounts, and tag',
  })
  getMe(@CurrentUser('sub') userId: string) {
    return this.userAuthService.getMe(userId);
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access and refresh tokens',
  })
  @ApiResponse({
    status: 200,
    description: 'New access and refresh tokens generated',
  })
  refreshToken(@Body() dto: RefreshTokenDto) {
    return this.userAuthService.refreshToken(dto);
  }

  @Patch('update-details')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Update personal profile details (names, date of birth, push token)',
  })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  updateUserDetails(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateUserDetailsDto,
  ) {
    return this.userAuthService.updateUserDetails(userId, dto);
  }

  @Post('verify-bvn')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Submit and verify BVN, then generate Moniepoint NUBAN virtual account',
    description:
      'Stores BVN, marks user as BVN-verified, and generates a dedicated Moniepoint NUBAN virtual account formatted as SPIKE-${FULL_NAME}.',
  })
  @ApiResponse({
    status: 200,
    description: 'BVN verified and Moniepoint NUBAN virtual account generated',
  })
  verifyBvnAndCreateNuban(
    @CurrentUser('sub') userId: string,
    @Body() dto: VerifyBvnDto,
  ) {
    return this.userAuthService.verifyBvnAndCreateNuban(userId, dto);
  }

  @Post('create-pin')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create 4-digit numeric transaction PIN',
    description:
      'Creates and securely hashes a 4-digit transaction PIN for the authenticated user.',
  })
  @ApiResponse({ status: 200, description: 'PIN created successfully' })
  createPin(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreatePinDto,
    @Req() req?: Request,
  ) {
    const rawIp = this.extractClientIp(req);
    return this.userAuthService.createPin(userId, dto, rawIp);
  }

  @Post('verify-pin')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify 4-digit transaction PIN',
    description:
      'Validates the provided 4-digit transaction PIN against the stored hash, tracking consecutive failures and enforcing temporary lockout.',
  })
  @ApiResponse({ status: 200, description: 'PIN verified successfully' })
  verifyPin(
    @CurrentUser('sub') userId: string,
    @Body() dto: VerifyPinDto,
    @Req() req?: Request,
    @CurrentUser('sessionId') sessionId?: string,
    @CurrentUser('deviceId') deviceId?: string,
  ) {
    return this.userAuthService.verifyPin(userId, dto, {
      action: 'VERIFY_PIN',
      endpoint: req ? `${req.method} ${req.originalUrl || req.url}` : undefined,
      ip: this.extractClientIp(req),
      userAgent: req?.headers?.['user-agent'] as string | undefined,
      sessionId,
      deviceId,
    });
  }

  @Post('change-pin')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change 4-digit transaction PIN',
    description:
      'Verifies the old 4-digit PIN (with consecutive failure tracking and lockout) and updates it with a new hashed 4-digit PIN.',
  })
  @ApiResponse({ status: 200, description: 'PIN changed successfully' })
  changePin(
    @CurrentUser('sub') userId: string,
    @Body() dto: ChangePinDto,
    @Req() req?: Request,
    @CurrentUser('sessionId') sessionId?: string,
    @CurrentUser('deviceId') deviceId?: string,
  ) {
    return this.userAuthService.changePin(userId, dto, {
      action: 'CHANGE_PIN',
      endpoint: req ? `${req.method} ${req.originalUrl || req.url}` : undefined,
      ip: this.extractClientIp(req),
      userAgent: req?.headers?.['user-agent'] as string | undefined,
      sessionId,
      deviceId,
    });
  }

  @Get('pin/status')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get transaction PIN security status',
    description:
      'Returns whether the user has a PIN, lockout status, remaining attempts, and whether OTP/KYC recovery is required.',
  })
  @ApiResponse({ status: 200, description: 'PIN security status returned' })
  getPinStatus(@CurrentUser('sub') userId: string) {
    return this.userAuthService.getPinStatus(userId);
  }

  @Post('pin/recovery/request-otp')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request OTP for locked PIN restoration or PIN reset',
    description:
      'Dispatches a 6-digit recovery OTP to the user email or phone number to restore locked PIN authorization or reset PIN.',
  })
  @ApiResponse({ status: 200, description: 'Recovery OTP dispatched' })
  requestPinRecoveryOtp(
    @CurrentUser('sub') userId: string,
    @Body() dto: RequestPinRecoveryOtpDto,
    @Req() req?: Request,
  ) {
    return this.userAuthService.requestPinRecoveryOtp(
      userId,
      dto,
      this.extractClientIp(req),
    );
  }

  @Post('pin/restore')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Restore locked PIN authorization via OTP and/or KYC verification',
    description:
      'Requires valid OTP and/or KYC (BVN) verification before unlocking a temporarily locked transaction PIN. Optionally accepts a new PIN.',
  })
  @ApiResponse({
    status: 200,
    description: 'PIN authorization restored successfully',
  })
  restorePinAuthorization(
    @CurrentUser('sub') userId: string,
    @Body() dto: RestorePinDto,
    @Req() req?: Request,
  ) {
    return this.userAuthService.restorePinAuthorization(
      userId,
      dto,
      this.extractClientIp(req),
    );
  }

  @Post('pin/reset')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset transaction PIN via OTP and/or KYC verification',
    description:
      'Verifies OTP and/or KYC (BVN), sets a new 4-digit transaction PIN, and clears any active PIN lockout state.',
  })
  @ApiResponse({
    status: 200,
    description: 'Transaction PIN reset and authorization restored',
  })
  resetPin(
    @CurrentUser('sub') userId: string,
    @Body() dto: ResetPinDto,
    @Req() req?: Request,
  ) {
    return this.userAuthService.resetPin(
      userId,
      dto,
      this.extractClientIp(req),
    );
  }

  @Post('push-token')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Register user push notification token',
    description:
      'Registers or updates FCM / APNs push token for the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Push token registered successfully',
  })
  registerPushToken(
    @CurrentUser('sub') userId: string,
    @Body() dto: RegisterPushTokenDto,
  ) {
    return this.userAuthService.registerPushToken(userId, dto);
  }

  @Post('device')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Register user current device',
    description:
      'Registers or updates the authenticated user device with deviceType, IP address, and location, linking it to the active session.',
  })
  @ApiResponse({ status: 200, description: 'Device registered successfully' })
  registerDevice(
    @CurrentUser('sub') userId: string,
    @Body() dto: RegisterDeviceDto,
    @Req() req?: Request,
    @CurrentUser('sessionId') sessionId?: string,
  ) {
    const rawIp =
      (req?.headers?.['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req?.ip ||
      req?.socket?.remoteAddress;
    if (sessionId) {
      return this.userAuthService.registerDevice(userId, dto, rawIp, sessionId);
    }
    return this.userAuthService.registerDevice(userId, dto, rawIp);
  }

  @Get('sessions')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all active sessions for current user',
    description:
      'Lists all active sessions across web and mobile devices with IP, device metadata, location, and indicates which one is the current session.',
  })
  @ApiResponse({ status: 200, description: 'Active user sessions list' })
  getSessions(
    @CurrentUser('sub') userId: string,
    @CurrentUser('sessionId') currentSessionId: string,
  ) {
    return this.userAuthService.getSessions(userId, currentSessionId);
  }

  @Delete('sessions/:sessionId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Revoke a specific session',
    description:
      'Revokes a specific session remotely by ID, immediately invalidating access and refresh tokens for that session.',
  })
  @ApiResponse({ status: 200, description: 'Session revoked successfully' })
  revokeSession(
    @CurrentUser('sub') userId: string,
    @Param('sessionId') sessionId: string,
  ) {
    return this.userAuthService.revokeSession(userId, sessionId);
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout of current session',
    description:
      'Revokes the current active session and invalidates the session token.',
  })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  logout(
    @CurrentUser('sub') userId: string,
    @CurrentUser('sessionId') sessionId: string,
  ) {
    return this.userAuthService.logout(userId, sessionId);
  }

  @Post('logout-all')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout of all devices and sessions',
    description:
      'Revokes all active sessions for the user and increments tokenVersion to immediately invalidate all existing tokens.',
  })
  @ApiResponse({
    status: 200,
    description: 'All sessions revoked and logged out successfully',
  })
  logoutAll(@CurrentUser('sub') userId: string) {
    return this.userAuthService.logoutAll(userId);
  }

  @Get('devices')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all registered user devices',
    description:
      'Lists all linked devices with primary device status, IP, location, and active session counts.',
  })
  @ApiResponse({ status: 200, description: 'User devices list' })
  getDevices(@CurrentUser('sub') userId: string) {
    return this.userAuthService.getDevices(userId);
  }

  @Patch('devices/:deviceId/primary')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Set device as primary device',
    description:
      'Designates the specified device as the primary trusted device for the user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Primary device updated successfully',
  })
  setPrimaryDevice(
    @CurrentUser('sub') userId: string,
    @Param('deviceId') deviceId: string,
  ) {
    return this.userAuthService.setPrimaryDevice(userId, deviceId);
  }

  @Delete('devices/:deviceId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove device and revoke all its sessions',
    description:
      'Unlinks the device from the user account and revokes all active sessions running on that device.',
  })
  @ApiResponse({
    status: 200,
    description: 'Device removed and its active sessions revoked',
  })
  removeDevice(
    @CurrentUser('sub') userId: string,
    @Param('deviceId') deviceId: string,
  ) {
    return this.userAuthService.removeDevice(userId, deviceId);
  }

  @Post('biometric/register')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Register asymmetric biometric public key for device',
    description:
      'Enrolls or rotates a hardware-backed asymmetric public key (ECDSA P-256, RSA >=2048, or Ed25519) for Face ID / Touch ID / Android Biometrics login on the specified device.',
  })
  @ApiResponse({
    status: 200,
    description: 'Biometric public key registered successfully',
  })
  registerBiometricKey(
    @CurrentUser('sub') userId: string,
    @CurrentUser('sessionId') sessionId: string,
    @Body() dto: RegisterBiometricDto,
    @Req() req: Request,
  ) {
    const rawIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      req.socket?.remoteAddress;
    return this.userAuthService.registerBiometricKey(
      userId,
      dto,
      rawIp,
      sessionId,
    );
  }

  @Delete('biometric/:deviceId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Disable biometric login for device',
    description:
      'Disables biometric login for the given device, removes its stored public key, and invalidates any pending challenges.',
  })
  @ApiResponse({
    status: 200,
    description: 'Biometric login disabled successfully',
  })
  disableBiometric(
    @CurrentUser('sub') userId: string,
    @Param('deviceId') deviceId: string,
  ) {
    return this.userAuthService.disableBiometric(userId, deviceId);
  }

  @Post('biometric/challenge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request one-time biometric login challenge',
    description:
      'Generates a short-lived (2-minute), single-use cryptographic nonce for the device to sign after local Face ID / biometric unlock.',
  })
  @ApiResponse({
    status: 200,
    description: 'Biometric challenge issued successfully',
  })
  createBiometricChallenge(@Body() dto: BiometricChallengeDto) {
    return this.userAuthService.createBiometricChallenge(dto);
  }

  @Post('biometric/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify signed biometric challenge and authenticate',
    description:
      'Verifies the device signature over the one-time challenge against the stored public key, consumes the challenge, creates a UserSession, and issues fresh access & refresh JWTs.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Biometric authentication successful. Returns user profile, sessionId, and JWT tokens.',
  })
  verifyBiometricLogin(
    @Body() dto: VerifyBiometricDto,
    @Req() req: Request,
  ) {
    const rawIp = this.extractClientIp(req);
    const userAgent = req.headers['user-agent'];
    return this.userAuthService.verifyBiometricLogin(dto, rawIp, userAgent);
  }

  private extractClientIp(req?: Request): string | undefined {
    return (
      (req?.headers?.['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req?.ip ||
      req?.socket?.remoteAddress
    );
  }
}
