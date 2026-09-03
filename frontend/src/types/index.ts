// ==========================================
// 1. User & Auth Types
// ==========================================
export interface User {
  id: string;
  email: string;
  full_name: string;
  company_name?: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// ==========================================
// 2. Transaction Types
// ==========================================
export type TransactionStatus = 'success' | 'failed' | 'pending' | 'abandoned' | 'refunded';
export type PaymentMethod = 'card' | 'upi' | 'netbanking' | 'wallet' | 'emi';
export type FailureReason = 'insufficient_funds' | 'card_declined' | 'authentication_failed' | 'network_error' | 'bank_unavailable' | 'expired_card' | 'fraud_suspected' | 'timeout' | 'unknown';
export type CheckoutStage = 'initiated' | 'payment_page' | 'otp_sent' | 'otp_verified' | 'processing' | 'completed';

export interface Transaction {
  id: string;
  merchant_id: string;
  customer_id: string;
  order_id: string;
  razorpay_payment_id?: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  payment_method: PaymentMethod;
  failure_reason?: FailureReason;
  checkout_stage?: CheckoutStage;
  retry_count: number;
  is_subscription: boolean;
  subscription_id?: string;
  customer_email?: string;
  customer_phone?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
  recovery_case?: RecoveryCase;
  audit_timeline?: Array<AuditLog>;
}

// ==========================================
// 3. Recovery Types
// ==========================================
export type RecoveryCaseStatus = 'detected' | 'analyzing' | 'eligible' | 'recovery_in_progress' | 'recovered' | 'failed' | 'stopped' | 'manual_review' | 'expired';
export type RecoveryPriority = 'critical' | 'high' | 'medium' | 'low';
export type FailureType = 'payment_failure' | 'checkout_abandonment' | 'subscription_failure' | 'overdue_receivable' | 'payment_degradation';
export type RecommendedAction = 'retry' | 'reminder' | 'alternate_payment' | 'manual_review' | 'no_action';

export interface PolicyCheck {
  rule: string;
  passed: boolean;
  flag?: string;
  name?: string; // Added for UI compatibility
}

export interface PolicyResult {
  allowed: boolean;
  checks: PolicyCheck[];
  blocked_reason?: string;
}

export interface RecoveryCase {
  id: string;
  transaction_id: string;
  merchant_id: string;
  customer_id: string;
  amount: number;
  currency: string;
  status: RecoveryCaseStatus;
  priority: RecoveryPriority;
  failure_type: FailureType;
  recovery_probability: number;
  probability: number; // alias for recovery_probability
  ai_diagnosis: string | { explanation?: string; action?: string; [key: string]: unknown }; // Updated for component compatibility
  recommended_action: RecommendedAction;
  ai_explanation: string;
  policy_result: PolicyResult;
  policy_checks?: PolicyCheck[]; // Added for UI compatibility
  retry_count: number;
  max_retries: number;
  recovery_window_start: string;
  recovery_window_end: string;
  recovered_amount: number;
  recovered_at?: string;
  stopped_reason?: string;
  created_at: string;
  updated_at: string;
}

export type ActionType = 'retry' | 'reminder' | 'alternate_payment' | 'manual_review' | 'stop' | 'escalate';
export type ActionStatus = 'initiated' | 'in_progress' | 'completed' | 'failed' | 'blocked';

export interface RecoveryAction {
  id: string;
  case_id: string;
  merchant_id: string;
  action_type: ActionType;
  status: ActionStatus;
  result?: Record<string, unknown>;
  policy_check: Record<string, unknown>;
  created_at: string;
  completed_at?: string;
  actor: 'ai' | 'system' | 'merchant';
}

// ==========================================
// 4. Policy Types
// ==========================================
export interface Policy {
  id: string;
  merchant_id: string;
  name?: string;
  description?: string;
  value?: unknown;
  max_retries: number;
  max_discount_percent: number;
  recovery_window_days: number;
  high_value_threshold: number;
  manual_approval_threshold: number;
  escalation_limit: number;
  auto_retry_enabled: boolean;
  reminder_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// ==========================================
// 5. Audit Types
// ==========================================
export interface AuditLog {
  id: string;
  merchant_id: string;
  case_id?: string;
  transaction_id?: string;
  event_type: string;
  actor: string;
  description: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type?: string;
  [key: string]: unknown;
}

// ==========================================
// 6. Notification Types
// ==========================================
export type NotificationType = 'high_value_case' | 'recovery_success' | 'recovery_stopped' | 'manual_approval' | 'policy_violation' | 'failure_spike' | 'success';

export interface Notification {
  id: string;
  merchant_id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  read?: boolean; // alias for is_read
  related_case_id?: string;
  created_at: string;
}

// ==========================================
// 7. Customer Types
// ==========================================
export interface Customer {
  id: string;
  merchant_id: string;
  name: string;
  email: string;
  phone: string;
  total_transactions: number;
  successful_transactions: number;
  failed_transactions: number;
  at_risk_amount?: number;
  recovered_amount?: number;
  created_at: string;
}

// ==========================================
// 8. Dashboard Types
// ==========================================
export interface DashboardOverview {
  revenue_at_risk: number;
  revenue_recovered: number;
  recovery_rate: number;
  active_cases: number;
  total_attempts: number;
  successful_recoveries: number;
  stopped_cases: number;
  manual_reviews: number;
  charts: {
    revenue_over_time: Array<{ date: string; at_risk: number; recovered: number }>;
    failure_distribution: Array<{ _id: string; count: number; total_amount: number }>;
    recovery_funnel: {
      revenue_at_risk: number;
      eligible: number;
      attempted: number;
      recovered: number;
    };
  };
}

// ==========================================
// 9. Analytics Types
// ==========================================
export interface AnalyticsData {
  recovery_by_failure_type: Array<{ _id: string; total_amount: number; count: number }>;
  revenue_trend: Array<{ _id: string; amount: number }>;
  time_to_recovery: { avg: string; median: string; fastest: string; slowest: string };
  recovery_probability_distribution: Record<string, number>;
  recovery_by_intervention: Record<string, number>;
  recovery_funnel?: {
    revenue_at_risk: number;
    eligible: number;
    attempted: number;
    recovered: number;
  };
}

// ==========================================
// 10. Simulation Types
// ==========================================
export interface SimulationResult {
  processed: number;
  recovered: number;
  stopped: number;
  manual_review: number;
  revenue_recovered: number;
}

export interface DemoDataResult {
  transactions_generated: number;
  cases_generated: number;
  customers_generated: number;
  at_risk_cases: number;
  revenue_at_risk: number;
  success: boolean;
}

// ==========================================
// 11. Pagination & API Errors
// ==========================================
export interface PaginatedResponse<T> {
  total: number;
  items: T[];
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}