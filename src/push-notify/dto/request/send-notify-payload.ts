import { PushNotifyPayload } from './push-notify-payload';
import { PushSubscriptionDto } from './push-subscription';

export class SendNotifyPayload {
  subscription: PushSubscriptionDto;
  payload: PushNotifyPayload;
}
