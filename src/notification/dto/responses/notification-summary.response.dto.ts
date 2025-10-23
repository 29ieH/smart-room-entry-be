import { NotificationAccountSummary } from './notification-account-summary';

export class NotificationSummary {
  id: number;
  title: string;
  type: string;
  message: string;
  sentAt: Date;
}

export class NotificationSummaryResponse {
  notifi: NotificationAccountSummary[];
  createdAt: Date;
}
