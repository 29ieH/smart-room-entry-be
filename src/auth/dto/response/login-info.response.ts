import { UserSummaryResponse } from './user-summary.response';

export class LoginInfoResponse {
  token: string;
  user: UserSummaryResponse;
}
