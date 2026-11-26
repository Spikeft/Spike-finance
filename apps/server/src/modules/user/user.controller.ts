import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CreateSpikeTagDto } from './dto/createSpikeTagDto';
import { UserService } from './user.service';

@ApiTags('User & SPIKE Tag')
@Controller('user')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('spike-tag')
  @ApiOperation({
    summary: 'Get authenticated user SPIKE tag or a unique default suggestion',
  })
  @ApiResponse({
    status: 200,
    description:
      'Returns the user SPIKE tag if set, or a unique suggested tag generated from their name.',
  })
  getMySpikeTag(@CurrentUser('sub') userId: string) {
    return this.userService.getMySpikeTag(userId);
  }

  @Get('spike-tag/check')
  @ApiOperation({
    summary: 'Check if a SPIKE tag is available',
  })
  checkSpikeTagAvailability(
    @CurrentUser('sub') userId: string,
    @Query('tag') tag: string,
  ) {
    return this.userService.checkSpikeTagAvailability(userId, tag);
  }

  @Post('spike-tag')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create or update the authenticated user SPIKE tag',
  })
  @ApiResponse({
    status: 200,
    description: 'SPIKE tag created or updated successfully.',
  })
  @ApiResponse({
    status: 409,
    description: 'SPIKE tag is already taken by another user.',
  })
  createSpikeTag(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateSpikeTagDto,
  ) {
    return this.userService.createSpikeTag(userId, dto.tag);
  }
}
