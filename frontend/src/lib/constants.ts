import {
  LayoutDashboard,
  AlertCircle,
  ArrowLeftRight,
  Users,
  Brain,
  Shield,
  BarChart3,
  ScrollText,
  Settings,
  Play,
  CalendarCheck,
  LucideIcon
} from 'lucide-react';

export interface NavItem {
  name: string;
  path: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Recovery Queue', path: '/dashboard/recovery', icon: AlertCircle },
  { name: 'Promises to Pay', path: '/dashboard/promises', icon: CalendarCheck },
  { name: 'Transactions', path: '/dashboard/transactions', icon: ArrowLeftRight },
  { name: 'Customers', path: '/dashboard/customers', icon: Users },
  { name: 'AI Decisions', path: '/dashboard/ai-decisions', icon: Brain },
  { name: 'Recovery Runs', path: '/dashboard/simulation', icon: Play },
  { name: 'Policies', path: '/dashboard/policies', icon: Shield },
  { name: 'Analytics', path: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Audit Trail', path: '/dashboard/audit', icon: ScrollText },
  { name: 'Settings', path: '/dashboard/settings', icon: Settings },
];

export const STATUS_LABELS: Record<string, string> = {
  detected: 'Detected',
  in_progress: 'In Progress',
  recovered: 'Recovered',
  failed: 'Failed',
  stopped: 'Stopped',
  manual_review: 'Manual Review',
  success: 'Success',
  pending: 'Pending',
};

export const PRIORITY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export const ACTION_LABELS: Record<string, string> = {
  retry: 'Smart Retry',
  remind: 'Send Reminder',
  manual_review: 'Flag for Review',
  stop: 'Stop Recovery',
};

export const FAILURE_TYPE_LABELS: Record<string, string> = {
  insufficient_funds: 'Insufficient Funds',
  do_not_honor: 'Do Not Honor',
  limit_exceeded: 'Limit Exceeded',
  expired_card: 'Expired Card',
  invalid_cvv: 'Invalid CVV',
  network_error: 'Network Error',
};