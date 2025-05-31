import { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import Layout from '../components/Layout';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import type { SimpleBill } from '../types';
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

const UserDashboard = () => {
  const { userBills, userBillsLoading, userBillsError, fetchUserInvoices } =
    useData();

  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<SimpleBill | null>(
    null
  );
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  console.log(selectedInvoice, '-------------------selectedInvoice');

  // Fetch user invoices on component mount
  useEffect(() => {
    fetchUserInvoices();
  }, []);

  // Access the bills array from the API response
  // userBills is UsersBills | null
  const bills: SimpleBill[] = userBills?.bills ?? [];

  // Validation schema with conditional requirements and amount limits
  const getValidationSchema = (paymentMethod: string, maxAmount: number) => {
    const baseSchema = {
      actual_amount: Yup.number()
        .required('Amount is required')
        .positive('Amount must be positive')
        .min(1, 'Amount must be at least 1')
        .max(maxAmount, `Amount cannot exceed ${maxAmount}`),
      payment_method: Yup.string()
        .required('Payment method is required')
        .oneOf(['cash', 'upi', 'cheque'], 'Invalid payment method'),
    };

    // Add conditional validations
    if (paymentMethod === 'upi') {
      return Yup.object({
        ...baseSchema,
        transaction_number: Yup.number()
          .required('Transaction number is required for UPI payments')
          .positive('Transaction number must be positive'),
      });
    } else if (paymentMethod === 'cheque') {
      return Yup.object({
        ...baseSchema,
        cheque_type: Yup.string()
          .required('Cheque type is required')
          .oneOf(['rtgs', 'neft', 'imps'], 'Invalid cheque type'),
        cheque_number: Yup.string()
          .required('Cheque number is required')
          .min(6, 'Cheque number must be at least 6 characters'),
        cheque_date: Yup.date()
          .required('Cheque date is required')
          .max(new Date(), 'Cheque date cannot be in the future'),
      });
    }

    return Yup.object(baseSchema);
  };

  const handleRecord = (invoice: SimpleBill) => {
    setSelectedInvoice(invoice);
    setIsPaymentDialogOpen(true);
  };

  interface PaymentFormValues {
    actual_amount: number;
    payment_method: 'cash' | 'upi' | 'cheque';
    transaction_number?: number | undefined;
    cheque_type?: 'rtgs' | 'neft' | 'imps';
    cheque_number?: string | undefined;
    cheque_date?: string | undefined;
  }
  console.log('Selected Invoice:', selectedInvoice);

  const handlePaymentSubmit = async (values: PaymentFormValues) => {
    if (!selectedInvoice) return;

    setIsSubmitting(true);

    try {
      // Prepare payload based on payment method
      const payload: {
        bill: number;
        payment_method: string;
        actual_amount: string;
        transaction_number?: number;
        cheque_type?: string;
        cheque_number?: string;
        cheque_date?: string;
      } = {
        bill: selectedInvoice.id,
        payment_method: values.payment_method,
        actual_amount: values.actual_amount.toString(),
        transaction_number: undefined,
        cheque_type: undefined,
        cheque_number: undefined,
        cheque_date: undefined,
      };

      // Set fields based on payment method
      if (values.payment_method === 'cash') {
        // All optional fields remain null for cash
      } else if (values.payment_method === 'upi') {
        payload.transaction_number = values.transaction_number;
      } else if (values.payment_method === 'cheque') {
        payload.cheque_type = values.cheque_type;
        payload.cheque_number = values.cheque_number;
        payload.cheque_date = values.cheque_date;
      }

      const token = localStorage.getItem('accessToken');

      // Make API call
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
      console.log(values, '---------------FormValues');

      console.log('Payment recorded successfully:', response.data);

      setIsPaymentDialogOpen(false);

      // Refresh the bills list
      await fetchUserInvoices();

      // Show success dialog if full amount is paid
      if (values.actual_amount >= Number(selectedInvoice.actual_amount)) {
        setSuccessDialogOpen(true);
      }
    } catch (error) {
      console.error('Failed to record payment:', error);

      // Handle different error types
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // Server responded with error status
          console.error('Server error:', error.response.data);
          alert(
            `Payment failed: ${error.response.data.message || 'Server error'}`
          );
        } else if (error.request) {
          // Request was made but no response received
          console.error('Network error:', error.request);
          alert('Payment failed: Network error. Please check your connection.');
        } else {
          // Something else happened
          console.error('Error:', error.message);
          alert(`Payment failed: ${error.message}`);
        }
      } else {
        alert('Payment failed: Unknown error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'closed':
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
        <h1 className='text-2xl font-bold mb-6'>User Dashboard</h1>

        <div className='bg-white shadow rounded-lg p-6'>
          <h2 className='text-lg font-semibold mb-4'>Your Collection Tasks</h2>

          {bills.length === 0 ? (
            <div className='text-center py-8 text-gray-500'>
              No collection tasks assigned to you yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Route Name</TableHead>
                  <TableHead>Outlet</TableHead>
                  <TableHead>Invoice No.</TableHead>
                  <TableHead>Date</TableHead>
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
                    <TableCell>{bill.invoice_date}</TableCell>
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
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Enter payment details for invoice{' '}
              {selectedInvoice?.invoice_number}
            </DialogDescription>
          </DialogHeader>

          <Formik
            initialValues={{
              actual_amount: 0,
              payment_method: 'cash',
              transaction_number: 0,
              cheque_type: 'rtgs',
              cheque_number: '',
              cheque_date: '',
            }}
            validationSchema={(values: PaymentFormValues) =>
              getValidationSchema(
                values?.payment_method,
                selectedInvoice ? Number(selectedInvoice.actual_amount) : 0
              )
            }
            onSubmit={handlePaymentSubmit}
            enableReinitialize
          >
            {({ values, setFieldValue }) => (
              <Form className='grid gap-4 py-4'>
                <div className='grid grid-cols-4 items-center gap-4'>
                  <Label className='text-right'>Invoice Number</Label>
                  <Input
                    className='col-span-3'
                    value={selectedInvoice?.invoice_number || ''}
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
                      max={
                        selectedInvoice
                          ? Number(selectedInvoice.actual_amount)
                          : undefined
                      }
                      placeholder='Enter payment amount'
                    />
                    <ErrorMessage
                      name='amount'
                      component='div'
                      className='text-red-500 text-sm mt-1'
                    />
                    {/* <div className='text-xs text-gray-500 mt-1'>
                      Maximum amount: ₹
                      {selectedInvoice
                        ? Number(selectedInvoice.amount).toFixed(2)
                        : '0.00'}
                    </div> */}
                  </div>
                </div>

                <div className='grid grid-cols-4 items-center gap-4'>
                  <Label className='text-right'>Payment Method *</Label>
                  <div className='col-span-3'>
                    <Select
                      value={values.payment_method}
                      onValueChange={(value) => {
                        setFieldValue('payment_method', value);
                        // Reset conditional fields when payment method changes
                        setFieldValue('transaction_number', '');
                        setFieldValue('cheque_type', '');
                        setFieldValue('cheque_number', '');
                        setFieldValue('cheque_date', '');
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select payment method' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='cash'>Cash</SelectItem>
                        <SelectItem value='upi'>UPI</SelectItem>
                        <SelectItem value='cheque'>Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                    <ErrorMessage
                      name='payment_method'
                      component='div'
                      className='text-red-500 text-sm mt-1'
                    />
                  </div>
                </div>

                {values.payment_method === 'upi' && (
                  <div className='grid grid-cols-4 items-center gap-4'>
                    <Label className='text-right'>Transaction Number *</Label>
                    <div className='col-span-3'>
                      <Field
                        as={Input}
                        name='transaction_number'
                        type='number'
                        placeholder='Enter UPI transaction number'
                      />
                      <ErrorMessage
                        name='transaction_number'
                        component='div'
                        className='text-red-500 text-sm mt-1'
                      />
                    </div>
                  </div>
                )}

                {values.payment_method === 'cheque' && (
                  <>
                    <div className='grid grid-cols-4 items-center gap-4'>
                      <Label className='text-right'>Cheque Type *</Label>
                      <div className='col-span-3'>
                        <Select
                          value={values.cheque_type}
                          onValueChange={(value) =>
                            setFieldValue('cheque_type', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder='Select cheque type' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='rtgs'>RTGS</SelectItem>
                            <SelectItem value='neft'>NEFT</SelectItem>
                            <SelectItem value='imps'>IMPS</SelectItem>
                          </SelectContent>
                        </Select>
                        <ErrorMessage
                          name='cheque_type'
                          component='div'
                          className='text-red-500 text-sm mt-1'
                        />
                      </div>
                    </div>

                    <div className='grid grid-cols-4 items-center gap-4'>
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

                    <div className='grid grid-cols-4 items-center gap-4'>
                      <Label className='text-right'>Cheque Date *</Label>
                      <div className='col-span-3'>
                        <Field
                          as={Input}
                          name='cheque_date'
                          type='date'
                          max={new Date().toISOString().split('T')[0]}
                        />
                        <ErrorMessage
                          name='cheque_date'
                          component='div'
                          className='text-red-500 text-sm mt-1'
                        />
                      </div>
                    </div>
                  </>
                )}

                <DialogFooter>
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
