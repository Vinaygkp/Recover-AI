import api from './api';

export interface PromiseToPay {
  id: string;
  promise_id: string;
  case_id: string;
  merchant_id: string;
  customer_id?: string;
  invoice_id?: string;
  customer_name?: string;
  amount: number;
  promised_date: string;
  status: 'promised' | 'due' | 'paid' | 'missed' | 'escalated';
  payment_received_at?: string;
  escalation_status?: string;
  notes?: string;
  created_at: string;
}

export const promiseService = {
  create: (data: { case_id: string; amount: number; promised_date: string; customer_name?: string; invoice_id?: string; notes?: string }) => 
    api.post('/promises', data).then(r => r.data),
    
  list: (params?: { status?: string }) => 
    api.get('/promises', { params }).then(r => r.data),
    
  recordPayment: (id: string) => 
    api.post(`/promises/${id}/payment`).then(r => r.data),
    
  markMissed: (id: string) => 
    api.post(`/promises/${id}/miss`).then(r => r.data),
    
  escalate: (id: string) => 
    api.post(`/promises/${id}/escalate`).then(r => r.data)
};
