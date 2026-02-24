export type WaitlistRole = 'board_member' | 'resident' | 'property_manager';

export type WaitlistHoaSize = '1-25' | '26-50' | '51-100' | '101-200' | '201+';

export interface WaitlistSignupRequest {
  email: string;
  role?: WaitlistRole;
  hoa_size?: WaitlistHoaSize;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

export type WaitlistSignupResponse =
  | { success: true; status: 'created' | 'duplicate' }
  | { success: false; code: 'INVALID_EMAIL' | 'RATE_LIMITED' | 'SERVER_ERROR' };

export type WaitlistFormState = 'idle' | 'submitting' | 'success' | 'error';
