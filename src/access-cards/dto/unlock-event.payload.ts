export class UnlockEventPayload {
  accessCardId: string | null;
  username: string | null;
  lockDate: number;
  lockId: string;
  admin: string;
  lockMac: string;
}
