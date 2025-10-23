export class NotificationAccountSummary {
  id: number;
  notificationId: number;
  accountId: number;
  title: string;
  content: string;
  type: string;
  sentAt: Date;
  isRead: boolean;
}
