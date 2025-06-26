import React, { useEffect, useMemo, useRef, useState } from 'react';
import Layout from '@/components/Layout';
// import PaymentTable from '@/components/PaymentTable';
import ExportPaymentDataDialog from '@/components/ExportPaymentDataDialog';
import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
import { API_URL } from '@/lib/url';
import axios from 'axios';
import { ChevronDown, ChevronLeft, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ChequePaymentTable from '@/components/ChequePaymentTable';
import { Input } from '@/components/ui/input';
// import { Input } from '@/components/ui/input';

const AdminChequeDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [searchInvoiceTerm, setSearchInvoiceTerm] = useState('');
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [noResults, setNoResults] = useState(false);

  // We'll keep a ref to the current debounce timer:
  const debounceRef = useRef<number | null>(null);

  // Compute total pages
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(payments.length / pageSize));
  }, [payments.length, pageSize]);

  // Slice out just the page we need
  const paginatedPayments = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return payments.slice(startIndex, startIndex + pageSize);
  }, [payments, currentPage, pageSize]);

  /**
   * Fetch payments from the API.
   * If `invoiceNumber` is provided (non‐empty),
   * append `?invoice_number=` to the URL.
   */
  const fetchPayments = async (invoiceNumber?: string) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      let url = `${API_URL}/api/payments/cheque-history/`;
      if (invoiceNumber && invoiceNumber.trim().length > 0) {
        const encoded = encodeURIComponent(invoiceNumber.trim());
        url += `?invoice_number=${encoded}`;
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = response.data || [];
      setPayments(data);
      setNoResults(invoiceNumber !== '' && data.length === 0);
    } catch (err: unknown) {
      console.error('Failed to fetch payments:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  // On mount, fetch all payments:
  useEffect(() => {
    fetchPayments();
  }, []);

  const refreshChequePayment = async () => {
    await fetchPayments();
  };

  // Whenever `searchInvoiceTerm` changes, debounce for 500ms before fetching
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // If the field is blank, fetch all immediately (no search term)
    if (searchInvoiceTerm.trim() === '') {
      // Avoid waiting the full debounce delay—clear “noResults” and fetch immediately
      setNoResults(false);
      fetchPayments();
      setCurrentPage(1);
      return;
    }

    // Otherwise, wait 500ms before fetching
    debounceRef.current = window.setTimeout(() => {
      fetchPayments(searchInvoiceTerm.trim());
      setCurrentPage(1);
    }, 500);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchInvoiceTerm]);

  // If user presses Enter, fire fetch immediately (no debounce)
  // const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  //   if (e.key === 'Enter') {
  //     if (debounceRef.current) {
  //       clearTimeout(debounceRef.current);
  //     }
  //     const term = searchInvoiceTerm.trim();
  //     if (term === '') {
  //       setNoResults(false);
  //       fetchPayments();
  //     } else {
  //       fetchPayments(term);
  //     }
  //     setCurrentPage(1);
  //   }
  // };

  // Manual “Search” button click (in case user wants to avoid waiting 500 ms)
  const handleSearchClick = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    const term = searchInvoiceTerm.trim();
    if (term === '') {
      setNoResults(false);
      fetchPayments();
    } else {
      fetchPayments(term);
    }
    setCurrentPage(1);
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePrevious = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  if (loading) {
    return (
      <Layout>
        <div className='max-w-7xl mx-auto'>
          <div className='flex items-center justify-center min-h-[400px]'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto mb-4' />
              <p className='text-gray-600'>Loading Cheque payments...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
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

  return (
    <Layout>
      <div className='max-w-7xl mx-auto'>
        {/* Header: Title, Search bar, Back button, Export */}
        <div className='flex flex-col sm:flex-row items-center justify-between gap-2 pb-4'>
          <h1 className='text-2xl font-bold mb-2'>Cheque Payment Dashboard</h1>

          <div className='flex items-center gap-2'>
            <div className='flex w-full sm:w-auto items-center gap-2'>
              <Input
                className='w-full sm:w-64'
                placeholder='Search by Invoice Number'
                value={searchInvoiceTerm}
                onChange={(e) => setSearchInvoiceTerm(e.target.value)}
                // onKeyDown={handleKeyDown}
              />
              <Button onClick={handleSearchClick}>
                <Search className='h-4 w-4' />
              </Button>
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={() => navigate('/admin')}
              className='flex items-center gap-1'
            >
              <ChevronLeft className='h-4 w-4' /> Back
            </Button>

            {/* <Button
              className='flex items-center gap-2 px-3 py-2 rounded-lg shadow cursor-pointer'
              onClick={() => setIsExportDialogOpen(true)}
            >
              <Outdent className='h-4 w-4' /> Export Payments
            </Button> */}
          </div>
        </div>

        {/* Main table area */}
        <div className='bg-white shadow rounded-lg p-6'>
          <div className='flex justify-between items-center mb-4'>
            <h2 className='text-lg font-semibold'>Cheque Payments</h2>
          </div>

          {payments.length === 0 ? (
            <div className='text-center py-8'>
              <p className='text-gray-500'>
                {noResults
                  ? `No payments found for "${searchInvoiceTerm}"`
                  : 'No payments found'}
              </p>
              {noResults && (
                <Button
                  onClick={() => {
                    setSearchInvoiceTerm('');
                    setNoResults(false);
                    fetchPayments();
                    setCurrentPage(1);
                  }}
                >
                  Clear Search
                </Button>
              )}
            </div>
          ) : (
            <ChequePaymentTable
              refreshCheques={refreshChequePayment}
              payments={paginatedPayments}
            /> // <PaymentTable payments={paginatedPayments} />
          )}

          {/* Pagination controls */}
          <div className='flex justify-between items-center mt-4'>
            <p className='text-lg font-semibold'>Total: {payments.length}</p>
            <div className='flex items-center gap-2'>
              <Button
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className='flex items-center gap-1'
              >
                <ChevronDown className='h-4 w-4 rotate-90' /> Previous
              </Button>
              <p className='text-sm'>
                Page {currentPage} of {totalPages}
              </p>
              <Button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className='flex items-center gap-1'
              >
                Next <ChevronDown className='h-4 w-4 -rotate-90' />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Export Payments Dialog */}
      <ExportPaymentDataDialog
        open={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
      />
    </Layout>
  );
};

export default AdminChequeDashboard;
