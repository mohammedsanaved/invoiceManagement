import React, { useEffect, useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useData } from '../context/DataContext';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { API_URL } from '@/lib/url';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from './ui/calendar';
import { useToast } from '../hooks/use-toast';

interface CreateInvoiceDialogProps {
  open: boolean;
  onClose: () => void;
}

// Validation schema for the form
const CreateInvoiceSchema = Yup.object().shape({
  invoice_date: Yup.string().required('Invoice Date is required'),
  outlet: Yup.number().required('Outlet is required'),
  invoice_number: Yup.string()
    .required('Invoice number is required')
    .matches(/^INV-\d{4}-\d{3}$/, 'Invalid format! Use format: INV-YYYY-XXX'),
  amount: Yup.number()
    .required('Amount is required')
    .positive('Amount must be positive')
    .typeError('Amount must be a number'),
  brand: Yup.string().required('Brand is required'),
  route_id: Yup.number().required('Route is required'),
});

interface Outlet {
  id: number;
  name: string;
  route: string;
}

interface Route {
  id: number;
  name: string;
}
interface InvoiceValues {
  invoice_date: string;
  outlet: number;
  invoice_number: string;
  amount: number;
  brand: string;
  route_id: number;
}

const CreateInvoiceDialog: React.FC<CreateInvoiceDialogProps> = ({
  open,
  onClose,
}) => {
  const { addInvoice } = useData();
  const { toast } = useToast();
  const [outletOptions, setOutletOptions] = useState<Outlet[]>([]);
  const [routeOptions, setRouteOptions] = useState<Route[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [date, setDate] = useState<Date | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (
    values: InvoiceValues,
    { resetForm }: { resetForm: () => void }
  ) => {
    try {
      setIsSubmitting(true);

      // Create the invoice using DataContext
      await addInvoice({
        invoice_date: values.invoice_date,
        outlet: values.outlet,
        invoice_number: values.invoice_number,
        amount: values.amount,
        brand: values.brand,
        route_id: values.route_id,
      });

      // Reset form and close dialog on success
      resetForm();
      setDate(undefined);
      setSelectedRouteId(null);
      setOutletOptions([]);
      onClose();
    } catch (error: unknown) {
      console.error('Failed to create invoice:', error);
      // Error is already handled in DataContext with toast
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchOutlets = async () => {
      if (!selectedRouteId) return;

      const token = localStorage.getItem('accessToken');
      try {
        const response = await fetch(
          `${API_URL}/api/routes/${selectedRouteId}/outlets/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();
        console.log(data, '-----------------Outlets');
        setOutletOptions(data);
      } catch (error) {
        console.error('Failed to fetch outlets:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch outlets.',
          variant: 'destructive',
        });
      }
    };

    fetchOutlets();
  }, [selectedRouteId]);

  useEffect(() => {
    const fetchRoutes = async () => {
      const token = localStorage.getItem('accessToken');
      try {
        const response = await fetch(`${API_URL}/api/routes/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        console.log(data, '-----------------Routes');
        setRouteOptions(data);
      } catch (error) {
        console.error('Failed to fetch routes:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch routes.',
          variant: 'destructive',
        });
      }
    };

    if (open) {
      fetchRoutes();
    }
  }, [open]);

  // Reset form when dialog closes
  const handleClose = () => {
    setDate(undefined);
    setSelectedRouteId(null);
    setOutletOptions([]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Create New Invoice</DialogTitle>
          <DialogDescription>
            Enter the details of the new invoice to be created.
          </DialogDescription>
        </DialogHeader>

        <Formik
          initialValues={{
            invoice_date: '',
            outlet: 0,
            invoice_number: 'INV-' + format(new Date(), 'yyyy') + '-',
            amount: 0,
            brand: '',
            route_id: 0,
          }}
          validationSchema={CreateInvoiceSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ errors, touched, setFieldValue, values }) => (
            <Form className='space-y-4'>
              <div className='grid gap-4 py-4'>
                {/* Route Name */}
                <div className='grid grid-cols-4 items-center gap-4'>
                  <Label htmlFor='route_id' className='text-right'>
                    Route Name
                  </Label>
                  <Field name='route_id'>
                    {({
                      field,
                      form,
                    }: {
                      field: {
                        name: string;
                        value: string | number;
                        onChange: React.ChangeEventHandler<HTMLSelectElement>;
                        onBlur: React.FocusEventHandler<HTMLSelectElement>;
                      };
                      form: import('formik').FormikProps<InvoiceValues>;
                    }) => (
                      <Select
                        value={String(field.value)}
                        onValueChange={(value) => {
                          const selectedRoute = routeOptions.find(
                            (r) => r.id === parseInt(value)
                          );
                          form.setFieldValue(field.name, parseInt(value));
                          if (selectedRoute) {
                            setSelectedRouteId(selectedRoute.id);
                            // Reset outlet selection when route changes
                            form.setFieldValue('outlet', '');
                          }
                        }}
                      >
                        <SelectTrigger className='col-span-3'>
                          <SelectValue placeholder='Select Route' />
                        </SelectTrigger>
                        <SelectContent>
                          {routeOptions.map((route) => (
                            <SelectItem key={route.id} value={String(route.id)}>
                              {route.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </Field>
                  <ErrorMessage
                    name='route_id'
                    component='div'
                    className='text-sm text-red-500 col-span-4 ml-[33%]'
                  />
                </div>

                {/* Outlet Name */}
                <div className='grid grid-cols-4 items-center gap-4'>
                  <Label htmlFor='outlet' className='text-right'>
                    Outlet Name
                  </Label>
                  <div className='col-span-3'>
                    <Field name='outlet'>
                      {({
                        field,
                        form,
                      }: {
                        field: {
                          name: string;
                          value: string | number;
                          onChange: React.ChangeEventHandler<HTMLSelectElement>;
                          onBlur: React.FocusEventHandler<HTMLSelectElement>;
                        };
                        form: import('formik').FormikProps<InvoiceValues>;
                      }) => (
                        <Select
                          value={String(field.value)}
                          onValueChange={(value) => {
                            form.setFieldValue(field.name, parseInt(value));
                          }}
                          disabled={!selectedRouteId}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                selectedRouteId
                                  ? 'Select Outlet'
                                  : 'First select a route'
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {outletOptions.map((outlet) => (
                              <SelectItem
                                key={outlet.id}
                                value={String(outlet.id)}
                              >
                                {outlet.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </Field>
                    <ErrorMessage
                      name='outlet'
                      component='div'
                      className='text-sm text-red-500'
                    />
                  </div>
                </div>

                {/* Invoice Number */}
                <div className='grid grid-cols-4 items-center gap-4'>
                  <Label htmlFor='invoice_number' className='text-right'>
                    Invoice Number
                  </Label>
                  <div className='col-span-3'>
                    <Field
                      as={Input}
                      id='invoice_number'
                      name='invoice_number'
                      placeholder='INV-2023-001'
                      className={
                        errors.invoice_number && touched.invoice_number
                          ? 'border-red-500'
                          : ''
                      }
                    />
                    <ErrorMessage
                      name='invoice_number'
                      component='div'
                      className='text-sm text-red-500'
                    />
                  </div>
                </div>

                {/* Invoice Date */}
                <div className='grid grid-cols-4 items-center gap-4'>
                  <Label htmlFor='invoice_date' className='text-right'>
                    Invoice Date
                  </Label>
                  <div className='col-span-3'>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-[240px] justify-start text-left font-normal',
                            !values.invoice_date && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className='mr-2 h-4 w-4' />
                          {values.invoice_date
                            ? format(new Date(values.invoice_date), 'PPP')
                            : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className='w-auto p-0' align='start'>
                        <Calendar
                          mode='single'
                          selected={date}
                          onSelect={(selected) => {
                            setDate(selected);
                            if (selected) {
                              const formatted = format(selected, 'yyyy-MM-dd');
                              setFieldValue('invoice_date', formatted);
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <ErrorMessage
                      name='invoice_date'
                      component='div'
                      className='text-sm text-red-500'
                    />
                  </div>
                </div>

                {/* Amount */}
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

                {/* Brand */}
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
              </div>

              <DialogFooter>
                <Button type='button' variant='outline' onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  type='submit'
                  disabled={isSubmitting}
                  className='cursor-pointer'
                >
                  {isSubmitting ? 'Creating...' : 'Create Invoice'}
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
