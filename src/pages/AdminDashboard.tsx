import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import type { Invoice } from '../types';
import Layout from '../components/Layout';
import {
  ArrowUpRight,
  Banknote,
  // Cable,
  ChevronDown,
  CreditCard,
  FileInput,
  Outdent,
  Plus,
  Search,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import InvoiceTable from '../components/InvoiceTable';
import AssignDialog from '../components/AssignDialog';
import axios from 'axios';
import { API_URL } from '@/lib/url';
import { useToast } from '../hooks/use-toast';
import ExportDataDialog from '@/components/ExportDataDialog';
import CreateInvoiceDialog from '@/components/CreateInvoiceDialog';
import { Link } from 'react-router-dom';
import ImportDataDialog from '@/components/ImportDataDialog';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Employee {
  id: number;
  username: string;
  full_name: string;
  role: string;
  is_admin: boolean;
}
interface PaymentTotals {
  cash_total: string;
  upi_total: string;
  cheque_total: string;
  date?: string;
}

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const {
    invoices,
    sendNotification,
    loading,
    error,
    refreshInvoices,
    fetchInvoices,
  } = useData();

  const pageSize = 10;
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [noResults, setNoResults] = useState(false);
  const [paymentTotals, setPaymentTotals] = useState<PaymentTotals>({
    cash_total: '0',
    upi_total: '0',
    cheque_total: '0',
  });
  const [loadingTotalPayments, setLoadingTotalPayments] = useState(false);
  const [errorTotalPayments, setErrorTotalPayments] = useState<string | null>(
    null
  );
  const { toast } = useToast();

  // A ref to store a debounce timer
  const debounceRef = useRef<number | null>(null);

  // Fetch employee list on mount
  useEffect(() => {
    const fetchEmployee = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      try {
        const response = await axios.get(`${API_URL}/api/auth/users/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEmployees(response.data);
      } catch (err) {
        console.error('Error fetching employee:', err);
      }
    };
    fetchEmployee();
  }, []);

  useEffect(() => {
    const fetchTodaysTotalCollection = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      try {
        setLoadingTotalPayments(true);
        const response = await axios.get(
          `${API_URL}/api/payments/today-totals/`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setPaymentTotals(response.data);
        // Assuming response.data contains the total collection amount
        // You can store it in a state or use it directly
        console.log("Today's total collection:", response.data);
      } catch (err) {
        console.error("Error fetching today's total collection:", err);
        setErrorTotalPayments(
          err instanceof Error ? err.message : 'Failed to Total Payments'
        );
      } finally {
        setLoadingTotalPayments(false);
      }
    };
    fetchTodaysTotalCollection();
  }, []);

  // Debounced search: whenever `searchTerm` changes, wait 500ms then call fetchInvoices
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = window.setTimeout(() => {
      fetchAndHandle(searchTerm.trim());
    }, 500);

    // Clean up if searchTerm changes or component unmounts
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchTerm]);

  // Wrapper to call fetchInvoices with optional invoice_number, then track if there were no results
  const fetchAndHandle = async (term: string) => {
    try {
      if (term) {
        await fetchInvoices(term);
      } else {
        await fetchInvoices(undefined);
      }
      // After fetch completes, if `invoices` array is empty while term is non-empty → no results
      setNoResults(term !== '' && invoices.length === 0);
    } catch {
      // swallow; DataContext’s fetchInvoices already handles errors
    }
  };

  // If user presses “Enter” inside the input, fire an immediate fetch
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      fetchAndHandle(searchTerm.trim());
      setCurrentPage(1);
    }
  };

  const totalPages = useMemo(() => {
    return Math.ceil(invoices.length / pageSize) || 1;
  }, [invoices.length]);

  const paginatedInvoices: Invoice[] = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return invoices.slice(startIndex, startIndex + pageSize);
  }, [invoices, currentPage]);

  const goToPrevious = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };
  const goToNext = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handleOpenUpdateAssignDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsDialogOpen(true);
  };

  if (loading || loadingTotalPayments) {
    return (
      <Layout>
        <div className='max-w-7xl mx-auto'>
          <div className='flex items-center justify-center min-h-[400px]'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto mb-4' />
              <p className='text-gray-600'>Loading invoices...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || errorTotalPayments) {
    return (
      <Layout>
        <div className='max-w-7xl mx-auto'>
          <div className='flex items-center justify-center min-h-[400px]'>
            <div className='text-center'>
              <p className='text-red-600 mb-4'>Error: {error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }
  if (loadingTotalPayments) {
    return (
      <Layout>
        <div className='max-w-7xl mx-auto'>
          <div className='flex items-center justify-center min-h-[400px]'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto mb-4' />
              <p className='text-gray-600'>Loading payment totals...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const handleAssign = async (invoiceId: number, employeeId: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      await axios.post(
        `${API_URL}/api/bills/${invoiceId}/assign/`,
        {
          bill_ids: [invoiceId],
          dra_id: employeeId,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      await refreshInvoices();
      toast({
        title: 'Invoice Assigned',
        description: `Invoice ${invoiceId} has been assigned successfully.`,
      });
    } catch (err) {
      console.error('Error assigning invoice:', err);
    }
  };

  const handleConfirmAssign = async () => {
    if (!selectedInvoice || !currentUser) return;
    await sendNotification(
      'employee1@example.com',
      'New Collection Assignment',
      `You have been assigned to collect invoice ${selectedInvoice.invoice_number} for $${selectedInvoice.actual_amount}`
    );
    await sendNotification(
      'admin@example.com',
      'Invoice Assignment Confirmation',
      `Invoice ${selectedInvoice.invoice_number} has been assigned to Employee One for collection.`
    );
    setIsDialogOpen(false);
  };

  return (
    <Layout>
      <div className='max-w-7xl mx-auto'>
        {/* Payment Summary Cards */}
        <h1 className='text-2xl font-bold mb-2'>Admin Dashboard</h1>
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 my-4'>
          <Card className='bg-green-50 border border-green-200'>
            <CardHeader className='flex items-center gap-2'>
              <Wallet className='text-green-600' />
              <CardTitle>Cash Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-2xl font-bold text-green-700'>
                ₹ {paymentTotals.cash_total}
              </p>
            </CardContent>
          </Card>

          <Card className='bg-blue-50 border border-blue-200'>
            <CardHeader className='flex items-center gap-2'>
              <CreditCard className='text-blue-600' />
              <CardTitle>UPI Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-2xl font-bold text-blue-700'>
                ₹ {paymentTotals.upi_total}{' '}
              </p>
            </CardContent>
          </Card>

          {/* <Card className='bg-zinc-50 border border-zinc-200'>
            <CardHeader className='flex items-center gap-2'>
              <Cable className='text-zinc-600' />
              <CardTitle>Electronic Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-2xl font-bold text-zinc-700'>
                ₹ {paymentTotals.cheque_total}
              </p>
            </CardContent>
          </Card> */}
          <Card className='bg-yellow-50 border border-yellow-200'>
            <CardHeader className='flex items-center gap-2'>
              <Banknote className='text-yellow-600' />
              <CardTitle>Cheque Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-2xl font-bold text-yellow-700'>
                ₹ {paymentTotals.cheque_total}
              </p>
            </CardContent>
          </Card>
        </div>
        <div className='flex flex-col sm:flex-row pb-4 justify-between gap-2 items-center'>
          {/* Search bar (full width on small screens) */}
          <div className='flex w-full sm:w-auto items-center gap-2'>
            <Input
              className='w-full sm:w-64'
              placeholder='Search by Invoice Number'
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              onKeyDown={handleKeyDown}
            />
            <Button
              onClick={() => {
                fetchAndHandle(searchTerm.trim());
                setCurrentPage(1);
              }}
            >
              <Search className='h-4 w-4' />
            </Button>
          </div>

          <div className='flex items-center gap-2 px-3 py-2 bg-white flex-wrap rounded-lg shadow'>
            <Link to='/admin/payments/cheque'>
              <Button size={'sm'} className='flex items-center gap-2'>
                Cheque History
                <ArrowUpRight className='h-4 w-4' />
              </Button>
            </Link>
            <Link to='/admin/payments'>
              <Button size={'sm'} className='flex items-center gap-2'>
                Pay History
                <ArrowUpRight className='h-4 w-4' />
              </Button>
            </Link>
            <Button
              size={'sm'}
              className='flex items-center gap-2'
              onClick={() => setIsExportDialogOpen(true)}
            >
              <Outdent className='h-4 w-4' /> Export Bills
            </Button>
            <Button
              size={'sm'}
              className='flex items-center gap-2'
              onClick={() => setIsImportDialogOpen(true)}
            >
              <FileInput className='h-4 w-4' /> Imports Bills
            </Button>
          </div>
        </div>

        <div className='bg-white shadow rounded-lg p-6'>
          <div className='flex justify-between items-center mb-4'>
            <h2 className='text-lg font-semibold'>Invoices</h2>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className='flex items-center gap-2'
            >
              <Plus className='h-4 w-4' /> Create New Invoice
            </Button>
          </div>

          {invoices.length === 0 ? (
            <div className='text-center py-8'>
              <p className='text-gray-500 mb-4'>
                {noResults
                  ? `No invoices found for “${searchTerm}”`
                  : 'No invoices found'}
              </p>
              {noResults && (
                <Button
                  onClick={() => {
                    setSearchTerm('');
                    fetchAndHandle('');
                    setCurrentPage(1);
                  }}
                >
                  Clear Search
                </Button>
              )}
              {!noResults && (
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className='flex items-center gap-2 mx-auto'
                >
                  <Plus className='h-4 w-4' /> Create Your First Invoice
                </Button>
              )}
            </div>
          ) : (
            <InvoiceTable
              invoices={paginatedInvoices}
              employees={employees}
              onAssign={handleAssign}
              onOpenUpdateAssignDialog={handleOpenUpdateAssignDialog}
            />
          )}

          <div className='flex justify-between items-center mt-4'>
            <p className='text-lg font-semibold mr-2'>
              Total: {invoices.length}
            </p>
            <div className='flex items-center gap-2'>
              <Button
                onClick={goToPrevious}
                disabled={currentPage === 1}
                className='flex items-center gap-1'
              >
                <ChevronDown className='h-4 w-4 rotate-90' /> Previous
              </Button>
              <p className='text-sm'>
                Page {currentPage} of {totalPages}
              </p>
              <Button
                onClick={goToNext}
                disabled={currentPage === totalPages}
                className='flex items-center gap-1'
              >
                Next <ChevronDown className='h-4 w-4 -rotate-90' />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <AssignDialog
        invoice={selectedInvoice}
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onAssign={handleConfirmAssign}
        refreshInvoices={refreshInvoices}
      />
      <ExportDataDialog
        open={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
      />
      <CreateInvoiceDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
      />
      <ImportDataDialog
        open={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
      />
    </Layout>
  );
};

export default AdminDashboard;
