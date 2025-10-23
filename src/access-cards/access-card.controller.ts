import { Body, Controller, Post } from '@nestjs/common';
import { UnlockEventRequest } from './dto/unlock-event.request';
import { AccessCardService } from './access-card.service';
import { IsPublicRoute } from 'src/common/decorators/public-route.decorator';

@Controller('access-cards')
export class AccessCardController {
  constructor(private readonly accessCardService: AccessCardService) {}
  @IsPublicRoute()
  @Post('unlock')
  async fallbackUnlockAccessCard(@Body() dto: UnlockEventRequest) {
    await this.accessCardService.handleUnlockEvent(dto);
  }
}
