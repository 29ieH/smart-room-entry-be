export enum UnlockEventType {
  UNLOCK = '1',
}
export enum UnlockRecordType {
  REMOTE_UNLOCK = '12',
  ACCESS_CARD_UNLOCK = '7',
  FINGERPRINT_VERIFICATION_UNLOCK = '8',
  PASSWORD_UNLOCK = '4',
}

export enum LockStatus {
  UNLOCK = '1',
  LOCK = '0',
}

export enum UnlockRecordStatus {
  SUCCESS = '1',
  FAILED = '0',
}
export enum UnlockMethod {
  CARD = 'CARD',
  FINGERPRINT = 'FINGERPRINT',
  PASSWORD = 'PASSWORD',
}
