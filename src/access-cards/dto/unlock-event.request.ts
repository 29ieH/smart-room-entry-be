export class UnlockEventRecord {
  lockId: string;
  electricQuantity: number;
  serverDate: number;
  recordTypeFromLock: number;
  recordType: string;
  success: number;
  lockMac: string;
  keyboardPwd: string;
  lockDate: number;
  username: string;
}
export class UnlockEventRequest {
  lockId: string;
  notifyType: string;
  records: string;
  admin: string;
  lockMac: string;
}
