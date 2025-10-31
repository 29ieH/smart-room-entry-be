import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SettingSummaryDto } from './dto/response/setting-summary.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateSettingRequestDto } from './dto/request/update-setting.request';

@Injectable()
export class SettingService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {}
  async getSettings(): Promise<SettingSummaryDto[] | []> {
    const settings = await this.prismaService.setting.findMany({});
    if (settings.length > 0) {
      return settings.map((setting) => {
        return {
          key: setting.key,
          value: setting.value,
          description: setting.description ?? undefined,
        };
      });
    }
    return [];
  }
  async getSettingByKey(key: string): Promise<SettingSummaryDto | null> {
    const setting = await this.prismaService.setting.findUnique({
      where: { key },
    });
    if (setting) {
      return {
        key: setting.key,
        value: setting.value,
        description: setting.description ?? undefined,
      };
    }
    return null;
  }
  async updateSettings(
    dto: UpdateSettingRequestDto,
  ): Promise<SettingSummaryDto[]> {
    const updates = dto.settings.map((setting) =>
      this.prismaService.setting.update({
        where: { key: setting.key },
        data: { value: setting.value },
      }),
    );
    await Promise.all(updates);
    const updatedSettings = await this.prismaService.setting.findMany({
      where: {
        key: { in: dto.settings.map((s) => s.key) },
      },
    });
    return updatedSettings.map((s) => ({
      key: s.key,
      value: s.value,
    }));
  }
}
