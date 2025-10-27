import { Body, Controller, Get, Put } from '@nestjs/common';
import { SettingService } from './setting.service';
import { IsPublicRoute } from 'src/common/decorators/public-route.decorator';
import { UpdateSettingRequestDto } from './dto/request/update-setting.request';

@Controller('/settings')
export class SettingController {
  constructor(private readonly settingService: SettingService) {}
  @IsPublicRoute()
  @Get()
  async getSettings() {
    return this.settingService.getSettings();
  }
  @IsPublicRoute()
  @Put()
  async updateSettings(@Body() dto: UpdateSettingRequestDto) {
    return this.settingService.updateSettings(dto);
  }
}
