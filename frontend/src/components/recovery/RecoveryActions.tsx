import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';
import { recoveryService } from '../../services/recovery';
import { RefreshCw, Mail, AlertTriangle, XOctagon, ShieldAlert, CreditCard, ShieldCheck, Zap, UserCheck, MessageSquare, Copy, Check } from 'lucide-react';
import api from '../../services/api';
import { useQueryClient } from '@tanstack/react-query';
import { formatCurrency } from '../../lib/utils';

interface RecoveryActionsProps {
  caseId: string;
  allowedActions?: string[];
  status?: string;
  amount?: number;
  onActionComplete?: () => void;
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => Promise<void>;
  modal?: {
    ondismiss?: () => void;
  };
  theme?: {
    color?: string;
  };
}

interface RazorpayInstance {
  open: () => void;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface OrderDetails {
  order_id: string;
  amount: number;
  currency?: string;
  provider?: string;
  environment?: string;
  key_id?: string;
}

export function RecoveryActions({ caseId, allowedActions = ['retry', 'remind', 'manual_review', 'stop'], status, amount = 4999.0, onActionComplete }: RecoveryActionsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // High value manual review modal state
  const [isHighValueModalOpen, setIsHighValueModalOpen] = useState(false);
  const [highValueMessage, setHighValueMessage] = useState('');

  // Razorpay payment flow state
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Hinglish / English messaging modal state
  const [isMsgModalOpen, setIsMsgModalOpen] = useState(false);
  const [msgLang, setMsgLang] = useState<'hinglish' | 'english'>('hinglish');
  const [generatedMsg, setGeneratedMsg] = useState('');
  const [isGeneratingMsg, setIsGeneratingMsg] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isRecovered = status === 'recovered';

  const handleActionClick = (action: string) => {
    setSelectedAction(action);
    setIsModalOpen(true);
  };

  const fetchRecoveryMessage = async (language: 'hinglish' | 'english') => {
    setIsGeneratingMsg(true);
    setMsgLang(language);
    try {
      const res = await api.post(`/recovery/${caseId}/message?lang=${language}`);
      setGeneratedMsg(res.data?.message || '');
      setIsMsgModalOpen(true);
    } catch (error: unknown) {
      toast('error', 'Message generation failed', 'Unable to generate recovery outreach message.');
    } finally {
      setIsGeneratingMsg(false);
    }
  };

  const handleCopyMessage = () => {
    if (!generatedMsg) return;
    navigator.clipboard.writeText(generatedMsg);
    setIsCopied(true);
    toast('success', 'Message Copied!', 'Outreach text copied to clipboard.');
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleRecoverPaymentClick = async () => {
    setIsLoading(true);
    try {
      const res = await api.post('/payments/order', { case_id: caseId, amount });
      const order = res.data;
      setOrderDetails(order);
      setIsPayModalOpen(true);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      const msg = err.response?.data?.detail || 'Failed to initiate Razorpay payment order.';
      if (msg.toLowerCase().includes('high value') || msg.toLowerCase().includes('threshold') || msg.toLowerCase().includes('policy')) {
        setHighValueMessage(msg);
        setIsHighValueModalOpen(true);
      } else {
        toast('error', 'Policy Check Notice', msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveHighValueCase = async () => {
    setIsLoading(true);
    try {
      const approveRes = await api.post(`/recovery/${caseId}/approve`, { reason: "Approved by merchant operator in executive console" });
      if (approveRes.data?.success) {
        toast('success', 'High-Value Case Approved', `Case #${caseId.slice(0, 8)} approved by merchant manager.`);
        setIsHighValueModalOpen(false);
        const res = await api.post('/payments/order', { case_id: caseId, amount });
        setOrderDetails(res.data);
        setIsPayModalOpen(true);
        queryClient.invalidateQueries();
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      toast('error', 'Approval failed', err.response?.data?.detail || 'Failed to approve case.');
    } finally {
      setIsLoading(false);
    }
  };

  const executeRazorpayTestPayment = async () => {
    if (!orderDetails) return;
    setIsVerifying(true);

    const isRazorpayTestMode = orderDetails.provider === 'razorpay_test' || orderDetails.environment === 'RAZORPAY_TEST_MODE';
    const isDemoMode = orderDetails.provider === 'demo_sandbox' || orderDetails.environment === 'DEMO_MODE';

    if (isRazorpayTestMode) {
      if (typeof window === 'undefined' || !window.Razorpay) {
        setIsVerifying(false);
        toast('error', 'SDK Unavailable', 'Razorpay Checkout is unavailable. Please reload the page.');
        return;
      }

      try {
        const options: RazorpayOptions = {
          key: orderDetails.key_id || '',
          amount: Math.round(orderDetails.amount * 100),
          currency: orderDetails.currency || 'INR',
          name: 'RECOVER AI',
          description: `Payment Recovery Case #${caseId.slice(0, 8)}`,
          order_id: orderDetails.order_id,
          handler: async (response: RazorpayResponse) => {
            await verifyPaymentWithServer(
              response.razorpay_order_id, 
              response.razorpay_payment_id, 
              response.razorpay_signature
            );
          },
          modal: {
            ondismiss: () => {
              setIsVerifying(false);
            }
          },
          theme: { color: '#00D26A' }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
        setIsPayModalOpen(false);
      } catch (error: unknown) {
        const err = error as Error;
        setIsVerifying(false);
        toast('error', 'Checkout Error', err?.message || 'Failed to open Razorpay Checkout SDK.');
      }
      return;
    }

    if (isDemoMode) {
      const orderId = orderDetails.order_id;
      const paymentId = `pay_demo_${Math.random().toString(36).substring(2, 10)}`;
      const signature = `sig_demo_${orderId.slice(-8)}`;
      try {
        await verifyPaymentWithServer(orderId, paymentId, signature);
      } catch (error: unknown) {
        const err = error as { response?: { data?: { detail?: string } } };
        toast('error', 'Demo Payment Verification Failed', err.response?.data?.detail || 'Signature check failed.');
      } finally {
        setIsVerifying(false);
      }
      return;
    }
  };

  const verifyPaymentWithServer = async (razorpay_order_id: string, razorpay_payment_id: string, razorpay_signature: string) => {
    try {
      const verifyRes = await api.post('/payments/verify', {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        case_id: caseId
      });

      if (verifyRes.data?.success) {
        const isDemo = orderDetails?.environment === 'DEMO_MODE';
        toast(
          'success', 
          isDemo ? 'Demo Mode Payment Verified' : 'Razorpay TEST Payment Verified!', 
          `₹${verifyRes.data.amount_recovered || orderDetails?.amount || amount} added to Recovered Revenue ledger.`
        );
        setIsPayModalOpen(false);
        queryClient.invalidateQueries();
        if (onActionComplete) onActionComplete();
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      toast('error', 'Payment Verification Failed', err.response?.data?.detail || 'Server-side signature check failed.');
    } finally {
      setIsVerifying(false);
    }
  };

  const executeAction = async () => {
    if (!selectedAction) return;
    setIsLoading(true);
    try {
      if (selectedAction === 'retry') await recoveryService.retry(caseId);
      if (selectedAction === 'remind') await recoveryService.remind(caseId);
      if (selectedAction === 'manual_review') await recoveryService.manualReview(caseId);
      if (selectedAction === 'stop') await recoveryService.stop(caseId);
      
      toast('success', 'Action executed successfully', `Successfully processed ${selectedAction.replace('_', ' ')}.`);
      setIsModalOpen(false);
      queryClient.invalidateQueries();
      if (onActionComplete) onActionComplete();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      const msg = err.response?.data?.detail || 'Please check network connection or policy limits.';
      if (msg.toLowerCase().includes('high value') || msg.toLowerCase().includes('threshold')) {
        setIsModalOpen(false);
        setHighValueMessage(msg);
        setIsHighValueModalOpen(true);
      } else {
        toast('error', 'Action failed', msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isRecovered) {
    return (
      <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-green-400 shrink-0" />
          <div>
            <p className="text-xs font-mono font-bold text-green-400 uppercase tracking-wider">RECOVERY COMPLETED ✓</p>
            <p className="text-xs font-mono text-neutral-300 mt-0.5">Amount {formatCurrency(amount)} verified & recorded in ledger</p>
          </div>
        </div>
        <span className="text-[10px] font-mono bg-green-500/20 text-green-300 font-bold px-3 py-1 rounded-xl border border-green-500/40">
          SERVER VERIFIED
        </span>
      </div>
    );
  }

  const actions = [
    { 
      id: 'retry', 
      label: 'Smart Retry', 
      icon: RefreshCw, 
      variant: 'secondary' as const, 
      allowed: allowedActions.includes('retry'),
      colorClass: 'hover:border-green-500/50 hover:shadow-[0_0_15px_rgba(34,197,94,0.2)] text-green-400 bg-green-500/10 border-green-500/30' 
    },
    { 
      id: 'remind', 
      label: 'Send Reminder', 
      icon: Mail, 
      variant: 'secondary' as const, 
      allowed: true,
      colorClass: 'hover:border-blue-500/50 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] text-blue-400 bg-blue-500/10 border-blue-500/30' 
    },
    { 
      id: 'manual_review', 
      label: 'Flag Review', 
      icon: AlertTriangle, 
      variant: 'secondary' as const, 
      allowed: true,
      colorClass: 'hover:border-yellow-500/50 hover:shadow-[0_0_15px_rgba(234,179,8,0.2)] text-yellow-400 bg-yellow-500/10 border-yellow-500/30' 
    },
    { 
      id: 'stop', 
      label: 'Stop', 
      icon: XOctagon, 
      variant: 'danger' as const, 
      allowed: true,
      colorClass: 'hover:border-red-500/50 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] text-red-400 bg-red-500/10 border-red-500/30' 
    }
  ];

  return (
    <div className="space-y-4">
      
      {/* Primary Executable Payment Recovery Action */}
      <div className="p-4 bg-gradient-to-r from-green-500/15 via-emerald-500/10 to-transparent border border-green-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[0_0_20px_rgba(34,197,94,0.15)]">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-green-400 font-bold block mb-0.5">
            Razorpay Test Mode Recovery
          </span>
          <p className="text-xs font-mono text-white font-semibold">
            Trigger Bounded Payment Recovery ({formatCurrency(amount)})
          </p>
        </div>

        <Button
          onClick={handleRecoverPaymentClick}
          disabled={isLoading}
          className="bg-gradient-to-r from-green-400 via-emerald-400 to-green-500 text-black font-extrabold text-xs font-mono uppercase tracking-wider px-5 py-2.5 rounded-xl hover:brightness-110 shadow-[0_0_20px_rgba(34,197,94,0.4)] flex items-center gap-2 cursor-pointer shrink-0"
        >
          <CreditCard className="w-4 h-4" /> RECOVER PAYMENT
        </Button>
      </div>

      {/* Secondary Actions Row */}
      <div className="flex flex-wrap gap-2.5">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.id}
              variant={action.variant}
              disabled={!action.allowed || isLoading}
              onClick={() => handleActionClick(action.id)}
              className={`gap-1.5 font-mono text-[11px] uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                action.allowed ? action.colorClass : 'opacity-40 cursor-not-allowed bg-neutral-900 border-neutral-800 text-neutral-500'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {action.label}
            </Button>
          );
        })}

        {/* Hinglish Outreach Message Generator Button */}
        <Button
          variant="secondary"
          onClick={() => fetchRecoveryMessage('hinglish')}
          disabled={isGeneratingMsg}
          className="gap-1.5 font-mono text-[11px] uppercase tracking-wider bg-purple-500/10 border-purple-500/30 text-purple-400 hover:border-purple-500/50 cursor-pointer"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Hinglish Message
        </Button>
      </div>

      {/* Hinglish / English Outreach Message Modal */}
      <Modal
        isOpen={isMsgModalOpen}
        onClose={() => setIsMsgModalOpen(false)}
        title="Compliant Recovery Message Generator"
        description={`Bilingual customer outreach copy for Case #${caseId.slice(0, 8)}`}
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchRecoveryMessage('hinglish')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono border cursor-pointer ${
                  msgLang === 'hinglish' ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 font-bold' : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                }`}
              >
                Hinglish
              </button>
              <button
                onClick={() => fetchRecoveryMessage('english')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono border cursor-pointer ${
                  msgLang === 'english' ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 font-bold' : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                }`}
              >
                English
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => setIsMsgModalOpen(false)} className="text-xs font-mono cursor-pointer">
                Close
              </Button>
              <Button
                variant="primary"
                onClick={handleCopyMessage}
                className="bg-purple-500 hover:bg-purple-400 text-black font-bold text-xs font-mono uppercase tracking-wider cursor-pointer flex items-center gap-1.5"
              >
                {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {isCopied ? 'Copied!' : 'Copy Copy'}
              </Button>
            </div>
          </div>
        }
      >
        <div className="p-4 bg-neutral-900/90 border border-neutral-800 rounded-2xl font-mono text-xs text-neutral-200 leading-relaxed whitespace-pre-wrap mt-2">
          {generatedMsg || 'Generating message...'}
        </div>
      </Modal>

      {/* Confirmation Modal for Standard Actions */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isLoading && setIsModalOpen(false)}
        title="Confirm Autonomous Action"
        description={`Are you sure you want to execute ${selectedAction?.replace('_', ' ').toUpperCase()} on case #${caseId}?`}
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} disabled={isLoading} className="text-xs font-mono cursor-pointer">
              Cancel
            </Button>
            <Button 
              variant="primary" 
              isLoading={isLoading} 
              onClick={executeAction}
              className="bg-gradient-to-r from-green-500 to-yellow-400 text-black font-bold text-xs font-mono uppercase tracking-wider hover:opacity-95 shadow-[0_0_20px_rgba(34,197,94,0.3)] cursor-pointer"
            >
              Confirm Execution
            </Button>
          </div>
        }
      >
        <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 flex items-start gap-3 mt-2">
          <ShieldAlert className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-mono text-white font-semibold">Policy Compliance & Audit Notice</p>
            <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
              This recovery action will be logged in the immutable audit trail and executed via bounded gateway rails.
            </p>
          </div>
        </div>
      </Modal>

      {/* High Value Manual Review Approval Modal */}
      <Modal
        isOpen={isHighValueModalOpen}
        onClose={() => !isLoading && setIsHighValueModalOpen(false)}
        title="High-Value Policy Guardrail Approval"
        description={`Transaction amount ${formatCurrency(amount)} exceeds automated threshold (≥ ₹10,000).`}
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button variant="ghost" onClick={() => setIsHighValueModalOpen(false)} disabled={isLoading} className="text-xs font-mono cursor-pointer">
              Dismiss
            </Button>
            <Button 
              isLoading={isLoading} 
              onClick={handleApproveHighValueCase}
              className="bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-black font-extrabold text-xs font-mono uppercase tracking-wider py-2.5 px-5 rounded-xl hover:brightness-110 shadow-[0_0_25px_rgba(234,179,8,0.4)] flex items-center gap-2 cursor-pointer"
            >
              <UserCheck className="w-4 h-4 fill-black" /> Approve & Execute Recovery
            </Button>
          </div>
        }
      >
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2 mt-2 font-mono text-xs">
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <AlertTriangle className="w-4 h-4" /> Policy Engine Escalate Rule Triggered
          </div>
          <p className="text-neutral-300 leading-relaxed">
            {highValueMessage || `Amount exceeds high value threshold (₹10,000). Policy Engine forces Merchant Manager Review prior to payment processing.`}
          </p>
          <div className="pt-2 text-[11px] text-neutral-400">
            Clicking <strong>Approve & Execute Recovery</strong> authorizes this transaction for Razorpay payment recovery.
          </div>
        </div>
      </Modal>

      {/* Razorpay Test Mode Payment Modal */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => !isVerifying && setIsPayModalOpen(false)}
        title={orderDetails?.environment === 'DEMO_MODE' ? 'Demo Sandbox Mode Recovery Checkout' : 'Razorpay Test Mode Recovery Checkout'}
        description={`Execute bounded payment recovery for Case #${caseId.slice(0, 8)}`}
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button variant="ghost" onClick={() => setIsPayModalOpen(false)} disabled={isVerifying} className="text-xs font-mono cursor-pointer">
              Cancel
            </Button>
            <Button 
              isLoading={isVerifying}
              onClick={executeRazorpayTestPayment}
              className="bg-gradient-to-r from-green-400 to-emerald-500 text-black font-extrabold text-xs font-mono uppercase tracking-wider py-2.5 px-5 rounded-xl hover:brightness-110 shadow-[0_0_25px_rgba(34,197,94,0.4)] flex items-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-black" /> {orderDetails?.environment === 'DEMO_MODE' ? 'Simulate Demo Payment' : 'Pay with Razorpay Test Mode'}
            </Button>
          </div>
        }
      >
        {orderDetails && (
          <div className="space-y-4 font-mono text-xs mt-2">
            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2.5">
              <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
                <span className="text-neutral-400">Order ID:</span>
                <span className="font-bold text-white text-xs">{orderDetails.order_id}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
                <span className="text-neutral-400">Recovery Amount:</span>
                <span className="font-extrabold text-green-400 text-base">{formatCurrency(orderDetails.amount)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
                <span className="text-neutral-400">Gateway Provider:</span>
                <span className="font-bold text-blue-400 uppercase text-[11px]">{orderDetails.environment}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Server Signature Check:</span>
                <span className="font-bold text-amber-400 uppercase text-[11px]">HMAC-SHA256 ENFORCED</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-green-500/10 border border-green-500/20 text-neutral-300 text-[11px] leading-relaxed flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
              <span>
                {orderDetails.environment === 'DEMO_MODE' ? (
                  <>Clicking <strong>Simulate Demo Payment</strong> will execute sandbox verification and update MongoDB ledger.</>
                ) : (
                  <>Clicking <strong>Pay with Razorpay Test Mode</strong> will launch the official Razorpay Checkout SDK modal. Upon completion, server HMAC signature verification will be enforced.</>
                )}
              </span>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}