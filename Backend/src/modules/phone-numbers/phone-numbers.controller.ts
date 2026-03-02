import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Query,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { PhoneNumberService } from '../../services/phoneNumber/phone-number.service';
import { ClerkAuthGuard } from '../../common/clerk-auth.guard';
import { CurrentUserId } from '../../common/current-user-id.decorator';

@Controller('numbers')
@UseGuards(ClerkAuthGuard)
export class PhoneNumbersController {
  constructor(private readonly phoneNumberService: PhoneNumberService) {}

  @Get('countries')
  async getCountries() {
    return this.phoneNumberService.getCountries();
  }

  @Get('search')
  async searchNumbers(
    @Query('countryCode') countryCode: string | undefined,
    @Query('features') features: string | string[] | undefined,
    @Query('type') type: string | undefined,
    @Query('limit') limit: string | undefined,
  ) {
    if (!countryCode) {
      throw new BadRequestException('countryCode query param is required');
    }
    const limitNum = limit != null ? parseInt(limit, 10) : undefined;
    return this.phoneNumberService.searchNumbers({
      countryCode,
      features,
      type,
      limit: Number.isNaN(limitNum as number) ? undefined : limitNum,
    });
  }

  @Post('order')
  @HttpCode(HttpStatus.CREATED)
  async orderNumber(
    @CurrentUserId() userId: string,
    @Body()
    body: {
      phoneNumber: string;
      countryCode?: string;
      monthlyCost?: number;
      rawNumberDetails?: Record<string, unknown> | null;
    },
  ) {
    if (!body?.phoneNumber) {
      throw new BadRequestException('phoneNumber is required');
    }
    const result = await this.phoneNumberService.orderNumber(userId, {
      phoneNumber: body.phoneNumber,
      countryCode: body.countryCode,
      monthlyCost: body.monthlyCost,
      rawNumberDetails: body.rawNumberDetails ?? null,
    });
    if (result.error) {
      throw new BadRequestException(result.error);
    }
    return result.data;
  }

  @Get('mine')
  async listMyNumbers(@CurrentUserId() userId: string) {
    const result = await this.phoneNumberService.listMyNumbers(userId);
    if (result.error) {
      throw new BadRequestException(result.error);
    }
    return result.data ?? [];
  }

  @Patch('enable-voice')
  @HttpCode(HttpStatus.OK)
  async enableVoiceCall(
    @CurrentUserId() userId: string,
    @Body() body: { phoneNumber?: string },
  ) {
    if (!body?.phoneNumber) {
      throw new BadRequestException('phoneNumber is required');
    }
    const result = await this.phoneNumberService.enableVoiceCall(
      userId,
      body.phoneNumber,
    );
    if (!result.ok) {
      throw new BadRequestException(result.error ?? 'Failed to enable voice call');
    }
    return { message: 'Voice call enabled successfully' };
  }

  @Delete(':phoneNumber')
  @HttpCode(HttpStatus.OK)
  async deleteNumber(
    @CurrentUserId() userId: string,
    @Param('phoneNumber') phoneNumber: string,
  ) {
    if (!phoneNumber) {
      throw new BadRequestException('phoneNumber is required');
    }
    const result = await this.phoneNumberService.deleteNumber(userId, phoneNumber);
    if (!result.ok) {
      throw new BadRequestException(result.error ?? 'Failed to delete number');
    }
    return { message: 'Phone number deleted successfully' };
  }
}
