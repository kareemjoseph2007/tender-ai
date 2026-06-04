export interface AlertUser {
  id: string;
  email: string;
}

export interface SendAlertResult {
  sent: boolean;
  skippedReason?: string;
  error?: string;
}

export interface ProcessAlertsResult {
  sent: number;
  skipped: number;
  errors: string[];
}
