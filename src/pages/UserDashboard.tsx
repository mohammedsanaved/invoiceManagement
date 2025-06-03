import React, { useEffect, useState } from 'react';
import { useData } from '../context/DataContext';
import Layout from '../components/Layout';
import { Formik, Form, Field, ErrorMessage, type FormikHelpers } from 'formik';
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

const UserDashboard: React.FC = () => {
  const { userBills, userBillsLoading, userBillsError, fetchUserInvoices } =
    useData();

  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<SimpleBill | null>(
    null
  );
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch user invoices on mount
  useEffect(() => {
    fetchUserInvoices();
  }, []);

  // Our bills array
  const bills: SimpleBill[] = userBills?.bills ?? [];

  // Helper to build Yup schema, guarding values !== undefined
  const getValidationSchema = (
    paymentMethod: string | undefined,
    maxAmount: number
  ) => {
    // Default to 'cash' if paymentMethod is undefined
    const method = paymentMethod || 'cash';

    const baseSchema = {
      amount: Yup.number()
        .required('Amount is required')
        .positive('Amount must be positive')
        .min(1, 'Amount must be at least 1')
        .max(maxAmount, `Amount cannot exceed ₹${maxAmount}`),
      payment_method: Yup.string()
        .required('Payment method is required')
        .oneOf(['cash', 'upi', 'cheque'], 'Invalid payment method'),
    };

    if (method === 'upi') {
      return Yup.object({
        ...baseSchema,
        transaction_number: Yup.number()
          .required('Transaction number is required for UPI payments')
          .positive('Transaction number must be positive'),
      });
    }

    if (method === 'cheque') {
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

  type PaymentFormValues = {
    amount: number;
    payment_method: 'cash' | 'upi' | 'cheque';
    transaction_number?: number;
    cheque_type?: 'rtgs' | 'neft' | 'imps';
    cheque_number?: string;
    cheque_date?: string;
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
        cheque_type?: string;
        cheque_number?: string;
        cheque_date?: string;
      } = {
        bill: selectedInvoice.id,
        payment_method: values.payment_method,
        amount: values.amount.toString(),
      };

      if (values.payment_method === 'upi') {
        payload.transaction_number = values.transaction_number;
      } else if (values.payment_method === 'cheque') {
        payload.transaction_number = values.transaction_number;
        payload.cheque_type = values.cheque_type;
        payload.cheque_number = values.cheque_number;
        payload.cheque_date = values.cheque_date;
      }

      const token = window.localStorage.getItem('accessToken');
      await axios.post(
        `${API_URL}/api/payments/${selectedInvoice.id}/payments/`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Close dialog & reset form
      setIsPaymentDialogOpen(false);
      resetForm();

      // Refresh bills
      await fetchUserInvoices();

      // If fully paid, show success
      if (values.amount >= Number(selectedInvoice.actual_amount)) {
        setSuccessDialogOpen(true);
      }
    } catch (error: unknown) {
      console.error('Failed to record payment:', error);
      if (axios.isAxiosError(error)) {
        if (error.response) {
          alert(
            `Payment failed: ${error.response.data.message || 'Server error'}`
          );
        } else if (error.request) {
          alert('Payment failed: Network error. Please check your connection.');
        } else {
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
            <Formik
              initialValues={{
                amount: 0,
                payment_method: 'cash',
                transaction_number: undefined,
                cheque_type: undefined,
                cheque_number: '',
                cheque_date: '',
              }}
              validationSchema={(values: PaymentFormValues) =>
                getValidationSchema(
                  values?.payment_method,
                  Number(selectedInvoice.actual_amount)
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
                      value={selectedInvoice.invoice_number}
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
                      <div className='text-xs text-gray-500 mt-1'>
                        Maximum amount: ₹
                        {Number(selectedInvoice.actual_amount).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className='grid grid-cols-4 items-center gap-4'>
                    <Label className='text-right'>Payment Method *</Label>
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
                            onValueChange={(value) =>
                              setFieldValue('payment_method', value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder='Select method' />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='cash'>Cash</SelectItem>
                              <SelectItem value='upi'>UPI</SelectItem>
                              <SelectItem value='cheque'>Cheque</SelectItem>
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

                  {values.payment_method === 'upi' && (
                    <div className='grid grid-cols-4 items-center gap-4'>
                      <Label className='text-right'>Transaction Number *</Label>
                      <div className='col-span-3'>
                        <Field
                          as={Input}
                          name='transaction_number'
                          type='number'
                          placeholder='Enter transaction number'
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
                            value={values.cheque_type || ''}
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
                    {/* Formik now handles validation before calling onSubmit */}
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
