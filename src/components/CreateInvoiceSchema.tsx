import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useData } from '../context/DataContext';
import type { Invoice } from '../types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';

interface CreateInvoiceDialogProps {
  open: boolean;
  onClose: () => void;
}

// Validation schema for the form
const CreateInvoiceSchema = Yup.object().shape({
  outletNumber: Yup.string()
    .required('Outlet number is required')
    .min(3, 'Too short!'),
  outletName: Yup.string().required('Outlet name is required'),
  invoiceNumber: Yup.string()
    .required('Invoice number is required')
    .matches(/^INV-\d{4}-\d{3}$/, 'Invalid format! Use format: INV-YYYY-XXX'),
  amount: Yup.number()
    .required('Amount is required')
    .positive('Amount must be positive')
    .typeError('Amount must be a number'),
  brand: Yup.string().required('Brand is required'),
  overdueDays: Yup.number()
    .required('Overdue days is required')
    .min(0, 'Cannot be negative')
    .typeError('Overdue days must be a number'),
  routeName: Yup.string().required('Route name is required'),
});

const CreateInvoiceDialog: React.FC<CreateInvoiceDialogProps> = ({
  open,
  onClose,
}) => {
  const { addInvoice } = useData();

  const handleSubmit = (
    values: Omit<Invoice, 'id' | 'status' | 'invoiceDate' | 'assignedTo'>
  ) => {
    // Add current date as invoice date
    const invoiceData = {
      ...values,
      invoiceDate: format(new Date(), 'yyyy-MM-dd'),
    };

    addInvoice(invoiceData);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Create New Invoice</DialogTitle>
          <DialogDescription>
            Enter the details of the new invoice to be created.
          </DialogDescription>
        </DialogHeader>

        <Formik
          initialValues={{
            outletNumber: '',
            outletName: '',
            invoiceNumber: 'INV-' + format(new Date(), 'yyyy') + '-',
            amount: 0,
            brand: '',
            overdueDays: 0,
            routeName: '',
          }}
          validationSchema={CreateInvoiceSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, isSubmitting }) => (
            <Form className='space-y-4'>
              <div className='grid gap-4 py-4'>
                <div className='grid grid-cols-4 items-center gap-4'>
                  <Label htmlFor='outletNumber' className='text-right'>
                    Outlet Number
                  </Label>
                  <div className='col-span-3'>
                    <Field
                      as={Input}
                      id='outletNumber'
                      name='outletNumber'
                      placeholder='OUT-001'
                      className={
                        errors.outletNumber && touched.outletNumber
                          ? 'border-red-500'
                          : ''
                      }
                    />
                    <ErrorMessage
                      name='outletNumber'
                      component='div'
                      className='text-sm text-red-500'
                    />
                  </div>
                </div>

                <div className='grid grid-cols-4 items-center gap-4'>
                  <Label htmlFor='outletName' className='text-right'>
                    Outlet Name
                  </Label>
                  <div className='col-span-3'>
                    <Field
                      as={Input}
                      id='outletName'
                      name='outletName'
                      placeholder='City Center Store'
                      className={
                        errors.outletName && touched.outletName
                          ? 'border-red-500'
                          : ''
                      }
                    />
                    <ErrorMessage
                      name='outletName'
                      component='div'
                      className='text-sm text-red-500'
                    />
                  </div>
                </div>

                <div className='grid grid-cols-4 items-center gap-4'>
                  <Label htmlFor='invoiceNumber' className='text-right'>
                    Invoice Number
                  </Label>
                  <div className='col-span-3'>
                    <Field
                      as={Input}
                      id='invoiceNumber'
                      name='invoiceNumber'
                      placeholder='INV-2023-001'
                      className={
                        errors.invoiceNumber && touched.invoiceNumber
                          ? 'border-red-500'
                          : ''
                      }
                    />
                    <ErrorMessage
                      name='invoiceNumber'
                      component='div'
                      className='text-sm text-red-500'
                    />
                  </div>
                </div>

                <div className='grid grid-cols-4 items-center gap-4'>
                  <Label htmlFor='amount' className='text-right'>
                    Amount
                  </Label>
                  <div className='col-span-3'>
                    <Field
                      as={Input}
                      type='number'
                      id='amount'
                      name='amount'
                      placeholder='1000.00'
                      className={
                        errors.amount && touched.amount ? 'border-red-500' : ''
                      }
                    />
                    <ErrorMessage
                      name='amount'
                      component='div'
                      className='text-sm text-red-500'
                    />
                  </div>
                </div>

                <div className='grid grid-cols-4 items-center gap-4'>
                  <Label htmlFor='brand' className='text-right'>
                    Brand
                  </Label>
                  <div className='col-span-3'>
                    <Field
                      as={Input}
                      id='brand'
                      name='brand'
                      placeholder='Nike'
                      className={
                        errors.brand && touched.brand ? 'border-red-500' : ''
                      }
                    />
                    <ErrorMessage
                      name='brand'
                      component='div'
                      className='text-sm text-red-500'
                    />
                  </div>
                </div>

                <div className='grid grid-cols-4 items-center gap-4'>
                  <Label htmlFor='overdueDays' className='text-right'>
                    Overdue Days
                  </Label>
                  <div className='col-span-3'>
                    <Field
                      as={Input}
                      type='number'
                      id='overdueDays'
                      name='overdueDays'
                      placeholder='0'
                      className={
                        errors.overdueDays && touched.overdueDays
                          ? 'border-red-500'
                          : ''
                      }
                    />
                    <ErrorMessage
                      name='overdueDays'
                      component='div'
                      className='text-sm text-red-500'
                    />
                  </div>
                </div>

                <div className='grid grid-cols-4 items-center gap-4'>
                  <Label htmlFor='routeName' className='text-right'>
                    Route Name
                  </Label>
                  <div className='col-span-3'>
                    <Field
                      as={Input}
                      id='routeName'
                      name='routeName'
                      placeholder='Downtown Route'
                      className={
                        errors.routeName && touched.routeName
                          ? 'border-red-500'
                          : ''
                      }
                    />
                    <ErrorMessage
                      name='routeName'
                      component='div'
                      className='text-sm text-red-500'
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type='button' variant='outline' onClick={onClose}>
                  Cancel
                </Button>
                <Button type='submit' disabled={isSubmitting}>
                  Create Invoice
                </Button>
              </DialogFooter>
            </Form>
          )}
        </Formik>
      </DialogContent>
    </Dialog>
  );
};

export default CreateInvoiceDialog;
