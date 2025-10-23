import { Body, Controller, Post } from '@nestjs/common';
import { SensorPayload } from './dto/sensor-payload';
import { SensorService } from './sensor.service';
import { IsPublicRoute } from 'src/common/decorators/public-route.decorator';

@Controller('sensors')
export class SensorController {
  constructor(private readonly sensorService: SensorService) {}
  @IsPublicRoute()
  @Post('/unlock')
  async sensorUnlock(@Body() payload: SensorPayload) {
    await this.sensorService.handleSensorEvent(payload);
  }
}
