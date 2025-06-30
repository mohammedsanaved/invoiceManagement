export type UserRole = 'admin' | 'dra';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  is_admin: boolean;
  username: string;
  full_name: string;
}

export interface Invoice {
  id: number;
  outlet: number;
  route_name: string;
  route: number;
  outlet_name: string;
  overdue_days: number;
  remaining_amount?: string;
  invoice_number: string;
  invoice_date: string;
  actual_amount: number;
  brand: string;
  status: string;
  created_at?: string;
  cleared_at?: string | null;
  assigned_to_id?: number;
  cheque_status?: 'pending' | 'cleared' | 'bounced';
  assigned_to_name?: string;
}

// For bills where fewer fields are returned:
export interface SimpleBill {
  id: number;
  invoice_number: string;
  invoice_date: string;
  actual_amount: string;
  brand: string;
  remaining_amount?: string;
  status: string;
  overdue_days: number;
  route_id: number;
  route_name: string;
  outlet_id: number;
  outlet_name: string;
}

export interface Payment {
  id: string;
  invoiceId: number;
  amount: number;
  method: 'cash' | 'upi' | 'cheque';
  chequeType: 'rtgs' | 'neft' | 'imps';
  date: string;
  transactionId?: string;
  transactionImage?: string;
  chequeNumber?: string;
  chequeDate?: string;
}

export interface Route {
  id: number;
  name: string;
}

export interface Outlet {
  id: number;
  name: string;
  route_id: number;
  route_name: string;
}

export interface AssignmentsResponse {
  routes: Route[];
  outlets: Outlet[];
  bills: SimpleBill[];
}
