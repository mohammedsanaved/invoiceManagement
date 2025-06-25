import React, { useEffect, useRef, useState } from 'react';
import { useData } from '../context/DataContext';
import Layout from '../components/Layout';
import { Formik, Form, Field, ErrorMessage, type FormikHelpers } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import type { SimpleBill } from '../types';
import { useToast } from '../hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { API_URL } from '@/lib/url';
import { Search } from 'lucide-react';

const UserDashboard: React.FC = () => {
  const { userBills, userBillsLoading, userBillsError, fetchUserInvoices } =
    useData();
  const { toast } = useToast();
  const debounceRef = useRef<number | null>(null);

  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<SimpleBill | null>(
    null
  );
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [noResults, setNoResults] = useState(false);
  const [filterBy, setFilterBy] = useState<
    'invoice_number' | 'route_name' | 'outlet_name'
  >('invoice_number');

  // Debounced search with proper cleanup
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(handleSearch, 500);
    return () => clearTimeout(debounceRef.current!);
  }, [searchTerm, filterBy]);

  const handleSearch = async () => {
    const term = searchTerm.trim();
    const termData = term ? term : undefined;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    await fetchUserInvoices(termData, filterBy);
    setNoResults(term !== '' && (userBills?.bills?.length ?? 0) === 0);
  };

  // Handle manual search trigger (button click)
  const handleManualSearch = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    handleSearch();
  };

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleManualSearch();
    }
  };

  // Our bills array
  const bills: SimpleBill[] = userBills?.bills ?? [];

  // FIXED Validation Schema with proper conditional validations
  const getValidationSchema = (maxAmount: number) => {
    return Yup.object().shape({
      amount: Yup.number()
        .required('Amount is required')
        .positive('Amount must be positive')
        .min(1, 'Amount must be at least 1')
        .max(maxAmount, `Amount cannot exceed ₹${maxAmount}`),
      payment_method: Yup.string()
        .required('Payment method is required')
        .oneOf(
          ['cash', 'upi', 'cheque', 'electronic'],
          'Invalid payment method'
        ),

      // UPI validations
      transaction_number: Yup.string().when('payment_method', {
        is: 'upi',
        then: (schema) =>
          schema
            .required('UTR number is required for UPI payments')
            .matches(/^\d+$/, 'UTR number must contain only digits')
            .min(5, 'UTR number must be at least 5 digits'),
        otherwise: (schema) => schema.notRequired(),
      }),

      // Cheque validations
      bank_name: Yup.string().when('payment_method', {
        is: 'cheque',
        then: (schema) =>
          schema
            .required('Bank name is required for cheque payments')
            .min(2, 'Bank name must be at least 2 characters'),
        otherwise: (schema) => schema.notRequired(),
      }),
      cheque_type: Yup.string().when('payment_method', {
        is: 'cheque',
        then: (schema) =>
          schema
            .required('Firm type is required for cheque payments')
            .oneOf(['rtgs', 'neft'], 'Please select a valid firm type'),
        otherwise: (schema) => schema.notRequired(),
      }),
      cheque_number: Yup.string().when('payment_method', {
        is: 'cheque',
        then: (schema) =>
          schema
            .required('Cheque number is required for cheque payments')
            .min(6, 'Cheque number must be at least 6 characters')
            .matches(/^[A-Za-z0-9]+$/, 'Cheque number must be alphanumeric'),
        otherwise: (schema) => schema.notRequired(),
      }),
      cheque_date: Yup.date().when('payment_method', {
        is: 'cheque',
        then: (schema) =>
          schema
            .required('Cheque date is required for cheque payments')
            .min(
              new Date(new Date().setHours(0, 0, 0, 0)),
              'Cheque date cannot be before today'
            ),
        otherwise: (schema) => schema.notRequired(),
      }),

      // Electronic payment validations
      electronic_cheque_type: Yup.string().when('payment_method', {
        is: 'electronic',
        then: (schema) =>
          schema
            .required('Transaction type is required for electronic payments')
            .oneOf(
              ['rtgs', 'neft', 'imps'],
              'Please select a valid transaction type'
            ),
        otherwise: (schema) => schema.notRequired(),
      }),

      // UTR Number for RTGS in electronic payments
      utr_number: Yup.string().when(
        ['payment_method', 'electronic_cheque_type'],
        {
          is: (payment_method: string, electronic_cheque_type: string) =>
            payment_method === 'electronic' &&
            electronic_cheque_type === 'rtgs',
          then: (schema) =>
            schema
              .required('UTR number is required for RTGS payments')
              .matches(/^\d+$/, 'UTR number must contain only digits')
              .min(10, 'UTR number must be at least 10 digits'),
          otherwise: (schema) => schema.notRequired(),
        }
      ),

      // Transaction ID for NEFT/IMPS in electronic payments
      transaction_id: Yup.string().when(
        ['payment_method', 'electronic_cheque_type'],
        {
          is: (payment_method: string, electronic_cheque_type: string) =>
            payment_method === 'electronic' &&
            ['neft', 'imps'].includes(electronic_cheque_type),
          then: (schema) =>
            schema
              .required('Transaction ID is required for NEFT/IMPS payments')
              .min(8, 'Transaction ID must be at least 8 characters')
              .matches(/^[A-Za-z0-9]+$/, 'Transaction ID must be alphanumeric'),
          otherwise: (schema) => schema.notRequired(),
        }
      ),
    });
  };

  type PaymentFormValues = {
    amount: number;
    payment_method: 'cash' | 'upi' | 'cheque' | 'electronic';

    // UPI fields
    transaction_number?: string;

    // Cheque fields
    bank_name?: string;
    cheque_type?: 'rtgs' | 'neft'; // For firm selection in cheque
    cheque_number?: string;
    cheque_date?: string;

    // Electronic fields
    electronic_cheque_type?: 'rtgs' | 'neft' | 'imps'; // For transaction type in electronic
    utr_number?: string; // For RTGS
    transaction_id?: string; // For NEFT/IMPS
  };

  const handleRecord = (invoice: SimpleBill) => {
    setSelectedInvoice(invoice);
    setIsPaymentDialogOpen(true);
  };

  const handlePaymentSubmit = async (
    values: PaymentFormValues,
    { resetForm }: FormikHelpers<PaymentFormValues>
  ) => {
    if (!selectedInvoice) return;
    setIsSubmitting(true);

    try {
      const payload: {
        bill: number;
        payment_method: string;
        amount: string;
        transaction_number?: number;
        bank_name?: string;
        firm?: string;
        cheque_type?: string;
        utr_number?: string;
        cheque_number?: string;
        cheque_date?: string;
        transaction_id?: string;
      } = {
        bill: selectedInvoice.id,
        payment_method: values.payment_method,
        amount: values.amount.toString(),
      };

      if (values.payment_method === 'upi') {
        payload.transaction_number = values.transaction_number
          ? Number(values.transaction_number)
          : undefined;
      } else if (values.payment_method === 'cheque') {
        payload.bank_name = values.bank_name;
        payload.firm = values.cheque_type === 'rtgs' ? 'NA' : 'MZ'; // Map rtgs->na, neft->mz
        payload.cheque_number = values.cheque_number;
        payload.cheque_date = values.cheque_date;
      } else if (values.payment_method === 'electronic') {
        payload.cheque_type = values.electronic_cheque_type;

        if (values.electronic_cheque_type === 'rtgs') {
          payload.utr_number = values.utr_number;
        } else if (
          ['neft', 'imps'].includes(values.electronic_cheque_type || '')
        ) {
          payload.transaction_id = values.transaction_id;
        }
      }

      const token = window.localStorage.getItem('accessToken');
      const response = await axios.post(
        `${API_URL}/api/payments/${selectedInvoice.id}/payments/`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('Payment recorded successfully:', response);

      // Close dialog & reset form
      setIsPaymentDialogOpen(false);
      resetForm();

      // Refresh bills
      await fetchUserInvoices();

      // If fully paid, show success
      if (
        values.amount >=
        Number(
          selectedInvoice.remaining_amount || selectedInvoice.actual_amount
        )
      ) {
        setSuccessDialogOpen(true);
      }

      toast({
        title: 'Payment recorded successfully',
        description: `Payment of ₹${values.amount} recorded for invoice ${selectedInvoice.invoice_number}`,
        variant: 'default',
      });
    } catch (error: unknown) {
      console.error('Failed to record payment:', error);
      if (axios.isAxiosError(error)) {
        if (error.response) {
          const errorMessage =
            error.response.data?.amount?.[0] ||
            error.response.data?.message ||
            'Server error occurred';
          toast({
            title: 'Payment failed',
            description: errorMessage,
            variant: 'destructive',
          });
        } else if (error.request) {
          toast({
            title: 'Payment failed',
            description: 'Network error. Please check your connection.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Payment failed',
            description: error.message,
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'Payment failed',
          description: 'Unknown error occurred',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'cleared':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (userBillsLoading) {
    return (
      <Layout>
        <div className='flex justify-center items-center h-64'>
          <p>Loading bills...</p>
        </div>
      </Layout>
    );
  }

  if (userBillsError) {
    return (
      <Layout>
        <div className='flex justify-center items-center h-64'>
          <p className='text-red-500'>Error: {userBillsError}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className='max-w-7xl mx-auto'>
        <h1 className='text-2xl text-center sm:text-left font-bold mb-6 '>
          User Dashboard
        </h1>
        <div className='flex justify-between items-center mb-4'>
          <div className='flex w-full sm:w-auto items-center gap-2'>
            <Select
              value={filterBy}
              onValueChange={(val) =>
                setFilterBy(
                  val as 'invoice_number' | 'route_name' | 'outlet_name'
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder='Search By…' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='invoice_number'>Invoice Number</SelectItem>
                <SelectItem value='route_name'>Route Name</SelectItem>
                <SelectItem value='outlet_name'>Outlet Name</SelectItem>
              </SelectContent>
            </Select>

            <Input
              className='w-full sm:w-64'
              placeholder={`Search by ${filterBy.replace('_', ' ')}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
            />

            <Button onClick={handleManualSearch}>
              <Search className='h-4 w-4' />
            </Button>
          </div>
        </div>
        <div className='bg-white shadow rounded-lg p-6'>
          <h2 className='text-lg font-semibold mb-4'>Your Collection Tasks</h2>

          {bills.length === 0 ? (
            <div className='text-center py-8 text-gray-500'>
              No collection tasks assigned to you yet.
            </div>
          ) : noResults ? (
            <Button
              onClick={() => {
                setSearchTerm('');
                // fetchAndHandle('');
                // setCurrentPage(1);
              }}
            >
              Clear Search
            </Button>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Route Name</TableHead>
                  <TableHead>Outlet</TableHead>
                  <TableHead>Invoice No.</TableHead>
                  <TableHead>Actual Amount</TableHead>
                  <TableHead>Remain Amount</TableHead>
                  <TableHead>Invoice Date</TableHead>
                  <TableHead>OverDue Days</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.map((bill: SimpleBill) => (
                  <TableRow key={bill.id}>
                    <TableCell>{bill.route_name}</TableCell>
                    <TableCell>{bill.outlet_name}</TableCell>
                    <TableCell>{bill.invoice_number}</TableCell>
                    <TableCell>{bill.actual_amount}</TableCell>
                    <TableCell>{bill.remaining_amount}</TableCell>
                    <TableCell>{bill.invoice_date}</TableCell>
                    <TableCell>{bill.overdue_days}</TableCell>
                    <TableCell>{bill.brand}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(
                          bill.status
                        )}`}
                      >
                        {bill.status.charAt(0).toUpperCase() +
                          bill.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleRecord(bill)}
                        disabled={bill.status === 'cleared'}
                      >
                        Record Payment
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Payment Recording Dialog */}
      <Dialog
        open={isPaymentDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedInvoice(null);
          }
          setIsPaymentDialogOpen(open);
        }}
      >
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Enter payment details for invoice{' '}
              {selectedInvoice?.invoice_number}
            </DialogDescription>
          </DialogHeader>

          {/* Only render Formik if we actually have a selectedInvoice */}
          {selectedInvoice && (
            <Formik<PaymentFormValues>
              initialValues={{
                amount: 0,
                payment_method: 'cash',
                transaction_number: '',
                bank_name: '',
                cheque_type: undefined,
                cheque_number: '',
                cheque_date: '',
                electronic_cheque_type: undefined,
                utr_number: '',
                transaction_id: '',
              }}
              validationSchema={getValidationSchema(
                Number(selectedInvoice.actual_amount)
              )}
              onSubmit={handlePaymentSubmit}
              enableReinitialize
            >
              {({ values, setFieldValue }) => (
                <Form className='grid gap-4 py-4'>
                  <div className='grid grid-cols-4 items-center gap-4'>
                    <Label className='text-right'>Invoice Number</Label>
                    <Input
                      className='col-span-3'
                      value={selectedInvoice.invoice_number}
                      readOnly
                    />
                  </div>
                  <div className='grid grid-cols-4 items-center gap-4'>
                    <Label className=''>Remaining Amount</Label>
                    <Input
                      className='col-span-3'
                      value={selectedInvoice.remaining_amount}
                      readOnly
                    />
                  </div>

                  <div className='grid grid-cols-4 items-center gap-4'>
                    <Label className='text-right'>Amount *</Label>
                    <div className='col-span-3'>
                      <Field
                        as={Input}
                        name='amount'
                        type='number'
                        step='0.01'
                        min='1'
                        max={selectedInvoice.actual_amount}
                        placeholder='Enter payment amount'
                      />
                      <ErrorMessage
                        name='amount'
                        component='div'
                        className='text-red-500 text-sm mt-1'
                      />
                    </div>
                  </div>

                  <div className='grid grid-cols-4 items-center gap-4'>
                    <Label className=''>Payment Method *</Label>
                    <div className='col-span-3'>
                      <Field name='payment_method'>
                        {({
                          field,
                        }: {
                          field: {
                            value: string;
                          };
                        }) => (
                          <Select
                            value={field.value}
                            onValueChange={(value) => {
                              setFieldValue('payment_method', value);
                              // Clear ALL conditional fields when payment method changes
                              setFieldValue('transaction_number', '');
                              setFieldValue('bank_name', '');
                              setFieldValue('cheque_type', undefined);
                              setFieldValue('cheque_number', '');
                              setFieldValue('cheque_date', '');
                              setFieldValue(
                                'electronic_cheque_type',
                                undefined
                              );
                              setFieldValue('utr_number', '');
                              setFieldValue('transaction_id', '');
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder='Select method' />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='cash'>Cash</SelectItem>
                              <SelectItem value='upi'>UPI</SelectItem>
                              <SelectItem value='cheque'>Cheque</SelectItem>
                              <SelectItem value='electronic'>
                                Electronic
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </Field>
                      <ErrorMessage
                        name='payment_method'
                        component='div'
                        className='text-red-500 text-sm mt-1'
                      />
                    </div>
                  </div>

                  {/* UPI Fields */}
                  {values.payment_method === 'upi' && (
                    <div className='grid grid-cols-4 items-center gap-4'>
                      <Label className='text-right'>UTR Number *</Label>
                      <div className='col-span-3'>
                        <Field
                          as={Input}
                          name='transaction_number'
                          type='text'
                          placeholder='Enter UTR number'
                        />
                        <ErrorMessage
                          name='transaction_number'
                          component='div'
                          className='text-red-500 text-sm mt-1'
                        />
                      </div>
                    </div>
                  )}

                  {/* Cheque Fields */}
                  {values.payment_method === 'cheque' && (
                    <>
                      {/* Bank Name */}
                      <div className='grid grid-cols-4 items-center gap-4'>
                        <Label className='text-right'>Bank Name *</Label>
                        <div className='col-span-3'>
                          <Field
                            as={Input}
                            name='bank_name'
                            placeholder='Enter bank name'
                          />
                          <ErrorMessage
                            name='bank_name'
                            component='div'
                            className='text-red-500 text-sm mt-1'
                          />
                        </div>
                      </div>

                      {/* Firm Type */}
                      <div className='grid grid-cols-4 items-center gap-4 mt-2'>
                        <Label className='text-right'>Select Firm *</Label>
                        <div className='col-span-3'>
                          <Select
                            value={values.cheque_type || ''}
                            onValueChange={(val) =>
                              setFieldValue('cheque_type', val)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder='Select Firm Type' />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='rtgs'>NA</SelectItem>
                              <SelectItem value='neft'>MZ</SelectItem>
                            </SelectContent>
                          </Select>
                          <ErrorMessage
                            name='cheque_type'
                            component='div'
                            className='text-red-500 text-sm mt-1'
                          />
                        </div>
                      </div>

                      {/* Cheque Number */}
                      <div className='grid grid-cols-4 items-center gap-4 mt-2'>
                        <Label className='text-right'>Cheque Number *</Label>
                        <div className='col-span-3'>
                          <Field
                            as={Input}
                            name='cheque_number'
                            placeholder='Enter cheque number'
                          />
                          <ErrorMessage
                            name='cheque_number'
                            component='div'
                            className='text-red-500 text-sm mt-1'
                          />
                        </div>
                      </div>

                      {/* Cheque Date */}
                      <div className='grid grid-cols-4 items-center gap-4 mt-2'>
                        <Label className='text-right'>Cheque Date *</Label>
                        <div className='col-span-3'>
                          <Field as={Input} name='cheque_date' type='date' />
                          <ErrorMessage
                            name='cheque_date'
                            component='div'
                            className='text-red-500 text-sm mt-1'
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Electronic Fields */}
                  {values.payment_method === 'electronic' && (
                    <>
                      {/* Transaction Type */}
                      <div className='grid grid-cols-4 items-center gap-4'>
                        <Label className='text-right'>Transaction Type *</Label>
                        <div className='col-span-3'>
                          <Select
                            value={values.electronic_cheque_type || ''}
                            onValueChange={(val) => {
                              setFieldValue('electronic_cheque_type', val);
                              // Clear specific fields when type changes
                              setFieldValue('utr_number', '');
                              setFieldValue('transaction_id', '');
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder='Select transaction type' />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='rtgs'>RTGS</SelectItem>
                              <SelectItem value='neft'>NEFT</SelectItem>
                              <SelectItem value='imps'>IMPS</SelectItem>
                            </SelectContent>
                          </Select>
                          <ErrorMessage
                            name='electronic_cheque_type'
                            component='div'
                            className='text-red-500 text-sm mt-1'
                          />
                        </div>
                      </div>

                      {/* UTR Number for RTGS */}
                      {values.electronic_cheque_type === 'rtgs' && (
                        <div className='grid grid-cols-4 items-center gap-4 mt-2'>
                          <Label className='text-right'>UTR Number *</Label>
                          <div className='col-span-3'>
                            <Field
                              as={Input}
                              name='utr_number'
                              placeholder='Enter UTR number'
                            />
                            <ErrorMessage
                              name='utr_number'
                              component='div'
                              className='text-red-500 text-sm mt-1'
                            />
                          </div>
                        </div>
                      )}

                      {/* Transaction ID for NEFT/IMPS */}
                      {(values.electronic_cheque_type === 'neft' ||
                        values.electronic_cheque_type === 'imps') && (
                        <div className='grid grid-cols-4 items-center gap-4 mt-2'>
                          <Label className='text-right'>Transaction ID *</Label>
                          <div className='col-span-3'>
                            <Field
                              as={Input}
                              name='transaction_id'
                              placeholder='Enter transaction ID'
                            />
                            <ErrorMessage
                              name='transaction_id'
                              component='div'
                              className='text-red-500 text-sm mt-1'
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  <DialogFooter className='mt-4'>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => setIsPaymentDialogOpen(false)}
                      disabled={isSubmitting}
                      className='cursor-pointer'
                    >
                      Cancel
                    </Button>
                    <Button
                      type='submit'
                      disabled={isSubmitting}
                      className='cursor-pointer'
                    >
                      {isSubmitting ? 'Recording...' : 'Record Payment'}
                    </Button>
                  </DialogFooter>
                </Form>
              )}
            </Formik>
          )}
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Payment Complete!</DialogTitle>
            <DialogDescription>
              The full amount has been collected for invoice{' '}
              {selectedInvoice?.invoice_number}.
            </DialogDescription>
          </DialogHeader>
          <div className='flex items-center justify-center py-8'>
            <div className='bg-green-100 p-6 rounded-full'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-12 w-12 text-green-600'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M5 13l4 4L19 7'
                />
              </svg>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setSuccessDialogOpen(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default UserDashboard;
