import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Invoice, Payment, UsersBills } from '../types';
import { useToast } from '../hooks/use-toast';
import axios from 'axios';
import { API_URL } from '@/lib/url';

interface DataContextType {
  invoices: Invoice[];
  payments: Payment[];
  loading: boolean;
  error: string | null;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'status'>) => Promise<void>;
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
  userBills: UsersBills[]; // Adjust type as needed
  userBillsLoading: boolean;
  userBillsError: string | null;
  fetchUserInvoices: () => Promise<void>; // Function to fetch user invoices
  fetchInvoices: () => Promise<void>; // Function to fetch invoices
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
  const [userBills, setUserBills] = useState<UsersBills[]>([]);
  const [userBillsError, setUserBillsError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Centralized function to fetch invoices
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('accessToken');

      if (!token) {
        throw new Error('No access token found');
      }

      const response = await axios.get<Invoice[]>(`${API_URL}/api/bills/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setInvoices(response.data);
      console.log(
        'Fetched invoices------------------------------:',
        response.data
      );
    } catch (error: unknown) {
      let message = 'Failed to fetch invoices';
      if (error instanceof Error) {
        message = error.message;
      }
      console.error('Failed to fetch invoices:', error);
      setError(message);
      toast({
        title: 'Error',
        description: 'Unable to fetch invoices.',
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
      setUserBills(response.data);
      console.log(
        'Fetched user invoices------------------------------:',
        response.data
      );
    } catch (error: any) {
      console.error('Failed to fetch user invoices:', error);
      setUserBillsError(error.message || 'Failed to fetch user invoices');
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
  const addInvoice = async (invoiceData: Omit<Invoice, 'id' | 'status'>) => {
    try {
      const token = localStorage.getItem('accessToken');

      if (!token) {
        throw new Error('No access token found');
      }

      const payload = {
        invoice_date: invoiceData.invoice_date,
        outlet: invoiceData.outlet_id,
        invoice_number: invoiceData.invoice_number,
        amount: invoiceData.amount,
        brand: invoiceData.brand,
      };

      await axios.post(`${API_URL}/api/bills/`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Refresh the invoices list to get the new invoice
      await refreshInvoices();

      toast({
        title: 'Invoice Created',
        description: `Invoice ${invoiceData.invoice_number} has been created successfully.`,
      });
    } catch (error: any) {
      console.error('Failed to create invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to create invoice. Please try again.',
        variant: 'destructive',
      });
      throw error; // Re-throw so the component knows it failed
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

      const newStatus =
        totalPaid >= parseFloat(invoice.amount) ? 'paid' : 'partial';

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
