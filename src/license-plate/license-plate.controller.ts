import { Body, Controller, Post } from '@nestjs/common';
import { LicensePlateService } from './license-plate.service';
import { LicensePlateInfoRequest } from './dto/license-plate-info.request';
import { IsPublicRoute } from 'src/common/decorators/public-route.decorator';

@Controller('license-plates')
export class LicensePlateController {
  constructor(private readonly licensePlateService: LicensePlateService) {}
  @IsPublicRoute()
  @Post('/entry')
  async handleLicensePlateInfo(@Body() dto: LicensePlateInfoRequest) {
    // Implementation goes here
    await this.licensePlateService.handleLicensePlate(dto);
  }
}
