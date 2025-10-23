import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationUnlockPayload } from './dto/payloads/notification-unlock-payload';
import { NotificationEvent } from 'src/common/enum/notification-event.enum';
import { NotificationLicensePlatePayload } from './dto/payloads/notification-license-plate';

@Injectable()
export class NotificationPublisher {
  constructor(private readonly eventEmitter: EventEmitter2) {}
  publishRoomCapacityExceeded(payload: NotificationUnlockPayload) {
    this.eventEmitter.emit(NotificationEvent.ROOM_CAPACITY_EXCEEDED, payload);
  }
  publishGateLeftOpen(payload: NotificationUnlockPayload) {
    this.eventEmitter.emit(NotificationEvent.GATE_LEFT_OPEN, payload);
  }
  publishFrequentGateAccessForOthers(payload: NotificationUnlockPayload) {
    this.eventEmitter.emit(
      NotificationEvent.FREQUENT_GATE_ACCESS_FOR_OTHERS,
      payload,
    );
  }
  publishRoomOccupancyVerificationSuggested() {
    this.eventEmitter.emit(
      NotificationEvent.ROOM_OCCUPANCY_VERIFICATION_SUGGESTED,
    );
  }
  publishUnauthorizedAccess(payload: NotificationUnlockPayload) {
    this.eventEmitter.emit(NotificationEvent.UNAUTHORIZED_ACCESS, payload);
  }
  publishUnauthorizedVehicleAccess(payload: NotificationLicensePlatePayload) {
    this.eventEmitter.emit(
      NotificationEvent.VEHICLE_UNAUTHORIZED_ACCESS,
      payload,
    );
  }
}
