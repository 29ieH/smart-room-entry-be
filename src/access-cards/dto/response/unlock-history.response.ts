import { UnlockEventRecord } from '../unlock-event.request';

export class UnlockHistoryResponse {
  total: number;
  pages: number;
  pageNo: number;
  pageSize: number;
  list: UnlockEventRecord[];
}
