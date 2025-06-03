import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AssignmentsResponse, Invoice, Payment } from '../types';
import { useToast } from '../hooks/use-toast';
import axios from 'axios';
import { API_URL } from '@/lib/url';

// const addInvoice = async () => {
//   ...
// };

interface DataContextType {
  invoices: Invoice[];
  payments: Payment[];
  loading: boolean;
  error: string | null;
  addInvoice: (
    invoice: Omit<
      Invoice,
      | 'id'
      | 'status'
      | 'created_at'
      | 'cleared_at'
      | 'overdue_days'
      | 'route_name'
      | 'outlet_name'
    >
  ) => Promise<void>;
  assignInvoice: (invoiceId: number, userId: number) => void;
  recordPayment: (payment: Omit<Payment, 'id'>) => void;
  getUserInvoices: (userId: number) => Invoice[];
  getInvoiceById: (invoiceId: number) => Invoice | undefined;
  sendNotification: (
    email: string,
    subject: string,
    message: string
  ) => Promise<void>;
  refreshInvoices: () => Promise<void>; // Add refresh function
  userBills: AssignmentsResponse | null;
  userBillsLoading: boolean;
  userBillsError: string | null;
  fetchUserInvoices: () => Promise<void>; // Function to fetch user invoices
  fetchInvoices: (invoiceNumber?: string) => Promise<void>; // Function to fetch invoices
  refreshUserInvoices: () => Promise<void>; // Add refreshUserInvoices to the context type
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [userBillsLoading, setUserBillsLoading] = useState(true);
  // after
  const [userBills, setUserBills] = useState<AssignmentsResponse | null>(null);

  const [userBillsError, setUserBillsError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Centralized function to fetch invoices
  const fetchInvoices = async (invoiceNumber?: string) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('No access token found');

      // Build URL: if invoiceNumber is present, append query param
      let url = `${API_URL}/api/bills/`;
      if (invoiceNumber && invoiceNumber.trim().length > 0) {
        const encoded = encodeURIComponent(invoiceNumber.trim());
        url += `?invoice_number=${encoded}`;
      }

      const response = await axios.get<Invoice[]>(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setInvoices(response.data);
    } catch (err: unknown) {
      let msg = 'Failed to fetch invoices';
      if (err instanceof Error) msg = err.message;
      setError(msg);
      toast({
        title: 'Error',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Refresh function that can be called from components
  const refreshInvoices = async () => {
    await fetchInvoices();
  };

  // Initial fetch
  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchUserInvoices = async () => {
    try {
      setUserBillsLoading(true);
      setUserBillsError(null);
      const token = localStorage.getItem('accessToken');

      if (!token) {
        throw new Error('No access token found');
      }
      const response = await axios.get(
        `${API_URL}/api/bills/my-assignments-flat/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setUserBills(response.data as AssignmentsResponse);
      console.log(
        'Fetched user invoices------------------------------:',
        response.data
      );
    } catch (error: unknown) {
      console.error('Failed to fetch user invoices:', error);
      setUserBillsError(
        error instanceof Error ? error.message : 'Failed to fetch user invoices'
      );
      toast({
        title: 'Error',
        description: 'Unable to fetch user invoices.',
        variant: 'destructive',
      });
    } finally {
      setUserBillsLoading(false);
    }
  };

  const refreshUserInvoices = async () => {
    await fetchUserInvoices(); // Call the fetchUserInvoices function
  };
  // Initial fetch for user invoices
  useEffect(() => {
    fetchUserInvoices();
  }, []);

  useEffect(() => {
    const storedPayments = localStorage.getItem('payments');
    if (storedPayments) {
      setPayments(JSON.parse(storedPayments));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('payments', JSON.stringify(payments));
  }, [payments]);

  // Updated addInvoice to create invoice via API and refresh the list
  const addInvoice = async (
    invoiceData: Omit<
      Invoice,
      | 'id'
      | 'status'
      | 'created_at'
      | 'cleared_at'
      | 'overdue_days'
      | 'route_name'
      | 'outlet_name'
    >
  ) => {
    try {
      const token = localStorage.getItem('accessToken');

      if (!token) {
        throw new Error('No access token found');
      }

      const payload = {
        invoice_date: invoiceData.invoice_date,
        outlet: invoiceData.outlet,
        invoice_number: invoiceData.invoice_number,
        actual_amount: invoiceData.actual_amount,
        brand: invoiceData.brand,
        route: invoiceData.route,
      };
      console.log('Adding invoice with payload:', payload);
      setSubmitting(true);

      await axios.post(`${API_URL}/api/bills/`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      setSubmitting(false);
      console.log(submitting, 'Invoice created successfully');
      // Refresh the invoices list to get the new invoice
      await refreshInvoices();

      toast({
        title: 'Invoice Created',
        description: `Invoice ${invoiceData.invoice_number} has been created successfully.`,
      });
    } catch (error: unknown) {
      console.error('Failed to create invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to create invoice. Please try again.',
        variant: 'destructive',
      });
      throw error; // Re-throw so the component knows it failed
    } finally {
      setSubmitting(false);
    }
  };

  const assignInvoice = (invoiceId: number, userId: number) => {
    setInvoices((prev) =>
      prev.map((invoice) =>
        invoice.id === invoiceId ? { ...invoice, assigned_to: userId } : invoice
      )
    );

    const updatedInvoice = invoices.find((inv) => inv.id === invoiceId);
    if (updatedInvoice) {
      toast({
        title: 'Invoice Assigned',
        description: `Invoice ${updatedInvoice.invoice_number} has been assigned.`,
      });
    }
  };

  const recordPayment = (paymentData: Omit<Payment, 'id'>) => {
    const newPayment: Payment = {
      ...paymentData,
      id: `pay-${Date.now()}`,
    };

    const updatedPayments = [...payments, newPayment];
    setPayments(updatedPayments);

    const invoice = invoices.find((inv) => inv.id === paymentData.invoiceId);
    if (invoice) {
      const totalPaid = updatedPayments
        .filter((p) => p.invoiceId === paymentData.invoiceId)
        .reduce((sum, p) => sum + p.amount, 0);

      const newStatus = totalPaid >= invoice.actual_amount ? 'paid' : 'partial';

      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === paymentData.invoiceId ? { ...inv, status: newStatus } : inv
        )
      );

      toast({
        title: 'Payment Recorded',
        description: `Payment of ${paymentData.amount} recorded for invoice ${invoice.invoice_number}`,
      });
    }
  };

  const getUserInvoices = (userId: number) => {
    return invoices.filter((invoice) => invoice.assigned_to_id === userId);
  };

  const getInvoiceById = (invoiceId: number) => {
    return invoices.find((invoice) => invoice.id === invoiceId);
  };

  const sendNotification = async (
    email: string,
    subject: string,
    message: string
  ) => {
    console.log(`Email notification to ${email}:`);
    console.log(`Subject: ${subject}`);
    console.log(`Message: ${message}`);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast({
      title: 'Notification Sent',
      description: `Email sent to ${email}`,
    });
  };

  return (
    <DataContext.Provider
      value={{
        invoices,
        payments,
        loading,
        error,
        addInvoice,
        assignInvoice,
        recordPayment,
        getUserInvoices,
        getInvoiceById,
        sendNotification,
        refreshInvoices,
        userBills,
        userBillsLoading,
        userBillsError,
        fetchUserInvoices,
        fetchInvoices, // Expose the fetchInvoices function
        refreshUserInvoices, // Expose the refresh function for user invoices
        // submitting,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
