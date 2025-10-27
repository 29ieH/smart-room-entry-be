import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { LicensePlateService } from './license-plate.service';
import { LicensePlateInfoRequest } from './dto/license-plate-info.request';
import { IsPublicRoute } from 'src/common/decorators/public-route.decorator';
import { GetAllLicensePlateRequest } from './dto/get-all-license-plate.request';

@Controller('license-plates')
export class LicensePlateController {
  constructor(private readonly licensePlateService: LicensePlateService) {}
  @IsPublicRoute()
  @Post('/entry')
  async handleLicensePlateInfo(@Body() dto: LicensePlateInfoRequest) {
    // Implementation goes here
    await this.licensePlateService.handleLicensePlate(dto);
  }
  @IsPublicRoute()
  @Get()
  async getHistoryLicensePlate(@Query() filter: GetAllLicensePlateRequest) {
    return this.licensePlateService.getAllLicensePlate(filter);
  }
}
