export class AccessLogSummaryResponse {
  id: number;
  roomNumber: string;
  userName: string;
  inCount: number;
  outCount: number;
  unlockMethod: string;
  note: string;
  logDate: Date;
}
