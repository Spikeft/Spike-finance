import { Module } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma/prisma.service';
import { UserAuthModule } from '../user-auth/user-auth.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [UserAuthModule],
  controllers: [UserController],
  providers: [UserService, PrismaService],
  exports: [UserService],
})
export class UserModule {}
