import { UnlockMethod } from '@prisma/client';
import { UnlockRecordType } from '../enum/unlock-event.enum';

export function parseRoomNumberByKey(userName: string): string {
  const unlockEventKey = userName.split('.');
  if (unlockEventKey.length == 0) return '';
  return unlockEventKey[0];
}

export function parseRecordTypeToUnlockMethod(
  unlockEvent: number,
): UnlockMethod {
  switch (unlockEvent) {
    case Number(UnlockRecordType.REMOTE_UNLOCK):
      return UnlockMethod.CARD;
    case Number(UnlockRecordType.ACCESS_CARD_UNLOCK):
      return UnlockMethod.CARD;
    case Number(UnlockRecordType.FINGERPRINT_VERIFICATION_UNLOCK):
      return UnlockMethod.FINGERPRINT;
    case Number(UnlockRecordType.PASSWORD_UNLOCK):
      return UnlockMethod.PASSWORD;
    default:
      return UnlockMethod.CARD;
  }
}
